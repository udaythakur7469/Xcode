import React, { useCallback, useState, useEffect } from "react";
import PostTitle from "./postTitle/PostTitle";
import PostToolbar from "./postToolbar/PostToolbar";
import PostEditor from "./postEditor/PostEditor";
import { usePostStore } from "@/features/postStore";
import { MoonLoader } from "react-spinners";
import { CircleX, CircleCheckBig } from "lucide-react";
import { useSearchParams } from "next/navigation";
import UnsavedChangesDialog from "./postTitle/dialogBoxes/UnsavedChangesDialog";
import MissingTitleDialog from "./postTitle/dialogBoxes/MissingTitleDialog";

type PostBoxProps = { onClose: () => void; draftId?: string | null };

const PostBox: React.FC<PostBoxProps> = ({ onClose, draftId = null }) => {
  const searchParams = useSearchParams(); // Get search params
  const problemTitle = searchParams.get("title") as string; // Get the title query parameter

  //post content states
  const [content, setContent] = useState<string>("");
  const [postTitle, setPostTitle] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [originalTemplate, setOriginalTemplate] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  const {
    createNewPost,
    getDraftPostData,
    updateDraftPost,
    createPost,
    isCreatingPost,
    createPostError,
    isGettingDraftPostDetails,
    isUpdatingDraftPost,
    updateDraftPostError,
  } = usePostStore();

  //other states
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [resetHandler, setResetHandler] = useState<(() => void) | null>(null);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showMissingTitleDialog, setShowMissingTitleDialog] =
    useState<boolean>(false);
  const [isDraftMode, setIsDraftMode] = useState<boolean>(false);

  // Load draft data if draftId is provided
  useEffect(() => {
    const loadDraftData = async () => {
      if (draftId) {
        setIsDraftMode(true);
        try {
          const draftData = await getDraftPostData(draftId);
          setPostTitle(draftData.title);
          setSelectedTags(draftData.tags);
          setContent(draftData.content);
          setOriginalTemplate(draftData.content);
        } catch (error) {
          console.error("Failed to load draft data:", error);
        }
      }
    };

    loadDraftData();
  }, [draftId, getDraftPostData]);

  const setOriginalTemplateContent = (template: string) => {
    setOriginalTemplate(template);
  };

  // Effect to detect changes - simple logging
  useEffect(() => {
    if (originalTemplate && content) {
      const hasContentChanged = content !== originalTemplate;

      // Log every time content differs from original
      if (hasContentChanged) {
        console.log("📝 Content modified - tracking changes");
      }

      // Update state for tracking transitions
      if (hasContentChanged && !hasChanges) {
        setHasChanges(true);
      } else if (!hasContentChanged && hasChanges) {
        console.log("✅ Content reverted to original");
        setHasChanges(false);
      }
    }
  }, [content, hasChanges, originalTemplate]);

  // Auto-close after success
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1000); // 1 second

      return () => clearTimeout(timer);
    }
  }, [showSuccess, onClose]);

  // function to insert markdown (toolbar actions)
  const handleInsertText = useCallback(
    (before: string, after: string = "") => {
      const textarea = document.querySelector(
        "textarea"
      ) as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      const replacement = before + selectedText + after;

      const newContent =
        content.substring(0, start) + replacement + content.substring(end);
      setContent(newContent);

      // Reset cursor selection
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      }, 0);
    },
    [content]
  );

  const handleDismissError = () => {
    setShowError(false);
  };

  // Add these functions for cancel handling
  const handleCancelWithCheck = () => {
    if (hasChanges) {
      setShowCancelDialog(true); // Show warning dialog
    } else {
      onClose(); // Close directly if no changes
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false); // Close warning dialog
    onClose(); // Close post box
  };

  const handleCreateNewPost = async () => {
    if (!postTitle) {
      setShowMissingTitleDialog(true);
      return;
    }

     try {
       if (isDraftMode && draftId) {
         // Update draft and publish it
         await updateDraftPost(draftId, postTitle, selectedTags, content, true);
         setSuccessMessage("Post published successfully!");
       } else {
         // Create new post
         await createNewPost(
           postTitle,
           problemTitle,
           selectedTags,
           content,
           false
         );
         setSuccessMessage("Post created successfully!");
       }
       setShowSuccess(true);
     } catch (error) {
       console.error("Failed to create/publish post:", error);
       setShowError(true);
     }
  };

  const handleCreateDraftPost = async () => {
    if (!postTitle) {
      setShowMissingTitleDialog(true);
      return;
    }
    try {
      if (isDraftMode && draftId) {
        // Update existing draft
        await updateDraftPost(draftId, postTitle, selectedTags, content, false);
        setSuccessMessage("Draft updated successfully!");
      } else {
        // Create new draft
        await createNewPost(
          postTitle,
          problemTitle,
          selectedTags,
          content,
          true
        );
        setSuccessMessage("Successfully saved as draft!");
      }
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to create/update draft:", error);
      setShowError(true);
    }
  };

  const isLoading =
    isCreatingPost || isGettingDraftPostDetails || isUpdatingDraftPost;
  const currentError = createPostError || updateDraftPostError;


  return (
    <div className="bg-muted h-full w-full rounded-xl border-none flex flex-col overflow-hidden">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="absolute inset-0 backdrop-blur-md pointer-events-none select-none z-50 flex justify-center items-center">
          <MoonLoader color="#ffffff" size={150} />
        </div>
      )}
      {/* Success Overlay - Shows after loader disappears for 2 seconds */}
      {showSuccess && !isLoading && (
        <div className="absolute inset-0 backdrop-blur-md pointer-events-none select-none z-50 flex justify-center items-center">
          <div className="relative rounded-lg p-8 max-w-md">
            <CircleCheckBig
              className="mx-auto mb-4 text-green-500/90"
              size={48}
            />
            <div className="w-full text-2xl font-bold text-green-500/90 text-center">
              {successMessage}
            </div>
          </div>
        </div>
      )}
      {/* Error overlay*/}
      {showError && currentError && (
        <div className="absolute inset-0 backdrop-blur-sm pointer-events-auto select-none z-50 flex justify-center items-center">
          <div className="relative rounded-lg p-8 max-w-md">
            <CircleX
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-red-500 cursor-pointer rounded-full p-1 transition-colors"
              size={48}
              onClick={handleDismissError}
            />
            <div className="w-full text-4xl font-bold text-red-500 text-center mt-4">
              {currentError}
            </div>
          </div>
        </div>
      )}
      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirmCancel={handleConfirmCancel}
      />
      {/* Missing title Dialog */}
      <MissingTitleDialog
        isOpen={showMissingTitleDialog}
        onClose={() => setShowMissingTitleDialog(false)}
      />
      {/* Title*/}
      <div className="border-b rounded-t-xl flex-[2.5] min-h-0 border">
        <PostTitle
          onClose={handleCancelWithCheck}
          postTitle={postTitle}
          setPostTitle={setPostTitle}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          handleCreateNewPost={handleCreateNewPost}
          handleCreateDraftPost={handleCreateDraftPost}
          isDraftMode={isDraftMode}
        />
      </div>
      {/* Toolbar*/}
      <div className="border-b flex-none min-h-0 border">
        <PostToolbar onInsertText={handleInsertText} onReset={resetHandler} />
      </div>
      {/* Editor panels takes rest of the space */}
      <div className="flex-[7] min-h-0 h-full rounded-b-xl border">
        <PostEditor
          content={content}
          setContent={setContent}
          onSelectionChange={(start, end) => {
            setSelectionStart(start);
            setSelectionEnd(end);
          }}
          onResetReady={setResetHandler}
          setOriginalTemplate={setOriginalTemplateContent}
          hasChanges={hasChanges}
          isDraftMode={isDraftMode}
        />
      </div>
    </div>
  );
};

export default PostBox;
