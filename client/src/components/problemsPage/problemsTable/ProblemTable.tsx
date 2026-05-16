"use client";

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
import { useRouter } from "next/navigation";
import { ProblemTableSkeleton } from "./ProblemTableSkeleton";
import { toIso, useCalendarStore } from "@/features/calenderStore";

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

  // ── Calendar filter state ──────────────────────────────────────────────────
  const { calendarMode, selectedDate, selectedRange } = useCalendarStore();

  // Derived date params
  const dateFrom: string | null = React.useMemo(() => {
    if (calendarMode === "single") return selectedDate;
    if (calendarMode === "range" && selectedRange.from)
      return toIso(selectedRange.from);
    return null;
  }, [calendarMode, selectedDate, selectedRange]);

  const dateTo: string | null = React.useMemo(() => {
    if (calendarMode === "single") return selectedDate;
    if (calendarMode === "range" && selectedRange.to)
      return toIso(selectedRange.to);
    return null;
  }, [calendarMode, selectedDate, selectedRange]);

  const router = useRouter();
  const data = searchResults.length > 0 ? searchResults : problems;

  // Re-fetch when page, difficulty filter, or calendar selection changes
  useEffect(() => {
    getPaginatedProblems(pagination.currentPage, dateFrom, dateTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, difficultyFilter, dateFrom, dateTo]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRowClick = (problemTitle: string) => {
    router.push(
      `/problems/problem-detail?title=${encodeURIComponent(problemTitle)}&tab=description`,
    );
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
      <div className="rounded-md border w-full">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className={
                      header.column.id === "solved"
                        ? "text-right text-lg text-white cursor-pointer"
                        : "text-lg text-white cursor-pointer"
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
                  className="hover:bg-secondary cursor-pointer"
                  onClick={() => handleRowClick(row.original.title)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: `${cell.column.getSize()}px` }}
                      className={
                        cell.column.id === "solved"
                          ? "text-right cursor-pointer"
                          : "cursor-pointer"
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

      {searchResults.length === 0 && (
        <div className="flex justify-between mt-4">
          <Button
            onClick={() =>
              getPaginatedProblems(pagination.currentPage - 1, dateFrom, dateTo)
            }
            disabled={pagination.currentPage === 1}
          >
            <ArrowLeft />
            Previous
          </Button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            onClick={() =>
              getPaginatedProblems(pagination.currentPage + 1, dateFrom, dateTo)
            }
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
