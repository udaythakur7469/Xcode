import React, { useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import ProblemColumns from "./ProblemColumns";
import { useProblemStore } from "@/features/problemStore";
import { MoonLoader } from "react-spinners";
import { useRouter } from "next/navigation";

type ProblemTableProps = {};

const ProblemTable: React.FC<ProblemTableProps> = () => {
  const {
    problems,
    searchResults,
    pagination,
    isLoading,
    error,
    getPaginatedProblems,
    difficultyFilter,
  } = useProblemStore();

  const router = useRouter();
  const data = searchResults.length > 0 ? searchResults : problems;

  useEffect(() => {
    console.log("Fetching problems with difficulty filter:", difficultyFilter); // Debug log
    getPaginatedProblems(pagination.currentPage);
  }, [pagination.currentPage, getPaginatedProblems, difficultyFilter]);

  const handleRowClick = (problemTitle: string) => {
    console.log("clicked");
    router.push(
      `/problems/problem-detail?title=${encodeURIComponent(problemTitle)}&tab=description`,
    ); // Navigate to the problem details page with query parameter
  };

  const table = useReactTable({
    data,
    columns: ProblemColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <MoonLoader color="#ffffff" size={100} />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="w-full">
      <table className="w-full">
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b hover:bg-secondary cursor-pointer"
              onClick={() => handleRowClick(row.original.title)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="p-4"
                  style={{ width: `${cell.column.getSize()}px` }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default ProblemTable;
