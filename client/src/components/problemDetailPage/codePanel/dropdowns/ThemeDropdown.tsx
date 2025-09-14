import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ThemeDropdownProps = {
  selectedTheme: string;
  onThemeChange: (theme: string) => void;
};

const ThemeDropdown: React.FC<ThemeDropdownProps> = ({
  selectedTheme,
  onThemeChange,
}) => {
  return (
    <Select value={selectedTheme} onValueChange={onThemeChange}>
      <SelectTrigger className="w-auto text-md">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="dracula">Dracula</SelectItem>
        <SelectItem value="github-light">GitHub Light</SelectItem>
        <SelectItem value="github-dark">GitHub Dark</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ThemeDropdown;
