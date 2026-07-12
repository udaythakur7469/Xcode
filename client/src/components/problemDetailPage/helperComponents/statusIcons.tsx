import {
  CheckCircle2,
  XCircle,
  CodeXml,
  TriangleAlert,
  TerminalSquare,
  Clock,
  HardDrive,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import type { StatusIconKey } from "@/lib/share/getStatusConfig";

export const STATUS_ICON_MAP: Record<StatusIconKey, LucideIcon> = {
  check: CheckCircle2,
  x: XCircle,
  code: CodeXml,
  alertTriangle: TriangleAlert,
  terminal: TerminalSquare,
  clock: Clock,
  hardDrive: HardDrive,
  wifiOff: WifiOff,
};
