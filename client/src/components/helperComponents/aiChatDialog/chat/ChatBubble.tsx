"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Loader2,
  CirclePause,
  Copy,
  RotateCcw,
  Pencil,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Message, useChatStore } from "@/features/chatStore";
import { formatDate } from "@/services/dateService";

type ChatBubbleProps = {
  message: Message;
  allMessages: Message[];
  isAIGenerating: boolean;
  onAbort: (messageId: string) => void;
  onRegenerate: (userMessageId: string) => void;
  onEditSave: (userMessageId: string, newText: string) => void;
  chatId: string;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  allMessages,
  isAIGenerating,
  onAbort,
  onRegenerate,
  onEditSave,
  chatId,
}) => {
  const isUser = message.role === "user";
  const isThinking = message.status === "thinking";
  const isError = message.status === "error";
  const isAborted = message.status === "aborted";
  const isSending = message.status === "sending";

  const setEditingState = useChatStore((s) => s.setEditingState);

  // ── Hover / long press ────────────────────────
  const [isHovered, setIsHovered] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => setIsHovered(true), 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // ── Copy ──────────────────────────────────────
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ── Edit state ────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Register / unregister in the store whenever edit mode changes.
  // ChatContainerSidebar reads this before switching chats or closing the dialog.
  useEffect(() => {
    if (isEditing) {
      setEditingState({ chatId, messageId: message.id });
    } else {
      setEditingState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // Clear store on unmount so it's never left stale.
  useEffect(() => {
    return () => {
      setEditingState(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enterEditMode = () => {
    setEditValue(message.text);
    setIsEditing(true);
    setTimeout(() => {
      editTextareaRef.current?.focus();
      const len = editTextareaRef.current?.value.length ?? 0;
      editTextareaRef.current?.setSelectionRange(len, len);
    }, 0);
  };

  const exitEditMode = () => {
    setIsEditing(false);
    setEditValue("");
  };

  // Watch store editingState: if cleared externally (ChatContainer confirmed exit),
  // close edit mode silently without showing our own dialog.
  const storeEditingState = useChatStore((s) => s.editingState);

  useEffect(() => {
    if (isEditing && storeEditingState === null) {
      setIsEditing(false);
      setEditValue("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeEditingState]);

  // ── Alert dialogs ─────────────────────────────
  const [rewriteAlertOpen, setRewriteAlertOpen] = useState(false);
  const [unsavedAlertOpen, setUnsavedAlertOpen] = useState(false);

  const pendingAction = useRef<"regenerate" | "edit" | null>(null);
  const pendingEditText = useRef<string>("");

  // ── Alert dialog trigger condition ────────────
  // Show rewrite dialog only when there are user messages AFTER this one.
  // AI-only messages after the target are ignored.
  const userMessagesAfterCount = (() => {
    const idx = allMessages.findIndex((m) => m.id === message.id);
    if (idx === -1) return 0;
    return allMessages.slice(idx + 1).filter((m) => m.role === "user").length;
  })();

  const needsRewriteConfirmation = userMessagesAfterCount > 0;

  // ── Regenerate ────────────────────────────────

  const handleRegenerateClick = () => {
    if (needsRewriteConfirmation) {
      pendingAction.current = "regenerate";
      setRewriteAlertOpen(true);
    } else {
      onRegenerate(message.id);
    }
  };

  // ── Edit ──────────────────────────────────────

  const handleEditClick = () => enterEditMode();

  const handleEditCancel = () => exitEditMode();

  const handleEditSaveClick = () => {
    const trimmed = editValue.trim();

    if (!trimmed) {
      toast.error("Please write a message first");
      return;
    }

    if (trimmed === message.text) {
      toast.warning("Please edit the message before saving");
      return;
    }

    if (needsRewriteConfirmation) {
      pendingAction.current = "edit";
      pendingEditText.current = trimmed;
      setRewriteAlertOpen(true);
    } else {
      exitEditMode();
      onEditSave(message.id, trimmed);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd+Enter → newline
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setEditValue((v) => v + "\n");
      return;
    }
    // Enter alone → save
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleEditSaveClick();
    }
    // Escape → cancel
    if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  const handleEditTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setEditValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 240)}px`;
  };

  // ── Rewrite alert handlers ────────────────────

  const handleRewriteConfirm = () => {
    setRewriteAlertOpen(false);
    if (pendingAction.current === "regenerate") {
      onRegenerate(message.id);
    } else if (pendingAction.current === "edit") {
      exitEditMode();
      onEditSave(message.id, pendingEditText.current);
    }
    pendingAction.current = null;
    pendingEditText.current = "";
  };

  const handleRewriteCancel = () => {
    setRewriteAlertOpen(false);
    pendingAction.current = null;
    pendingEditText.current = "";
    // Stay in edit mode — user cancelled the rewrite dialog, not the edit itself
  };

  // ── Unsaved changes alert handlers ───────────
  // Triggered by ChatContainerSidebar (via store) when user tries to switch
  // chats or close the dialog while this bubble is in edit mode.

  const handleUnsavedContinue = () => {
    setUnsavedAlertOpen(false);
    // Restore editingState — the container cleared it optimistically
    setEditingState({ chatId, messageId: message.id });
  };

  const handleUnsavedExit = () => {
    setUnsavedAlertOpen(false);
    setIsEditing(false);
    setEditValue("");
    // editingState is already null — navigation proceeds in the container
  };

  // ── Display flags ─────────────────────────────

  const showActionBar = isUser && !isSending && !isEditing && isHovered;
  const showDestructiveActions = !isAIGenerating;

  const bubbleClasses = [
    "px-3 py-2 rounded-xl border text-sm text-white leading-relaxed",
    isEditing
      ? "bg-zinc-800 border-zinc-600 w-full max-w-[80%]"
      : isUser
        ? "max-w-[70%] bg-blue-600 border-blue-500"
        : "max-w-[70%] bg-zinc-800 border-zinc-700",
    isSending ? "opacity-60 animate-pulse" : "",
    isError && !isUser ? "bg-red-950 border-red-500/50" : "",
    isAborted && !isUser ? "bg-yellow-950/60 border-yellow-600/40" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* Hover zone wraps bubble + action bar so moving to the bar keeps it visible */}
      <div
        className={`flex flex-col mb-3 ${isUser ? "items-end" : "items-start"}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={isUser ? handleTouchStart : undefined}
        onTouchEnd={isUser ? handleTouchEnd : undefined}
      >
        {/* ── Bubble ── */}
        <div className={bubbleClasses}>
          {isThinking ? (
            <div className="flex items-center justify-between gap-3 py-0.5">
              <div className="flex items-center gap-2 text-zinc-300">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Thinking…</span>
              </div>
              {isAIGenerating && (
                <button
                  onClick={() => onAbort(message.id)}
                  title="Stop generation"
                  className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-red-600 hover:bg-red-500 transition-colors"
                >
                  <CirclePause size={12} />
                  Stop
                </button>
              )}
            </div>
          ) : isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={editTextareaRef}
                value={editValue}
                onChange={handleEditTextareaChange}
                onKeyDown={handleEditKeyDown}
                rows={3}
                className="
                  w-full resize-none
                  bg-zinc-700 text-white text-sm
                  rounded-lg border border-zinc-500
                  px-3 py-2
                  outline-none
                  focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                  leading-relaxed placeholder-zinc-400
                  min-h-[72px]
                "
                placeholder="Edit your message…"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleEditCancel}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-500 text-zinc-300 hover:bg-zinc-600 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSaveClick}
                  disabled={
                    !editValue.trim() || editValue.trim() === message.text
                  }
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap break-words">
                {message.text}
              </div>
              {message.status === "sent" && (
                <div className="mt-1 text-[11px] text-zinc-400 text-right">
                  {formatDate(message.updatedAt)}
                </div>
              )}
              {isError && !isUser && (
                <div className="mt-1 text-[11px] font-semibold text-red-400">
                  Failed to generate response
                </div>
              )}
              {isAborted && !isUser && (
                <div className="mt-1 text-[11px] font-semibold text-yellow-500">
                  Generation stopped
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Action bar ── */}
        {showActionBar && (
          <div className="flex items-center gap-0.5 mt-1 animate-[fadeIn_0.12s_ease_forwards]">
            <ActionButton
              onClick={handleCopy}
              title="Copy message"
              label={copied ? "Copied!" : "Copy"}
              icon={
                copied ? (
                  <Check size={13} className="text-green-400" />
                ) : (
                  <Copy size={13} />
                )
              }
            />
            {showDestructiveActions && (
              <>
                <ActionButton
                  onClick={handleEditClick}
                  title="Edit message"
                  label="Edit"
                  icon={<Pencil size={13} />}
                />
                <ActionButton
                  onClick={handleRegenerateClick}
                  title="Regenerate response"
                  label="Regenerate"
                  icon={<RotateCcw size={13} />}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Rewrite conversation alert ── */}
      <AlertDialog open={rewriteAlertOpen} onOpenChange={setRewriteAlertOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Rewrite conversation from here?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently delete all messages after this point. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleRewriteCancel}
              className="bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRewriteConfirm}
              className="bg-red-600 hover:bg-red-500 text-white border-transparent"
            >
              Delete &amp; Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Unsaved changes alert (chat switch / dialog close mid-edit) ── */}
      <AlertDialog open={unsavedAlertOpen} onOpenChange={setUnsavedAlertOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              You have unsaved changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Your edits to this message will be lost if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleUnsavedContinue}
              className="bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              Continue editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsavedExit}
              className="bg-red-600 hover:bg-red-500 text-white border-transparent"
            >
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

type ActionButtonProps = {
  onClick: () => void;
  title: string;
  label: string;
  icon: React.ReactNode;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  title,
  label,
  icon,
}) => (
  <button
    onClick={onClick}
    title={title}
    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
  >
    {icon}
    {label}
  </button>
);

export default ChatBubble;
