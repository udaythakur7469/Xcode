import { Badge } from "@/components/ui/linkBadge";
import React from "react";

type LinkBoxesProps = {
  title: string;
};

const LinkBoxes: React.FC<LinkBoxesProps> = ({ title }) => {
  return (
    <Badge
      variant="secondary"
      className="border flex justify-center items-center text-base sm:text-xl font-semibold w-full max-w-[200px] sm:max-w-[250px]"
    >
      {title}
    </Badge>
  );
};
export default LinkBoxes;
