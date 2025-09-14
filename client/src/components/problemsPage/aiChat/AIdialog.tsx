import * as React from "react";
import FloatingDialog from "../helperComponents/FloatingDialog";

type AIdialogProps = {};

const AIdialog: React.FC<AIdialogProps> = () => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "q" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <div
        className="flex justify-center items-center flex-col cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <p className="text-xl mb-3">To chat with AI</p>
        <p className="text-xl text-muted-foreground">
          Press{" "}
          <kbd
            className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 p-4 justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xl">⌘ + Q or ctrl + Q</span>
          </kbd>
        </p>
      </div>
      <FloatingDialog
        open={open}
        onOpenChange={setOpen}
        title="AI Chat"
        defaultSize={{ width: 600, height: 500 }}
        enableReset={true}
      >
        <div className="h-full flex justify-center items-center">
          AI chat box
        </div>
      </FloatingDialog>
    </>
  );
};

export default AIdialog;
