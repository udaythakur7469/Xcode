"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/helperDialogs";
import { Button } from "@/components/ui/button";
import { usePostStore } from "@/features/postStore";

type PostOrDeleteDraftDialogBoxProps = {
  isOpen: boolean;
  onClose: () => void;
  draftId: string | null;
  action: "post" | "delete";
};

const PostOrDeleteDraftDialogBox: React.FC<PostOrDeleteDraftDialogBoxProps> = ({
  isOpen,
  onClose,
  draftId,
  action,
}) => {
  const { manageDraftPost, isManagingDraftPost } = usePostStore();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!draftId) {
      console.error("Draft ID is missing");
      return;
    }

    try {
      const response = await manageDraftPost(draftId, action);
      console.log(`Draft ${action}ed successfully:`, response);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      console.error(`Error ${action}ing draft:`, error);
    }
  };

  const title = action === "post" ? "Post Draft" : "Delete Draft";
  const description =
    action === "post"
      ? "Are you sure you want to post this draft?"
      : "Are you sure you want to delete this draft? This action cannot be undone.";

  const getButtonText = () => {
    if (isSuccess) {
      return action === "post" ? "Posted" : "Deleted";
    }
    if (isManagingDraftPost) {
      return action === "post" ? "Posting..." : "Deleting...";
    }
    return "Yes";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex items-center justify-center">
          <DialogTitle className="text-3xl">{title}</DialogTitle>
          <DialogDescription className="py-3 text-lg">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-center gap-2 sm:justify-center">
          <Button
            className="bg-red-600 text-white hover:bg-red-700 shadow-none"
            onClick={onClose}
            disabled={isManagingDraftPost}
          >
            No
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700 shadow-none"
            onClick={handleConfirm}
            disabled={isManagingDraftPost || isSuccess}
          >
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostOrDeleteDraftDialogBox;
