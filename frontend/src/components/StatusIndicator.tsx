import React from "react";
import type { UnitStatus } from "../types";

/**
 * StatusIndicator component
 * Shows a colored dot (and optional label) for a unit status.
 */
interface StatusIndicatorProps {
  status: UnitStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<UnitStatus, { color: string; label: string; icon: string }> = {
  available: { color: "bg-emerald-500", label: "Available", icon: "\u{1F7E2}" },
  enroute: { color: "bg-amber-400", label: "En Route", icon: "\u{1F7E1}" },
  "on-scene": { color: "bg-red-500", label: "On Scene", icon: "\u{1F534}" },
  "out-of-service": { color: "bg-slate-500", label: "Out of Service", icon: "\u{26AB}" },
};

const SIZE_MAP = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = "md",
  showLabel = false,
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`${SIZE_MAP[size]} ${config.color} rounded-full inline-block ring-2 ring-dark-900`} />
      {showLabel && <span className="text-xs text-dark-300">{config.icon} {config.label}</span>}
    </div>
  );
};
