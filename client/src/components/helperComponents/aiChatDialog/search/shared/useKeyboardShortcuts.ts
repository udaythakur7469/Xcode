import { useEffect } from "react";
import { useChatStore } from "@/features/chatStore";

// ─────────────────────────────────────────────────────────────────────────────
// useChatSearchShortcuts
//
//   Alt+F  → open Text Search (no-op if already open)
//   Alt+G  → open Node Search (no-op if already open)
//   Alt+A  → set scope to All Chats, for whichever panel is open
//   Alt+C  → set scope to This Chat, for whichever panel is open
//
// Pressing the OTHER panel's shortcut while one is open closes the current
// one and opens the other — you never have to close one before opening the
// other. Alt+1..5 were considered and rejected: they already switch
// problem-page tabs (ShortcutData.tsx). Every existing single-modifier
// shortcut on the site uses a left-hand key, so these match that
// convention. Verified against ShortcutData.tsx for collisions.
//
// Only active while `enabled` is true — pass whether the AI chat dialog is
// currently open, so these don't fire globally across the whole site.
// ─────────────────────────────────────────────────────────────────────────────
export function useChatSearchShortcuts(enabled: boolean) {
  const activeChatId = useChatStore((s) => s.activeChatId);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      const { activePanel, openTextSearch, openNodeSearch, setTextScope, setNodeScope } =
        useChatStore.getState();

      if (key === "f") {
        e.preventDefault();
        if (activePanel === "text") return; // already open — no-op
        openTextSearch();
      } else if (key === "g") {
        e.preventDefault();
        if (activePanel === "node") return; // already open — no-op
        openNodeSearch(activeChatId);
      } else if (key === "a" || key === "c") {
        if (!activePanel) return; // no-op unless a search panel is open
        e.preventDefault();
        const scope = key === "a" ? "all" : "chat";
        if (activePanel === "text") setTextScope(scope);
        else setNodeScope(scope);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, activeChatId]);
}
