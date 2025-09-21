import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import TagsSection from "./TagsSection";
import { postTags } from "@/components/problemDetailPage/questionDiscussion/questionDiscussionData/QuestionDiscussionData";

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

  // ✅ Tag validation function
  const isValidTag = (tag: string) => {
    const lowerTag = tag.toLowerCase();

    // Allowed 2-letter and short tech terms
    const allowedShortTags = ["dp", "bfs", "dfs", "ai", "ml"];

    // ✅ Acronym whitelist (all-caps common tech terms)
    const acronymWhitelist = [
      "API",
      "OOP",
      "SQL",
      "CSS",
      "HTML",
      "JS",
      "TS",
      "IDE",
      "UI",
      "UX",
      "DB",
      "TCP",
      "UDP",
      "IP",
      "REST",
      "JSON",
      "XML",
      "JWT",
      "JWT",
      "CI",
      "CD",
      "MVC",
      "MVVM",
      "SDK",
      "CLI",
    ];

    if (
      postTags.includes(lowerTag) ||
      allowedShortTags.includes(lowerTag) ||
      acronymWhitelist.includes(tag.toUpperCase())
    ) {
      return { isValid: true, reason: "" };
    }

    // Special cases: block single '-' or '_'
    if (tag === "-" || tag === "_") {
      return {
        isValid: false,
        reason:
          "Hyphens and underscores must be accompanied by letters or numbers",
      };
    }

    // Block tags starting with '-' or '_'
    if (/^[-_]/.test(tag)) {
      return {
        isValid: false,
        reason: "Tags cannot start with a hyphen or underscore",
      };
    }

    // Block tags ending with '-' or '_'
    if (/[-_]$/.test(tag)) {
      return {
        isValid: false,
        reason:
          "Tags cannot end with a hyphen or underscore — they must be followed by letters or numbers",
      };
    }

    // Block consecutive hyphens/underscores
    if (/[-_]{2,}/.test(tag)) {
      return {
        isValid: false,
        reason: "Tags cannot contain consecutive hyphens or underscores",
      };
    }

    // Must match allowed characters
    const wordPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i;
    if (!wordPattern.test(tag)) {
      return {
        isValid: false,
        reason:
          "Tag can only contain letters, numbers, hyphens, and underscores",
      };
    }

    // Minimum length
    if (tag.length < 2) {
      return {
        isValid: false,
        reason: "Tag must be at least 2 characters long",
      };
    }

    // Maximum length (to prevent nonsense like 200 chars long)
    if (tag.length > 30) {
      return {
        isValid: false,
        reason: "Tag is too long — keep it under 30 characters",
      };
    }

    // Block gibberish patterns like "a-a-a-a" or "b_b_b"
    const parts = tag.split(/[-_]/);
    const singleCharParts = parts.filter((p) => p.length === 1).length;
    if (parts.length > 3 && singleCharParts / parts.length > 0.5) {
      return {
        isValid: false,
        reason: "Tag looks like gibberish (too many single-character segments)",
      };
    }

    // No gibberish with repeating chars
    const repetitiveChars = /(.)\1{2,}/;
    if (repetitiveChars.test(tag)) {
      return {
        isValid: false,
        reason: "Tag contains too many repetitive characters",
      };
    }

    // Common suffix/prefix patterns for tech/English words
    const commonSuffixes = [
      "ing",
      "tion",
      "ment",
      "ity",
      "ance",
      "ence",
      "ism",
      "ist",
      "ness",
      "ship",
    ];
    const hasCommonSuffix = commonSuffixes.some((suffix) =>
      tag.toLowerCase().endsWith(suffix)
    );

    const commonPrefixes = [
      "re",
      "un",
      "pre",
      "post",
      "anti",
      "dis",
      "en",
      "em",
    ];
    const hasCommonPrefix = commonPrefixes.some((prefix) =>
      tag.toLowerCase().startsWith(prefix)
    );

    if (hasCommonSuffix || hasCommonPrefix) {
      return { isValid: true, reason: "" };
    }

    // Basic vowel/consonant check
    const vowels = tag.match(/[aeiou]/gi);
    const consonants = tag.match(/[bcdfghjklmnpqrstvwxyz]/gi);

    if (vowels && consonants) {
      const vowelRatio = vowels.length / tag.length;
      if (vowelRatio < 0.1) {
        return {
          isValid: false,
          reason: "Tag does not follow typical word patterns",
        };
      }
    } else if (!vowels && tag.length > 3) {
      return {
        isValid: false,
        reason: "Tag should contain some vowels",
      };
    }

    // ✅ Passed all checks
    return { isValid: true, reason: "" };
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setError("");
      return;
    }

    // Live validation while typing
    const validation = isValidTag(value.trim());
    if (validation.isValid) {
      setError("");
    } else {
      setError(validation.reason);
    }
  };

  const handleAddTag = (tag: string) => {
    const validation = isValidTag(tag);
    if (validation.isValid) {
      onAddTag(tag);
      setSearchTerm("");
      setError("");
    } else {
      setError(validation.reason);
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
      <TagsSection searchTerm={searchTerm} onAddTag={handleAddTag} error={error}/>
    </div>
  );
};
export default AddTagDialogBox;
