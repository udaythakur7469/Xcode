import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import UserSubmissionsTable from "../submissionTable/UserSubmissionsTable";
import AllSubmissionsTable from "../submissionTable/AllSubmissionsTable";

type SubmissionTabsProps = {};

const SubmissionTabs: React.FC<SubmissionTabsProps> = () => {
  const searchParams = useSearchParams(); // Get search params
  const problemTitle : string | null = searchParams.get("title"); // Get the title query parameter
  return (
    <div className="h-full w-full overflow-hidden">
      <Tabs
        defaultValue="your-submissions"
        className="flex h-full w-full flex-col rounded-md "
      >
        <TabsList className="w-full flex shrink-0">
          <TabsTrigger
            value="your-submissions"
            className="hover:bg-gray-100 hover:text-black flex-1 text-center"
          >
            <p className="text-md">Your Submissions</p>
          </TabsTrigger>
          <TabsTrigger
            value="all-submissions"
            className="hover:bg-gray-100 hover:text-black flex-1 text-center"
          >
            <p className="text-md">All Submissions</p>
          </TabsTrigger>
        </TabsList>
        <div className="w-full flex-1 min-h-0">
          <TabsContent value="your-submissions" className="h-full">
            <UserSubmissionsTable problemTitle={problemTitle} />
          </TabsContent>
          <TabsContent value="all-submissions" className="h-full">
            <AllSubmissionsTable problemTitle={problemTitle} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SubmissionTabs;
