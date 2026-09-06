import React, { useEffect, useRef, useState } from "react";

interface NodeTooltipProps {
  text: string;
  nodeEl: HTMLElement;
  boundsEl: HTMLElement;
}

// ─────────────────────────────────────────────────────────────────────────────
// Placement priority: left → right → top → bottom, defaulting to top if all
// four directions are blocked. Measures the tooltip off-screen first
// (visibility: hidden) to know its real size before deciding where to put
// it. Rendered via position: fixed directly against viewport coordinates —
// must be explicitly unmounted by the parent on click/close, since it isn't
// cleaned up automatically by anything else closing around it.
// ─────────────────────────────────────────────────────────────────────────────
const NodeTooltip: React.FC<NodeTooltipProps> = ({ text, nodeEl, boundsEl }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });

  useEffect(() => {
    const tip = ref.current;
    if (!tip) return;

    const nodeRect = nodeEl.getBoundingClientRect();
    const boundsRect = boundsEl.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const gap = 10;

    const availLeft = nodeRect.left - boundsRect.left;
    const availRight = boundsRect.right - nodeRect.right;
    const availTop = nodeRect.top - boundsRect.top;
    const availBottom = boundsRect.bottom - nodeRect.bottom;

    let left: number;
    let top: number;
    if (availLeft >= tw + gap) {
      left = nodeRect.left - tw - gap;
      top = nodeRect.top + nodeRect.height / 2 - th / 2;
    } else if (availRight >= tw + gap) {
      left = nodeRect.right + gap;
      top = nodeRect.top + nodeRect.height / 2 - th / 2;
    } else if (availTop >= th + gap) {
      left = nodeRect.left + nodeRect.width / 2 - tw / 2;
      top = nodeRect.top - th - gap;
    } else if (availBottom >= th + gap) {
      left = nodeRect.left + nodeRect.width / 2 - tw / 2;
      top = nodeRect.bottom + gap;
    } else {
      // all four directions blocked — default to top
      left = nodeRect.left + nodeRect.width / 2 - tw / 2;
      top = nodeRect.top - th - gap;
    }

    left = Math.max(boundsRect.left + 4, Math.min(left, boundsRect.right - tw - 4));
    top = Math.max(boundsRect.top + 4, Math.min(top, boundsRect.bottom - th - 4));

    setStyle({ left, top, visibility: "visible" });
  }, [nodeEl, boundsEl]);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", zIndex: 200, ...style }}
      className="max-w-[240px] bg-zinc-800 border border-[var(--brand)]/35 rounded-lg px-2.5 py-2 text-xs leading-relaxed text-white shadow-2xl pointer-events-none"
    >
      {text}
    </div>
  );
};

export default NodeTooltip;
