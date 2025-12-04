"use client";

import { useUserStore } from "@/features/userStore";
import React, { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";

// Types
interface HeatmapValue {
  date: string;
  count: number;
}

// Helper function to get color class based on count
const getColorClass = (count: number): string => {
  if (count === 0) return "color-empty";
  if (count === 1) return "color-scale-1";
  if (count >= 2 && count <= 3) return "color-scale-2";
  if (count >= 4 && count <= 6) return "color-scale-3";
  return "color-scale-4"; // 7+
};

// Helper function to convert Record<string, number> to HeatmapValue[]
const transformHeatmapData = (
  data: Record<string, number> | null
): HeatmapValue[] => {
  if (!data) return [];

  return Object.entries(data).map(([date, count]) => ({
    date,
    count,
  }));
};

// Helper function to get date range (12 months back + 1 week forward)
const getDateRange = () => {
  const today = new Date();

  // End date: 1 week in the future
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);

  // Start date: 12 months back from today
  const startDate = new Date(today);
  startDate.setFullYear(startDate.getFullYear() - 1);

  return { startDate, endDate };
};

const SolvedQuestionsBarChart: React.FC = () => {
  const { heatmapData, fetchHeatmapData, isLoading } = useUserStore();

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  const [tooltipData, setTooltipData] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const { startDate, endDate } = getDateRange();
  const values = transformHeatmapData(heatmapData);

  // Calculate total problems solved
  const totalSolved = heatmapData
    ? Object.values(heatmapData).reduce((sum, count) => sum + count, 0)
    : 0;

  if (isLoading) {
    return (
      <div className="w-full h-[250px] rounded-xl mb-3 bg-accent p-6 border flex items-center justify-center">
        <div className="text-white">Loading heatmap...</div>
      </div>
    );
  }

  const handleClick = (value: HeatmapValue | undefined) => {
    if (value) {
      console.log(`Date: ${value.date}, Problems Solved: ${value.count}`);
    }
  };

  const handleMouseOver = (
    event: React.MouseEvent,
    value: HeatmapValue | undefined
  ) => {
    if (value) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setTooltipData({
        date: value.date,
        count: value.count,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  return (
    <div className="w-full rounded-xl mb-2 bg-accent p-4 border">
      <style>{`
        /* Override text colors to white */
        .react-calendar-heatmap text {
          fill: white !important;
          font-size: 10px;
        }

        .react-calendar-heatmap .react-calendar-heatmap-month-label {
          fill: white !important;
          font-size: 11px;
          font-weight: 500;
        }

        .react-calendar-heatmap .react-calendar-heatmap-weekday-label {
          fill: white !important;
          font-size: 9px;
        }

        /* Ensure all weekday labels are visible */
        .react-calendar-heatmap .react-calendar-heatmap-weekday-labels {
          display: block;
        }
      `}</style>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">
          {totalSolved} problems solved in the last year
        </h3>
        <p className="text-sm text-white">Your problem-solving activity</p>
      </div>

      <div className="relative">
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={values}
          classForValue={(value) => {
            if (!value) return "color-empty";
            return getColorClass(value.count);
          }}
          tooltipDataAttrs={(value: HeatmapValue | undefined) => {
            return {
              "data-tip": value
                ? `${value.count} problem${value.count !== 1 ? "s" : ""} on ${
                    value.date
                  }`
                : "No data",
            };
          }}
          onClick={handleClick}
          onMouseOver={handleMouseOver}
          onMouseLeave={handleMouseLeave}
          showWeekdayLabels={true}
          weekdayLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
          showMonthLabels={true}
        />

        {/* Custom Tooltip */}
        {tooltipData && (
          <div
            className="fixed z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none border border-gray-700"
            style={{
              left: `${tooltipData.x}px`,
              top: `${tooltipData.y}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="whitespace-nowrap">
              <div className="font-semibold">
                {tooltipData.count} problem{tooltipData.count !== 1 ? "s" : ""}{" "}
                solved
              </div>
              <div className="text-xs text-gray-300">
                {new Date(tooltipData.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
            <div
              className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full"
              style={{
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid #1f2937",
              }}
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end mt-3 space-x-2">
        <span className="text-xs text-white">Less</span>
        <div className="flex space-x-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#ebedf0" }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#c6e48b" }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#7bc96f" }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#239a3b" }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#196127" }}
          />
        </div>
        <span className="text-xs text-white">More</span>
      </div>
    </div>
  );
};

export default SolvedQuestionsBarChart;
