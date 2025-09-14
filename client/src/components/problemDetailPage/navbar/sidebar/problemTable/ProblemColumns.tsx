import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Problem } from "@/features/problemStore";
import { Check } from "lucide-react";

const ProblemColumns: ColumnDef<Problem>[] = [
  {
    accessorKey: "solved",
    header: "",
    cell: ({ row }) => {
      const solved = row.getValue("solved") as boolean;
      return solved ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        null
      );
    },
    size: 40,
  },
  {
    accessorKey: "serialNumber",
    header: "#",
    cell: ({ row }) => {
      return <span>{row.index + 1}</span>;
    },
    size: 40,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return <span className="text-sm">{title}</span>;
    },
    size: 300,
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    cell: ({ row }) => {
      const difficulty = row.getValue("difficulty") as string;
      return (
        <span
          className={
            difficulty === "easy"
              ? "text-green-500 text-sm"
              : difficulty === "medium"
              ? "text-yellow-500 text-sm"
              : "text-red-500 text-sm"
          }
        >
          {difficulty}
        </span>
      );
    },
    size: 100,
  },
];
export default ProblemColumns;
