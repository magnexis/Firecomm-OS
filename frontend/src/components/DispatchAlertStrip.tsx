import React from "react";
import type { DispatchAlert } from "../types";

/**
 * DispatchAlertStrip component
 * Displays the latest dispatch broadcast as a full-width banner.
 */
interface DispatchAlertStripProps {
  alerts: DispatchAlert[];
}

export const DispatchAlertStrip: React.FC<DispatchAlertStripProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  const latest = alerts[alerts.length - 1];

  return (
    <div className="bg-red-900/50 border-y border-red-500/50 px-4 py-2 animate-emergency-flash">
      <div className="flex items-center gap-3">
        <span className="text-red-200 text-lg">🚨</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-red-200">Dispatch Broadcast</p>
          <p className="text-sm text-red-100 font-semibold truncate">{latest.content}</p>
        </div>
        <p className="text-[11px] text-red-300/90">
          {new Date(latest.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};
