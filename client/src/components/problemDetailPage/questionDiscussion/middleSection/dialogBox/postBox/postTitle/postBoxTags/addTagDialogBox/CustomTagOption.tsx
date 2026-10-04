import React from "react";
import { MoonLoader } from "react-spinners";

type CustomTagValidation = {
  isValidating: boolean;
  isValid: boolean | null;
  message: string;
};

type CustomTagOptionProps = {
  searchTerm: string;
  validation: CustomTagValidation;
  error: string;
  onSelect: (tag: string) => void;
};

const CustomTagOption: React.FC<CustomTagOptionProps> = ({
  searchTerm,
  validation,
  error,
  onSelect,
}) => {
  const trimmedTerm = searchTerm.trim();

  if (!trimmedTerm) {
    return <div className="text-center">No tags available</div>;
  }

  if (validation.isValidating) {
    return (
      <div className="flex items-center justify-center">
        <MoonLoader size={20} color="#ffffff" className="mr-2" />
        Validating tag...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (validation.isValid) {
    return (
      <div
        className="px-3 py-2 hover:bg-accent cursor-pointer text-sm transition-colors rounded-lg"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onSelect(trimmedTerm);
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {trimmedTerm}
        <span className="ml-2 text-xs text-green-400">(New tag)</span>
      </div>
    );
  }

  if (validation.isValid === false) {
    return (
      <div className="text-red-500 text-center">
        {validation.message || "No matching tags"}
      </div>
    );
  }

  return <div className="text-center">No matching tags</div>;
};

export default CustomTagOption;
