import { useCallback, useRef, useState } from "react";
import type { CropTransform } from "@/lib/cropImage";

export const CROP_STAGE_SIZE = 320;
export const CROP_ZOOM_MIN = 100;
export const CROP_ZOOM_MAX = 300;
export const CROP_ZOOM_STEP = 20;

/**
 * Drives the LeetCode-style "drag to reposition, slider to zoom" crop
 * interaction. The stage is always a `CROP_STAGE_SIZE`-square viewport with
 * a circular mask; this hook only tracks the underlying image's transform
 * (origin + scale) relative to that viewport.
 */
export function useImageCropper() {
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState<CropTransform>({
    originX: 0,
    originY: 0,
    scale: 1,
  });
  const [zoom, setZoom] = useState(CROP_ZOOM_MIN);
  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef({
    pointerStartX: 0,
    pointerStartY: 0,
    originStartX: 0,
    originStartY: 0,
  });

  const baseScaleFor = useCallback((width: number, height: number) => {
    const minDimension = Math.min(width, height);
    return minDimension > 0 ? CROP_STAGE_SIZE / minDimension : 1;
  }, []);

  const clampOrigin = useCallback(
    (originX: number, originY: number, scale: number, width: number, height: number) => {
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const minX = Math.min(0, CROP_STAGE_SIZE - scaledWidth);
      const minY = Math.min(0, CROP_STAGE_SIZE - scaledHeight);
      return {
        originX: Math.max(minX, Math.min(0, originX)),
        originY: Math.max(minY, Math.min(0, originY)),
      };
    },
    [],
  );

  /** Call once the source image has loaded, to center it and reset zoom. */
  const initializeImage = useCallback(
    (width: number, height: number) => {
      const baseScale = baseScaleFor(width, height);
      const originX = (CROP_STAGE_SIZE - width * baseScale) / 2;
      const originY = (CROP_STAGE_SIZE - height * baseScale) / 2;
      setNaturalSize({ width, height });
      setTransform({ originX, originY, scale: baseScale });
      setZoom(CROP_ZOOM_MIN);
    },
    [baseScaleFor],
  );

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      setZoom(nextZoom);
      setTransform((prev) => {
        const baseScale = baseScaleFor(naturalSize.width, naturalSize.height);
        const factor = nextZoom / 100;
        const nextScale = baseScale * factor;

        // Keep the stage's center point fixed on the same image pixel while
        // zooming, instead of zooming from the image's top-left corner.
        const center = CROP_STAGE_SIZE / 2;
        const relX = (center - prev.originX) / prev.scale;
        const relY = (center - prev.originY) / prev.scale;
        const rawOriginX = center - relX * nextScale;
        const rawOriginY = center - relY * nextScale;

        const clamped = clampOrigin(
          rawOriginX,
          rawOriginY,
          nextScale,
          naturalSize.width,
          naturalSize.height,
        );
        return { ...clamped, scale: nextScale };
      });
    },
    [baseScaleFor, clampOrigin, naturalSize],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      setIsDragging(true);
      dragStateRef.current = {
        pointerStartX: event.clientX,
        pointerStartY: event.clientY,
        originStartX: transform.originX,
        originStartY: transform.originY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [transform],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const { pointerStartX, pointerStartY, originStartX, originStartY } =
        dragStateRef.current;
      const rawOriginX = originStartX + (event.clientX - pointerStartX);
      const rawOriginY = originStartY + (event.clientY - pointerStartY);
      const clamped = clampOrigin(
        rawOriginX,
        rawOriginY,
        transform.scale,
        naturalSize.width,
        naturalSize.height,
      );
      setTransform((prev) => ({ ...prev, ...clamped }));
    },
    [isDragging, clampOrigin, transform.scale, naturalSize],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheelZoom = useCallback(
    (deltaY: number) => {
      const step = deltaY < 0 ? 5 : -5;
      const nextZoom = Math.max(CROP_ZOOM_MIN, Math.min(CROP_ZOOM_MAX, zoom + step));
      handleZoomChange(nextZoom);
    },
    [zoom, handleZoomChange],
  );

  return {
    transform,
    zoom,
    isDragging,
    initializeImage,
    handleZoomChange,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheelZoom,
  };
}
