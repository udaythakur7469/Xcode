import React, { useEffect, useState } from "react";
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

// Diameter of the visible circular crop hole, in the same pixel space as
// CROP_STAGE_SIZE (320). Kept as a plain constant (not a percentage) so the
// CSS mask-image radial-gradient below and the on-screen ring line up with
// pixel precision regardless of stage size.
const CROP_HOLE_DIAMETER = 220;

const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onBack,
  onSave,
}) => {
  const [isSaving, setIsSaving] = React.useState(false);
  // The stage lives inside a Radix portal, which mounts AFTER this component
  // first renders — so a plain useRef is still null when effects run. Using
  // state-backed callback refs guarantees our effects re-run once the
  // element really exists.
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const {
    transform,
    zoom,
    isDragging,
    initializeImage,
    handleZoomChange,
    handlePointerDown,
    handleWheelZoom,
  } = useImageCropper();

  // Initialise (center + reset zoom) whenever the <img> finishes loading.
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    initializeImage(img.naturalWidth, img.naturalHeight);
  };

  // Mouse-wheel zoom needs a NON-passive native listener so preventDefault
  // works (React's onWheel is passive) and the page behind doesn't scroll.
  useEffect(() => {
    if (!stageEl) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleWheelZoom(e.deltaY);
    };
    stageEl.addEventListener("wheel", onWheel, { passive: false });
    return () => stageEl.removeEventListener("wheel", onWheel);
  }, [stageEl, handleWheelZoom]);

  const handleSave = async () => {
    if (!imageSrc) return;
    setIsSaving(true);
    try {
      const blob = await renderCircularCrop(
        imageSrc,
        transform,
        CROP_STAGE_SIZE,
        CROP_HOLE_DIAMETER,
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
          crop hole into an ellipse and desyncs the drag bounds from what's
          visually shown.
        */}
        <div
          ref={setStageEl}
          className="relative mx-auto h-80 w-80 touch-none select-none overflow-hidden rounded-lg bg-black"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onPointerDown={handlePointerDown}
        >
          {imageSrc && (
            <img
              key={imageSrc}
              onLoad={handleImageLoad}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left select-none"
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

/**
 * Darkens everything outside the circular crop area using a plain CSS
 * mask-image (radial-gradient) rather than an SVG <mask id="..."> element.
 *
 * Deliberately avoiding the id-referenced SVG mask: Radix Dialog keeps
 * DialogContent mounted in a portal during its close animation, so more
 * than one copy of this component's markup can briefly coexist in the DOM.
 * Two elements sharing the same mask id causes the browser to resolve
 * `url(#id)` unpredictably (sometimes against the wrong/stale instance),
 * which can silently break the circular clip and show a plain rectangle
 * instead. A CSS mask-image needs no id, so this can't happen.
 */
const CropMaskOverlay: React.FC = () => (
  <>
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: "rgba(0,0,0,0.6)",
        WebkitMaskImage: `radial-gradient(circle ${CROP_HOLE_DIAMETER / 2}px at center, transparent 0, transparent ${CROP_HOLE_DIAMETER / 2}px, black ${CROP_HOLE_DIAMETER / 2 + 1}px, black 100%)`,
        maskImage: `radial-gradient(circle ${CROP_HOLE_DIAMETER / 2}px at center, transparent 0, transparent ${CROP_HOLE_DIAMETER / 2}px, black ${CROP_HOLE_DIAMETER / 2 + 1}px, black 100%)`,
      }}
    />
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-white/70"
      style={{
        width: CROP_HOLE_DIAMETER,
        height: CROP_HOLE_DIAMETER,
        transform: "translate(-50%, -50%)",
      }}
    />
  </>
);

export default ImageCropDialog;
