import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LangDropdownProps = {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
};

const LangDropdown: React.FC<LangDropdownProps> = ({
  selectedLanguage,
  onLanguageChange,
}) => {
  return (
    <Select value={selectedLanguage} onValueChange={onLanguageChange}>
      <SelectTrigger className="w-auto text-md">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="javascript">Javascript</SelectItem>
        <SelectItem value="python">Python</SelectItem>
        <SelectItem value="cpp">C++</SelectItem>
        <SelectItem value="java">Java</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LangDropdown;
