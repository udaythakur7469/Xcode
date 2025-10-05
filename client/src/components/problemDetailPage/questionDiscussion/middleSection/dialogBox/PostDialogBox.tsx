import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/postBoxDialogBox";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import PostBox from "./postBox/PostBox";

type PostDialogBoxProps = { isOpen: boolean; onClose: () => void };

const PostDialogBox: React.FC<PostDialogBoxProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="backdrop-blur-2xl border overflow-hidden"
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
        <div className="flex flex-wrap border rounded-xl">
          <PostBox onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDialogBox;
