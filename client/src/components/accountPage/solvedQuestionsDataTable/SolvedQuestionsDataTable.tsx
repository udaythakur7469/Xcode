import React, { useEffect, useMemo } from "react";
import { SolvedQuestionsDataTableColumns } from "./SolvedQuestionsDataTableColumns";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Submission, useSubmissionStore } from "@/features/submissionStore";
import { useRouter } from "next/navigation";

type SolvedQuestionsDataTableProps = {};

const SolvedQuestionsDataTable: React.FC<
  SolvedQuestionsDataTableProps
> = () => {
  const {
    userSubmissions,
    error,
    submissionPagination,
    getUserSubmissions,
  } = useSubmissionStore();

  const router = useRouter();

  const uniqueSubmissions = useMemo(() => {
    const sortedSubmissions = [...userSubmissions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const uniqueMap = new Map<string, Submission>();
    sortedSubmissions.forEach((submission) => {
      const title = submission.problem?.title;
      if (title && !uniqueMap.has(title)) {
        uniqueMap.set(title, submission);
      }
    });

    return Array.from(uniqueMap.values());
  }, [userSubmissions]);

  useEffect(() => {
    getUserSubmissions(submissionPagination.currentPage);
  }, [submissionPagination.currentPage]);

  const table = useReactTable({
    data: uniqueSubmissions,
    columns: SolvedQuestionsDataTableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRowClick = (submission: Submission) => {
    const problemTitle = submission.problem?.title;
    if (problemTitle) {
      router.push(
        `/problems/problem-detail?title=${encodeURIComponent(problemTitle)}`,
      );
    }
  };

  return (
    <>
      {/*
        max-h caps the container so it doesn't grow infinitely.
        min-h ensures it's not tiny when there are few rows or while loading.
        overflow-y-auto keeps the scroll inside the box.
      */}
      <div className="w-full min-h-[200px] max-h-[420px] md:max-h-[540px] overflow-y-auto rounded-xl bg-accent border">
        {error ? (
          <div className="text-red-500 text-center p-4">Error: {error}</div>
        ) : (
          <div className="w-full h-full">
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
                          // Removed style={{ width: `${cell.column.getSize()}px` }}
                          // Those were fixed pixel widths based on a 1000px reference table.
                          // Let the browser distribute column widths naturally via CSS.
                          <TableCell key={cell.id}>
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

            {uniqueSubmissions.length > 0 && (
              // px-3 prevents buttons from touching the container edge on mobile
              <div className="flex justify-between items-center mt-2 mb-5 px-3">
                <Button
                  onClick={() =>
                    getUserSubmissions(submissionPagination.currentPage - 1)
                  }
                  disabled={submissionPagination.currentPage === 1}
                >
                  <ArrowLeft className="mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
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
      </div>
    </>
  );
};

export default SolvedQuestionsDataTable;
