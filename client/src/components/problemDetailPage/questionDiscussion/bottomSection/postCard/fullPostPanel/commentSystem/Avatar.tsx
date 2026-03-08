"use client";

import React from "react";

interface AvatarProps {
  name: string | null;
  picture: string | null;
  size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ name, picture, size = 32 }) => {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  if (picture) {
    return (
      <img
        src={picture}
        alt={name || "User"}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-semibold flex-shrink-0 select-none"
    >
      {initials}
    </div>
  );
};

export default Avatar;
