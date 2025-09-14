"use client";

import React from "react";
import UserInterviews from "./userInterviews/UserInterviews";
import AllInterviews from "./allInterviews/AllInterviews";

type InterviewsProps = {};

const Interviews: React.FC<InterviewsProps> = () => {
  return (
    <div id="user interviews" className="w-full mb-4">
      <div className="mb-2">
        <UserInterviews />
      </div>
      <div>
        <AllInterviews />
      </div>
    </div>
  );
};

export default Interviews;