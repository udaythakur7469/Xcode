"use client";

import Navbar from "@/components/landingPage/navbar/Navbar";
import ContestJourney from "@/components/contestsPage/journey/ContestJourney";

export default function ContestJourneyPage() {
  return (
    <>
      <Navbar buttons={["Explore Xcode", "Solve Problems", "Mock Interviews"]} />
      <ContestJourney />
    </>
  );
}
