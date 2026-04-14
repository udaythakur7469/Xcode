import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function SubmissionTableSkeleton({ columns }: { columns: string[] }) {
  return (
    <div className="w-full h-full px-5 my-2">
      <div className="rounded-md border w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="text-center">
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col} className="text-center">
                    <div className="flex justify-center items-center h-10">
                      <Skeleton className="h-4 w-20 rounded" />
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  );
}

export function UserSubmissionsTableSkeleton() {
  return (
    <div className="h-[550px] w-full overflow-hidden">
      <SubmissionTableSkeleton
        columns={[
          "S.No",
          "Language",
          "Status",
          "Runtime",
          "Memory",
          "Test Cases",
          "Submitted At",
        ]}
      />
    </div>
  );
}

export function AllSubmissionsTableSkeleton() {
  return (
    <div className="h-[550px] w-full overflow-hidden">
      <SubmissionTableSkeleton
        columns={[
          "S.No",
          "User",
          "Language",
          "Status",
          "Test Cases",
          "Submitted At",
        ]}
      />
    </div>
  );
}
