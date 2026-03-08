import prisma from "../configs/db.js";
import createHttpError from "http-errors";
import logger from "../configs/loggerConfig.js";

// ─────────────────────────────────────────────
// GET /api/sticky-notes
// Fetch all sticky notes for the authenticated user
// ─────────────────────────────────────────────
export const getStickyNotes = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const notes = await prisma.stickyNote.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json({
      message: "Sticky notes fetched successfully",
      notes,
    });
  } catch (error) {
    logger.error("Error fetching sticky notes:", error);
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/sticky-notes
// Create a new sticky note for the authenticated user
// ─────────────────────────────────────────────
export const createStickyNote = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const note = await prisma.stickyNote.create({
      data: {
        userId,
        title: "Untitled Note",
        content: "",
        color: "yellow",
        x: 100,
        y: 100,
        width: 320,
        height: 240,
        zIndex: 1,
      },
    });

    return res.status(201).json({
      message: "Sticky note created successfully",
      note,
    });
  } catch (error) {
    logger.error("Error creating sticky note:", error);
    next(error);
  }
};

// ─────────────────────────────────────────────
// PUT /api/sticky-notes/:id
// Update any fields of a sticky note (content, position, size, zIndex, color, title)
// ─────────────────────────────────────────────
export const updateStickyNote = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, content, color, x, y, width, height, zIndex } = req.body;

    // Verify ownership
    const existingNote = await prisma.stickyNote.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      throw createHttpError.NotFound("Sticky note not found");
    }

    // Build update object with only the fields that were provided
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (color !== undefined) updateData.color = color;
    if (x !== undefined) updateData.x = x;
    if (y !== undefined) updateData.y = y;
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;
    if (zIndex !== undefined) updateData.zIndex = zIndex;

    const updatedNote = await prisma.stickyNote.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      message: "Sticky note updated successfully",
      note: updatedNote,
    });
  } catch (error) {
    logger.error("Error updating sticky note:", error);
    next(error);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/sticky-notes/:id
// Delete a sticky note (only by its owner)
// ─────────────────────────────────────────────
export const deleteStickyNote = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Verify ownership
    const existingNote = await prisma.stickyNote.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      throw createHttpError.NotFound("Sticky note not found");
    }

    await prisma.stickyNote.delete({ where: { id } });

    return res.status(200).json({
      message: "Sticky note deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting sticky note:", error);
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/sticky-notes/bulk
// Bulk create notes (used for guest → auth migration)
// ─────────────────────────────────────────────
export const bulkCreateStickyNotes = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { notes } = req.body;

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      throw createHttpError.BadRequest("Notes array is required");
    }

    // Create all notes in a single transaction
    const createdNotes = await prisma.$transaction(
      notes.map((note: any) =>
        prisma.stickyNote.create({
          data: {
            userId,
            title: note.title || "Untitled Note",
            content: note.content || "",
            color: note.color || "yellow",
            x: note.x ?? 100,
            y: note.y ?? 100,
            width: note.width ?? 320,
            height: note.height ?? 240,
            zIndex: note.zIndex ?? 1,
          },
        }),
      ),
    );

    return res.status(201).json({
      message: `${createdNotes.length} notes migrated successfully`,
      notes: createdNotes,
    });
  } catch (error) {
    logger.error("Error bulk creating sticky notes:", error);
    next(error);
  }
};
