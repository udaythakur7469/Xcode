import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { ChartNoAxesCombined } from "lucide-react";
import { SelectSeparator } from "@/components/ui/select";
import { toTwoDecimals } from "@/services/acceptanceRateService";
import { formatCount } from "@/services/countService";

type StatsDialogProps = {
  stats?: {
    totalSolved: number;
    totalAttempts: number;
    acceptanceRate: number;
  };
};

const StatsDialog: React.FC<StatsDialogProps> = ({ stats }) => {
  if (!stats) return null;
  return (
    <HoverCard>
      <HoverCardTrigger>
        <Badge
          variant="secondary"
          className="px-2 py-1 flex items-center ml-1 cursor-pointer"
        >
          <ChartNoAxesCombined className="h-5 w-5" />
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent side="right">
        <div className="flex flex-col p-2">
          <div>Accuracy : {toTwoDecimals(stats?.acceptanceRate)}%</div>
          <SelectSeparator />
          <div>Attempts : {formatCount(stats?.totalAttempts)}</div>
          <SelectSeparator />
          <div>Accepted : {formatCount(stats?.totalSolved)}</div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
export default StatsDialog;
