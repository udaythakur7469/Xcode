import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MoonLoader } from "react-spinners";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MALE_AVATAR,
  DEFAULT_FEMALE_AVATAR,
  type AvatarGender,
} from "@/constants/avatar";

type DefaultAvatarDialogProps = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onConfirm: (gender: AvatarGender) => Promise<void>;
};

const DefaultAvatarDialog: React.FC<DefaultAvatarDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedGender, setSelectedGender] = useState<AvatarGender | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) setSelectedGender(null);
    onClose(open);
  };

  const handleConfirm = async () => {
    if (!selectedGender) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selectedGender);
      setSelectedGender(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Choose a default avatar
          </DialogTitle>
          <DialogDescription className="text-center">
            Pick a default picture to use for your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <GenderOption
            label="Male"
            src={DEFAULT_MALE_AVATAR}
            selected={selectedGender === "male"}
            onSelect={() => setSelectedGender("male")}
          />
          <GenderOption
            label="Female"
            src={DEFAULT_FEMALE_AVATAR}
            selected={selectedGender === "female"}
            onSelect={() => setSelectedGender("female")}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          This will delete your current profile picture. Every account needs
          a default avatar, so please choose one to continue.
        </p>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleConfirm}
            disabled={!selectedGender || isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-none"
          >
            {isSubmitting ? (
              <MoonLoader size={16} color="#ffffff" />
            ) : (
              "Set as profile picture"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type GenderOptionProps = {
  label: string;
  src: string;
  selected: boolean;
  onSelect: () => void;
};

const GenderOption: React.FC<GenderOptionProps> = ({
  label,
  src,
  selected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-2.5 p-3.5 rounded-lg border-2 bg-accent transition-all hover:border-green-500 hover:bg-secondary hover:-translate-y-0.5",
        selected
          ? "border-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]"
          : "border-border",
      )}
    >
      <Image
        src={src}
        alt={`${label} avatar`}
        width={96}
        height={96}
        className="rounded-full object-cover border pointer-events-none"
      />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
};

export default DefaultAvatarDialog;
