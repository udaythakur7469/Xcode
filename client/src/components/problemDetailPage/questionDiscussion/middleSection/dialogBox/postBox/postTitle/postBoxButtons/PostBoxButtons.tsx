import { Ban, Send, SquarePen } from "lucide-react";
import React from "react";

type PostBoxButtonsProps = {
  onClose: () => void;
  handleCreateNewPost: () => void;
  handleCreateDraftPost: () => void;
  isDraftMode?: boolean;
};

const PostBoxButtons: React.FC<PostBoxButtonsProps> = ({
  onClose,
  handleCreateNewPost,
  handleCreateDraftPost,
  isDraftMode = false,
}) => {
  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="h-full w-full flex flex-col justify-center items-center gap-5">
      <div className="flex flex-row justify-center items-center gap-5">
        <div
          className="h-auto w-auto bg-red-500 px-3 py-2 cursor-pointer select-none rounded-2xl flex flex-row items-center"
          onClick={handleCancel}
        >
          <Ban />
          <div className="ml-3">Cancel</div>
        </div>
        <div
          className="h-auto w-auto bg-green-500 px-3 py-2 cursor-pointer select-none rounded-2xl flex flex-row items-center"
          onClick={() => handleCreateNewPost()}
        >
          <Send />
          <div className="ml-3">Post</div>
        </div>
      </div>
      <div>
        <div
          className="h-auto w-auto bg-indigo-500 px-3 py-2 cursor-pointer select-none rounded-2xl flex flex-row items-center"
          onClick={() => handleCreateDraftPost()}
        >
          <SquarePen />
          <div className="ml-3">
            {isDraftMode ? "Update Draft" : "Save as Draft"}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PostBoxButtons;
