import React, { useEffect, useRef, useState } from "react";
import { DraftPostData, usePostStore } from "@/features/postStore";
import { ScrollArea } from "@/components/ui/questionDiscussionScrollArea";
import { EllipsisVertical } from "lucide-react";
import DraftOptionsMenu from "./draftOptionsMenu/DraftOptionsMenu";

type DraftPostDropdownProps = {
  draftPosts: DraftPostData[];
  isGettingDraftPostData: boolean;
  draftPostError: any;
  onDraftClick: (draftId: string) => void;
  onClose?: () => void;
};

const DraftPostDropdown: React.FC<DraftPostDropdownProps> = ({
  draftPosts,
  isGettingDraftPostData,
  draftPostError,
  onDraftClick,
  onClose,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const truncateTitle = (title: string): string => {
    if (title.length > 30) {
      return title.substring(0, 30) + "...";
    }
    return title;
  };

  const { manageDraftPost, isManagingDraftPost, manageDraftPostError } =
    usePostStore();

  const handleEllipsisClick = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation(); // Prevent triggering the parent div's onClick
    setOpenMenuId(openMenuId === draftId ? null : draftId);
  };

  const handleMenuAction = async (
    action: string,
    draftId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    console.log("Draft ID:", draftId);

    setOpenMenuId(null);

    switch (action) {
      case "Rename":
        await manageDraftPost(draftId, "rename", "New Title");
        break;
      case "Post":
        await manageDraftPost(draftId, "post");
        break;
      case "Delete":
        await manageDraftPost(draftId, "delete");
        break;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId];
        const target = event.target as Node;

        // Check if click is outside the menu
        if (menuElement && !menuElement.contains(target)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  if (isGettingDraftPostData) {
    return <div>Loading drafts...</div>;
  }

  if (draftPostError) {
    return <div>Error loading drafts</div>;
  }

  return (
    <div className="relative">
      <ScrollArea className="h-[180px] w-full pr-2">
        <div className="space-y-3">
          {draftPosts.map((draftPost) => (
            <div
              className="h-full w-full py-1 px-2 bg-secondary rounded-md text-lg flex flex-row items-center justify-between"
              key={draftPost.id}
            >
              {/* Clickable title area */}
              <div
                className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onDraftClick(draftPost.id.toString())}
              >
                {truncateTitle(draftPost.title)}
              </div>

              {/* Ellipsis button - separate clickable area */}
              <div
                ref={(el) => (menuRefs.current[draftPost.id.toString()] = el)}
                className="cursor-pointer hover:bg-secondary-foreground/10 rounded p-1 transition-colors"
                onClick={(e) => handleEllipsisClick(e, draftPost.id.toString())}
              >
                <EllipsisVertical className="ml-3" size={22} />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Options Menu - rendered outside scroll container */}
      {openMenuId && (
        <div
          style={{
            position: "fixed",
            left:
              (menuRefs.current[openMenuId]?.getBoundingClientRect().right ||
                0) + 8,
            top: menuRefs.current[openMenuId]?.getBoundingClientRect().top || 0,
          }}
          className="z-[9999]"
        >
          <DraftOptionsMenu
            draftId={openMenuId}
            onRename={(e) => handleMenuAction("Rename", openMenuId, e)}
            onPost={(e) => handleMenuAction("Post", openMenuId, e)}
            onDelete={(e) => handleMenuAction("Delete", openMenuId, e)}
          />
        </div>
      )}
    </div>
  );
};
export default DraftPostDropdown;
