"use client";

import Navbar from "@/components/landingPage/navbar/Navbar";
import ContestLobby from "@/components/contestsPage/contestLobby/ContestLobby";

export default function ContestLobbyPage() {
  return (
    <>
      <Navbar buttons={["Explore Xcode", "Solve Problems", "Mock Interviews"]} />
      <ContestLobby />
    </>
  );
}
