"use client";

import React from "react";
import Sidebar from "./sidebar/Sidebar";
import QuestionFrequencyPieChart from "./questionFrequencyPieChart/QuestionFrequencyPieChart";
import EditProfileBar from "./editProfileBar/EditProfileBar";
import SolvedQuestionsBarChart from "./solvedQuestionsBarChart/SolvedQuestionsBarChart";
import SolvedQuestionsDataTable from "./solvedQuestionsDataTable/SolvedQuestionsDataTable";

type UserProfileProps = {};

const UserProfile: React.FC<UserProfileProps> = () => {
  return (
    <div className="w-full min-h-screen px-4 sm:px-6 py-4 pb-10">
      <div className="w-full flex flex-col lg:flex-row gap-3 items-start">
        {/* Sidebar — full width on mobile, fixed width on desktop */}
        <Sidebar />

        {/* Main content — grows to fill remaining space */}
        <div className="flex-1 w-full flex flex-col gap-3 min-w-0">
          {/* Top Row: Pie Chart + Edit Profile */}
          <div className="w-full flex flex-col sm:flex-row gap-3">
            <div className="sm:flex-[9] w-full min-h-[180px]">
              <QuestionFrequencyPieChart />
            </div>
            <div className="sm:flex-[11] w-full min-h-[180px]">
              <EditProfileBar />
            </div>
          </div>

          {/* Heatmap */}
          <SolvedQuestionsBarChart />

          {/* Submissions Table */}
          <SolvedQuestionsDataTable />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
