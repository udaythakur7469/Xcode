import { useCallback, useRef } from "react";

const ZOOM_DURATION_MS = 280;
// Time constant (ms) of the wheel's exponential smoothing — the zoom closes
// ~63% of the remaining distance to its target every WHEEL_SMOOTHING_MS.
const WHEEL_SMOOTHING_MS = 85;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

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
// producing a visible "overshoots right, then centers" artifact.
//
// The fix: drive scale, sizer width/height, margin, AND scroll position ALL
// from one single requestAnimationFrame loop, recomputing every value fresh
// from the same interpolated zoom value (z) on every frame. There is exactly
// one clock. Do not reintroduce a CSS transition on transform/width/height/
// margin-left for these elements.
//
// Zoom anchoring: every zoom keeps one point of the diagram stationary on
// screen — the mouse cursor for wheel zoom, the viewport centre for the +/-
// buttons. That is what lets the user pan with the mouse (drag) and then zoom
// where they are looking, instead of being yanked back to the root node.
// ─────────────────────────────────────────────────────────────────────────────
export function useZoomAnimation(
  refs: React.MutableRefObject<ZoomRefs>,
  baseSizeRef: React.MutableRefObject<{ width: number; height: number; rootPx: number }>,
) {
  const zoomRef = useRef(1);
  // The zoom level the user is heading towards. Wheel events accumulate
  // against this (not against the mid-animation value) so fast scrolling
  // feels proportional and doesn't stall.
  const targetZoomRef = useRef(1);
  const tokenRef = useRef(0);
  // Wheel zoom runs ONE continuous loop that chases targetZoomRef, instead of
  // restarting a fixed-duration animation on every wheel tick (each restart
  // reset the easing curve's velocity to zero, which felt steppy/jerky).
  const wheelAnchorRef = useRef({ x: 0, y: 0 });
  const wheelLoopTokenRef = useRef(-1);

  // Applies scale/size/margin for zoom `z`, then positions the scroll so the
  // diagram point that was under (ax, ay) — canvas-viewport coordinates at
  // zoom `fromZ` — is still under it at zoom `z`.
  const applyZoomAnchored = useCallback(
    (z: number, fromZ: number, ax: number, ay: number) => {
      const { sizer, wrap, canvas } = refs.current;
      const base = baseSizeRef.current;
      if (!sizer || !wrap || !canvas) return;

      // Diagram-space point under the anchor BEFORE the change.
      const contentX = (canvas.scrollLeft + ax - sizer.offsetLeft) / fromZ;
      const contentY = (canvas.scrollTop + ay - sizer.offsetTop) / fromZ;

      wrap.style.transform = `scale(${z})`;
      sizer.style.width = `${base.width * z}px`;
      sizer.style.height = `${base.height * z}px`;

      // Keep the diagram horizontally centred while it is narrower than the
      // viewport (same rule as applyInstant).
      const extraSpace = canvas.clientWidth / 2 - base.rootPx * z;
      sizer.style.marginLeft = extraSpace > 0 ? `${extraSpace}px` : "0px";

      // Reading offsetLeft/offsetTop forces layout with the new margin/size.
      canvas.scrollLeft = contentX * z + sizer.offsetLeft - ax;
      canvas.scrollTop = contentY * z + sizer.offsetTop - ay;
    },
    [refs, baseSizeRef],
  );

  const applyInstant = useCallback(
    (zoom: number) => {
      const { sizer, wrap, canvas } = refs.current;
      const base = baseSizeRef.current;
      if (!sizer || !wrap || !canvas) return;

      tokenRef.current++; // cancel any running animation
      zoomRef.current = zoom;
      targetZoomRef.current = zoom;
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
    },
    [refs, baseSizeRef],
  );

  const animateTo = useCallback(
    (
      targetZoomRaw: number,
      opts?: { anchor?: { x: number; y: number }; duration?: number },
    ) => {
      const { canvas } = refs.current;
      if (!canvas) return;
      const targetZoom = clampZoom(+targetZoomRaw.toFixed(3));
      targetZoomRef.current = targetZoom;

      // Anchor in canvas-viewport coordinates; default = viewport centre.
      const ax = opts?.anchor?.x ?? canvas.clientWidth / 2;
      const ay = opts?.anchor?.y ?? canvas.clientHeight / 2;
      const duration = opts?.duration ?? ZOOM_DURATION_MS;

      const myToken = ++tokenRef.current;
      const fromZoom = zoomRef.current;
      const start = performance.now();
      let prevZ = fromZoom;

      function step(now: number) {
        if (myToken !== tokenRef.current) return; // superseded by a newer zoom
        const t = Math.min(1, (now - start) / duration);
        const z = fromZoom + (targetZoom - fromZoom) * easeOutCubic(t);

        applyZoomAnchored(z, prevZ, ax, ay);
        prevZ = z;
        zoomRef.current = z;

        if (t < 1) requestAnimationFrame(step);
        else zoomRef.current = targetZoom;
      }
      requestAnimationFrame(step);
    },
    [refs, applyZoomAnchored],
  );

  const zoomIn = useCallback(() => animateTo(targetZoomRef.current + 0.12), [animateTo]);
  const zoomOut = useCallback(() => animateTo(targetZoomRef.current - 0.12), [animateTo]);

  // Mouse-wheel zoom, anchored at the cursor. deltaY is normalised to pixels
  // (line-mode wheels report ~3 per notch) and applied exponentially so every
  // notch changes the zoom by the same *percentage*. Each event only moves the
  // TARGET; a single rAF loop eases the actual zoom towards it with
  // frame-rate-independent exponential smoothing, so rapid scrolling glides
  // like the +/- buttons rather than stepping.
  const zoomByWheel = useCallback(
    (deltaY: number, deltaMode: number, anchor: { x: number; y: number }) => {
      const { canvas } = refs.current;
      if (!canvas) return;

      const px = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 100 : deltaY;
      const clamped = Math.max(-120, Math.min(120, px));
      targetZoomRef.current = clampZoom(targetZoomRef.current * Math.exp(-clamped * 0.0016));
      wheelAnchorRef.current = anchor;

      // Loop already running (and not superseded by a button zoom)? Done —
      // it will pick up the new target and anchor on its next frame.
      if (wheelLoopTokenRef.current === tokenRef.current) return;

      const myToken = ++tokenRef.current;
      wheelLoopTokenRef.current = myToken;
      let last = performance.now();

      function step(now: number) {
        if (myToken !== tokenRef.current) return; // superseded by a newer zoom
        const dt = Math.min(64, now - last);
        last = now;

        const target = targetZoomRef.current;
        const prevZ = zoomRef.current;
        let z = prevZ + (target - prevZ) * (1 - Math.exp(-dt / WHEEL_SMOOTHING_MS));
        const done = Math.abs(target - z) < 0.0005;
        if (done) z = target;

        const a = wheelAnchorRef.current;
        applyZoomAnchored(z, prevZ, a.x, a.y);
        zoomRef.current = z;

        if (done) wheelLoopTokenRef.current = -1;
        else requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    },
    [refs, applyZoomAnchored],
  );

  // Smoothly returns to EXACTLY the state applyInstant(1) produced when the
  // panel opened: zoom 1, diagram centred on the root, scrolled to the top.
  // One rAF loop drives zoom + scroll together (same single-clock rule as
  // animateTo), so there is no drift between them.
  const recenter = useCallback(() => {
    const { sizer, wrap, canvas } = refs.current;
    const base = baseSizeRef.current;
    if (!sizer || !wrap || !canvas) return;

    const myToken = ++tokenRef.current;
    const fromZoom = zoomRef.current;
    const fromLeft = canvas.scrollLeft;
    const fromTop = canvas.scrollTop;
    targetZoomRef.current = 1;

    // Same target-scroll rule as applyInstant at zoom 1.
    const extraSpace1 = canvas.clientWidth / 2 - base.rootPx;
    const toLeft =
      extraSpace1 > 0
        ? 0
        : Math.max(0, Math.min(-extraSpace1, Math.max(0, base.width - canvas.clientWidth)));
    const toTop = 0;
    const start = performance.now();

    function step(now: number) {
      if (myToken !== tokenRef.current) return;
      const t = Math.min(1, (now - start) / ZOOM_DURATION_MS);
      const e = easeOutCubic(t);
      const z = fromZoom + (1 - fromZoom) * e;

      wrap!.style.transform = `scale(${z})`;
      sizer!.style.width = `${base.width * z}px`;
      sizer!.style.height = `${base.height * z}px`;
      const extra = canvas!.clientWidth / 2 - base.rootPx * z;
      sizer!.style.marginLeft = extra > 0 ? `${extra}px` : "0px";

      canvas!.scrollLeft = fromLeft + (toLeft - fromLeft) * e;
      canvas!.scrollTop = fromTop + (toTop - fromTop) * e;
      zoomRef.current = z;

      if (t < 1) requestAnimationFrame(step);
      else applyInstant(1); // snap to the exact opening state
    }
    requestAnimationFrame(step);
  }, [refs, baseSizeRef, applyInstant]);

  return { zoomRef, applyInstant, animateTo, zoomIn, zoomOut, zoomByWheel, recenter };
}
