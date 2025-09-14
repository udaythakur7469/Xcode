"use client";

import React from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type HintsDialogProps = {
  data: string[]; 
};

const HintsDialog: React.FC<HintsDialogProps> = ({ data }) => {
  const hintLength = data.length;
  return (
    <DialogContent className="flex flex-col justify-center">
      <DialogHeader>
        <DialogTitle className="flex justify-center m-0 p-0">
          <span className="text-4xl flex justify-center">Hints</span>
        </DialogTitle>
        <DialogDescription className="flex flex-col justify-center">
          <span className="flex justify-center items-center m-3 mb-0 text-md">
            Below are the hints for this problem
          </span>
          <span className="flex justify-center items-center m-3 text-md">
            We advise you to think about the problem before checking the hints
          </span>
        </DialogDescription>
      </DialogHeader>
      {hintLength ? (
        <Accordion type="single" collapsible className="w-full">
          {data.map((hint, index) => (
            <AccordionItem key={index} value={`item-${index + 1}`}>
              <AccordionTrigger className="w-full text-xl mt-2 mb-2">
                Hint {index + 1}
              </AccordionTrigger>
              <AccordionContent>{hint}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-red-500 text-md text-center">
          No hints available for this problem
        </div>
      )}
    </DialogContent>
  );
};

export default HintsDialog;
