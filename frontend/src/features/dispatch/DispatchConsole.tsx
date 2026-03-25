import React, { useMemo, useState } from "react";
import type { DispatchAlert, DiscoveryServerInfo } from "../../types";

/**
 * DispatchConsole component
 * Lets dispatch broadcast alerts and scan for active FireComm servers.
 */
interface DispatchConsoleProps {
  canBroadcast: boolean;
  alerts: DispatchAlert[];
  discoveredServers: DiscoveryServerInfo[];
  onBroadcast: (content: string, priority: "priority" | "emergency") => Promise<boolean>;
  onScanNetwork: () => void;
}

export const DispatchConsole: React.FC<DispatchConsoleProps> = ({
  canBroadcast,
  alerts,
  discoveredServers,
  onBroadcast,
  onScanNetwork,
}) => {
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"priority" | "emergency">("emergency");
  const [isSending, setIsSending] = useState(false);

  const orderedAlerts = useMemo(
    () => [...alerts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 6),
    [alerts]
  );

  const handleSend = async () => {
    if (!content.trim() || !canBroadcast) return;

    setIsSending(true);
    try {
      const success = await onBroadcast(content.trim(), priority);
      if (success) {
        setContent("");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a111d] border border-[#243248]">
      <div className="p-4 border-b border-[#243248]">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Dispatch Mode</h3>
        <p className="text-xs text-dark-400 mt-1">Broadcast to all stations and scan active FireComm servers.</p>
      </div>

      <div className="p-4 border-b border-[#243248] space-y-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          placeholder={canBroadcast ? "Send system alert to all stations..." : "Join Dispatch station to broadcast"}
          className="input-field w-full resize-y"
          disabled={!canBroadcast || isSending}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPriority("priority")}
            className={`text-xs px-3 py-1.5 border ${
              priority === "priority"
                ? "bg-amber-600/20 border-amber-500/40 text-amber-200"
                : "border-dark-700 text-dark-300 hover:bg-dark-800"
            }`}
          >
            Priority
          </button>
          <button
            type="button"
            onClick={() => setPriority("emergency")}
            className={`text-xs px-3 py-1.5 border ${
              priority === "emergency"
                ? "bg-red-700/20 border-red-500/40 text-red-100"
                : "border-dark-700 text-dark-300 hover:bg-dark-800"
            }`}
          >
            Emergency
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canBroadcast || !content.trim() || isSending}
            className="btn-primary ml-auto disabled:opacity-40"
          >
            {isSending ? "Sending..." : "Broadcast"}
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-[#243248]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Network Discovery</h4>
          <button type="button" className="btn-secondary text-xs py-1.5" onClick={onScanNetwork}>
            Scan Network
          </button>
        </div>

        <div className="space-y-1 max-h-28 overflow-y-auto">
          {discoveredServers.length === 0 && (
            <p className="text-xs text-dark-500">No servers discovered yet. Scan to detect active hosts.</p>
          )}
          {discoveredServers.map((server) => (
            <div key={`${server.hostname}-${server.port}`} className="border border-dark-700 bg-dark-900 px-2 py-1.5">
              <p className="text-xs text-white font-semibold">{server.hostname}</p>
              <p className="text-[11px] text-dark-400">{server.localIPs.join(", ")}:{server.port}</p>
              <p className="text-[10px] text-dark-500">
                Users {server.activeUsers} | Incidents {server.activeIncidents}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Recent Broadcasts</h4>
        <div className="space-y-2">
          {orderedAlerts.length === 0 && <p className="text-xs text-dark-500">No dispatch broadcasts yet.</p>}
          {orderedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border px-2 py-2 ${
                alert.priority === "emergency"
                  ? "border-red-500/50 bg-red-950/25"
                  : "border-amber-500/40 bg-amber-950/20"
              }`}
            >
              <p className="text-xs text-white font-semibold">{alert.content}</p>
              <p className="text-[10px] text-dark-400 mt-1">
                {alert.userName} | {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
