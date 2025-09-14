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
        className="h-full w-full rounded-md "
      >
        <TabsList className="w-full flex">
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
        <div className="w-full h-full">
          <TabsContent value="your-submissions">
            <UserSubmissionsTable problemTitle={problemTitle} />
          </TabsContent>
          <TabsContent value="all-submissions">
            <AllSubmissionsTable problemTitle={problemTitle} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SubmissionTabs;
