"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContestStore } from "@/features/contestStore";
import { toast } from "sonner";
import Navbar from "@/components/landingPage/navbar/Navbar";
import ContestLobbyHero from "./ContestLobbyHero";
import ContestLobbyTabs, { LobbyTab } from "./ContestLobbyTabs";
import RulesTab from "./tabs/RulesTab";
import PrizesTab from "./tabs/PrizesTab";
import RatingTab from "./tabs/RatingTab";
import FaqTab from "./tabs/FaqTab";
import { ContestLobbySkeleton } from "./ContestLobbySkeleton";

export default function ContestLobby() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const {
    activeContest,
    loadingContest,
    fetchContestBySlug,
    registerForContest,
  } = useContestStore();
  const [tab, setTab] = useState<LobbyTab>("rules");

  useEffect(() => {
    if (slug) fetchContestBySlug(slug);
  }, [slug, fetchContestBySlug]);

  if (loadingContest || !activeContest) {
    return (
      <>
        <Navbar
          buttons={["Explore Xcode", "Solve Problems", "Mock Interviews"]}
        />
        <ContestLobbySkeleton />
      </>
    );
  }

  const handleRegister = async () => {
    const ok = await registerForContest(activeContest.id);
    if (ok) toast.success("Registered — we'll notify you before it starts.");
    else toast.error("Couldn't register — please sign in first.");
  };

  const canEnterWorkspace =
    activeContest.status === "LIVE" && activeContest.isRegistered;

  return (
    <>
      <Navbar
        buttons={["Explore Xcode", "Solve Problems", "Mock Interviews"]}
      />

      <div className="w-full px-5 pb-24">
        <button
          onClick={() => router.push("/contests")}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Back to Contests
        </button>

        <ContestLobbyHero
          contest={activeContest}
          onRegister={handleRegister}
          onEnterWorkspace={() => router.push(`/contests/${slug}/workspace`)}
          canEnterWorkspace={canEnterWorkspace}
        />

        <ContestLobbyTabs tab={tab} onTabChange={setTab} />

        <div className="py-6">
          {tab === "rules" && <RulesTab />}
          {tab === "prizes" && <PrizesTab />}
          {tab === "rating" && <RatingTab rated={activeContest.rated} />}
          {tab === "faq" && <FaqTab rated={activeContest.rated} />}
        </div>
      </div>
    </>
  );
}
