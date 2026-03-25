import React from "react";
import type { Message } from "../types";

/**
 * MessageBubble component
 * Renders a single chat message with priority styling and optional incident conversion.
 */
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId: string;
  canConvertToIncident?: boolean;
  onConvertToIncident?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  currentUserId,
  canConvertToIncident = false,
  onConvertToIncident,
}) => {
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const priorityClass =
    message.priority === "emergency"
      ? "message-emergency bg-red-950/40"
      : message.priority === "priority"
        ? "message-priority bg-amber-950/20"
        : "";

  const readCount = message.readBy.filter((id) => id !== message.userId).length;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-slide-in`}>
      <div
        className={`max-w-[74%] ${priorityClass} ${
          isOwn ? "bg-fire-600/20 border border-fire-700/30" : "bg-dark-800 border border-dark-700"
        } rounded-lg px-4 py-2.5`}
      >
        {!isOwn && <p className="text-xs font-semibold text-fire-300 mb-1">{message.userName}</p>}

        {message.priority !== "normal" && (
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1 ${
              message.priority === "emergency" ? "bg-red-600 text-white" : "bg-amber-600 text-white"
            }`}
          >
            {message.priority === "emergency" ? "\u{1F6A8} EMERGENCY" : "\u26A0 PRIORITY"}
          </span>
        )}

        <p className="text-sm text-white break-words whitespace-pre-wrap">{message.content}</p>

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-dark-400">{time}</span>
            {!isOwn && (
              <span className="text-[10px] text-dark-500 uppercase tracking-wide">{message.station}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canConvertToIncident && onConvertToIncident && (
              <button
                onClick={() => onConvertToIncident(message)}
                className="text-[10px] px-2 py-1 border border-fire-500/50 text-fire-200 hover:bg-fire-700/20 transition-colors"
                title="Convert this report into an incident"
              >
                Convert to Incident
              </button>
            )}
            {isOwn && (
              <span className="text-[10px]" title={`Read by ${readCount}`}>
                {readCount > 0 ? (
                  <svg className="w-3.5 h-3.5 text-blue-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-dark-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
