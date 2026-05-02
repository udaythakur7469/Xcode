"use client";

import React from "react";
import { Badge } from "@/components/ui/linkBadge";
import { useUserStore } from "@/features/userStore";

type SkillsBarProps = {};

const SkillsBar: React.FC<SkillsBarProps> = () => {
  const { userData } = useUserStore();

  // Safely access stats with optional chaining
  const solvedLanguages = userData?.stats?.languages || [];
  const solvedProblemTags = userData?.stats?.tags || [];

  return (
    <div className="w-full rounded-xl bg-accent">
      <div className="w-full">
        {/* Languages Section */}
        <div>
          <p className="text-lg font-semibold ">Languages</p>
          <div className="space-y-2 mt-3">
            {solvedLanguages.length > 0 ? (
              solvedLanguages.map(({ language, count }) => (
                <div
                  key={language}
                  className="flex flex-row items-center space-x-1"
                >
                  <Badge variant="outline" className="font-medium">
                    {language}
                  </Badge>
                  <span> x </span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                Solve questions to learn skills
              </p>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div>
          <p className="text-lg font-semibold mt-3">Problems solved</p>
          <div className="space-y-2 mt-3">
            {solvedProblemTags.length > 0 ? (
              solvedProblemTags.map(({ tag, count }) => (
                <div
                  key={tag}
                  className="flex flex-row items-center space-x-1 space-y-1"
                >
                  <Badge variant="outline" className="font-medium capitalize">
                    {tag}
                  </Badge>
                  <span> x </span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                Solve questions to learn skills
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsBar;
