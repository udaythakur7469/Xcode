"use client";

import { useUserStore } from "@/features/userStore";
import React, { useEffect, useState, useRef } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import moment from "moment";

// Types
interface HeatmapValue {
  date: Date;
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
// Backend sends UTC date strings (YYYY-MM-DD format)
// Add 1 day to compensate for the heatmap library's timezone handling
const transformHeatmapData = (
  data: Record<string, number> | null
): Array<{ date: Date; count: number }> => {
  if (!data) return [];

  return Object.entries(data).map(([dateStr, count]) => {
    // Create a local Date object and add 1 day to fix the offset
    const [year, month, day] = dateStr.split("-").map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0);

    // Add 1 day to match the correct cell
    localDate.setDate(localDate.getDate() + 1);

    return {
      date: localDate,
      count,
    };
  });
};

// Helper function to get date range (use local time to match heatmap library)
const getDateRange = () => {
  const today = moment(); // Use local time

  // Start date: exactly 1 year before today (in local time)
  const startDate = moment(today).subtract(1, "year").startOf("day").toDate();

  // End date: 7 days after today (in local time)
  const endDate = moment(today).add(7, "days").endOf("day").toDate();

  return { startDate, endDate };
};

const SolvedQuestionsBarChart: React.FC = () => {
  const { heatmapData, fetchHeatmapData } = useUserStore();

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const [tooltipData, setTooltipData] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const { startDate, endDate } = getDateRange();
  const values = transformHeatmapData(heatmapData);
  const heatmapRef = useRef<HTMLDivElement>(null);

  // Calculate total submissions
  const totalSubmissions = heatmapData
    ? Object.values(heatmapData).reduce((sum, count) => sum + count, 0)
    : 0;

  // Add event listeners to all rect elements for empty days
  useEffect(() => {
    const currentRef = heatmapRef.current;
    if (!currentRef) return;

    const handleRectMouseOver = (event: Event) => {
      const rect = event.currentTarget as SVGRectElement;
      const rectBounds = rect.getBoundingClientRect();

      // Try to get date from data-date attribute
      let dateStr = rect.getAttribute("data-date");

      // If no data-date, try to extract from title or calculate from position
      if (!dateStr) {
        // The library might store date in title attribute
        const title = rect.getAttribute("title");
        if (title) {
          // Extract date from title if it contains date info
          const dateMatch = title.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            dateStr = dateMatch[1];
          }
        }
      }

      // If still no date, calculate from the rect's position in the grid
      if (!dateStr) {
        // Get the SVG element
        const svg = rect.closest("svg");
        if (svg) {
          // Filter only day rects (they have class starting with 'color-')
          // and exclude month/weekday label rects
          const dayRects = Array.from(
            svg.querySelectorAll(
              "rect.color-empty, rect.color-scale-1, rect.color-scale-2, rect.color-scale-3, rect.color-scale-4"
            )
          );
          const rectIndex = dayRects.indexOf(rect);

          // In the handleRectMouseOver function, when calculating date from index:
          if (rectIndex >= 0) {
            // Calculate date based on index and start date (in local time)
            const calculatedDate = moment(startDate).add(rectIndex, "days");
            dateStr = calculatedDate.format("YYYY-MM-DD");
          }
        }
      }

      // In the handleRectMouseOver function, update how you check for data:
      if (dateStr) {
        // Parse as UTC date
        const [year, month, day] = dateStr.split("-").map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));

        // Check if we have data for this date (compare UTC date strings)
        const count = heatmapData?.[dateStr] || 0;

        setTooltipData({
          date: dateStr,
          count: count,
          x: rectBounds.left + rectBounds.width / 2,
          y: rectBounds.top - 10,
        });
      }
    };

    const handleRectMouseLeave = () => {
      setTooltipData(null);
    };

    // Add event listeners only to day rects (not month/weekday labels)
    const dayRects = currentRef.querySelectorAll(
      "rect.color-empty, rect.color-scale-1, rect.color-scale-2, rect.color-scale-3, rect.color-scale-4"
    );
    dayRects.forEach((rect) => {
      rect.addEventListener("mouseover", handleRectMouseOver);
      rect.addEventListener("mouseleave", handleRectMouseLeave);
    });

    return () => {
      // Cleanup: remove event listeners
      const dayRects = currentRef.querySelectorAll(
        "rect.color-empty, rect.color-scale-1, rect.color-scale-2, rect.color-scale-3, rect.color-scale-4"
      );
      dayRects.forEach((rect) => {
        rect.removeEventListener("mouseover", handleRectMouseOver);
        rect.removeEventListener("mouseleave", handleRectMouseLeave);
      });
    };
  }, [heatmapData, startDate]);

  const handleClick = (value: HeatmapValue | undefined) => {
    if (value) {
      const dateStr = moment.utc(value.date).format("YYYY-MM-DD");
      console.log(`Date: ${dateStr}, Problems Solved: ${value.count}`);
    }
  };

  return (
    <div className="w-full rounded-xl mb-2 bg-accent p-4 border">
      <style>{`
        /* GitHub-style heatmap colors - dark background */
        .react-calendar-heatmap {
          background: transparent;
        }

        /* Text colors for dark theme */
        .react-calendar-heatmap text {
          fill: #8b949e !important;
          font-size: 10px;
        }

        .react-calendar-heatmap .react-calendar-heatmap-month-label {
          fill: #8b949e !important;
          font-size: 11px;
          font-weight: 500;
        }

        .react-calendar-heatmap .react-calendar-heatmap-weekday-label {
          fill: #8b949e !important;
          font-size: 9px;
        }

        /* GitHub contribution graph colors */
        .react-calendar-heatmap .color-empty {
          fill: #161b22 !important;
        }

        .react-calendar-heatmap .color-scale-1 {
          fill: #0e4429 !important;
        }

        .react-calendar-heatmap .color-scale-2 {
          fill: #006d32 !important;
        }

        .react-calendar-heatmap .color-scale-3 {
          fill: #26a641 !important;
        }

        .react-calendar-heatmap .color-scale-4 {
          fill: #39d353 !important;
        }

        /* Hover effect */
        .react-calendar-heatmap rect:hover {
          stroke: #fff !important;
          stroke-width: 1px;
          opacity: 0.9;
        }

        /* Ensure all weekday labels are visible */
        .react-calendar-heatmap .react-calendar-heatmap-weekday-labels {
          display: block;
        }
      `}</style>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">
          {totalSubmissions} submissions in the past one year
        </h3>
        <p className="text-sm text-white/70">Your problem-solving activity</p>
      </div>

      <div className="relative" ref={heatmapRef}>
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={values}
          classForValue={(value) => {
            if (!value) return "color-empty";
            const heatmapValue = value as HeatmapValue;
            return getColorClass(heatmapValue.count);
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={(value: any) =>
            handleClick(value as HeatmapValue | undefined)
          }
          // Note: onMouseOver and onMouseLeave are handled by direct event listeners
          // to support tooltips for empty days as well
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
                {tooltipData.count} submission
                {tooltipData.count !== 1 ? "s" : ""}
              </div>
              <div className="text-xs text-gray-300">
                {moment(tooltipData.date, "YYYY-MM-DD").format(
                  "ddd, MMM D, YYYY"
                )}
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
      <div className="flex items-center justify-end mt-2 space-x-2">
        <span className="text-xs text-white/70">Less</span>
        <div className="flex space-x-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#0e4429" }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#006d32" }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#26a641" }}
          />
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#39d353" }}
          />
        </div>
        <span className="text-xs text-white/70">More</span>
      </div>
    </div>
  );
};

export default SolvedQuestionsBarChart;
