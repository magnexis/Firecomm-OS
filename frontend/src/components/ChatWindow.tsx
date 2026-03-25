import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { EmergencyBanner } from "./EmergencyBanner";
import { ConnectionPanel } from "./ConnectionPanel";
import { DispatchAlertStrip } from "./DispatchAlertStrip";
import type { ConnectionStatus, DispatchAlert, Message, User } from "../types";
import { DEFAULT_STATIONS } from "../types";

/**
 * ChatWindow component
 * Handles rendering of real-time messages, connection status, and inline dispatch banners.
 */
interface ChatWindowProps {
  messages: Message[];
  currentStation: string;
  currentUserId: string;
  users: User[];
  typingUsers: string[];
  connectionStatus: ConnectionStatus;
  latency: number;
  serverUrl: string;
  emergencyMessages: Message[];
  dispatchAlerts: DispatchAlert[];
  connectionWarning: string | null;
  canConvertToIncident: boolean;
  onSend: (content: string, priority: Message["priority"]) => void;
  onConnect: (serverUrl: string) => void;
  onDisconnect: () => void;
  onScanNetwork: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onMarkAsRead: (messageId: string, station: string) => void;
  onDismissEmergency: (messageId: string) => void;
  onConvertToIncident: (message: Message) => void;
  onClearConnectionWarning: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentStation,
  currentUserId,
  users,
  typingUsers,
  connectionStatus,
  latency,
  serverUrl,
  emergencyMessages,
  dispatchAlerts,
  connectionWarning,
  canConvertToIncident,
  onSend,
  onConnect,
  onDisconnect,
  onScanNetwork,
  onTypingStart,
  onTypingStop,
  onMarkAsRead,
  onDismissEmergency,
  onConvertToIncident,
  onClearConnectionWarning,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stationName = DEFAULT_STATIONS.find((station) => station.id === currentStation)?.name || currentStation;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && connectionStatus === "connected") {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.userId !== currentUserId && !lastMessage.readBy.includes(currentUserId)) {
        onMarkAsRead(lastMessage.id, currentStation);
      }
    }
  }, [messages, connectionStatus, currentUserId, currentStation, onMarkAsRead]);

  return (
    <section className="flex-1 flex flex-col h-full bg-dark-950 min-w-[34rem]">
      <ConnectionPanel
        connectionStatus={connectionStatus}
        latency={latency}
        currentServer={serverUrl}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onScanNetwork={onScanNetwork}
      />

      {connectionWarning && (
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-500/40 flex items-center gap-2">
          <span className="text-amber-300">\u26A0</span>
          <p className="text-xs text-amber-200 flex-1">{connectionWarning}</p>
          <button
            type="button"
            onClick={onClearConnectionWarning}
            className="text-[11px] text-amber-200/70 hover:text-amber-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <DispatchAlertStrip alerts={dispatchAlerts} />

      <div className="bg-[#091220] border-b border-[#1f2a3c] px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">{stationName}</h2>
          <p className="text-xs text-dark-400">
            {users.length} member{users.length !== 1 ? "s" : ""} online
          </p>
        </div>
        <div className="flex items-center gap-2">
          {users.slice(0, 6).map((user) => (
            <div
              key={user.id}
              className="w-7 h-7 bg-dark-700 border border-dark-600 flex items-center justify-center text-xs font-bold text-fire-300"
              title={`${user.name} (${user.status})`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {users.length > 6 && <span className="text-xs text-dark-400">+{users.length - 6}</span>}
        </div>
      </div>

      <EmergencyBanner emergencyMessages={emergencyMessages} onDismiss={onDismissEmergency} />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {connectionStatus !== "connected" ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-dark-800 border border-dark-700 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0"
                  />
                </svg>
              </div>
              <p className="text-dark-400 text-sm">Connect to a server to start communicating</p>
              <p className="text-dark-500 text-xs mt-1">Set server IP in the connection bar above</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-dark-400 text-sm">No messages in {stationName}</p>
              <p className="text-dark-500 text-xs mt-1">Incoming reports can be converted into incidents</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.userId === currentUserId}
                currentUserId={currentUserId}
                canConvertToIncident={canConvertToIncident}
                onConvertToIncident={onConvertToIncident}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 py-1 animate-fade-in">
          <p className="text-xs text-dark-400 italic">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.join(", ")} are typing...`}
          </p>
        </div>
      )}

      <MessageInput
        onSend={onSend}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        disabled={connectionStatus !== "connected"}
      />
    </section>
  );
};
