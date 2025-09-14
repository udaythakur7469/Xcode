import { Ban, Send } from "lucide-react";
import React from "react";

type CommentDialogButtonsProps = {};

const CommentDialogButtons: React.FC<CommentDialogButtonsProps> = () => {
  return (
    <div className="h-full w-full flex flex-row justify-center items-center gap-5">
      <div className="h-auto w-auto bg-red-500 px-3 py-2 cursor-pointer select-none rounded-2xl flex flex-row items-center">
        <Ban />
        <div className="ml-3">Cancel</div>
      </div>
      <div className="h-auto w-auto bg-green-500 px-3 py-2 cursor-pointer select-none rounded-2xl flex flex-row items-center">
        <Send />
        <div className="ml-3">Post</div>
      </div>
    </div>
  );
};
export default CommentDialogButtons;
