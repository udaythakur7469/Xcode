"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type CommentPanelContextType = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  postId: string | null;
  setPostId: (id: string | null) => void;
};

const CommentPanelContext = createContext<CommentPanelContextType | null>(null);

export function CommentPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);

  return (
    <CommentPanelContext.Provider
      value={{ isOpen, setIsOpen, postId, setPostId }}
    >
      {children}
    </CommentPanelContext.Provider>
  );
}

export function useCommentPanel() {
  const context = useContext(CommentPanelContext);

  if (!context) {
    throw new Error("useCommentPanel must be used inside CommentPanelProvider");
  }

  return context;
}
