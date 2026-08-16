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
import ProfilePictureOptionsDialog from "../helperComponents/dialogBoxes/ProfilePictureOptionsDialog";

const DEFAULT_PROFILE_PICTURE =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTM3FwFWSj9qohGE7FhrwJ-PlcK4-tLdWSlGg&s";

type SidebarProps = {};

const Sidebar: React.FC<SidebarProps> = () => {
  const {
    userData,
    updateProfilePicture,
    deleteProfilePicture,
    isDataUpdating,
  } = useUserStore();
  const [showDescriptionDialogBox, setShowDescriptionDialogBox] =
    useState(false);
  const [showLinksDialogBox, setShowLinksDialogBox] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [showPictureOptionsDialog, setShowPictureOptionsDialog] =
    useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateImageFile = (
    file: File,
  ): { valid: boolean; error?: string } => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Invalid file type. Please upload a JPEG, PNG, or WEBP image.",
      };
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size too large. Please upload an image smaller than 5MB.",
      };
    }
    return { valid: true };
  };

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploadingImage(true);
    try {
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditPictureClick = () => {
    if (picture && picture !== DEFAULT_PROFILE_PICTURE) {
      setShowPictureOptionsDialog(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleChangeImageClick = () => {
    setShowPictureOptionsDialog(false);
    fileInputRef.current?.click();
  };

  const handleDeleteImage = async () => {
    setIsDeletingImage(true);
    try {
      await deleteProfilePicture();
      toast({
        title: "Success",
        description: "Profile picture removed successfully!",
        variant: "default",
      });
      setShowPictureOptionsDialog(false);
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingImage(false);
    }
  };

  const name = userData?.name;
  const capitalizedName = capitalizeFirstLetter(name);
  const picture = userData?.picture;
  const email = userData?.email;
  const description = userData?.description;
  const links = userData?.links;

  const hasLinks =
    links && (links.LinkedIn || links.Github || links["Personal site"]);

  return (
    <div className="bg-accent border rounded-xl w-full lg:w-80 xl:w-96 lg:flex-shrink-0 lg:self-stretch">
      <div className="w-full flex flex-col items-center pb-6">
        {/* Avatar and Name/Email */}
        <div className="w-full flex flex-row justify-around mt-8 px-6 pb-5">
          {/* Avatar with Edit Button */}
          <div className="relative w-20 h-20 flex-shrink-0">
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
            <button
              onClick={handleEditPictureClick}
              disabled={isUploadingImage || isDeletingImage || isDataUpdating}
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
              aria-label="Upload profile picture"
            />
          </div>

          {/* Name + Email — min-w-0 prevents text overflow breaking layout */}
          <div className="flex flex-col justify-start items-start px-4 min-w-0 flex-1">
            <p className="text-2xl font-bold mb-1 truncate w-full">
              {capitalizedName}
            </p>
            <p className="text-sm text-muted-foreground truncate w-full">
              {email}
            </p>
          </div>
        </div>

        <Separator />

        {/* Description Section */}
        <div className="w-full px-5 mt-8">
          {description ? (
            <div className="flex flex-col border rounded-md p-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-lg font-semibold">Description</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDescriptionDialogBox(true)}
                >
                  <PencilLine className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words overflow-y-auto max-h-[200px] pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
                {description}
              </p>
            </div>
          ) : (
            <Button
              className="w-full h-[40px]"
              onClick={() => setShowDescriptionDialogBox(true)}
            >
              <PencilLine className="mr-2" />
              Add description
            </Button>
          )}
        </div>

        {/* Links Section */}
        <div className="w-full px-5 mt-6">
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
                  <div className="flex items-center min-w-0">
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
                  <div className="flex items-center min-w-0">
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
                  <div className="flex items-center min-w-0">
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
              className="w-full h-[40px]"
              onClick={() => setShowLinksDialogBox(true)}
            >
              <Link className="mr-2" />
              Add profile links
            </Button>
          )}
        </div>

        {/* Skills Section */}
        <div className="w-full px-5 mt-6">
          <div className="flex flex-col border rounded-md p-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-lg font-semibold">Skills</p>
            </div>
            <SkillsBar />
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
      <ProfilePictureOptionsDialog
        isOpen={showPictureOptionsDialog}
        onClose={setShowPictureOptionsDialog}
        onChangeImage={handleChangeImageClick}
        onDeleteImage={handleDeleteImage}
        isDeletingImage={isDeletingImage}
      />
    </div>
  );
};

export default Sidebar;
