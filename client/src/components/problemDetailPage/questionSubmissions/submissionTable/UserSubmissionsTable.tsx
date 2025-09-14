import React, { useEffect, useState } from "react";
import { SubmissionColumns } from "./SubmissionColumns";
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

const UserSubmissionsTable: React.FC<{ problemTitle?: string }> = ({
  problemTitle,
}) => {
  const {
    userSubmissions,
    isLoading,
    error,
    submissionPagination,
    getUserSubmissions,
  } = useSubmissionStore();

  // Fetch user submissions when the component mounts or when page changes
  useEffect(() => {
    getUserSubmissions(submissionPagination.currentPage, problemTitle);
  }, [submissionPagination.currentPage, getUserSubmissions, problemTitle]);

  // Create the table instance
  const table = useReactTable({
    data: userSubmissions,
    columns: SubmissionColumns,
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
          <div className="h-[550px] w-full flex justify-center items-center">
            <MoonLoader size={200} color="#ffffff" />
          </div>
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
                        colSpan={SubmissionColumns.length}
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
            {userSubmissions.length > 0 && (
              <div className="flex justify-between mt-2">
                <Button
                  onClick={() =>
                    getUserSubmissions(
                      submissionPagination.currentPage - 1,
                      problemTitle
                    )
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
                    getUserSubmissions(
                      submissionPagination.currentPage + 1,
                      problemTitle
                    )
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
      {/* Code Dialog */}
      <CodeDialog
        isOpen={isCodeDialogOpen}
        onClose={() => setIsCodeDialogOpen(false)}
        submission={selectedSubmission}
      />
    </>
  );
};

export default UserSubmissionsTable;
