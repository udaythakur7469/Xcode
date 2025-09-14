import { ColumnDef } from "@tanstack/react-table";
import { Submission } from "@/features/submissionStore";
import { relativeDate } from "@/services/dateService";

export const SolvedQuestionsDataTableColumns: ColumnDef<Submission>[] = [
  {
    accessorKey: "problem.title",
    header: "Problem Title",
    cell: ({ row }) => {
      const problemTitle = row.original.problem?.title;
      return (
        <span className="flex justify-start items-center h-10 pl-4 w-full">
          {problemTitle}
        </span>
      );
    },
    size: 800, // 80% of a 1000px reference width
  },
  {
    accessorKey: "createdAt",
    header: "Solved At",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      const formattedDate = relativeDate(createdAt);
      return (
        <span className="flex justify-end items-center h-10 pr-4 w-full">
          {formattedDate}
        </span>
      );
    },
    size: 200, // 20% of a 1000px reference width
  },
];
