import React, { useState, useEffect } from "react";
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

type InstitutionDialogBoxProps = {
  isOpen: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
};

const InstitutionDialogBox: React.FC<InstitutionDialogBoxProps> = ({
  isOpen,
  onClose,
}) => {
  const [institution, setInstitution] = useState<string>("");
  const { userData, updateInstitution, isDataUpdating, error } = useUserStore();

  useEffect(() => {
    if (userData?.institution) {
      setInstitution(userData.institution);
    }
  }, [userData?.institution]);

  const handleInstitutionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInstitution(e.target.value);
  };

  const handleSetInstitution = async () => {
    try {
      await updateInstitution(institution);
      onClose(false);
    } catch (error) {
      console.error("Failed to update institution:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-h-[200px] min-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex justify-center items-start mb-3">
            {userData?.institution ? "Edit Institution" : "Add Institution"}
          </DialogTitle>
          <DialogDescription className="flex flex-col h-full w-full">
            <Textarea
              placeholder="Enter your institution"
              className="h-full w-full mb-5"
              value={institution}
              onChange={handleInstitutionChange}
            />
            <Button className="w-full" onClick={handleSetInstitution}>
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
                "Set Institution"
              )}
            </Button>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default InstitutionDialogBox;
