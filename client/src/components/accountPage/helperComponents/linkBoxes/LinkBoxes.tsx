import { Badge } from "@/components/ui/linkBadge";
import React from "react";

type LinkBoxesProps = {
  title: string;
};

const LinkBoxes: React.FC<LinkBoxesProps> = ({ title }) => {
  return (
    <Badge
      variant="secondary"
      className="border flex justify-center items-center text-xl font-semibold w-[250px]"
    >
      {title}
    </Badge>
  );
};
export default LinkBoxes;
