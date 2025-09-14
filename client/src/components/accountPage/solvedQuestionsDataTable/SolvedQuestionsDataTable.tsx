import React, { useEffect, useMemo } from "react";
import { SolvedQuestionsDataTableColumns } from "./SolvedQuestionsDataTableColumns";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { MoonLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Submission, useSubmissionStore } from "@/features/submissionStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

type SolvedQuestionsDataTableProps = {};

const SolvedQuestionsDataTable: React.FC<
  SolvedQuestionsDataTableProps
> = () => {
  const {
    userSubmissions,
    isLoading,
    error,
    submissionPagination,
    getUserSubmissions,
  } = useSubmissionStore();

  const router = useRouter();

  // Filter submissions to show only unique problems (based on problem title) in reverse chronological order
  const uniqueSubmissions = useMemo(() => {
    // First sort all submissions by createdAt date (newest first)
    const sortedSubmissions = [...userSubmissions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Then filter for unique problem titles (keeping the first occurrence which will be the newest)
    const uniqueMap = new Map<string, Submission>();
    sortedSubmissions.forEach((submission) => {
      const title = submission.problem?.title;
      if (title && !uniqueMap.has(title)) {
        uniqueMap.set(title, submission);
      }
    });

    return Array.from(uniqueMap.values());
  }, [userSubmissions]);

  // Fetch user submissions when the component mounts or when page changes
  useEffect(() => {
    getUserSubmissions(submissionPagination.currentPage);
  }, [submissionPagination.currentPage, getUserSubmissions]);

  // Create the table instance with unique submissions
  const table = useReactTable({
    data: uniqueSubmissions,
    columns: SolvedQuestionsDataTableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRowClick = (submission: Submission) => {
    const problemTitle = submission.problem?.title;
    if (problemTitle) {
      router.push(
        `/problems/problem-detail?title=${encodeURIComponent(problemTitle)}`
      );
    }
  };

  return (
    <>
      <ScrollArea className="h-[550px] w-full rounded-xl bg-accent border">
        {isLoading ? (
          <div className="h-[550px] w-full flex justify-center items-center">
            <MoonLoader size={200} color="#ffffff" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">Error: {error}</div>
        ) : (
          <div className="w-full h-full">
            {/* Data Table */}
            <div className="rounded-md border w-full">
              <Table className="w-full">
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-secondary cursor-pointer"
                        onClick={() => handleRowClick(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            style={{ width: `${cell.column.getSize()}px` }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={SolvedQuestionsDataTableColumns.length}
                        className="h-24 text-center"
                      >
                        No submissions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {uniqueSubmissions.length > 0 && (
              <div className="flex justify-between mt-2 mb-5">
                <Button
                  onClick={() =>
                    getUserSubmissions(submissionPagination.currentPage - 1)
                  }
                  disabled={submissionPagination.currentPage === 1}
                >
                  <ArrowLeft className="mr-2" />
                  Previous
                </Button>
                <span>
                  Page {submissionPagination.currentPage} of{" "}
                  {submissionPagination.totalPages || 1}
                </span>
                <Button
                  onClick={() =>
                    getUserSubmissions(submissionPagination.currentPage + 1)
                  }
                  disabled={
                    submissionPagination.currentPage ===
                      submissionPagination.totalPages ||
                    !submissionPagination.totalPages
                  }
                >
                  Next
                  <ArrowRight className="ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </>
  );
};

export default SolvedQuestionsDataTable;
