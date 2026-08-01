"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Copy,
  RotateCcw,
  Pencil,
  Check,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  MessageNode,
  MessageFeedback,
  useChatStore,
} from "@/features/chatStore";
import { formatDate } from "@/services/dateService";
import BranchNavigator from "./BranchNavigator";

type ChatBubbleProps = {
  message: MessageNode;
  isActivePathGenerating: boolean;
  onRegenerate: (userMessageId: string) => void;
  onEditSave: (userMessageId: string, newText: string) => void;
  chatId: string;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isActivePathGenerating,
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
  const setFeedback = useChatStore((s) => s.setFeedback);

  // ── Hover / long press ────────────────────────────────────────────────────
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

  // ── Copy ──────────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ── Feedback (Like / Dislike) — AI bubbles only ───────────────────────────
  const handleFeedback = (value: "LIKE" | "DISLIKE") => {
    // Toggle off if already selected
    const newFeedback: MessageFeedback =
      message.feedback === value ? null : value;
    setFeedback(message.id, newFeedback);
  };

  // ── Edit state ────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Register editing state in the store so ChatContainerSidebar can guard
  // chat switches while an edit textarea is open.
  useEffect(() => {
    if (isEditing) {
      setEditingState({ chatId, messageId: message.id });
    } else {
      setEditingState(null);
    }
    return () => {
      setEditingState(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // Watch store editingState: if cleared externally (chat-switch guard confirmed
  // exit), close edit mode silently without showing another dialog.
  const storeEditingState = useChatStore((s) => s.editingState);
  useEffect(() => {
    if (isEditing && storeEditingState === null) {
      setIsEditing(false);
      setEditValue("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeEditingState]);

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

  // ── Edit save ─────────────────────────────────────────────────────────────
  // No AlertDialog needed — branching means nothing is deleted.
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

    exitEditMode();
    onEditSave(message.id, trimmed);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setEditValue((v) => v + "\n");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleEditSaveClick();
    }
    if (e.key === "Escape") exitEditMode();
  };

  const handleEditTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setEditValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 240)}px`;
  };

  // ── Regenerate ────────────────────────────────────────────────────────────
  // No AlertDialog — branching creates a new node, nothing is deleted.
  const handleRegenerateClick = () => {
    onRegenerate(message.id);
  };

  // ── Display flags ─────────────────────────────────────────────────────────
  const showActionBar = !isSending && !isEditing && isHovered;
  // Edit and Regenerate hidden while any generation is in progress on active path
  const showDestructiveActions = !isActivePathGenerating;

  const bubbleClasses = [
    "px-3 py-2 rounded-xl border text-sm text-white leading-relaxed",
    isEditing
      ? "bg-zinc-800 border-zinc-600 w-full max-w-[80%]"
      : isUser
        ? "max-w-[70%] bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dim)] border-transparent"
        : "max-w-[70%] bg-[var(--brand-muted)] border-[var(--brand)]/25",
    isSending ? "opacity-60 animate-pulse" : "",
    isError && !isUser ? "bg-red-950 border-red-500/50" : "",
    isAborted && !isUser ? "bg-yellow-950/60 border-yellow-600/40" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* Outer wrapper — hover zone covers bubble + navigator + action bar */}
      <div
        className={`flex flex-col mb-4 ${isUser ? "items-end" : "items-start"}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={isUser ? handleTouchStart : undefined}
        onTouchEnd={isUser ? handleTouchEnd : undefined}
      >
        {/* ── Bubble ──────────────────────────────────────────────────────── */}
        <div className={bubbleClasses}>
          {isThinking ? (
            /* Thinking state — Stop button removed from bubble, lives in ChatInput */
            <div className="flex items-center gap-2 py-0.5 text-zinc-300">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">Thinking…</span>
            </div>
          ) : isEditing ? (
            /* Edit mode */
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
                  px-3 py-2 outline-none
                  focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                  leading-relaxed placeholder-zinc-400 min-h-[72px]
                "
                placeholder="Edit your message…"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={exitEditMode}
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
            /* Normal message */
            <>
              <div className="whitespace-pre-wrap break-words">
                {message.text}
              </div>
              {message.status === "sent" && (
                <div className="mt-1 text-[11px] text-white text-right">
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

        {/* ── Branch navigator — below bubble, above action bar ────────────── */}
        {!isEditing && <BranchNavigator message={message} />}

        {/* ── Action bar ──────────────────────────────────────────────────── */}
        <div
          className={`flex items-center gap-0.5 mt-1 h-5 transition-opacity duration-150 ${
            showActionBar ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {isUser ? (
            /* User bubble: Copy, Edit, Regenerate */
            <>
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
                    onClick={enterEditMode}
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
            </>
          ) : (
            /* AI bubble: Copy, Like, Dislike */
            <>
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
              <ActionButton
                onClick={() => handleFeedback("LIKE")}
                title="Like response"
                label="Like"
                icon={
                  <ThumbsUp
                    size={13}
                    className={
                      message.feedback === "LIKE"
                        ? "text-green-400 fill-green-400"
                        : ""
                    }
                  />
                }
                active={message.feedback === "LIKE"}
              />
              <ActionButton
                onClick={() => handleFeedback("DISLIKE")}
                title="Dislike response"
                label="Dislike"
                icon={
                  <ThumbsDown
                    size={13}
                    className={
                      message.feedback === "DISLIKE"
                        ? "text-red-400 fill-red-400"
                        : ""
                    }
                  />
                }
                active={message.feedback === "DISLIKE"}
              />
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

// ── Small reusable action button ──────────────────────────────────────────────

type ActionButtonProps = {
  onClick: () => void;
  title: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  title,
  label,
  icon,
  active = false,
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`
      flex items-center gap-1.5 px-2 py-1 rounded-md
      text-[11px] font-medium transition-colors
      ${
        active
          ? "text-zinc-200 bg-zinc-700"
          : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
      }
    `}
  >
    {icon}
    {label}
  </button>
);

export default ChatBubble;
