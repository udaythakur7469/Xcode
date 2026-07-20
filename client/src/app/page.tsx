"use client";

import React, { Suspense } from "react";
import LandingPage from "@/components/landingPage/LandingPage";

type PageProps = {};

const Page: React.FC<PageProps> = () => {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
};

export default Page;
