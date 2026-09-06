import React, { useEffect, useRef } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { MoonLoader } from "react-spinners";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useImageCropper,
  CROP_STAGE_SIZE,
  CROP_ZOOM_MIN,
  CROP_ZOOM_MAX,
} from "@/hooks/useImageCropper";
import { renderCircularCrop } from "@/lib/cropImage";

type ImageCropDialogProps = {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: (open: boolean) => void;
  onBack: () => void;
  onSave: (blob: Blob) => Promise<void>;
};

const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onBack,
  onSave,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const {
    transform,
    zoom,
    isDragging,
    initializeImage,
    handleZoomChange,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheelZoom,
  } = useImageCropper();

  // Re-center the image every time a new source is loaded into the dialog.
  useEffect(() => {
    const img = imageRef.current;
    if (!img || !imageSrc) return;

    const handleLoad = () => {
      initializeImage(img.naturalWidth, img.naturalHeight);
    };

    if (img.complete && img.naturalWidth > 0) {
      handleLoad();
    } else {
      img.addEventListener("load", handleLoad);
      return () => img.removeEventListener("load", handleLoad);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  const handleSave = async () => {
    if (!imageSrc) return;
    setIsSaving(true);
    try {
      const blob = await renderCircularCrop(
        imageSrc,
        transform,
        CROP_STAGE_SIZE,
      );
      await onSave(blob);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Adjust your photo</DialogTitle>
          <DialogDescription className="text-center">
            Drag to reposition and use the slider to zoom.
          </DialogDescription>
        </DialogHeader>

        {/*
          IMPORTANT: this stage must stay a perfect square (CROP_STAGE_SIZE x
          CROP_STAGE_SIZE, i.e. h-80 w-80 = 320x320px) and centered — never
          w-full. useImageCropper's drag-clamping and zoom math assume a
          square viewport; a non-square stage both stretches the circular
          mask into an ellipse and desyncs the drag bounds from what's
          visually shown.
        */}
        <div
          className="relative mx-auto h-80 w-80 select-none overflow-hidden rounded-lg bg-black"
          style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={(e) => {
            e.preventDefault();
            handleWheelZoom(e.deltaY);
          }}
        >
          {imageSrc && (
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
              style={{
                transform: `translate(${transform.originX}px, ${transform.originY}px) scale(${transform.scale})`,
              }}
            />
          )}
          <CropMaskOverlay />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomOut className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={CROP_ZOOM_MIN}
            max={CROP_ZOOM_MAX}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-secondary accent-green-500"
          />
          <ZoomIn className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          This is how your profile picture will appear across xCode.
        </p>

        <DialogFooter className="flex flex-row gap-3 sm:justify-center">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSaving}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !imageSrc}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-none"
          >
            {isSaving ? <MoonLoader size={16} color="#ffffff" /> : "Save photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** SVG mask that darkens everything outside the circular crop area. */
const CropMaskOverlay: React.FC = () => (
  <svg
    className="pointer-events-none absolute inset-0 h-full w-full"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <defs>
      <mask id="avatarCropHoleMask">
        <rect x="0" y="0" width="100" height="100" fill="white" />
        <circle cx="50" cy="50" r="34" fill="black" />
      </mask>
    </defs>
    <rect
      x="0"
      y="0"
      width="100"
      height="100"
      fill="rgba(0,0,0,0.6)"
      mask="url(#avatarCropHoleMask)"
    />
    <circle cx="50" cy="50" r="34" fill="none" stroke="white" strokeWidth="0.6" />
  </svg>
);

export default ImageCropDialog;
