"use client";

import React, { use } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useUserStore } from "@/features/userStore";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const QuestionFrequencyPieChart: React.FC = () => {
  const { userData } = useUserStore();
  const totalSolved = userData?.stats?.totalSolved;
  const easySolved = userData?.stats?.easySolved;
  const mediumSolved = userData?.stats?.mediumSolved;
  const hardSolved = userData?.stats?.hardSolved;

  const data = {
    labels: [
      `Easy ${easySolved}`,
      `Medium ${mediumSolved}`,
      `Hard ${hardSolved}`,
    ],
    datasets: [
      {
        label: "Problems Solved",
        data: [`${easySolved}`, `${mediumSolved}`, `${hardSolved}`],
        backgroundColor: [
          "rgb(34 197 94)",
          "rgb(254, 183, 4)",
          "rgb(244, 56, 55)",
        ],
        borderWidth: 1,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "#ffffff",
          boxWidth: 12,
          padding: 16,
          font: {
            size: 14,
          },
          useBarStyle: true, // Makes legend markers circular
        },
      },
    },
    cutout: "65%", // Slightly smaller cutout for better fit
    maintainAspectRatio: false,
  };

  return (
    <div className="h-full w-full rounded-xl border p-2 flex flex-col bg-accent">
      <h2 className="text-lg font-bold mb-1 text-center">
        Total Problems Solved: {`${totalSolved}`}
      </h2>
      <div className="flex-1 h-full">
        <Doughnut data={data} options={options} className="p-1" />
      </div>
    </div>
  );
};

export default QuestionFrequencyPieChart;
