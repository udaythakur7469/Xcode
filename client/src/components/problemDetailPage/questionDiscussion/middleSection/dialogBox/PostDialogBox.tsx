import React from "react";
import { Dialog, DialogContent } from "@/components/ui/postBoxDialogBox";
import CommentBox from "./commentBox/CommentBox";

type PostDialogBoxProps = { isOpen: boolean; onClose: () => void };

const PostDialogBox: React.FC<PostDialogBoxProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-2xl h-[calc(100vh-50px)] w-[calc(100vw-80px)] max-w-none border">
        <div className="flex flex-wrap border rounded-xl">
          <CommentBox />
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default PostDialogBox;
