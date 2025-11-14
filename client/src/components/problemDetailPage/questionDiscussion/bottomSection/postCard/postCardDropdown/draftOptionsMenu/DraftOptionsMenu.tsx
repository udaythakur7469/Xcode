"use client";

import React from "react";

type DraftOptionsMenuProps = {
  draftId: string;
  onRename: () => void;
  onPost: () => void;
  onDelete: () => void;
  onClose: () => void;
};

const DraftOptionsMenu: React.FC<DraftOptionsMenuProps> = ({
  draftId,
  onRename,
  onPost,
  onDelete,
  onClose,
}) => {
  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Rename clicked in menu");
    onRename();
  };

  const handlePostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Post clicked in menu");
    onPost();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Delete clicked in menu");
    onDelete();
  };

  return (
    <div className="bg-muted rounded-lg py-1 min-w-[150px] z-[9999] border shadow-lg">
      <div
        onClick={handleRenameClick}
        className="px-4 py-2 hover:bg-[#3a3a3d] cursor-pointer text-sm text-white"
      >
        Rename draft
      </div>
      <div
        onClick={handlePostClick}
        className="px-4 py-2 hover:bg-[#3a3a3d] cursor-pointer text-sm text-white"
      >
        Post draft
      </div>
      <div
        onClick={handleDeleteClick}
        className="px-4 py-2 hover:bg-[#3a3a3d] cursor-pointer text-sm text-red-500"
      >
        Delete draft
      </div>
    </div>
  );
};

export default DraftOptionsMenu;
