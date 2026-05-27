"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MicOff, RefreshCw } from "lucide-react";

export type MicPermissionStatus = "unknown" | "checking" | "granted" | "denied";

type MicPermissionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  micStatus: MicPermissionStatus;
  onRetry: () => void;
};

const statusConfig: Record<
  MicPermissionStatus,
  { label: string; chipClass: string; dotClass: string }
> = {
  unknown: {
    label: "Unknown",
    chipClass: "border-gray-300 text-gray-600 bg-gray-50",
    dotClass: "bg-gray-400",
  },
  checking: {
    label: "Checking...",
    chipClass: "border-yellow-300 text-yellow-700 bg-yellow-50",
    dotClass: "bg-yellow-500 animate-pulse",
  },
  granted: {
    label: "Allowed",
    chipClass: "border-green-300 text-green-700 bg-green-50",
    dotClass: "bg-green-500",
  },
  denied: {
    label: "Blocked",
    chipClass: "border-red-300 text-red-700 bg-red-50",
    dotClass: "bg-red-500",
  },
};

const MicPermissionDialog: React.FC<MicPermissionDialogProps> = ({
  open,
  onOpenChange,
  micStatus,
  onRetry,
}) => {
  const status = statusConfig[micStatus];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
              <MicOff className="w-5 h-5 text-red-500" />
            </div>
            <DialogTitle className="text-base">
              Microphone access required
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            Your browser needs microphone access to run the interview. Please
            allow it when prompted, or enable it manually using the steps below.
          </DialogDescription>
        </DialogHeader>

        {/* Permission status chip */}
        <div className="flex gap-2 mt-1">
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${status.chipClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
            Microphone — {status.label}
          </span>
        </div>

        {/* Manual steps — shown when denied */}
        {micStatus === "denied" && (
          <div className="mt-3 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              How to enable manually
            </p>
            <ol className="space-y-2.5">
              {[
                <>
                  Click the <strong className="font-medium">lock icon</strong>{" "}
                  in your browser&apos;s address bar
                </>,
                <>
                  Set{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    Microphone
                  </code>{" "}
                  to <strong className="font-medium">Allow</strong>
                </>,
                <>
                  Click <strong className="font-medium">Try again</strong> below
                  — no page reload needed
                </>,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs shrink-0 mt-0.5 text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-foreground leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Dismiss
          </Button>
          <Button onClick={onRetry} disabled={micStatus === "checking"}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            {micStatus === "checking" ? "Checking..." : "Try again"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MicPermissionDialog;
