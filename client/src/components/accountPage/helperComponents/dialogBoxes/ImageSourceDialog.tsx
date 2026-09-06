import React from "react";
import { ImagePlus, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ImageSourceDialogProps = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onChooseFile: () => void;
  onTakePhoto: () => void;
};

const ImageSourceDialog: React.FC<ImageSourceDialogProps> = ({
  isOpen,
  onClose,
  onChooseFile,
  onTakePhoto,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Update profile picture
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose an image from your device or take a new photo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <SourceOption
            icon={<ImagePlus className="h-[22px] w-[22px]" />}
            label="Choose an image"
            sublabel="JPEG, PNG or WEBP · up to 5MB"
            onClick={onChooseFile}
          />
          <SourceOption
            icon={<Camera className="h-[22px] w-[22px]" />}
            label="Take a photo"
            sublabel="Use your camera"
            onClick={onTakePhoto}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

type SourceOptionProps = {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
};

const SourceOption: React.FC<SourceOptionProps> = ({
  icon,
  label,
  sublabel,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2.5 rounded-lg border bg-accent px-3 py-6 text-center transition-all hover:border-green-500 hover:bg-secondary hover:-translate-y-0.5"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500/10 text-green-500">
        {icon}
      </span>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{sublabel}</span>
    </button>
  );
};

export default ImageSourceDialog;
