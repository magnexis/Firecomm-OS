import React from "react";
import type { Message } from "../types";
import { DEFAULT_STATIONS } from "../types";

interface EmergencyBannerProps {
  emergencyMessages: Message[];
  onDismiss: (messageId: string) => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  emergencyMessages,
  onDismiss,
}) => {
  if (emergencyMessages.length === 0) return null;

  return (
    <div className="space-y-1">
      {emergencyMessages.map((msg) => {
        const stationName =
          DEFAULT_STATIONS.find((s) => s.id === msg.station)?.name || msg.station;
        const time = new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={msg.id}
            className="bg-red-950/60 border border-red-700/50 px-4 py-2 flex items-center gap-3 animate-emergency-flash"
          >
            <span className="text-red-400 text-lg shrink-0">{"\u{1F6A8}"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-200 font-semibold truncate">
                EMERGENCY - {stationName}
              </p>
              <p className="text-xs text-red-300/80 truncate">
                {msg.userName}: {msg.content}
              </p>
            </div>
            <span className="text-xs text-red-400/60 shrink-0">{time}</span>
            <button
              onClick={() => onDismiss(msg.id)}
              className="text-red-400/60 hover:text-red-300 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
