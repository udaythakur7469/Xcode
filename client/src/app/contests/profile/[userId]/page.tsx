"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContestStore } from "@/features/contestStore";
import { getTitleForRating } from "@/lib/titles";
import { Button } from "@/components/ui/button";

export default function ContestProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { profile, fetchProfile } = useContestStore();

  useEffect(() => {
    if (userId) fetchProfile(parseInt(userId, 10));
  }, [userId, fetchProfile]);

  if (!profile) {
    return <div className="px-5 pt-10 text-muted-foreground">Loading profile…</div>;
  }

  const title = getTitleForRating(profile.user.contestRating);
  const history = profile.ratingHistory;
  const w = 640;
  const h = 220;
  const pad = 30;
  const ratings = history.map((h) => h.rating);
  const min = ratings.length ? Math.min(...ratings) - 40 : 1100;
  const max = ratings.length ? Math.max(...ratings) + 40 : 1300;
  const points = history.map((point, i) => {
    const x = pad + i * ((w - 2 * pad) / Math.max(1, history.length - 1));
    const y = h - pad - ((point.rating - min) / (max - min)) * (h - 2 * pad);
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  return (
    <div className="max-w-5xl mx-auto px-5 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 pt-8">
        <div className="card-modern hero-mesh p-5 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold border-2" style={{ borderColor: title.color }}>
              {profile.user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="mt-3 font-semibold text-lg">{profile.user.name}</div>
            <div className="text-sm font-semibold mt-0.5" style={{ color: title.color }}>
              {title.icon} {title.name}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 text-center">
            <div className="stat-chip p-2.5">
              <div className="text-xs text-muted-foreground">Rating</div>
              <div className="text-lg font-bold font-mono">{profile.user.contestRating}</div>
            </div>
            <div className="stat-chip p-2.5">
              <div className="text-xs text-muted-foreground">Peak</div>
              <div className="text-lg font-bold font-mono">{profile.user.peakRating}</div>
            </div>
            <div className="stat-chip p-2.5 col-span-2">
              <div className="text-xs text-muted-foreground">Contests Played</div>
              <div className="text-lg font-bold font-mono">{profile.contestsPlayed}</div>
            </div>
          </div>
          <Button className="w-full mt-4 btn-brand" onClick={() => router.push(`/contests/journey/${userId}`)}>
            View Contest Journey →
          </Button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card-modern p-5">
            <div className="text-sm font-semibold mb-3">Rating Graph</div>
            {history.length > 0 ? (
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-52">
                <path d={path} fill="none" stroke="#22c55e" strokeWidth={2.5} opacity={0.9} />
                {points.map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={getTitleForRating(history[i].rating).color} />
                ))}
              </svg>
            ) : (
              <div className="text-sm text-muted-foreground py-10 text-center">
                No rated contests yet.
              </div>
            )}
          </div>

          <div className="card-modern p-5">
            <div className="text-sm font-semibold mb-3">Achievements</div>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {profile.achievements.length === 0 && (
                <div className="text-sm text-muted-foreground col-span-full">No achievements unlocked yet.</div>
              )}
              {profile.achievements.map((a) => (
                <div key={a.key} className="flex flex-col items-center gap-1 p-2 rounded-md border" title={a.category}>
                  <div className="text-xl">{a.icon}</div>
                  <div className="text-[10px] text-center leading-tight">{a.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-modern p-5 overflow-hidden">
            <div className="text-sm font-semibold mb-3">Contest History</div>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase tracking-wide border-b">
                <tr>
                  <th className="text-left font-medium py-2">Contest</th>
                  <th className="text-right font-medium py-2">Rating</th>
                  <th className="text-right font-medium py-2">Δ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((hRow, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{hRow.contestTitle}</td>
                    <td className="text-right font-mono">{hRow.rating}</td>
                    <td className={`text-right font-mono ${hRow.delta >= 0 ? "text-brand" : "text-red-500"}`}>
                      {hRow.delta >= 0 ? `+${hRow.delta}` : hRow.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
