import React, { useEffect } from "react";
import { X } from "lucide-react";
import { usePostStore } from "@/features/postStore";
import { MoonLoader } from "react-spinners";
import { motion } from "framer-motion";

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
    <div className="absolute inset-0 z-[9999] pointer-events-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          type: "tween",
          duration: 0.3,
          ease: "easeInOut",
        }}
        className="absolute right-0 top-0 h-full w-full bg-background shadow-2xl flex flex-col pointer-events-auto"
      >
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
            <div className="text-red-500 text-center">
              Error: {fullPostError}
            </div>
          )}

          {fullPostData && !isGettingFullPost && (
            <motion.pre
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-secondary p-4 rounded-lg overflow-auto text-sm"
            >
              {JSON.stringify(fullPostData, null, 2)}
            </motion.pre>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FullPostPanel;
