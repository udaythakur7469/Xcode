import React, { useEffect, useState } from "react";
import { ArrowLeft, Share2 } from "lucide-react";
import { usePostStore } from "@/features/postStore";
import { MoonLoader } from "react-spinners";
import { motion } from "framer-motion";
import PostData from "./PostData";
import { useCommentPanel } from "@/context/commentPanelContext";
import ShareDialog from "../sharePost/ShareDialog";

type FullPostPanelProps = {
  postId: string | null;
  onClose: () => void;
};

const FullPostPanel: React.FC<FullPostPanelProps> = ({ postId, onClose }) => {
  const { getFullPostById, fullPostData, isGettingFullPost, fullPostError } =
    usePostStore();

  const { setIsOpen } = useCommentPanel();
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (postId) {
      getFullPostById(postId);
    }
  }, [postId, getFullPostById]);

  const closePanels = () => {
    onClose();
    setIsOpen(false);
  };

  return (
    <div className="absolute inset-0 z-[40] pointer-events-none">
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
        transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
        className="absolute right-0 top-0 h-full w-full bg-background shadow-2xl flex flex-col pointer-events-auto overflow-x-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b shrink-0 pr-2">
          <button
            onClick={() => closePanels()}
            className="flex flex-row items-center justify-center"
            aria-label="Close"
          >
            <ArrowLeft size={18} className="mx-1" />
            All solutions
          </button>

          {/* Share button — passes prefetchedPost so dialog skips the fetch */}
          {fullPostData && !isGettingFullPost && (
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-secondary"
              aria-label="Share post"
            >
              <Share2 size={14} className="text-purple-400" />
              Share
            </button>
          )}
        </div>

        {/* Scroll container */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#888 transparent" }}
        >
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

      {/* Share dialog — prefetchedPost avoids a redundant API call */}
      {postId && (
        <ShareDialog
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          postId={postId}
          prefetchedPost={fullPostData}
        />
      )}
    </div>
  );
};

export default FullPostPanel;
