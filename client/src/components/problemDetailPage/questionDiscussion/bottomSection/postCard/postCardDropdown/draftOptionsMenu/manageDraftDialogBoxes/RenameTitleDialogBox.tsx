"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/helperDialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePostStore } from "@/features/postStore";

type RenameTitleDialogBoxProps = {
  isOpen: boolean;
  onClose: () => void;
  draftId: string | null;
  currentTitle: string;
};

const RenameTitleDialogBox: React.FC<RenameTitleDialogBoxProps> = ({
  isOpen,
  onClose,
  draftId,
  currentTitle,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const { manageDraftPost, isManagingDraftPost } = usePostStore();

  useEffect(() => {
    if (isOpen) {
      setNewTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const handleRename = async () => {
    if (!draftId || !newTitle.trim()) {
      console.error("Draft ID or title is missing");
      return;
    }

    try {
      const response = await manageDraftPost(draftId, "rename", newTitle);
      console.log("Draft renamed successfully:", response);
      onClose();
    } catch (error) {
      console.error("Error renaming draft:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex items-center justify-center">
          <DialogTitle className="text-3xl">Rename Draft</DialogTitle>
          <DialogDescription className="py-3 text-lg">
            Enter a new title for your draft
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter new title..."
            className="w-full"
          />
        </div>
        <DialogFooter className="flex flex-row justify-center gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isManagingDraftPost}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={isManagingDraftPost || !newTitle.trim()}
          >
            {isManagingDraftPost ? "Renaming..." : "Rename Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameTitleDialogBox;
