import React from "react";
import { Dialog, DialogContent } from "@/components/ui/postBoxDialogBox";
import CommentBox from "./commentBox/CommentBox";

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
        <div className="flex flex-wrap border rounded-xl">
          <CommentBox />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDialogBox;
