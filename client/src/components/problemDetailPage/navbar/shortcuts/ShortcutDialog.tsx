"use client";

import React from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { shortcutName, shortcutKeys } from "./ShortcutData";

type ShortcutDialogProps = {};

const ShortcutDialog: React.FC<ShortcutDialogProps> = () => {
  return (
    <div>
      <DialogContent className="max-w-2xl max-h-[60vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-row justify-center items-center text-2xl mb-2">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {shortcutName.map((name, index) => (
            <div
              key={index}
              className="flex flex-row justify-between items-center py-2 px-3 hover:bg-secondary rounded-md"
            >
              <div className="flex-1 text-md font-semibold">{name}</div>
              <div className="flex flex-row items-center gap-2">
                {shortcutKeys[index].map((key, keyIndex) => (
                  <React.Fragment key={keyIndex}>
                    <kbd className="px-3 py-1.5 text-sm font-semibold border border-gray-300 rounded-md bg-secondary shadow-sm">
                      {key}
                    </kbd>
                    {keyIndex < shortcutKeys[index].length - 1 && (
                      <span className="text-white">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </div>
  );
};
export default ShortcutDialog;
