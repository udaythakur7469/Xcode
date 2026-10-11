"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import moment from "moment";
import type { ContestProfile } from "@/features/contestStore";

export default function RatingGraphCard({ history }: { history: ContestProfile["ratingHistory"] }) {
  const chartData = history.map((h) => ({
    date: moment(h.date).format("MMM D"),
    rating: h.rating,
    contest: h.contestTitle,
  }));

  return (
    <div className="bg-card border rounded-xl p-6">
      <h2 className="text-base font-semibold mb-4">Rating history</h2>
      {chartData.length === 0 ? (
        <div className="text-sm text-muted-foreground py-10 text-center">No rated contests yet.</div>
      ) : (
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} domain={["dataMin - 50", "dataMax + 50"]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(value: any, _name: any, item: any) => [`${value} — ${item?.payload?.contest ?? ""}`, "Rating"]}
              />
              <Line type="monotone" dataKey="rating" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
