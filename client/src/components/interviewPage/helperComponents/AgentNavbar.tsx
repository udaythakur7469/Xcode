import React from "react";

type AgentNavbarProps = { type: string };

const AgentNavbar: React.FC<AgentNavbarProps> = ({ type }) => {
  const title = type === "generate" ? "Interview generation" : "Interview practice";

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {type === "generate"
            ? "The AI will ask you questions and generate a tailored interview."
            : "Answer out loud — the AI interviewer is listening."}
        </p>
      </div>
      <span
        className="hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px]"
        style={{
          borderColor: "rgba(34,197,94,0.25)",
          background: "var(--brand-muted)",
          color: "var(--brand)",
        }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ background: "var(--brand)" }}
        />
        live interview session
      </span>
    </div>
  );
};
export default AgentNavbar;
