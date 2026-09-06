import {
  LayoutNode,
  LayoutNodeMap,
  TreeLayoutResult,
  TREE_LAYOUT_CONSTANTS as T2D,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// computeLayout
//
// Real 2D tree layout — not a vertical list. Builds a childrenMap from each
// node's parentId (the tree already exists in the data: a parent with N
// children naturally fans into N visual branches with zero extra modeling).
// x position: leaves get sequential slots; every parent's x = the average of
// its children's x (standard tree-layout centering). y position: depth *
// rowSpacing. Mutates each node in nodeMap with x/depth/px/py and returns
// the total canvas size.
// ─────────────────────────────────────────────────────────────────────────────
export function computeLayout(
  nodeMap: LayoutNodeMap,
  rootId: string,
): TreeLayoutResult {
  const childrenMap: Record<string, string[]> = {};
  Object.values(nodeMap).forEach((n) => {
    if (n.parentId) {
      (childrenMap[n.parentId] ??= []).push(n.id);
    }
  });
  // The child on the active path renders first (toward center); branch
  // siblings (edits/regenerates, or non-first chats) fan to the sides.
  Object.keys(childrenMap).forEach((pid) => {
    childrenMap[pid].sort(
      (a, b) => (nodeMap[b].onPath ? 1 : 0) - (nodeMap[a].onPath ? 1 : 0),
    );
  });

  let leafCounter = 0;
  function assign(id: string, depth: number): number {
    const kids = childrenMap[id] ?? [];
    nodeMap[id].depth = depth;
    if (kids.length === 0) {
      nodeMap[id].x = leafCounter++;
      return nodeMap[id].x!;
    }
    const xs = kids.map((k) => assign(k, depth + 1));
    nodeMap[id].x = xs.reduce((a, b) => a + b, 0) / xs.length;
    return nodeMap[id].x!;
  }
  assign(rootId, 0);

  const maxDepth = Math.max(...Object.values(nodeMap).map((n) => n.depth!));
  const width = T2D.padX * 2 + leafCounter * T2D.colSpacing;
  const height = T2D.padY * 2 + maxDepth * T2D.rowSpacing + T2D.radius * 2 + 24;

  Object.values(nodeMap).forEach((n) => {
    n.px = T2D.padX + n.x! * T2D.colSpacing + T2D.colSpacing / 2;
    n.py = T2D.padY + n.depth! * T2D.rowSpacing;
  });

  return { width, height };
}

// ─────────────────────────────────────────────────────────────────────────────
// trimToBoundary
//
// Lines must be trimmed to the node's circumference/edge, never drawn into
// the node's center. Computes the boundary intersection point on `fromNode`
// in the direction of `toNode` — a circle's radius, or a rectangle's edge.
// ─────────────────────────────────────────────────────────────────────────────
export function trimToBoundary(fromNode: LayoutNode, toNode: LayoutNode) {
  const dx = toNode.px! - fromNode.px!;
  const dy = toNode.py! - fromNode.py!;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  if (fromNode.kind === "rect") {
    const hw = T2D.rectW / 2;
    const hh = T2D.rectH / 2;
    let scale: number;
    if (ux === 0) scale = hh / Math.abs(uy);
    else if (uy === 0) scale = hw / Math.abs(ux);
    else scale = Math.min(hw / Math.abs(ux), hh / Math.abs(uy));
    return { x: fromNode.px! + ux * scale, y: fromNode.py! + uy * scale };
  }
  return {
    x: fromNode.px! + ux * T2D.radius,
    y: fromNode.py! + uy * T2D.radius,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildSingleChatLayoutMap
//
// "This Chat" scope — every node in the chat's tree (not just activePath),
// as circle nodes. Root = the chat's first backbone message.
// ─────────────────────────────────────────────────────────────────────────────
export function buildSingleChatLayoutMap(
  nodeMapSource: Record<string, { id: string; parentId: string | null; role: string; text: string }>,
  activePath: string[],
  chatId: string,
): { layoutMap: LayoutNodeMap; rootId: string } {
  const layoutMap: LayoutNodeMap = {};
  const onPathSet = new Set(activePath);
  Object.values(nodeMapSource).forEach((n) => {
    layoutMap[n.id] = {
      id: n.id,
      kind: "circle",
      parentId: n.parentId,
      onPath: onPathSet.has(n.id),
      role: n.role as any,
      text: n.text,
      chatId,
    };
  });
  return { layoutMap, rootId: activePath[0] };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildAllChatsLayoutMap
//
// "All Chats" scope — one unified tree, no per-chat collapsing:
//   ROOT ("My Chats" rect, navigates back to openedFromChatId)
//     └─ one rect per chat (openedFromChatId ordered first)
//          └─ that chat's message tree, in the exact same circle-node shape
// A chat's root message's parentId is reassigned (in this synthetic layout
// data only — never persisted) from null to that chat's rect-node id, so
// computeLayout treats the whole thing as one tree with two node kinds.
// ─────────────────────────────────────────────────────────────────────────────
export function buildAllChatsLayoutMap(
  chats: Array<{ id: string; title: string }>,
  chatTrees: Record<
    string,
    {
      nodeMap: Record<string, { id: string; parentId: string | null; role: string; text: string }>;
      activePath: string[];
    }
  >,
  openedFromChatId: string | null,
): { layoutMap: LayoutNodeMap; rootId: string } {
  const layoutMap: LayoutNodeMap = {};
  layoutMap["ROOT"] = {
    id: "ROOT",
    kind: "rect",
    parentId: null,
    onPath: true,
    label: "My Chats",
    navChatId: openedFromChatId ?? undefined,
  };

  const orderedChats = [...chats].sort((a, b) => {
    if (a.id === openedFromChatId) return -1;
    if (b.id === openedFromChatId) return 1;
    return 0;
  });

  orderedChats.forEach((chat) => {
    const rectId = `rect_${chat.id}`;
    layoutMap[rectId] = {
      id: rectId,
      kind: "rect",
      parentId: "ROOT",
      onPath: true,
      label: chat.title,
      chatId: chat.id,
      navChatId: chat.id,
    };

    const tree = chatTrees[chat.id];
    if (!tree) return; // not loaded yet (lazy-loaded on scroll-into-view)

    const onPathSet = new Set(tree.activePath);
    Object.values(tree.nodeMap).forEach((n) => {
      const isChatRoot = n.parentId === null;
      layoutMap[n.id] = {
        id: n.id,
        kind: "circle",
        parentId: isChatRoot ? rectId : n.parentId,
        onPath: onPathSet.has(n.id),
        role: n.role as any,
        text: n.text,
        chatId: chat.id,
      };
    });
  });

  return { layoutMap, rootId: "ROOT" };
}
