import React from "react";
import { Dialog, DialogContent } from "@/components/ui/postBoxDialogBox";
import CommentBox from "./commentBox/CommentBox";

type PostDialogBoxProps = { isOpen: boolean; onClose: () => void };

const PostDialogBox: React.FC<PostDialogBoxProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-2xl min-h-[680px] min-w-[1460px] border overflow-hidden p-0">
        <div className="flex flex-wrap border rounded-xl">
          <CommentBox />
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default PostDialogBox;
