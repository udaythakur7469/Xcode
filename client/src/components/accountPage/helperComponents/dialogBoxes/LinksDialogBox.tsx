import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LinkBoxes from "../linkBoxes/LinkBoxes";
import {
  linkBadgeTextAreas,
  linkBadgeTitles,
} from "@/components/landingPage/landingPageData/data";
import LinkTextAreas from "../linkBoxes/LinkTextAreas";
import { z } from "zod";
import { useUserStore } from "@/features/userStore";

type LinksDialogBoxProps = {
  isOpen: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
};

const urlSchema = z.string().url({
  message: "Please enter a valid URL",
});

const LinksDialogBox: React.FC<LinksDialogBoxProps> = ({ isOpen, onClose }) => {
  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [buttonText, setButtonText] = useState<string>("Set Links");

  const { updateProfileData, userData } = useUserStore();

  const placeholderToTitle: Record<string, string> = {
    "Add your Github URL": "Github",
    "Add your LinkedIn URL": "LinkedIn",
    "Add your site's URL": "Personal site",
  };

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    linkBadgeTextAreas.forEach((placeholder) => {
      initialValues[placeholder] = "";
    });
    setLinkValues(initialValues);
  }, []);

  const handleValueChange = (placeholder: string, value: string) => {
    setLinkValues((prev) => ({ ...prev, [placeholder]: value }));
    if (validationErrors[placeholder]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[placeholder];
        return newErrors;
      });
      if (Object.keys(validationErrors).length === 1) {
        setButtonText("Set Links");
      }
    }
  };

  const handleSetLinks = async () => {
    setValidationErrors({});
    const errors: Record<string, string> = {};
    let hasErrors = false;

    Object.entries(linkValues).forEach(([placeholder, url]) => {
      if (url.trim() === "") return;
      try {
        urlSchema.parse(url);
      } catch (err) {
        if (err instanceof z.ZodError) {
          errors[placeholder] = err.errors[0].message;
          hasErrors = true;
        }
      }
    });

    if (hasErrors) {
      setValidationErrors(errors);
      setButtonText("Invalid Links");
    } else {
      setButtonText("Set Links");
      const formattedLinks: Record<string, string> = {};
      Object.entries(linkValues).forEach(([placeholder, url]) => {
        if (url.trim() === "") return;
        const title = placeholderToTitle[placeholder] || placeholder;
        formattedLinks[title] = url;
      });
      try {
        await updateProfileData({ links: formattedLinks });
        onClose(false);
      } catch (error) {
        console.error("Failed to update links:", error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Responsive: near-full-screen on mobile, capped at 2xl on desktop */}
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl min-h-[400px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex justify-center items-start">
            {userData?.links ? "Edit links" : "Add links"}
          </DialogTitle>
          <DialogDescription className="flex flex-col h-full w-full">
            {/* 
              On very small screens, stack label + input vertically.
              On sm+ screens, show them side by side.
            */}
            <div className="h-full w-full flex flex-col sm:flex-row gap-4 mb-5 mt-3">
              <div className="flex-1 flex flex-col items-center justify-evenly gap-6">
                {linkBadgeTitles.map((title) => (
                  <LinkBoxes key={title} title={title} />
                ))}
              </div>
              <div className="flex-1 flex flex-col items-center justify-evenly gap-6">
                {linkBadgeTextAreas.map((inputPlaceholder) => (
                  <LinkTextAreas
                    key={inputPlaceholder}
                    inputPlaceholder={inputPlaceholder}
                    onValueChange={handleValueChange}
                    error={validationErrors[inputPlaceholder] || null}
                  />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleSetLinks}>
              {buttonText}
            </Button>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default LinksDialogBox;
