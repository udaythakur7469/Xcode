"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type TechIcon = {
  tech: string;
  url: string;
};

type DisplayTechIconsProps = { techIcons: TechIcon[] };

const DisplayTechIcons: React.FC<DisplayTechIconsProps> = ({ techIcons }) => {
  return (
    <div className="flex flex-row ml-0">
      {techIcons.slice(0, 4).map(({ tech, url }, index) => (
        <div
          key={tech}
          className={cn(
            "relative group bg-dark-300 rounded-full p-2 flex flex-center",
            index >= 1 && "-ml-3"
          )}
        >
          <span className="absolute bottom-full mb-1 hidden group-hover:flex px-2 py-1 text-xs text-white bg-gray-700 rounded-md shadow-md">
            {tech}
          </span>
          <div className="rounded-full p-2 bg-white">
            <Image
              src={url}
              alt={tech}
              width={100}
              height={100}
              className="size-5"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default DisplayTechIcons;
