import { ColumnDef } from "@tanstack/react-table";
import { Problem } from "@/features/problemStore";

export const columns: ColumnDef<Problem>[] = [
  {
    accessorKey: "serialNumber",
    header: "S.No",
    size: 50, // Set a fixed width for the Serial Number column
    cell: ({ row }) => {
      return <span>{row.index + 1}</span>; // Generate serial number dynamically
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    size: 450, // Adjust the width for the Title column
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    size: 150, // Set a fixed width for the Difficulty column
    cell: ({ row }) => {
      const difficulty = row.getValue("difficulty") as string;
      return (
        <span
          className={
            difficulty === "easy"
              ? "text-green-500"
              : difficulty === "medium"
              ? "text-yellow-500"
              : "text-red-500"
          }
        >
          {difficulty}
        </span>
      );
    },
  },
  {
    accessorKey: "acceptanceRate",
    header: "Acceptance Rate",
    size: 150, // Set a fixed width for the Acceptance Rate column
    cell: ({ row }) => {
      const acceptanceRate = row.getValue("acceptanceRate");

      // Ensure acceptanceRate is a valid number
      const rate =
        typeof acceptanceRate === "number"
          ? acceptanceRate
          : parseFloat(acceptanceRate);

      // Check if rate is a valid number
      if (isNaN(rate)) {
        return <span>N/A</span>; // Handle invalid or missing acceptanceRate
      }

      return <span>{rate.toFixed(2)}%</span>;
    },
  },
  {
    accessorKey: "solved",
    header: "Status",
    size: 150, // Set a fixed width for the Status column
    cell: ({ row }) => {
      const solved = row.getValue("solved") as boolean;
      return (
        <span className={solved ? "text-green-500" : "text-red-500"}>
          {solved ? "Solved" : "Unsolved"}
        </span>
      );
    },
  },
];
