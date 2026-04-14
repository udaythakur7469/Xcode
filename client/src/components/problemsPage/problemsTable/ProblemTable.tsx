import React, { useEffect } from "react";
import { useProblemStore } from "@/features/problemStore";
import { columns } from "./ProblemColumns";
import { Button } from "@/components/ui/button";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter
import { ProblemTableSkeleton } from "./ProblemTableSkeleton";

const ProblemTable: React.FC = () => {
  const {
    problems,
    searchResults,
    pagination,
    isLoading,
    error,
    getPaginatedProblems,
    difficultyFilter,
  } = useProblemStore();

  const router = useRouter(); // Initialize useRouter

  // Use searchResults if available, otherwise use problems
  const data = searchResults.length > 0 ? searchResults : problems;

  // Fetch problems when the component mounts or the page changes
  useEffect(() => {
    console.log("Fetching problems with difficulty filter:", difficultyFilter); // Debug log
    getPaginatedProblems(pagination.currentPage);
  }, [pagination.currentPage]);

  // Create the table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Handle row click to navigate to the problem details page
  const handleRowClick = (problemTitle: string) => {
    router.push(
      `/problems/problem-detail?title=${encodeURIComponent(problemTitle)}`,
    ); // Navigate to the problem details page with query parameter
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 mt-32">
        <ProblemTableSkeleton />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="w-full">
      {/* Data Table */}
      <div className="rounded-md border w-full">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }} // Set column width
                    className={
                      header.column.id === "solved"
                        ? "text-right text-lg text-white cursor-pointer"
                        : "text-lg text-white cursor-pointer" // Align Status header to the right
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-secondary cursor-pointer" // Add cursor-pointer
                  onClick={() => handleRowClick(row.original.title)} // Handle row click
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: `${cell.column.getSize()}px` }} // Set column width
                      className={
                        cell.column.id === "solved"
                          ? "text-right cursor-pointer"
                          : "cursor-pointer" // Align Status content to the right
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No problems found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {searchResults.length === 0 && ( // Only show pagination if no search results
        <div className="flex justify-between mt-4">
          <Button
            onClick={() => getPaginatedProblems(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            <ArrowLeft />
            Previous
          </Button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            onClick={() => getPaginatedProblems(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
            <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProblemTable;
