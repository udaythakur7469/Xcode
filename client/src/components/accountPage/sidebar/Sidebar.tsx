import React, { useState, useRef } from "react";
import { useUserStore } from "@/features/userStore";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/accountAvatar";
import { capitalizeFirstLetter } from "@/services/nameService";
import { Button } from "@/components/ui/button";
import { Github, Link, Linkedin, PencilLine } from "lucide-react";
import { MoonLoader } from "react-spinners";
import DescriptionDialogBox from "../helperComponents/dialogBoxes/DescriptionDialogBox";
import LinksDialogBox from "../helperComponents/dialogBoxes/LinksDialogBox";
import { Separator } from "@/components/ui/separator";
import SkillsBar from "../skillsBar/SkillsBar";
import { useToast } from "@/hooks/use-toast";

type SidebarProps = {};

const Sidebar: React.FC<SidebarProps> = () => {
  const { userData, isLoading, updateProfilePicture, isDataUpdating } =
    useUserStore();
  const [showDescriptionDialogBox, setShowDescriptionDialogBox] =
    useState(false);
  const [showLinksDialogBox, setShowLinksDialogBox] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Validate image file
  const validateImageFile = (
    file: File,
  ): { valid: boolean; error?: string } => {
    // Check file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Invalid file type. Please upload a JPEG, PNG, or WEBP image.",
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size too large. Please upload an image smaller than 5MB.",
      };
    }

    return { valid: true };
  };

  // Handle image file selection
  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload to backend (which handles Cloudinary)
      await updateProfilePicture(file);

      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Trigger file input click
  const handleEditPictureClick = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="bg-accent border h-screen w-[400px] rounded-xl flex items-center justify-center">
        <MoonLoader size={50} color="#ffffff" />
      </div>
    );
  }

  const name = userData?.name;
  const capitalizedName = capitalizeFirstLetter(name);
  const picture = userData?.picture;
  const email = userData?.email;
  const description = userData?.description;
  const links = userData?.links;

  // Check if any links exist
  const hasLinks =
    links && (links.LinkedIn || links.Github || links["Personal site"]);

  return (
    <div className="bg-accent border h-screen w-[400px] rounded-xl">
      <div className="h-full w-full flex flex-col items-center">
        {/* Avatar and Email Section */}
        <div className="w-full flex flex-row justify-around mt-8 px-10 pb-5">
          {/* Avatar with Edit Button */}
          <div className="relative w-20 h-20">
            {isUploadingImage ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <MoonLoader size={28} color="#ffffff" />
              </div>
            ) : (
              <Avatar
                onContextMenu={(e) => e.preventDefault()}
                className="w-20 h-20 rounded-full"
              >
                <AvatarImage
                  src={picture}
                  alt={name || "User"}
                  className="rounded-full object-cover"
                />
                <AvatarFallback className="rounded-full text-2xl">
                  {capitalizedName}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Edit Icon Button - positioned at bottom-right */}
            <button
              onClick={handleEditPictureClick}
              disabled={isUploadingImage || isDataUpdating}
              className={`absolute bottom-0 right-0 bg-green-500 text-primary-foreground rounded-full p-1.5 hover:bg-primary/90 transition-all duration-200 shadow-lg border-2 border-accent disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 ${
                isUploadingImage ? "hidden" : ""
              }`}
              aria-label="Change profile picture"
              title="Change profile picture"
            >
              {!isUploadingImage && (
                <PencilLine className="h-3 w-3 text-white" />
              )}
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
              aria-label="Upload profile picture"
            />
          </div>

          <div className="h-full w-full flex flex-col justify-start items-start px-8">
            <p className="text-3xl font-bold mb-1">{capitalizedName}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <Separator />

        {/* Description Section */}
        <div className="w-full px-10 mt-10">
          {description ? (
            <div className="flex flex-col border rounded-md p-2">
              <div className="flex justify-between items-center mb-2 ">
                <p className="text-lg font-semibold">Description</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDescriptionDialogBox(true)}
                >
                  <PencilLine className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words overflow-y-auto max-h-[230px] pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
                {description}
              </p>
            </div>
          ) : (
            <Button
              className="w-full h-[40px]"
              onClick={() => setShowDescriptionDialogBox(true)}
            >
              <PencilLine />
              Add description
            </Button>
          )}
        </div>

        {/* Links Section */}
        <div className="w-full px-10 mt-8">
          {hasLinks ? (
            <div className="flex flex-col border rounded-md p-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-lg font-semibold">Links</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLinksDialogBox(true)}
                >
                  <PencilLine className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {links?.LinkedIn && (
                  <div className="flex items-center">
                    <Linkedin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <a
                      href={links.LinkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-500 hover:underline truncate"
                    >
                      {links.LinkedIn}
                    </a>
                  </div>
                )}
                {links?.Github && (
                  <div className="flex items-center">
                    <Github className="h-4 w-4 mr-2 flex-shrink-0" />
                    <a
                      href={links.Github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-500 hover:underline truncate"
                    >
                      {links.Github}
                    </a>
                  </div>
                )}
                {links?.["Personal site"] && (
                  <div className="flex items-center">
                    <Link className="h-4 w-4 mr-2 flex-shrink-0" />
                    <a
                      href={links["Personal site"]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-500 hover:underline truncate"
                    >
                      {links["Personal site"]}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Button
              className="w-full h-[40px] mt-8"
              onClick={() => setShowLinksDialogBox(true)}
            >
              <Link />
              Add profile links
            </Button>
          )}
        </div>

        {/* Skills Section */}
        <div className="w-full px-10 mt-10">
          <div className="flex flex-col border rounded-md p-2">
            <div className="flex justify-between items-center mb-2 ">
              <p className="text-lg font-semibold">Skills</p>
            </div>
            <span className="text-sm text-muted-foreground whitespace-pre-wrap break-words overflow-y-auto max-h-[230px] pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
              <SkillsBar />
            </span>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <DescriptionDialogBox
        isOpen={showDescriptionDialogBox}
        onClose={setShowDescriptionDialogBox}
      />
      <LinksDialogBox
        isOpen={showLinksDialogBox}
        onClose={setShowLinksDialogBox}
      />
    </div>
  );
};

export default Sidebar;
