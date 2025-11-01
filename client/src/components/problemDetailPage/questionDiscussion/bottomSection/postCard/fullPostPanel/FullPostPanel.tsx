import React, { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { usePostStore } from "@/features/postStore";
import { MoonLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";

type FullPostPanelProps = {
  postId: string | null;
  onClose: () => void;
  isNested?: boolean;
};

const FullPostPanel: React.FC<FullPostPanelProps> = ({ postId, onClose, isNested = false }) => {
  const { getFullPostById, fullPostData, isGettingFullPost, fullPostError } =
    usePostStore();
  const [nestedPostId, setNestedPostId] = useState<string | null>(null);
  const [isNestedOpen, setIsNestedOpen] = useState(false);

  useEffect(() => {
    if (postId) {
      getFullPostById(postId);
    }
  }, [postId, getFullPostById]);

  const handleOpenNestedPanel = () => {
    setNestedPostId(postId);
    setIsNestedOpen(true);
  };

  const handleCloseNestedPanel = () => {
    setIsNestedOpen(false);
    setNestedPostId(null);
  };

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
        animate={{ x: isNested ? "calc(-100% - 15px)" : 0 }}
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

        {/* Button at bottom right */}
        {!isNested && (
          <div className="absolute bottom-4 right-4 pointer-events-auto">
            <button
              onClick={handleOpenNestedPanel}
              className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-lg transition-colors flex items-center justify-center"
              aria-label="Open nested panel"
            >
              <Plus size={24} />
            </button>
          </div>
        )}
      </motion.div>

      {/* Nested FullPostPanel */}
      <AnimatePresence mode="wait">
        {isNestedOpen && nestedPostId && (
          <FullPostPanel
            postId={nestedPostId}
            onClose={handleCloseNestedPanel}
            isNested={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FullPostPanel;
