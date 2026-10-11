"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContestStore } from "@/features/contestStore";
import ContestLobbyHero from "./ContestLobbyHero";
import ContestLobbyTabs from "./ContestLobbyTabs";
import { toast } from "sonner";

export default function ContestLobby() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { activeContest, loadingLobby, fetchContestBySlug, registerForContest } = useContestStore();
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (slug) fetchContestBySlug(slug);
  }, [slug, fetchContestBySlug]);

  const handleRegister = async () => {
    if (!activeContest) return;
    setIsRegistering(true);
    try {
      await registerForContest(activeContest.id);
      toast.success("You're registered!");
    } catch {
      toast.error("Failed to register");
    } finally {
      setIsRegistering(false);
    }
  };

  if (loadingLobby || !activeContest) {
    return <div className="max-w-5xl mx-auto px-6 py-16 text-center text-muted-foreground">Loading contest…</div>;
  }

  // LIVE still requires registration — that's the actual competition.
  // ENDED is open to everyone for practice, registered or not.
  const canEnterWorkspace =
    (activeContest.status === "LIVE" && activeContest.isRegistered) || activeContest.status === "ENDED";

  return (
    <main className="max-w-5xl mx-auto px-6 py-9">
      <ContestLobbyHero
        contest={activeContest}
        canEnterWorkspace={canEnterWorkspace}
        onRegister={handleRegister}
        onEnterWorkspace={() => router.push(`/contests/${slug}/workspace`)}
        isRegistering={isRegistering}
      />
      <ContestLobbyTabs />
    </main>
  );
}
