import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChatStore, SearchScope } from "@/features/chatStore";
import {
  LayoutNode,
  LayoutNodeMap,
  TREE_LAYOUT_CONSTANTS as T2D,
} from "../shared/types";
import {
  buildAllChatsLayoutMap,
  buildSingleChatLayoutMap,
  computeLayout,
  trimToBoundary,
} from "../shared/treeLayout";
import { useZoomAnimation } from "../shared/useZoomAnimation";
import TreeNode from "./TreeNode";
import NodeTooltip from "./NodeTooltip";

export interface TreeCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  jumpToNextMatch: () => void;
}

interface TreeCanvasProps {
  scope: SearchScope;
  openedFromChatId: string | null;
  onRevealMessage: (chatId: string, messageId: string) => void;
  onMatchesChange: (count: number, currentIndex: number) => void;
}

const TreeCanvas = forwardRef<TreeCanvasHandle, TreeCanvasProps>(
  ({ scope, openedFromChatId, onRevealMessage, onMatchesChange }, ref) => {
    const chatCache = useChatStore((s) => s.chatCache);
    const userChats = useChatStore((s) => s.userChats);
    const getChatMessages = useChatStore((s) => s.getChatMessages);

    const loadedChatTreeIds = useChatStore((s) => s.loadedChatTreeIds);
    const markChatTreeLoaded = useChatStore((s) => s.markChatTreeLoaded);
    const graphSearchQuery = useChatStore((s) => s.graphSearchQuery);

    const canvasRef = useRef<HTMLDivElement>(null);
    const sizerRef = useRef<HTMLDivElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    // Getter-backed so the zoom hook always sees the CURRENT DOM nodes, even
    // on the very first layout effect (a plain snapshot taken during render
    // would still hold null for refs that attach after that render).
    const refsBundle = useRef<{
      canvas: HTMLDivElement | null;
      sizer: HTMLDivElement | null;
      wrap: HTMLDivElement | null;
    }>({
      get canvas() {
        return canvasRef.current;
      },
      get sizer() {
        return sizerRef.current;
      },
      get wrap() {
        return wrapRef.current;
      },
    });
    const baseSizeRef = useRef({ width: 0, height: 0, rootPx: 0 });

    const { applyInstant, zoomIn, zoomOut, zoomByWheel } = useZoomAnimation(
      refsBundle,
      baseSizeRef,
    );

    const [hovered, setHovered] = useState<{ node: LayoutNode; el: HTMLElement } | null>(null);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

    // ── Build the layout map ────────────────────────────────────────────────
    const { layoutMap, rootId } = useMemo(() => {
      if (scope === "chat") {
        const cache = openedFromChatId ? chatCache[openedFromChatId] : null;
        if (!cache) return { layoutMap: {} as LayoutNodeMap, rootId: "" };
        return buildSingleChatLayoutMap(cache.nodeMap, cache.activePath, openedFromChatId!);
      }
      const chatTrees: Record<string, { nodeMap: any; activePath: string[] }> = {};
      loadedChatTreeIds.forEach((chatId) => {
        if (chatCache[chatId]) {
          chatTrees[chatId] = {
            nodeMap: chatCache[chatId].nodeMap,
            activePath: chatCache[chatId].activePath,
          };
        }
      });
      return buildAllChatsLayoutMap(userChats, chatTrees, openedFromChatId);
    }, [scope, openedFromChatId, chatCache, userChats, loadedChatTreeIds]);

    // ── Layout + lines ───────────────────────────────────────────────────────
    const { width, height, lines, nodes } = useMemo(() => {
      if (!rootId || !layoutMap[rootId]) {
        return { width: 0, height: 0, lines: [], nodes: [] as LayoutNode[] };
      }
      const { width, height } = computeLayout(layoutMap, rootId);
      const lines = Object.values(layoutMap)
        .filter((n) => n.parentId)
        .map((n) => {
          const parent = layoutMap[n.parentId!];
          const p1 = trimToBoundary(parent, n);
          const p2 = trimToBoundary(n, parent);
          const onPath = n.onPath && parent.onPath;
          return { key: n.id, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, onPath };
        });
      return { width, height, lines, nodes: Object.values(layoutMap) };
    }, [layoutMap, rootId]);

    // ── Instant centering — synchronous, before paint, on open/scope change ──
    useLayoutEffect(() => {
      if (!width || !height || !rootId) return;
      baseSizeRef.current = { width, height, rootPx: layoutMap[rootId].px! };
      applyInstant(1);
    }, [width, height, rootId, layoutMap, applyInstant]);

    useImperativeHandle(ref, () => ({
      zoomIn,
      zoomOut,
      jumpToNextMatch: () => {
        const matchEls = canvasRef.current?.querySelectorAll<HTMLElement>(
          '[data-search-match="true"]',
        );
        if (!matchEls || matchEls.length === 0) return;
        const nextIndex = (currentMatchIndex + 1) % matchEls.length;
        setCurrentMatchIndex(nextIndex);
        onMatchesChange(matchEls.length, nextIndex);
        matchEls[nextIndex].scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      },
    }));

    // ── In-graph search matching ─────────────────────────────────────────────
    const matchingIds = useMemo(() => {
      const q = graphSearchQuery.trim().toLowerCase();
      if (!q) return new Set<string>();
      const ids = new Set<string>();
      nodes.forEach((n) => {
        if (n.kind === "circle" && n.text?.toLowerCase().includes(q)) ids.add(n.id);
      });
      return ids;
    }, [graphSearchQuery, nodes]);

    useEffect(() => {
      setCurrentMatchIndex(-1);
      onMatchesChange(matchingIds.size, -1);
    }, [matchingIds, onMatchesChange]);

    // ── Lazy loading in All Chats mode: fetch a chat's tree only once its
    //    rect node has scrolled into the visible viewport ──────────────────
    useEffect(() => {
      if (scope !== "all" || !canvasRef.current) return;
      const rectEls = canvasRef.current.querySelectorAll<HTMLElement>("[data-nav-chat]");
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const chatId = (entry.target as HTMLElement).dataset.navChat;
            if (!chatId || loadedChatTreeIds.has(chatId)) return;
            markChatTreeLoaded(chatId);
            if (!chatCache[chatId]) {
              getChatMessages(chatId).catch((err) =>
                console.error("Failed to lazy-load chat tree:", err),
              );
            }
          });
        },
        { root: canvasRef.current, rootMargin: "80px", threshold: 0.2 },
      );
      rectEls.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scope, nodes.length]);

    const handleNodeClick = useCallback(
      (node: LayoutNode) => {
        setHovered(null);
        if (node.kind === "rect") {
          const chatId = node.navChatId ?? openedFromChatId;
          if (!chatId) return;
          const cache = chatCache[chatId];
          const rootMsgId = cache?.activePath?.[0];
          if (rootMsgId) onRevealMessage(chatId, rootMsgId);
        } else {
          onRevealMessage(node.chatId!, node.id);
        }
      },
      [chatCache, openedFromChatId, onRevealMessage],
    );

    // ── Mouse wheel = zoom (anchored at the cursor) ─────────────────────────
    // Must be a NATIVE non-passive listener: React registers onWheel as
    // passive, so preventDefault() there is ignored and the canvas would
    // scroll instead of zooming.
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        zoomByWheel(e.deltaY, e.deltaMode, {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setHovered(null);
      };
      canvas.addEventListener("wheel", onWheel, { passive: false });
      return () => canvas.removeEventListener("wheel", onWheel);
    }, [zoomByWheel]);

    // ── Click-and-drag = pan ────────────────────────────────────────────────
    // Works from anywhere on the canvas, including over nodes. A press only
    // becomes a drag after moving a few pixels, so plain clicks on nodes
    // still open the message; a click that ends a drag is swallowed.
    const [isPanning, setIsPanning] = useState(false);
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Don't hijack presses on the canvas's own scrollbars.
      if (e.clientX - canvas.getBoundingClientRect().left > canvas.clientWidth) return;
      if (e.clientY - canvas.getBoundingClientRect().top > canvas.clientHeight) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = canvas.scrollLeft;
      const startTop = canvas.scrollTop;
      let dragging = false;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!dragging) {
          if (Math.hypot(dx, dy) < 4) return;
          dragging = true;
          setIsPanning(true);
          setHovered(null);
        }
        ev.preventDefault();
        canvas.scrollLeft = startLeft - dx;
        canvas.scrollTop = startTop - dy;
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        if (dragging) {
          setIsPanning(false);
          // Swallow the click the browser fires right after a drag.
          const swallow = (ev: MouseEvent) => {
            ev.stopPropagation();
            ev.preventDefault();
          };
          window.addEventListener("click", swallow, { capture: true, once: true });
          setTimeout(() => window.removeEventListener("click", swallow, true), 0);
        }
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }, []);

    return (
      <div
        ref={canvasRef}
        data-wheel-owner
        onMouseDown={handleMouseDown}
        onScroll={() => setHovered(null)}
        className={`flex-1 overflow-auto relative px-10 py-7 select-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Legend — explicit pixel gaps (Tailwind has no gap-4.5 / pb-4.5, which
            is why the items used to touch each other and the tree below). */}
        <div
          className="flex flex-wrap items-center text-[11.5px] text-zinc-400"
          style={{ columnGap: 28, rowGap: 8, marginBottom: 40 }}
        >
          <span className="flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full inline-block bg-[var(--brand)]" />
            Your message
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full inline-block bg-[var(--brand-muted)] border-2 border-[var(--brand)]" />
            Nova AI reply
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full inline-block bg-zinc-700 border-2 border-zinc-600" />
            Alternate branch (edit / regenerate)
          </span>
        </div>

        <div ref={sizerRef} style={{ position: "relative", marginLeft: 0 }}>
          <div
            ref={wrapRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width,
              height,
              transformOrigin: "top left",
            }}
          >
            <svg
              width={width}
              height={height}
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
            >
              {lines.map((l) => (
                <line
                  key={l.key}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={l.onPath ? "rgba(34,197,94,.45)" : "rgba(255,255,255,.14)"}
                  strokeWidth={l.onPath ? 2 : 1.5}
                />
              ))}
            </svg>

            {nodes.map((n) => {
              const isMatch = matchingIds.has(n.id);
              const matchEls = Array.from(matchingIds);
              const isCurrent =
                isMatch && matchEls.indexOf(n.id) === currentMatchIndex && currentMatchIndex >= 0;
              return (
                <TreeNode
                  key={n.id}
                  node={n}
                  isSearchMatch={isMatch}
                  isSearchDim={matchingIds.size > 0 && !isMatch && n.kind === "circle"}
                  isCurrentMatch={isCurrent}
                  isCurrentChat={n.chatId === openedFromChatId}
                  onClick={() => handleNodeClick(n)}
                  onHover={(node, el) => setHovered(node && el ? { node, el } : null)}
                />
              );
            })}
          </div>
        </div>

        {hovered && canvasRef.current && (
          <NodeTooltip
            text={hovered.node.text ?? ""}
            nodeEl={hovered.el}
            boundsEl={canvasRef.current.closest("[data-graph-panel]") as HTMLElement}
          />
        )}
      </div>
    );
  },
);

TreeCanvas.displayName = "TreeCanvas";
export default TreeCanvas;
