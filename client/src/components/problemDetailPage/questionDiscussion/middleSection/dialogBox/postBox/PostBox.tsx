import React, { useCallback, useState, useEffect, useRef } from "react";
import PostTitle from "./postTitle/PostTitle";
import PostToolbar from "./postToolbar/PostToolbar";
import PostEditor from "./postEditor/PostEditor";
import { usePostStore } from "@/features/postStore";
import { MoonLoader } from "react-spinners";
import { CircleCheckBig } from "lucide-react";
import { useSearchParams } from "next/navigation";
import UnsavedChangesDialog from "./postTitle/dialogBoxes/UnsavedChangesDialog";
import MissingTitleDialog from "./postTitle/dialogBoxes/MissingTitleDialog";
import type { AIMode, AITone } from "./postToolbar/generatePost/AIWritePanel";
import PostCreationErrorDialog from "./postToolbar/generatePost/PostCreationErrorDialog";
import AIGenerationErrorDialog from "./postToolbar/generatePost/AIGenerationErrorDialog";
import AIGenerateConfirmDialog from "./postToolbar/generatePost/AIGenerateConfirmDialog";

type PostBoxProps = { onClose: () => void; draftId?: string | null };

const MAX_HISTORY = 5;

const PostBox: React.FC<PostBoxProps> = ({ onClose, draftId = null }) => {
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title") as string;

  // ── Post content states ──────────────────────────────────────────────────
  const [content, setContent] = useState<string>("");
  const [postTitle, setPostTitle] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [originalTemplate, setOriginalTemplate] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  // ── AI panel states ──────────────────────────────────────────────────────
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMode, setAiMode] = useState<AIMode>("write");
  const [aiTone, setAiTone] = useState<AITone>("technical");
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showAIConfirmDialog, setShowAIConfirmDialog] = useState(false);
  const [showGenerateError, setShowGenerateError] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Undo stack — snapshots taken before each AI generation
  const undoStackRef = useRef<string[]>([]);

  // AbortController ref — recreated on each generation
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    createNewPost,
    getDraftPostData,
    updateDraftPost,
    isCreatingPost,
    createPostError,
    isGettingDraftPostDetails,
    isUpdatingDraftPost,
    updateDraftPostError,
    generatePost,
    isGeneratingPost,
    generatePostError,
    generatePostTitle,
    isGeneratingTitle,
    generatePostTags,
    isGeneratingTags,
  } = usePostStore();

  // ── Other UI states ──────────────────────────────────────────────────────
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const resetHandlerRef = useRef<(() => void) | null>(null);
  const [hasResetHandler, setHasResetHandler] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showMissingTitleDialog, setShowMissingTitleDialog] = useState(false);
  const [isDraftMode, setIsDraftMode] = useState(false);

  // ── Load draft ───────────────────────────────────────────────────────────
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

  // Detect content changes
  useEffect(() => {
    if (originalTemplate && content) {
      const changed = content !== originalTemplate;
      if (changed && !hasChanges) setHasChanges(true);
      else if (!changed && hasChanges) setHasChanges(false);
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

  // Show AI error dialog when store sets generatePostError
  useEffect(() => {
    if (generatePostError) setShowGenerateError(true);
  }, [generatePostError]);

  // Ctrl+Z undo for AI generations (only when AI panel is open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && isAIPanelOpen) {
        if (undoStackRef.current.length > 0) {
          e.preventDefault();
          const prev = undoStackRef.current.pop()!;
          setContent(prev);
          setHasGenerated(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAIPanelOpen]);

  // Auto-detect selection → switch to Improve mode
  useEffect(() => {
    const handleSelectionChange = () => {
      const textarea = document.querySelector(
        "textarea#post-markdown-editor",
      ) as HTMLTextAreaElement | null;
      if (!textarea) return;
      const sel = textarea.value.substring(
        textarea.selectionStart,
        textarea.selectionEnd,
      );
      if (sel.trim().length > 20 && isAIPanelOpen) {
        setAiMode("improve");
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [isAIPanelOpen]);

  // ── Toolbar text insertion ───────────────────────────────────────────────
  const handleInsertText = useCallback(
    (before: string, after: string = "") => {
      const textarea = document.querySelector(
        "textarea#post-markdown-editor",
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

  // ── Cancel / close ───────────────────────────────────────────────────────
  const handleCancelWithCheck = () => {
    if (hasChanges) setShowCancelDialog(true);
    else onClose();
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    onClose();
  };

  // ── Post creation ────────────────────────────────────────────────────────
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

  // ── AI panel ─────────────────────────────────────────────────────────────

  const handleOpenAIPanel = () => {
    setIsAIPanelOpen((prev) => !prev);
  };

  const addToHistory = (prompt: string) => {
    if (!prompt.trim()) return;
    setPromptHistory((prev) => {
      const filtered = prev.filter((p) => p !== prompt);
      return [prompt, ...filtered].slice(0, MAX_HISTORY);
    });
  };

  // Core generation runner — used by generate, regenerate, and retry
  const runGeneration = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;

    // Snapshot current content for Ctrl+Z undo
    undoStackRef.current.push(content);

    addToHistory(prompt);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // For selection-based improve, grab the selected text range
    const textarea = document.querySelector(
      "textarea#post-markdown-editor",
    ) as HTMLTextAreaElement | null;
    const selectedText =
      aiMode === "improve" && textarea
        ? textarea.value.substring(
            textarea.selectionStart,
            textarea.selectionEnd,
          )
        : undefined;

    const isSelectionRewrite =
      aiMode === "improve" &&
      !!selectedText &&
      selectedText.trim().length > 0 &&
      selectionStart !== selectionEnd;

    // For selection rewrite — don't clear entire content
    if (!isSelectionRewrite) {
      setContent("");
    }

    setIsStreaming(true);
    setHasGenerated(false);

    try {
      await generatePost(
        prompt,
        (chunk) => {
          if (isSelectionRewrite) {
            // Splice chunk into the selection range in real time
            setContent((prev) => {
              const before = prev.substring(0, selectionStart);
              const after = prev.substring(selectionEnd);
              return before + chunk + after;
            });
          } else {
            setContent((prev) => prev + chunk);
          }
        },
        {
          mode: aiMode,
          tone: aiTone,
          problemTitle: problemTitle ?? undefined,
          currentContent: aiMode === "write" ? undefined : content,
          selectedText,
          signal: controller.signal,
        },
      );

      setIsStreaming(false);
      setHasGenerated(true);
      setHasChanges(true);
      setIsAIPanelOpen(false);
    } catch (error) {
      setIsStreaming(false);
      // AbortError → user clicked Stop — partial content kept, no error dialog
    }
  };

  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) return;
    if (hasChanges) setShowAIConfirmDialog(true);
    else runGeneration();
  };

  const handleAIAbort = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const handleAIRegenerate = () => {
    runGeneration();
  };

  const handleRetryGeneration = () => {
    setShowGenerateError(false);
    runGeneration();
  };

  // ── Title suggestion ─────────────────────────────────────────────────────
  const handleSuggestTitle = async () => {
    try {
      const suggested = await generatePostTitle(
        content,
        problemTitle ?? undefined,
      );
      setPostTitle(suggested);
    } catch (error) {
      console.error("Title generation failed:", error);
    }
  };

  // ── Tag suggestion ───────────────────────────────────────────────────────
  const handleSuggestTags = async (): Promise<string[]> => {
    try {
      const suggested = await generatePostTags(
        content,
        selectedTags,
        problemTitle ?? undefined,
      );
      return suggested;
    } catch (error) {
      console.error("Tag generation failed:", error);
      return [];
    }
  };

  const isLoading =
    isCreatingPost || isGettingDraftPostDetails || isUpdatingDraftPost;
  const currentError = createPostError || updateDraftPostError;

  return (
    <div className="bg-muted h-full w-full rounded-xl border-none flex flex-col overflow-hidden">
      {/* Loader */}
      {isLoading && (
        <div className="absolute inset-0 backdrop-blur-md pointer-events-none select-none z-50 flex justify-center items-center">
          <MoonLoader color="#ffffff" size={150} />
        </div>
      )}

      {/* Success */}
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

      {/* Post creation error — shadcn AlertDialog, renders via Portal → screen-centered */}
      <PostCreationErrorDialog
        isOpen={showError && !!currentError}
        error={currentError ?? ""}
        onClose={() => setShowError(false)}
      />

      {/* AI generation error — shadcn AlertDialog, renders via Portal → screen-centered */}
      <AIGenerationErrorDialog
        isOpen={showGenerateError && !!generatePostError}
        error={generatePostError ?? ""}
        onClose={() => setShowGenerateError(false)}
        onRetry={handleRetryGeneration}
      />

      {/* Unsaved changes */}
      <UnsavedChangesDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* Missing title */}
      <MissingTitleDialog
        isOpen={showMissingTitleDialog}
        onClose={() => setShowMissingTitleDialog(false)}
      />

      {/* AI replace confirm */}
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
          onSuggestTitle={handleSuggestTitle}
          isSuggestingTitle={isGeneratingTitle}
          onSuggestTags={handleSuggestTags}
          isSuggestingTags={isGeneratingTags}
        />
      </div>

      {/* Toolbar */}
      <div className="border-b flex-none min-h-0 border">
        <PostToolbar
          onInsertText={handleInsertText}
          onReset={hasResetHandler ? () => resetHandlerRef.current?.() : null}
          onOpenAIPanel={handleOpenAIPanel}
          isAIPanelOpen={isAIPanelOpen}
        />
      </div>

      {/* Editor */}
      <div className="flex-[7] min-h-0 h-full rounded-b-xl border">
        <PostEditor
          content={content}
          setContent={setContent}
          onSelectionChange={(start, end) => {
            setSelectionStart(start);
            setSelectionEnd(end);
            // Auto-switch to Improve when text is selected and panel is open
            if (isAIPanelOpen && end - start > 20) {
              setAiMode("improve");
            }
          }}
          onResetReady={(fn) => {
            resetHandlerRef.current = fn;
            setHasResetHandler(true);
          }}
          setOriginalTemplate={setOriginalTemplateContent}
          hasChanges={hasChanges}
          isDraftMode={isDraftMode}
          isStreaming={isStreaming}
          isAIPanelOpen={isAIPanelOpen}
          aiPrompt={aiPrompt}
          aiMode={aiMode}
          aiTone={aiTone}
          promptHistory={promptHistory}
          hasGenerated={hasGenerated}
          isGeneratingPost={isGeneratingPost}
          problemTitle={problemTitle ?? undefined}
          onAiPromptChange={setAiPrompt}
          onAiGenerate={handleAIGenerate}
          onAiAbort={handleAIAbort}
          onAiRegenerate={handleAIRegenerate}
          onAiCancel={() => setIsAIPanelOpen(false)}
          onAiModeChange={setAiMode}
          onAiToneChange={setAiTone}
        />
      </div>
    </div>
  );
};

export default PostBox;
