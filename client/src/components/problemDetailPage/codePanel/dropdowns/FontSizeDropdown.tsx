"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FontSizeDropdownProps = {
  onFontSizeChange: (fontSize: number) => void;
};

const FontSizeDropdown: React.FC<FontSizeDropdownProps> = ({
  onFontSizeChange,
}) => {
  const [fontSize, setFontSize] = useState<string>("14"); // Default font size

  const handleFontSizeChange = () => {
    const size = parseInt(fontSize, 10);
    if (!isNaN(size)) {
      onFontSizeChange(size); // Pass the font size to the parent component
    }
  };

  return (
    <Select>
      <SelectTrigger className="w-auto text-md">
        <SelectValue placeholder="Font Size" />
      </SelectTrigger>
      <SelectContent className="flex flex-col justify-center items-center gap-y-2">
        <Input
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          min="10"
          max="24"
          placeholder="Font Size"
          className="my-2 w-full"
        />
        <Button
          variant="secondary"
          onClick={handleFontSizeChange}
          className="mb-2 w-full"
        >
          Set Size
        </Button>
      </SelectContent>
    </Select>
  );
};

export default FontSizeDropdown;
