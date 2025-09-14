import React from "react";
import { CirclePlus } from "lucide-react";

type AddNewTagsProps = {};

const AddNewTags: React.FC<AddNewTagsProps> = () => {
  return (
    <div className="rounded-3xl border bg-primary-foreground mr-5 px-3 py-2 flex flex-row items-center cursor-pointer select-none">
      <CirclePlus />
      <div className="ml-2 text-xl">Tag</div>
    </div>
  );
};
export default AddNewTags;
