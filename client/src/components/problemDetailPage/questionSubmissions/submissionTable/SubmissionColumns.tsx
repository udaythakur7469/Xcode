import { ColumnDef } from "@tanstack/react-table";
import { Submission } from "@/features/submissionStore";
import { formatDate } from "@/services/dateService";

// Helper function for centered header
const centerHeader = (header: string) => (
  <div className="w-full flex justify-center items-center">{header}</div>
);

export const SubmissionColumns: ColumnDef<Submission>[] = [
  {
    accessorKey: "serialNumber",
    header: () => centerHeader("S.No"),
    size: 30,
    cell: ({ row }) => {
      return (
        <span className="flex justify-center items-center h-10">
          {row.index + 1}
        </span>
      );
    },
  },
  {
    accessorKey: "language",
    header: () => centerHeader("Language"),
    size: 150,
    cell: ({ row }) => {
      const value = row.getValue("language") as string;
      return <span className="flex justify-center items-center h-10">{value}</span>;
    },
  },
  {
    accessorKey: "status",
    header: () => centerHeader("Status"),
    size: 150,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`flex justify-center items-center h-10 ${
            status === "accepted"
              ? "text-green-500"
              : status === "wrong_answer"
              ? "text-red-500"
              : status === "time_limit_exceeded"
              ? "text-yellow-500"
              : "text-orange-500"
          }`}
        >
          {status.replace("_", " ")}
        </span>
      );
    },
  },
  {
    accessorKey: "runtime",
    header: () => centerHeader("Runtime"),
    size: 100,
    cell: ({ row }) => {
      const runtime = row.getValue("runtime") as number;
      return (
        <span className="flex justify-center items-center h-10">
          {runtime} ms
        </span>
      );
    },
  },
  {
    accessorKey: "memory",
    header: () => centerHeader("Memory"),
    size: 100,
    cell: ({ row }) => {
      const memory = row.getValue("memory") as number;
      return (
        <span className="flex justify-center items-center h-10">
          {memory} KB
        </span>
      );
    },
  },
  {
    accessorKey: "testCasesPassed",
    header: () => centerHeader("Test Cases"),
    size: 150,
    cell: ({ row }) => {
      const testCasesPassed = row.getValue("testCasesPassed") as number;
      const totalTestCases = row.original.totalTestCases;
      return (
        <span className="flex justify-center items-center h-10">
          {testCasesPassed}/{totalTestCases}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: () => centerHeader("Submitted At"),
    size: 200,
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      const formattedDate = formatDate(createdAt);
      return (
        <span className="flex justify-center items-center h-10">
          {formattedDate}
        </span>
      );
    },
  },
];

export const allSubmissionsColumns: ColumnDef<Submission>[] = [
  {
    accessorKey: "serialNumber",
    header: () => centerHeader("S.No"),
    size: 30,
    cell: ({ row }) => {
      return (
        <span className="flex justify-center items-center h-10">
          {row.index + 1}
        </span>
      );
    },
  },
  {
    accessorKey: "user",
    header: () => centerHeader("User"),
    size: 150,
    cell: ({ row }) => {
      const user = row.getValue("user") as { name: string };
      return (
        <span className="flex justify-center items-center h-10">
          {user?.name}
        </span>
      );
    },
  },
  {
    accessorKey: "language",
    header: () => centerHeader("Language"),
    size: 100,
    cell: ({ row }) => {
      const value = row.getValue("language") as string;
      return (
        <span className="flex justify-center items-center h-10">{value}</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => centerHeader("Status"),
    size: 150,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`flex justify-center items-center h-10 ${
            status === "accepted"
              ? "text-green-500"
              : status === "wrong_answer"
              ? "text-red-500"
              : status === "time_limit_exceeded"
              ? "text-yellow-500"
              : "text-orange-500"
          }`}
        >
          {status.replace("_", " ")}
        </span>
      );
    },
  },
  {
    accessorKey: "testCasesPassed",
    header: () => centerHeader("Test Cases"),
    size: 150,
    cell: ({ row }) => {
      const testCasesPassed = row.getValue("testCasesPassed") as number;
      const totalTestCases = row.original.totalTestCases;
      return (
        <span className="flex justify-center items-center h-10">
          {testCasesPassed}/{totalTestCases}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: () => centerHeader("Submitted At"),
    size: 200,
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      const formattedDate = formatDate(createdAt);
      return (
        <span className="flex justify-center items-center h-10">
          {formattedDate}
        </span>
      );
    },
  },
];
