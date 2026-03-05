import React, { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { usePostStore } from "@/features/postStore";
import { MoonLoader } from "react-spinners";
import { motion } from "framer-motion";
import PostData from "./PostData";

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
    <div className="absolute inset-0 z-[1000] pointer-events-none">
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
        className="absolute right-0 top-0 h-full w-full bg-background shadow-2xl flex flex-col pointer-events-auto overflow-x-hidden"
      >
        {/* Header — fixed, never scrolls */}
        <div className="flex items-center justify-start pb-1 border-b shrink-0">
          <button
            onClick={onClose}
            className="flex flex-row items-center justify-center"
            aria-label="Close"
          >
            <ArrowLeft size={18} className="mx-1" />
            All solutions
          </button>
        </div>

        {/* 
          ✅ THE ONE AND ONLY scroll container for the entire panel.
          Everything inside — title, meta, tags, markdown, comments — 
          scrolls together as one unified page.
        */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {isGettingFullPost && (
            <div className="flex justify-center items-center h-full">
              <MoonLoader size={50} color="#ffffff" />
            </div>
          )}

          {fullPostError && (
            <div className="text-red-500 text-center p-4">
              Error: {fullPostError}
            </div>
          )}

          {fullPostData && !isGettingFullPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <PostData fullPostData={fullPostData} />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FullPostPanel;
