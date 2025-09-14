import React, { useState } from "react";
import { useUserStore } from "@/features/userStore";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/accountAvatar";
import { capitalizeFirstLetter } from "@/services/nameService";
import { Button } from "@/components/ui/button";
import { Github, Link, Linkedin, PencilLine } from "lucide-react";
import { ClipLoader } from "react-spinners";
import DescriptionDialogBox from "../helperComponents/dialogBoxes/DescriptionDialogBox";
import LinksDialogBox from "../helperComponents/dialogBoxes/LinksDialogBox";
import { Separator } from "@/components/ui/separator";
import SkillsBar from "../skillsBar/SkillsBar";

type SidebarProps = {};

const Sidebar: React.FC<SidebarProps> = () => {
  const { userData, isLoading } = useUserStore();
  const [showDescriptionDialogBox, setShowDescriptionDialogBox] =
    useState(false);
  const [showLinksDialogBox, setShowLinksDialogBox] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-accent border h-screen w-[400px] rounded-xl flex items-center justify-center">
        <ClipLoader size={50} color="#ffffff" />
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
          <Avatar onContextMenu={(e) => e.preventDefault()}>
            <AvatarImage src={picture} alt="name" />
            <AvatarFallback>{capitalizedName}</AvatarFallback>
          </Avatar>
          <div className="h-full w-full flex flex-col justify-start items-start px-8">
            <p className="text-3xl font-bold mb-1">{capitalizedName}</p>
            <p>{email}</p>
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
