import React from "react";
import { Button } from "@/components/ui/button";
import { Upload, Trash2 } from "lucide-react";
import { MoonLoader } from "react-spinners";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type ProfilePictureOptionsDialogProps = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onChangeImage: () => void;
  onDeleteImage: () => void;
  isDeletingImage: boolean;
};

const ProfilePictureOptionsDialog: React.FC<
  ProfilePictureOptionsDialogProps
> = ({ isOpen, onClose, onChangeImage, onDeleteImage, isDeletingImage }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Profile picture</DialogTitle>
          <DialogDescription className="text-center">
            Upload a new profile picture or remove your current one.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-3 sm:justify-center">
          <Button
            onClick={onChangeImage}
            disabled={isDeletingImage}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-none"
          >
            <Upload className="h-4 w-4 mr-2" />
            Change
          </Button>
          <Button
            onClick={onDeleteImage}
            disabled={isDeletingImage}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-none"
          >
            {isDeletingImage ? (
              <MoonLoader size={16} color="#ffffff" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureOptionsDialog;
