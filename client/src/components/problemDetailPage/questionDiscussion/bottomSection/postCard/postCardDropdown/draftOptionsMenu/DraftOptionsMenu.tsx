import React from "react";

type DraftOptionsMenuProps = {
  draftId: string;
  onRename: (e: React.MouseEvent) => void;
  onPost: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
};

const DraftOptionsMenu: React.FC<DraftOptionsMenuProps> = ({
  draftId,
  onRename,
  onPost,
  onDelete,
}) => {
  return (
    <div className="absolute bg-muted rounded-lg py-1 min-w-[150px] z-[9999] border">
      <div
        onClick={onRename}
        className="px-4 py-2 hover:bg-[#3a3a3d] cursor-pointer text-sm text-white"
      >
        Rename draft
      </div>
      <div
        onClick={onPost}
        className="px-4 py-2 hover:bg-[#3a3a3d] cursor-pointer text-sm text-white"
      >
        Post draft
      </div>
      <div
        onClick={onDelete}
        className="px-4 py-2 hover:bg-[#3a3a3d] cursor-pointer text-sm text-red-500"
      >
        Delete draft
      </div>
    </div>
  );
};
export default DraftOptionsMenu;
