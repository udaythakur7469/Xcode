"use client";

import Navbar from "@/components/landingPage/navbar/Navbar";
import ContestLeaderboard from "@/components/contestsPage/leaderboard/ContestLeaderboard";

export default function ContestLeaderboardPage() {
  return (
    <>
      <Navbar buttons={["Explore Xcode", "Solve Problems", "Mock Interviews"]} />
      <ContestLeaderboard />
    </>
  );
}
