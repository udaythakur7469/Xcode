import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

type LinkTextAreasProps = {
  inputPlaceholder: string;
  onValueChange: (placeholder: string, value: string) => void;
  error?: string | null;
};

const LinkTextAreas: React.FC<LinkTextAreasProps> = ({
  inputPlaceholder,
  onValueChange,
  error,
}) => {
  const [value, setValue] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onValueChange(inputPlaceholder, newValue);
  };

  // Initialize value on mount
  useEffect(() => {
    if (onValueChange) {
      onValueChange(inputPlaceholder, value);
    }
  }, []);

  return (
    <div className="relative">
      {error && (
        <div className="absolute -top-6 left-0 right-0 text-sm text-red-500 text-center">
          {error}
        </div>
      )}
      <Input
        placeholder={inputPlaceholder}
        className="placeholder:text-center w-[250px]"
        value={value}
        onChange={handleChange}
        aria-invalid={!!error}
      />
    </div>
  );
};

export default LinkTextAreas;
