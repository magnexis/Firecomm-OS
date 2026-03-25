import React, { useState } from "react";
import type { ConnectionStatus } from "../types";

/**
 * ConnectionPanel component
 * Shows connection state, latency, and allows connect/disconnect/network scan.
 */
interface ConnectionPanelProps {
  connectionStatus: ConnectionStatus;
  latency: number;
  currentServer: string;
  onConnect: (serverUrl: string) => void;
  onDisconnect: () => void;
  onScanNetwork: () => void;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  connectionStatus,
  latency,
  currentServer,
  onConnect,
  onDisconnect,
  onScanNetwork,
}) => {
  const [serverInput, setServerInput] = useState(currentServer || "localhost:3001");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleConnect = () => {
    const url = serverInput.startsWith("http") ? serverInput : `http://${serverInput}`;
    onConnect(url);
  };

  const statusColor =
    connectionStatus === "connected"
      ? "text-emerald-400"
      : connectionStatus === "connecting"
        ? "text-amber-400"
        : "text-red-400";

  const statusDot =
    connectionStatus === "connected"
      ? "bg-emerald-500"
      : connectionStatus === "connecting"
        ? "bg-amber-500 animate-pulse"
        : "bg-red-500";

  const latencyColor =
    latency < 50 ? "text-emerald-400" : latency < 150 ? "text-amber-400" : "text-red-400";

  return (
    <div className="bg-[#070f1b] border-b border-[#1f2a3c]">
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-dark-900 transition-colors"
        onClick={() => setIsExpanded((current) => !current)}
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
          <span className={`text-sm font-medium ${statusColor}`}>
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"}
          </span>
          {connectionStatus === "connected" && <span className={`text-xs ${latencyColor}`}>{latency}ms</span>}
        </div>
        <svg
          className={`w-4 h-4 text-dark-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="px-4 pb-3 animate-fade-in space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={serverInput}
              onChange={(event) => setServerInput(event.target.value)}
              placeholder="Server IP:Port (e.g. 192.168.1.100:3001)"
              className="input-field flex-1 text-sm"
              disabled={connectionStatus === "connected"}
              onKeyDown={(event) => {
                if (event.key === "Enter" && connectionStatus !== "connected") handleConnect();
              }}
            />
            {connectionStatus === "connected" ? (
              <button onClick={onDisconnect} className="btn-danger text-sm">
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="btn-primary text-sm"
                disabled={connectionStatus === "connecting"}
              >
                {connectionStatus === "connecting" ? "..." : "Connect"}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={onScanNetwork} className="btn-secondary text-xs py-1.5">
              Scan Network
            </button>
            {connectionStatus === "connected" && (
              <div className="text-xs text-dark-400">
                <span>Server: {currentServer}</span>
                <span className={`ml-3 ${latencyColor}`}>Latency: {latency}ms</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
