"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

type ProblemCalenderProps = {};

const ProblemCalender: React.FC<ProblemCalenderProps> = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  return (
    <div>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border shadow"
      />
    </div>
  );
};
export default ProblemCalender;
