import React, { useEffect, useState } from "react";
import { allSubmissionsColumns } from "./SubmissionColumns";
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
import { MoonLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSubmissionStore } from "@/features/submissionStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import CodeDialog from "../dialogBoxes/CodeDialog";
import { AllSubmissionsTableSkeleton } from "./SubmissionTableSkeleton";

const AllSubmissionsTable: React.FC<{ problemTitle: string }> = ({
  problemTitle,
}) => {
  const {
    allSubmissions,
    isLoading,
    error,
    allSubmissionsPagination,
    getAllSubmissions,
  } = useSubmissionStore();

  // Fetch all submissions for a problem when the component mounts or when page changes
  useEffect(() => {
    if (problemTitle) {
      getAllSubmissions(problemTitle, allSubmissionsPagination.currentPage);
    }
  }, [allSubmissionsPagination.currentPage, getAllSubmissions, problemTitle]);

  // Create the table instance
  const table = useReactTable({
    data: allSubmissions,
    columns: allSubmissionsColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  // Handle row click to view submission details
  const handleRowClick = (submission: any) => {
    setSelectedSubmission(submission);
    setIsCodeDialogOpen(true);
  };

  return (
    <>
      <ScrollArea className="h-[550px] w-full">
        {isLoading ? (
          <AllSubmissionsTableSkeleton />
        ) : error ? (
          <div className="text-red-500 text-center">Error: {error}</div>
        ) : (
          <div className="w-full h-full px-5 my-2">
            {/* Data Table */}
            <div className="rounded-md border w-full">
              <Table className="w-full">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          style={{ width: `${header.getSize()}px` }}
                          className="text-lg text-white cursor-pointer"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
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
                        colSpan={allSubmissionsColumns.length}
                        className="h-24 text-center"
                      >
                        No submissions found for this problem.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {allSubmissions.length > 0 && (
              <div className="flex justify-between mt-2">
                <Button
                  onClick={() =>
                    getAllSubmissions(
                      problemTitle,
                      allSubmissionsPagination.currentPage - 1
                    )
                  }
                  disabled={allSubmissionsPagination.currentPage === 1}
                >
                  <ArrowLeft className="mr-2" />
                  Previous
                </Button>
                <span>
                  Page {allSubmissionsPagination.currentPage} of{" "}
                  {allSubmissionsPagination.totalPages || 1}
                </span>
                <Button
                  onClick={() =>
                    getAllSubmissions(
                      problemTitle,
                      allSubmissionsPagination.currentPage + 1
                    )
                  }
                  disabled={
                    allSubmissionsPagination.currentPage ===
                      allSubmissionsPagination.totalPages ||
                    !allSubmissionsPagination.totalPages
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
      {/* Code Dialog */}
      <CodeDialog
        isOpen={isCodeDialogOpen}
        onClose={() => setIsCodeDialogOpen(false)}
        submission={selectedSubmission}
      />
    </>
  );
};

export default AllSubmissionsTable;
