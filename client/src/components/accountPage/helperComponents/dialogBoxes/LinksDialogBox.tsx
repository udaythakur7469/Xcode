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

// Zod schema for URL validation
const urlSchema = z.string().url({
  message: "Please enter a valid URL",
});

const LinksDialogBox: React.FC<LinksDialogBoxProps> = ({ isOpen, onClose }) => {
  // State to store all link values
  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  // State to track validation errors
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  // State for button text
  const [buttonText, setButtonText] = useState<string>("Set Links");

  const { updateProfileData, userData } = useUserStore();

  // Map placeholders to more readable titles
  const placeholderToTitle: Record<string, string> = {
    "Add your Github URL": "Github",
    "Add your LinkedIn URL": "LinkedIn",
    "Add your site's URL": "Personal site",
  };

  // Initialize linkValues with empty strings for all placeholders
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    linkBadgeTextAreas.forEach((placeholder) => {
      initialValues[placeholder] = "";
    });
    setLinkValues(initialValues);
  }, []);

  // Handler for updating values from LinkTextAreas
  const handleValueChange = (placeholder: string, value: string) => {
    setLinkValues((prev) => ({
      ...prev,
      [placeholder]: value,
    }));

    // Clear error for this field when value changes
    if (validationErrors[placeholder]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[placeholder];
        return newErrors;
      });

      // Reset button text if all errors are cleared
      if (Object.keys(validationErrors).length === 1) {
        setButtonText("Set Links");
      }
    }
  };

  // Handler for the "Set Links" button click
  const handleSetLinks = async () => {
    // Reset validation errors
    setValidationErrors({});

    // Validate all URLs
    const errors: Record<string, string> = {};
    let hasErrors = false;

    // Check each URL
    Object.entries(linkValues).forEach(([placeholder, url]) => {
      if (url.trim() === "") return; // Skip empty URLs

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
      // Set validation errors to display in UI
      setValidationErrors(errors);
      // Change button text
      setButtonText("Invalid Links");
      // Don't console log anything for errors
    } else {
      // Reset button text
      setButtonText("Set Links");

      // Format the output in the desired format
      const formattedLinks: Record<string, string> = {};

      Object.entries(linkValues).forEach(([placeholder, url]) => {
        if (url.trim() === "") return; // Skip empty URLs

        // Use the mapping to get a clean title
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
      <DialogContent className="min-h-[400px] min-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex justify-center items-start">
            {userData?.links ? "Edit links" : "Add links"}
          </DialogTitle>
          <DialogDescription className="flex flex-col h-full w-full">
            <div className="h-full w-full flex flex-row space-x-3 mb-5">
              <div className="h-full w-full flex flex-col items-center justify-evenly space-y-7">
                {linkBadgeTitles.map((title) => (
                  <LinkBoxes key={title} title={title} />
                ))}
              </div>
              <div className="h-full w-full flex flex-col items-center justify-evenly space-y-7">
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
