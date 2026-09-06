import { MessageNode } from "@/features/chatStore";

// A node in the 2D tree layout — either a message circle or a navigational
// rectangle ("My Chats" root / a chat's title node in All Chats mode).
export type LayoutNodeKind = "circle" | "rect";

export interface LayoutNode {
  id: string;
  kind: LayoutNodeKind;
  parentId: string | null;
  onPath: boolean;

  // circle-only
  role?: MessageNode["role"];
  text?: string;
  chatId?: string;

  // rect-only
  label?: string;
  navChatId?: string; // chat to reveal when this rect is clicked

  // computed by computeLayout — present after layout runs
  x?: number;
  depth?: number;
  px?: number;
  py?: number;
}

export type LayoutNodeMap = Record<string, LayoutNode>;

export interface TreeLayoutResult {
  width: number;
  height: number;
}

export const TREE_LAYOUT_CONSTANTS = {
  radius: 24,
  colSpacing: 100,
  rowSpacing: 96,
  padX: 60,
  padY: 50,
  rectW: 172,
  rectH: 68,
} as const;
