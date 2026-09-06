import React from "react";
import { ArrowLeft, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCameraStream } from "@/hooks/useCameraStream";
import { captureMirroredFrame } from "@/lib/cropImage";

type CameraCaptureDialogProps = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onBack: () => void;
  onCapture: (dataUrl: string) => void;
};

const CameraCaptureDialog: React.FC<CameraCaptureDialogProps> = ({
  isOpen,
  onClose,
  onBack,
  onCapture,
}) => {
  const { status, videoRef } = useCameraStream(isOpen);

  const handleCapture = () => {
    if (!videoRef.current || status !== "streaming") return;
    const dataUrl = captureMirroredFrame(videoRef.current);
    onCapture(dataUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <DialogTitle className="mb-0">Take a photo</DialogTitle>
          </div>
          <DialogDescription className="text-center">
            Center your face in frame and press the shutter.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-80 w-full overflow-hidden rounded-lg bg-black">
          {status === "requesting" && (
            <CameraFallback label="Requesting camera access…" />
          )}
          {status === "unavailable" && (
            <CameraFallback label="Camera access unavailable. Please allow camera permissions and try again." />
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={
              "h-full w-full object-cover [transform:scaleX(-1)] " +
              (status === "streaming" ? "block" : "hidden")
            }
          />
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleCapture}
            disabled={status !== "streaming"}
            title="Capture"
            className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-4 border-white/30 bg-white transition-transform hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="h-[46px] w-[46px] rounded-full border-2 border-background bg-white" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CameraFallback: React.FC<{ label: string }> = ({ label }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-6 text-center text-sm text-muted-foreground">
    <Camera className="h-8 w-8" strokeWidth={1.5} />
    {label}
  </div>
);

export default CameraCaptureDialog;
