"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export type FABType = "aiChat" | "commandBar";

interface Positions {
  aiChat: { x: number; y: number };
  commandBar: { x: number; y: number };
}

interface Sides {
  aiChat: "left" | "right";
  commandBar: "left" | "right";
}

export const useFABSystem = () => {
  const [isMounted, setIsMounted] = useState(false);

  // Visibility states - true means visible, false means permanently hidden (via X button)
  const [aiChatPermanentlyHidden, setAiChatPermanentlyHidden] = useState(false);
  const [commandBarPermanentlyHidden, setCommandBarPermanentlyHidden] =
    useState(false);

  // Dialog states
  const [aiChatDialogOpen, setAiChatDialogOpen] = useState(false);
  const [commandBarDialogOpen, setCommandBarDialogOpen] =
    useState(false);

  // Computed visibility - FAB is visible if not permanently hidden AND dialog is closed
  const aiChatVisible = !aiChatPermanentlyHidden && !aiChatDialogOpen;
  const commandBarVisible =
    !commandBarPermanentlyHidden && !commandBarDialogOpen;

  const [isDragging, setIsDragging] = useState<FABType | null>(null);
  const [draggedButton, setDraggedButton] = useState<FABType | null>(null);
  const [repelledButton, setRepelledButton] = useState<FABType | null>(null);

  // Default positions (bottom-right corner)
  const getDefaultPositions = useCallback((): Positions => {
    if (typeof window === "undefined") {
      return {
        aiChat: { x: 100, y: 100 },
        commandBar: { x: 100, y: 170 },
      };
    }

    return {
      aiChat: { x: window.innerWidth - 80, y: window.innerHeight - 80 },
      commandBar: {
        x: window.innerWidth - 80,
        y: window.innerHeight - 150,
      },
    };
  }, []);

  const [positions, setPositions] = useState<Positions>(getDefaultPositions);
  const [sides, setSides] = useState<Sides>({
    aiChat: "right",
    commandBar: "right",
  });

  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load positions from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("fab-positions");
      if (stored) {
        const parsed = JSON.parse(stored);
        setPositions(parsed.positions);
        setSides(parsed.sides || { aiChat: "right", commandBar: "right" });
      }
    } catch (error) {
      console.error("Failed to load FAB positions:", error);
    }
  }, []);

  // Save positions to sessionStorage
  const savePositions = useCallback(
    (newPositions: Positions, newSides: Sides) => {
      try {
        sessionStorage.setItem(
          "fab-positions",
          JSON.stringify({
            positions: newPositions,
            sides: newSides,
          })
        );
      } catch (error) {
        console.error("Failed to save FAB positions:", error);
      }
    },
    []
  );

  // Calculate repulsion force - magnet-like behavior
  const calculateRepulsion = (
    draggedPos: { x: number; y: number },
    otherPos: { x: number; y: number },
    minDistance: number = 70
  ): { x: number; y: number } | null => {
    const dx = draggedPos.x - otherPos.x;
    const dy = draggedPos.y - otherPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance && distance > 0) {
      const repulsionStrength = (minDistance - distance) / minDistance;
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;
      const pushDistance = repulsionStrength * minDistance * 0.8;

      return {
        x: -normalizedDx * pushDistance,
        y: -normalizedDy * pushDistance,
      };
    }

    return null;
  };

  // Constrain position to boundaries
  const constrainToBounds = (pos: {
    x: number;
    y: number;
  }): { x: number; y: number } => {
    return {
      x: Math.max(0, Math.min(pos.x, window.innerWidth - 56)),
      y: Math.max(0, Math.min(pos.y, window.innerHeight - 56)),
    };
  };

  // Handle drag start
  const handleDragStart = (button: FABType) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(button);
    setDraggedButton(button);

    const buttonPos = positions[button];
    dragOffset.current = {
      x: e.clientX - buttonPos.x,
      y: e.clientY - buttonPos.y,
    };
    dragStartPos.current = { x: buttonPos.x, y: buttonPos.y };
  };

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      let draggedPos = { x: newX, y: newY };

      const otherButton = isDragging === "aiChat" ? "commandBar" : "aiChat";
      const otherButtonVisible =
        isDragging === "aiChat" ? commandBarVisible : aiChatVisible;

      if (otherButtonVisible) {
        const otherPos = positions[otherButton];
        const repulsion = calculateRepulsion(draggedPos, otherPos);

        if (repulsion) {
          setRepelledButton(otherButton);

          const newOtherPos = {
            x: otherPos.x + repulsion.x,
            y: otherPos.y + repulsion.y,
          };

          const constrainedOtherPos = constrainToBounds(newOtherPos);

          setPositions((prev) => ({
            ...prev,
            [otherButton]: constrainedOtherPos,
            [isDragging]: constrainToBounds(draggedPos),
          }));
        } else {
          setRepelledButton(null);
          setPositions((prev) => ({
            ...prev,
            [isDragging]: constrainToBounds(draggedPos),
          }));
        }
      } else {
        setPositions((prev) => ({
          ...prev,
          [isDragging]: constrainToBounds(draggedPos),
        }));
      }
    },
    [isDragging, positions, aiChatVisible, commandBarVisible]
  );

  // Handle mouse up (end drag)
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setRepelledButton(null);

    const currentPos = positions[isDragging];
    const windowCenter = window.innerWidth / 2;

    const otherButton = isDragging === "aiChat" ? "commandBar" : "aiChat";
    const otherButtonVisible =
      isDragging === "aiChat" ? commandBarVisible : aiChatVisible;

    let newSide: "left" | "right" =
      currentPos.x < windowCenter ? "left" : "right";
    let snapX = newSide === "left" ? 20 : window.innerWidth - 76;
    let finalY = currentPos.y;

    if (otherButtonVisible) {
      const otherPos = positions[otherButton];
      const otherWindowCenter = window.innerWidth / 2;
      const otherCurrentSide: "left" | "right" =
        otherPos.x < otherWindowCenter ? "left" : "right";

      if (newSide === otherCurrentSide) {
        const verticalDistance = Math.abs(currentPos.y - otherPos.y);

        if (verticalDistance < 70) {
          if (currentPos.y < otherPos.y) {
            finalY = Math.max(0, otherPos.y - 70);
          } else {
            finalY = Math.min(window.innerHeight - 56, otherPos.y + 70);
          }
        }
      }
    }

    let newPositions = {
      ...positions,
      [isDragging]: { x: snapX, y: finalY },
    };

    if (otherButtonVisible) {
      const otherPos = positions[otherButton];
      const otherWindowCenter = window.innerWidth / 2;
      const otherNewSide: "left" | "right" =
        otherPos.x < otherWindowCenter ? "left" : "right";
      const otherSnapX = otherNewSide === "left" ? 20 : window.innerWidth - 76;

      newPositions = {
        ...newPositions,
        [otherButton]: { x: otherSnapX, y: otherPos.y },
      };

      const newSides = {
        [isDragging]: newSide,
        [otherButton]: otherNewSide,
      };

      setSides(newSides as Sides);
      setPositions(newPositions);
      savePositions(newPositions, newSides as Sides);
    } else {
      const newSides = {
        ...sides,
        [isDragging]: newSide,
      };

      setPositions(newPositions);
      setSides(newSides);
      savePositions(newPositions, newSides);
    }

    setIsDragging(null);
    setTimeout(() => setDraggedButton(null), 300);
  }, [
    isDragging,
    positions,
    sides,
    savePositions,
    aiChatVisible,
    commandBarVisible,
  ]);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Q for AI Chat
      if (e.key === "q" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Close command Bar if open, then open AI chat
        if (commandBarDialogOpen) {
          setCommandBarDialogOpen(false);
          // Wait for next render cycle
          requestAnimationFrame(() => {
            setAiChatDialogOpen(true);
          });
        } else {
          setAiChatDialogOpen(true);
        }
      }

      // Ctrl + K for Command Bar
      if (e.key?.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Close AI chat if open, then open command Bar
        if (aiChatDialogOpen) {
          setAiChatDialogOpen(false);
          // Wait for next render cycle
          requestAnimationFrame(() => {
            setCommandBarDialogOpen(true);
          });
        } else {
          setCommandBarDialogOpen(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aiChatDialogOpen, commandBarDialogOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setPositions((prev) => {
        const newPositions = { ...prev };

        Object.keys(prev).forEach((key) => {
          const buttonKey = key as keyof Positions;
          const buttonSide = sides[buttonKey];
          const snapX = buttonSide === "left" ? 20 : window.innerWidth - 76;

          newPositions[buttonKey] = {
            x: snapX,
            y: Math.min(prev[buttonKey].y, window.innerHeight - 56),
          };
        });

        return newPositions;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sides]);

  const handleFABClick = (button: FABType) => {
    if (draggedButton) return;

    if (button === "aiChat") {
      setAiChatDialogOpen(true);
    } else {
      setCommandBarDialogOpen(true);
    }
  };

  return {
    // States
    isMounted,
    aiChatVisible,
    commandBarVisible,
    positions,
    sides,
    isDragging,
    draggedButton,
    repelledButton,
    aiChatDialogOpen,
    commandBarDialogOpen,

    // Setters
    setAiChatPermanentlyHidden,
    setCommandBarPermanentlyHidden,
    setAiChatDialogOpen,
    setCommandBarDialogOpen,

    // Handlers
    handleDragStart,
    handleFABClick,
  };
};
