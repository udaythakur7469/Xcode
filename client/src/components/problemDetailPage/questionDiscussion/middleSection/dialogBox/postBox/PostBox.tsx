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
import AIGenerateConfirmDialog from "./postToolbar/generatePost/AIGenerateConfirmDialog";
import PostCreationErrorDialog from "./postToolbar/generatePost/PostCreationErrorDialog";
import AIGenerationErrorDialog from "./postToolbar/generatePost/AIGenerationErrorDialog";

type PostBoxProps = { onClose: () => void; draftId?: string | null };

const PostBox: React.FC<PostBoxProps> = ({ onClose, draftId = null }) => {
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title") as string;

  // Post content states
  const [content, setContent] = useState<string>("");
  const [postTitle, setPostTitle] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [originalTemplate, setOriginalTemplate] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  // AI panel states
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAIConfirmDialog, setShowAIConfirmDialog] = useState(false);

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
    generatePost,
    isGeneratingPost,
    generatePostError,
  } = usePostStore();

  // Other states
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
  const [showGenerateError, setShowGenerateError] = useState(false);

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

  // Detect content changes from original template
  useEffect(() => {
    if (originalTemplate && content) {
      const hasContentChanged = content !== originalTemplate;

      if (hasContentChanged && !hasChanges) {
        setHasChanges(true);
      } else if (!hasContentChanged && hasChanges) {
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
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [showSuccess, onClose]);

  // Show error overlay when generatePostError appears
  useEffect(() => {
    if (generatePostError) {
      setShowGenerateError(true);
    }
  }, [generatePostError]);

  // Toolbar text insertion
  const handleInsertText = useCallback(
    (before: string, after: string = "") => {
      const textarea = document.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      const replacement = before + selectedText + after;

      const newContent =
        content.substring(0, start) + replacement + content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length,
        );
      }, 0);
    },
    [content],
  );

  const handleDismissError = () => {
    setShowError(false);
  };

  const handleCancelWithCheck = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    onClose();
  };

  const handleCreateNewPost = async () => {
    if (!postTitle) {
      setShowMissingTitleDialog(true);
      return;
    }

    try {
      if (isDraftMode && draftId) {
        await updateDraftPost(draftId, postTitle, selectedTags, content, true);
        setSuccessMessage("Post published successfully!");
      } else {
        await createNewPost(
          postTitle,
          problemTitle,
          selectedTags,
          content,
          false,
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
        await updateDraftPost(draftId, postTitle, selectedTags, content, false);
        setSuccessMessage("Draft updated successfully!");
      } else {
        await createNewPost(
          postTitle,
          problemTitle,
          selectedTags,
          content,
          true,
        );
        setSuccessMessage("Successfully saved as draft!");
      }
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to create/update draft:", error);
      setShowError(true);
    }
  };

  // ── AI generation handlers ─────────────────────────────────────────────────

  const handleOpenAIPanel = () => {
    setIsAIPanelOpen((prev) => !prev);
  };

  // Called by AIWritePanel when the user clicks Generate or presses Enter.
  // If the user has made changes to the base template, show the confirm dialog first.
  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) return;

    if (hasChanges) {
      setShowAIConfirmDialog(true);
    } else {
      runGeneration();
    }
  };

  // The actual generation call — wired to the store's streaming generatePost.
  const runGeneration = async () => {
    setContent("");

    try {
      await generatePost(aiPrompt, (chunk) => {
        setContent((prev) => prev + chunk);
      });
      // Generation complete — mark content as changed from original template
      setIsAIPanelOpen(false);
      setHasChanges(true);
    } catch (error) {
      // generatePostError in the store drives showGenerateError via useEffect
    }
  };

  const handleRetryGeneration = () => {
    setShowGenerateError(false);
    runGeneration();
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

      {/* Success Overlay */}
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

      {/* Post creation error dialog */}
      <PostCreationErrorDialog
        isOpen={showError && !!currentError}
        error={currentError ?? ""}
        onClose={handleDismissError}
      />

      {/* AI generation error dialog */}
      <AIGenerationErrorDialog
        isOpen={showGenerateError && !!generatePostError}
        error={generatePostError ?? ""}
        onClose={() => setShowGenerateError(false)}
        onRetry={handleRetryGeneration}
      />

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

      {/* AI generate confirm dialog — shown when user has existing changes */}
      <AIGenerateConfirmDialog
        isOpen={showAIConfirmDialog}
        onClose={() => {
          setShowAIConfirmDialog(false);
          setIsAIPanelOpen(false);
        }}
        onProceed={() => {
          setShowAIConfirmDialog(false);
          runGeneration();
        }}
      />

      {/* Title */}
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

      {/* Toolbar */}
      <div className="border-b flex-none min-h-0 border">
        <PostToolbar
          onInsertText={handleInsertText}
          onReset={resetHandler}
          onOpenAIPanel={handleOpenAIPanel}
          isAIPanelOpen={isAIPanelOpen}
        />
      </div>

      {/* Editor panels take the rest of the space */}
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
          isAIPanelOpen={isAIPanelOpen}
          aiPrompt={aiPrompt}
          isGeneratingPost={isGeneratingPost}
          onAiPromptChange={setAiPrompt}
          onAiGenerate={handleAIGenerate}
          onAiCancel={() => setIsAIPanelOpen(false)}
        />
      </div>
    </div>
  );
};

export default PostBox;
