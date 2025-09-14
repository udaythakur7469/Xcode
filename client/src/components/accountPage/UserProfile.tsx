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
    <div className="w-full h-screen px-5 mb-5">
      <div className="w-full h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* Scrollable area */}
          <div className="h-full w-full flex flex-row space-x-3 min-h-0">
            {/* Prevent height inflation */}
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-0">
              {" "}
              {/* Flexible column container */}
              {/* Top Row (Pie Chart + Edit Profile) */}
              <div className="h-[200px] min-h-[200px] w-full flex flex-row space-x-3 mb-3">
                <div className="flex-[9] h-full">
                  <QuestionFrequencyPieChart />
                </div>
                <div className="flex-[11] h-full">
                  <EditProfileBar />
                </div>
              </div>
              {/* Bar Charts */}
              <div className="space-y-3 flex-1 min-h-0">
                {/* Flexible space for charts */}
                <SolvedQuestionsBarChart />
                <SolvedQuestionsDataTable />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
