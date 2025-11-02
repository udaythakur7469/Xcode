import React, { useState } from "react";
import CustomDialog from "./CustomDialog";
import { Submission } from "@/features/submissionStore";
import { formatDate } from "@/services/dateService";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { EditorialScrollArea } from "@/components/ui/editorialCodeScrollArea";
import { Button } from "@/components/ui/button";
import { Clipboard, Check } from "lucide-react";
import { toast } from "sonner";

type CodeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
};

const CodeDialog: React.FC<CodeDialogProps> = ({
  isOpen,
  onClose,
  submission,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!submission) {
    return (
      <CustomDialog isOpen={isOpen} onClose={onClose} title="Code Submission">
        <div className="p-4">No submission data available.</div>
      </CustomDialog>
    );
  }

  const formattedDate = formatDate(submission.createdAt);
  const formattedStatus = submission.status?.replace(/_/g, " ") || "N/A";

  const handleCopyCode = () => {
    if (submission.code) {
      navigator.clipboard
        .writeText(submission.code)
        .then(() => {
          setIsCopied(true);
          toast.success("Code copied to clipboard");

          // Reset the copied state after 2 seconds
          setTimeout(() => {
            setIsCopied(false);
          }, 2000);
        })
        .catch((err) => {
          toast.error("Could not copy code to clipboard");
          console.error("Failed to copy: ", err);
        });
    }
  };

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose} title="Code Submission">
      <div className="p-4">
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-medium">
              Problem: {submission.problem.title || "N/A"}
            </h3>
            <p className="text-md">Submitted on: {formattedDate || "N/A"}</p>
            <p className="text-md">
              Status:{" "}
              <span
                className={
                  submission.status === "accepted"
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {formattedStatus}
              </span>
            </p>
          </div>

          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 z-10"
              onClick={handleCopyCode}
            >
              {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
            </Button>
            <EditorialScrollArea className="border rounded-md overflow-auto h-[400px]">
              <SyntaxHighlighter
                language={submission.language.toLowerCase()}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "16px",
                }}
              >
                {submission.code || "No code available"}
              </SyntaxHighlighter>
            </EditorialScrollArea>
          </div>
        </div>
      </div>
    </CustomDialog>
  );
};

export default CodeDialog;
