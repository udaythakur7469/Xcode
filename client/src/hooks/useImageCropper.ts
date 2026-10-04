import { useCallback, useEffect, useRef, useState } from "react";
import type { CropTransform } from "@/lib/cropImage";

export const CROP_STAGE_SIZE = 320;
// Diameter of the visible circular crop hole (same pixel space as the stage).
export const CROP_HOLE_DIAMETER = 220;
const HOLE_INSET = (CROP_STAGE_SIZE - CROP_HOLE_DIAMETER) / 2;
export const CROP_ZOOM_MIN = 100;
export const CROP_ZOOM_MAX = 300;

/**
 * Drives the "drag to reposition, slider to zoom" crop interaction. The
 * stage is always a `CROP_STAGE_SIZE`-square viewport with a circular mask;
 * this hook only tracks the underlying image's transform (origin + scale)
 * relative to that viewport.
 *
 * Dragging is driven by window-level pointermove/pointerup listeners
 * (attached only while a drag is in progress) rather than relying on the
 * stage element's own pointer capture. This is deliberate: the crop stage
 * lives inside a Radix Dialog portal, and pointer capture set on an element
 * inside a portal can be unreliable across browsers once the pointer moves
 * fast or briefly leaves the element's bounds. Listening on `window`
 * sidesteps that entirely and is the more robust pattern for drag-anywhere
 * interactions like this one.
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
  // Mirrors `transform`/`naturalSize` for use inside the window listener
  // effect below, without needing to re-subscribe that effect on every
  // transform change (which would tear down/rebuild it mid-drag).
  const latestRef = useRef({ transform, naturalSize });
  latestRef.current = { transform, naturalSize };
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const baseScaleFor = useCallback((width: number, height: number) => {
    const minDimension = Math.min(width, height);
    // At 100% zoom the image's shorter side exactly spans the circle.
    return minDimension > 0 ? CROP_HOLE_DIAMETER / minDimension : 1;
  }, []);

  const clampOrigin = useCallback(
    (
      originX: number,
      originY: number,
      scale: number,
      width: number,
      height: number,
    ) => {
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      // The image only has to cover the circle's bounding square, so its
      // edges/corners can be dragged all the way to the circle's edge.
      const maxX = HOLE_INSET;
      const maxY = HOLE_INSET;
      const minX = HOLE_INSET + CROP_HOLE_DIAMETER - scaledWidth;
      const minY = HOLE_INSET + CROP_HOLE_DIAMETER - scaledHeight;
      return {
        originX: Math.max(minX, Math.min(maxX, originX)),
        originY: Math.max(minY, Math.min(maxY, originY)),
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
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
      setTransform((prev) => {
        const { naturalSize: size } = latestRef.current;
        const baseScale = baseScaleFor(size.width, size.height);
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
          size.width,
          size.height,
        );
        return { ...clamped, scale: nextScale };
      });
    },
    [baseScaleFor, clampOrigin],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Only the primary button/touch/pen starts a drag.
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      setIsDragging(true);
      dragStateRef.current = {
        pointerStartX: event.clientX,
        pointerStartY: event.clientY,
        originStartX: latestRef.current.transform.originX,
        originStartY: latestRef.current.transform.originY,
      };
    },
    [],
  );

  // Window-level listeners, active only while dragging. This is what
  // actually moves the image — see the note in the JSDoc above for why
  // window listeners are used instead of per-element pointer capture.
  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (event: PointerEvent) => {
      const { pointerStartX, pointerStartY, originStartX, originStartY } =
        dragStateRef.current;
      const { transform: t, naturalSize: size } = latestRef.current;
      const rawOriginX = originStartX + (event.clientX - pointerStartX);
      const rawOriginY = originStartY + (event.clientY - pointerStartY);
      const clamped = clampOrigin(
        rawOriginX,
        rawOriginY,
        t.scale,
        size.width,
        size.height,
      );
      setTransform((prev) => ({ ...prev, ...clamped }));
    };

    const onPointerUp = () => setIsDragging(false);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDragging, clampOrigin]);

  const handleWheelZoom = useCallback(
    (deltaY: number) => {
      const step = deltaY < 0 ? 5 : -5;
      const nextZoom = Math.max(
        CROP_ZOOM_MIN,
        Math.min(CROP_ZOOM_MAX, zoomRef.current + step),
      );
      if (nextZoom === zoomRef.current) return;
      handleZoomChange(nextZoom);
    },
    [handleZoomChange],
  );

  return {
    transform,
    zoom,
    isDragging,
    initializeImage,
    handleZoomChange,
    handlePointerDown,
    handleWheelZoom,
  };
}
