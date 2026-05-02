import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/postBoxDialogBox";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import PostBox from "./postBox/PostBox";

type PostDialogBoxProps = {
  isOpen: boolean;
  onClose: () => void;
  draftId?: string | null;
};

const PostDialogBox: React.FC<PostDialogBoxProps> = ({
  isOpen,
  onClose,
  draftId = null,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="backdrop-blur-2xl border overflow-hidden p-0"
        style={{
          width: "calc(100vw * 1460 / 1536)",
          height: "calc(100vh * 680 / 730)",
          maxWidth: "1460px",
          maxHeight: "680px",
        }}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Post Editor</DialogTitle>
        </VisuallyHidden.Root>
        <div className="h-full w-full border rounded-xl overflow-hidden">
          <PostBox onClose={onClose} draftId={draftId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDialogBox;
