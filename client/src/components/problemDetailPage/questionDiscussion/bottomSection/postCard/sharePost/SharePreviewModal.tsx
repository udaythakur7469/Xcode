"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, Copy, Info, ArrowLeft } from "lucide-react";
import { ShareWarning, SmartSharePlatform } from "@/types/share";
import { copyToClipboard } from "@/lib/share/shareUtils";

type SharePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  platform: SmartSharePlatform;
  content: string;
  warnings: ShareWarning[];
  // Medium-specific: auto-open toggle
  showAutoOpenOption?: boolean;
};

const PLATFORM_LABELS: Record<SmartSharePlatform, string> = {
  medium: "Medium",
  blog: "Blog Post",
  notion: "Notion Notes",
  discussion: "Discussion",
};

const SharePreviewModal: React.FC<SharePreviewModalProps> = ({
  isOpen,
  onClose,
  platform,
  content,
  warnings,
  showAutoOpenOption = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [autoOpen, setAutoOpen] = useState(true);

  const handleCopy = async () => {
    await copyToClipboard(content);
    setCopied(true);

    if (showAutoOpenOption && autoOpen) {
      window.open("https://medium.com/new-story", "_blank");
    }

    setTimeout(() => setCopied(false), 2500);
  };

  const warnCount = warnings.filter((w) => w.severity === "warn").length;
  const infoCount = warnings.filter((w) => w.severity === "info").length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <span className="text-muted-foreground">/</span>
            <DialogTitle className="text-base font-semibold">
              {PLATFORM_LABELS[platform]} Preview
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="px-5 pt-3 pb-2 shrink-0 space-y-1.5">
            {warnings.map((w, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-xs px-3 py-2 rounded-md ${
                  w.severity === "warn"
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                {w.severity === "warn" ? (
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                ) : (
                  <Info size={13} className="mt-0.5 shrink-0" />
                )}
                {w.message}
              </div>
            ))}
          </div>
        )}

        {/* Raw/Rendered toggle */}
        <div className="px-5 py-2 border-b shrink-0 flex items-center gap-2">
          <button
            onClick={() => setShowRaw(false)}
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              !showRaw
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setShowRaw(true)}
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              showRaw
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Raw
          </button>
          <span className="ml-auto text-xs text-muted-foreground">
            {content.length.toLocaleString()} chars
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
          {showRaw ? (
            <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
              {content}
            </pre>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed">
              {/* Render as plain text preview — the actual rendering happens 
                  on the destination platform. We show a structured text view. */}
              <pre className="text-sm font-sans whitespace-pre-wrap break-words leading-relaxed text-foreground bg-transparent p-0 border-0">
                {content}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t shrink-0 space-y-3">
          {/* Medium auto-open toggle */}
          {showAutoOpenOption && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setAutoOpen((v) => !v)}
                className={`w-8 h-4 rounded-full transition-colors relative ${
                  autoOpen ? "bg-primary" : "bg-secondary"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    autoOpen ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                Open Medium editor after copy
              </span>
            </label>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopy}
              className="flex-1 gap-2"
              variant={copied ? "outline" : "default"}
            >
              {copied ? (
                <>
                  <Check size={15} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={15} />
                  {showAutoOpenOption && autoOpen
                    ? "Copy & Open Medium"
                    : "Copy to Clipboard"}
                </>
              )}
            </Button>
            {copied && !showAutoOpenOption && (
              <p className="text-xs text-muted-foreground">
                Paste it wherever you want
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharePreviewModal;
