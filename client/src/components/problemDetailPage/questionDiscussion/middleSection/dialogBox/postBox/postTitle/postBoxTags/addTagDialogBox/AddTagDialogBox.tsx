import React, { useState } from "react";
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

  const { validateTagCached } = usePostStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setError(""); // Clear error when typing - TagsSection owns live validation now
  };

  const handleAddTag = async (tag: string) => {
    try {
      setError("");

      const validation = await validateTagCached(tag);

      if (validation.valid) {
        onAddTag(tag);
        setSearchTerm("");
        setError("");
      } else {
        setError(validation.message || "Invalid tag");
      }
    } catch (error) {
      console.error("error validating tag", error);
      setError("Error validating tag");
    }
  };

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
