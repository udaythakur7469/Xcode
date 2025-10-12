"use client";

import React from "react";

type TagsProps = { title: string; key: number };

const Tags: React.FC<TagsProps> = ({ title }, ref) => {
  return (
    <div
      ref={ref}
      className="w-auto flex justify-center items-center rounded-xl border px-2 py-1 cursor-pointer bg-muted whitespace-nowrap"
    >
      {title}
    </div>
  );
};
export default Tags;
