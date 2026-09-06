import React from "react";
import { LayoutNode } from "../shared/types";
import { TREE_LAYOUT_CONSTANTS as T2D } from "../shared/types";

interface TreeNodeProps {
  node: LayoutNode;
  isSearchMatch: boolean;
  isSearchDim: boolean;
  isCurrentMatch: boolean;
  isCurrentChat: boolean;
  onClick: () => void;
  onHover: (node: LayoutNode | null, el: HTMLElement | null) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  isSearchMatch,
  isSearchDim,
  isCurrentMatch,
  isCurrentChat,
  onClick,
  onHover,
}) => {
  if (node.kind === "rect") {
    const isRoot = node.id === "ROOT";
    return (
      <div
        onClick={onClick}
        title={node.label}
        data-nav-chat={node.navChatId}
        style={{
          left: node.px! - T2D.rectW / 2,
          top: node.py! - T2D.rectH / 2,
          width: T2D.rectW,
          height: T2D.rectH,
        }}
        className={`absolute px-3 rounded-[10px] flex items-center justify-center text-center text-[11.5px] font-bold leading-tight text-white cursor-pointer z-[1] whitespace-normal break-words overflow-hidden border-2 transition-colors hover:shadow-[0_0_0_3px_var(--brand-glow)] ${
          isRoot
            ? "bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dim)] border-transparent text-[13px]"
            : isCurrentChat
              ? "bg-zinc-800 border-[var(--brand)] text-[var(--brand)]"
              : "bg-zinc-800 border-zinc-600"
        }`}
      >
        {node.label}
      </div>
    );
  }

  const isUser = node.role === "user";
  const dataFullText = node.text ?? "";

  let colorClasses = "";
  if (isSearchMatch) {
    colorClasses = "border-[#f59e0b] bg-[#f59e0b]/[0.16] text-[#f59e0b] shadow-[0_0_0_3px_rgba(245,158,11,0.3)]";
  } else if (node.onPath && isUser) {
    colorClasses = "bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dim)] border-transparent text-white";
  } else if (node.onPath && !isUser) {
    colorClasses = "bg-[var(--brand-muted)] border-[var(--brand)] text-[var(--brand)]";
  } else {
    colorClasses = "bg-zinc-800 border-zinc-600 text-zinc-400 opacity-70";
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => onHover(node, e.currentTarget)}
      onMouseLeave={() => onHover(null, null)}
      data-search-match={isSearchMatch ? "true" : undefined}
      style={{
        left: node.px! - T2D.radius,
        top: node.py! - T2D.radius,
        width: T2D.radius * 2,
        height: T2D.radius * 2,
      }}
      data-fulltext={dataFullText}
      className={`absolute rounded-full flex items-center justify-center text-xs font-bold cursor-pointer z-[1] border-2 transition-colors hover:border-white hover:shadow-[0_0_0_3px_var(--brand-glow)] ${colorClasses} ${
        isSearchDim ? "opacity-20" : ""
      } ${isCurrentMatch ? "animate-[matchJump_0.6s_ease-out_1]" : ""}`}
    >
      {isUser ? "U" : "AI"}
    </div>
  );
};

export default TreeNode;
