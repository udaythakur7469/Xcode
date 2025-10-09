import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import TagsSection from "./TagsSection";
import { usePostStore } from "@/features/postStore";

type AddTagDialogBoxProps = {
  onAddTag: (tag: string) => void;
  onClose: () => void;
};

const AddTagDialogBox: React.FC<AddTagDialogBoxProps> = ({
  onAddTag,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { validateTag } = usePostStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setError(""); // Clear error when typing

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only validate if there's actual content (not empty or just whitespace)
    if (value.trim().length > 0) {
      // Set new timeout for 1 second after user stops typing
      debounceRef.current = setTimeout(async () => {
        try {
          const validationResponse = await validateTag(
            value.trim(),
            "validate"
          );

          if (!validationResponse?.data?.valid) {
            setError(validationResponse?.message || "Invalid tag");
          }
        } catch (error) {
          console.error("error validating tag", error);
          setError("Error validating tag");
        }
      }, 1000); // 1 second delay
    }
  };

  const handleAddTag = async (tag: string) => {
    try {
      setError("");

      // Get the current tags list from the store
      const { TagsList } = usePostStore.getState();
      const postTags = TagsList?.data?.tags || [];

      // Check if tag already exists in the tags list (case insensitive)
      const tagExists = postTags.some(
        (existingTag) => existingTag.toLowerCase() === tag.toLowerCase()
      );

      if (tagExists) {
        // Tag already exists, no need to validate - just add it
        onAddTag(tag);
        setSearchTerm("");
        setError("");
      } else {
        // Tag doesn't exist, validate it first
        const validationResponse = await validateTag(tag, "add");

        if (validationResponse?.data?.valid) {
          onAddTag(tag);
          setSearchTerm("");
          setError("");
        } else {
          setError(validationResponse?.message || "Invalid tag");
        }
      }
    } catch (error) {
      console.error("error validating tag", error);
      setError("Error validating tag");
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="p-2 w-full">
      <Input
        placeholder="Search tags..."
        value={searchTerm}
        onChange={handleInputChange}
        className="mb-3 border-b"
        autoFocus
      />
      <TagsSection
        searchTerm={searchTerm}
        onAddTag={handleAddTag}
        error={error}
      />
    </div>
  );
};
export default AddTagDialogBox;
