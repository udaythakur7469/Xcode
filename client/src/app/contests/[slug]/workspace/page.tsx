"use client";

import ContestWorkspace from "@/components/contestsPage/workspace/ContestWorkspace";

// Deliberately no site Navbar here — the workspace is a timed, focused
// environment with its own WorkspaceNavbar (timer, live rank, run/submit).
// See CONTEST_SYSTEM_EXPLAINED.md §12 on why this stays a distraction-free
// route, same principle as the interview-practice pages.
export default function ContestWorkspacePage() {
  return <ContestWorkspace />;
}
