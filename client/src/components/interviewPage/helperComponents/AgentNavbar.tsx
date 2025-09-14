import React from "react";

type AgentNavbarProps = { type: string };

const AgentNavbar: React.FC<AgentNavbarProps> = ({ type }) => {
  if (type === "generate") {
    return <h1 className="text-4xl mb-10">Interview generation</h1>;
  }
  else{
    return <h1 className="text-4xl mb-10">Interview practice</h1>;
  }
};
export default AgentNavbar;
