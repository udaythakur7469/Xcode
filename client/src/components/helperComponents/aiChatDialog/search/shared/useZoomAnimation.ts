import { useCallback, useRef } from "react";

const ZOOM_DURATION_MS = 280;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface ZoomRefs {
  canvas: HTMLDivElement | null;
  sizer: HTMLDivElement | null;
  wrap: HTMLDivElement | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// useZoomAnimation
//
// IMPORTANT — read before changing anything in here.
//
// Early versions animated scale/size via a CSS transition while separately
// animating scrollLeft via a JS requestAnimationFrame loop. These are two
// independent animation engines with their own internal frame scheduling —
// even with identical duration/easing numbers, they drift apart under load,
// producing a visible "overshoots right, then centers" (zoom out) /
// "overshoots left, then centers" (zoom in) artifact. Matching the easing
// more closely only made the drift smaller, never zero.
//
// The fix: drive scale, sizer width/height, margin, AND scrollLeft ALL from
// one single requestAnimationFrame loop, recomputing every value fresh from
// the same interpolated progress value (z) on every frame. The centering
// target becomes a pure function of z, and z is only ever touched in this
// one loop, so drift is structurally impossible — there is exactly one
// clock. Do not reintroduce a CSS transition on transform/width/height/
// margin-left for these elements.
// ─────────────────────────────────────────────────────────────────────────────
export function useZoomAnimation(
  refs: React.MutableRefObject<ZoomRefs>,
  baseSizeRef: React.MutableRefObject<{ width: number; height: number; rootPx: number }>,
) {
  const zoomRef = useRef(1);
  const tokenRef = useRef(0);

  const applyInstant = useCallback((zoom: number) => {
    const { sizer, wrap, canvas } = refs.current;
    const base = baseSizeRef.current;
    if (!sizer || !wrap || !canvas) return;

    zoomRef.current = zoom;
    wrap.style.transform = `scale(${zoom})`;
    sizer.style.width = `${base.width * zoom}px`;
    sizer.style.height = `${base.height * zoom}px`;

    const half = canvas.clientWidth / 2;
    const rootVisualX = base.rootPx * zoom;
    const extraSpace = half - rootVisualX;
    if (extraSpace > 0) {
      sizer.style.marginLeft = `${extraSpace}px`;
      canvas.scrollTo({ left: 0, top: 0, behavior: "instant" as ScrollBehavior });
    } else {
      sizer.style.marginLeft = "0px";
      const maxScroll = Math.max(0, base.width * zoom - canvas.clientWidth);
      canvas.scrollTo({
        left: Math.max(0, Math.min(-extraSpace, maxScroll)),
        top: 0,
        behavior: "instant" as ScrollBehavior,
      });
    }
  }, [refs, baseSizeRef]);

  const animateTo = useCallback((targetZoomRaw: number) => {
    const targetZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +targetZoomRaw.toFixed(2)));
    const { sizer, wrap, canvas } = refs.current;
    const base = baseSizeRef.current;
    if (!sizer || !wrap || !canvas) return;

    const myToken = ++tokenRef.current;
    const fromZoom = zoomRef.current;
    const start = performance.now();

    function step(now: number) {
      if (myToken !== tokenRef.current) return; // superseded by a newer zoom step
      const t = Math.min(1, (now - start) / ZOOM_DURATION_MS);
      const z = fromZoom + (targetZoom - fromZoom) * easeOutCubic(t);

      wrap!.style.transform = `scale(${z})`;
      sizer!.style.width = `${base.width * z}px`;
      sizer!.style.height = `${base.height * z}px`;

      // Centering target recomputed fresh from this SAME z, in this SAME
      // frame — margin/scroll are a pure function of z, so they can never
      // fall out of sync with the scale that was just drawn above.
      const half = canvas!.clientWidth / 2;
      const rootVisualX = base.rootPx * z;
      const extraSpace = half - rootVisualX;
      if (extraSpace > 0) {
        sizer!.style.marginLeft = `${extraSpace}px`;
        canvas!.scrollLeft = 0;
      } else {
        sizer!.style.marginLeft = "0px";
        const maxScroll = Math.max(0, base.width * z - canvas!.clientWidth);
        canvas!.scrollLeft = Math.max(0, Math.min(-extraSpace, maxScroll));
      }

      zoomRef.current = z;
      if (t < 1) requestAnimationFrame(step);
      else zoomRef.current = targetZoom;
    }
    requestAnimationFrame(step);
  }, [refs, baseSizeRef]);

  const zoomIn = useCallback(() => animateTo(zoomRef.current + 0.12), [animateTo]);
  const zoomOut = useCallback(() => animateTo(zoomRef.current - 0.12), [animateTo]);
  const zoomByWheel = useCallback(
    (deltaY: number) => animateTo(zoomRef.current + (deltaY > 0 ? -0.06 : 0.06)),
    [animateTo],
  );

  return { zoomRef, applyInstant, animateTo, zoomIn, zoomOut, zoomByWheel };
}
