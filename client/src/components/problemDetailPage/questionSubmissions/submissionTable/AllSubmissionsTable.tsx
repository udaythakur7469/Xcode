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
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, LogIn, UserPlus } from "lucide-react";
import { useSubmissionStore } from "@/features/submissionStore";
import CodeDialog from "../dialogBoxes/CodeDialog";
import { AllSubmissionsTableSkeleton } from "./SubmissionTableSkeleton";
import { useUserStore } from "@/features/userStore";
import { ForgotPasswordDialog } from "@/components/auth/forgotPasswordPage/ForgotPasswordDialog";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";

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
  const { isUserAuthenticated, checkAuth } = useUserStore();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Fetch all submissions for a problem when the component mounts or when
  // page changes. Only fetches while logged in, mirroring
  // UserSubmissionsTable — the gated view below handles the logged-out
  // state instead of falling through to the loading/error/table branches.
  useEffect(() => {
    if (!isUserAuthenticated) return;
    if (problemTitle) {
      getAllSubmissions(problemTitle, allSubmissionsPagination.currentPage);
    }
  }, [
    allSubmissionsPagination.currentPage,
    getAllSubmissions,
    problemTitle,
    isUserAuthenticated,
  ]);

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
      <div className="relative h-full w-full overflow-y-auto">
        {!isUserAuthenticated ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/60 px-6 pb-[152px] text-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "#818CF81F", color: "#818CF8" }}
            >
              <LogIn size={19} strokeWidth={2.3} />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Log in to view submissions
            </p>
            <p className="max-w-[240px] text-xs leading-relaxed text-muted-foreground">
              Submission history is tied to your account. Log in or sign up to
              see it here.
            </p>
            <div className="mt-1 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors"
                style={{ background: "#818CF8" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#6366F1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#818CF8";
                }}
              >
                <LogIn size={13} strokeWidth={2.3} />
                Log In
              </button>
              <button
                type="button"
                onClick={() => setIsSignupOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/10 bg-secondary px-3.5 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-secondary/70"
              >
                <UserPlus size={13} strokeWidth={2.3} />
                Sign Up
              </button>
            </div>
          </div>
        ) : isLoading ? (
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
                        onClick={() => handleRowClick(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            style={{ width: `${cell.column.getSize()}px` }}
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
                      allSubmissionsPagination.currentPage - 1,
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
                      allSubmissionsPagination.currentPage + 1,
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
      </div>
      {/* Code Dialog */}
      <CodeDialog
        isOpen={isCodeDialogOpen}
        onClose={() => setIsCodeDialogOpen(false)}
        submission={selectedSubmission}
      />
      {/* Auth dialogs — opened from the logged-out gate above */}
      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        openSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
        openForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />
      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />
      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        openLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </>
  );
};

export default AllSubmissionsTable;
