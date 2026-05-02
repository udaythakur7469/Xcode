import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/features/userStore";
import { PropagateLoader } from "react-spinners";

type DescriptionDialogBoxProps = {
  isOpen: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
};

const DescriptionDialogBox: React.FC<DescriptionDialogBoxProps> = ({
  isOpen,
  onClose,
}) => {
  const [description, setDescription] = useState<string>("");
  const { updateProfileData, isDataUpdating, error, userData } = useUserStore();

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(e.target.value);
  };

  const handleSetDescription = async () => {
    try {
      await updateProfileData({ description });
      onClose(false);
    } catch (error) {
      console.error("Failed to update description:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 
        w-full + max-w-* pattern: fills screen on mobile, 
        caps at a readable width on desktop. No min-w with fixed px.
      */}
      <DialogContent className="w-full max-w-[95vw] sm:max-w-xl min-h-[400px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex justify-center items-start mb-3">
            {userData?.description ? "Edit description" : "Add description"}
          </DialogTitle>
          <DialogDescription className="flex flex-col h-full w-full">
            <Textarea
              placeholder="Enter your description"
              className="h-full w-full mb-5 min-h-[200px]"
              value={description}
              onChange={handleDescriptionChange}
            />
            <Button className="w-full" onClick={handleSetDescription}>
              {isDataUpdating ? (
                <PropagateLoader
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "100%",
                  }}
                />
              ) : error ? (
                error
              ) : (
                "Set description"
              )}
            </Button>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default DescriptionDialogBox;
