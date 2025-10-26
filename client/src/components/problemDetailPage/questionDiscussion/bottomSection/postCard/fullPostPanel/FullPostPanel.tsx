import React, { useEffect } from "react";
import { X } from "lucide-react";
import { usePostStore } from "@/features/postStore";
import { MoonLoader } from "react-spinners";

type FullPostPanelProps = {
  postId: string | null;
  onClose: () => void;
};

const FullPostPanel: React.FC<FullPostPanelProps> = ({ postId, onClose }) => {
  const { getFullPostById, fullPostData, isGettingFullPost, fullPostError } =
    usePostStore();

  useEffect(() => {
    if (postId) {
      getFullPostById(postId);
    }
  }, [postId, getFullPostById]);

  return (
    <div className="absolute inset-0 z-[9999] bg-background flex flex-col">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h2 className="text-xl font-semibold">Post Details</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isGettingFullPost && (
          <div className="flex justify-center items-center h-full">
            <MoonLoader size={50} color="#ffffff" />
          </div>
        )}

        {fullPostError && (
          <div className="text-red-500 text-center">Error: {fullPostError}</div>
        )}

        {fullPostData && !isGettingFullPost && (
          <pre className="bg-secondary p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(fullPostData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default FullPostPanel;
