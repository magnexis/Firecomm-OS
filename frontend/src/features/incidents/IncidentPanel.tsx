import React, { useEffect, useMemo, useState } from "react";
import { DispatchConsole } from "../dispatch/DispatchConsole";
import { CommandMap } from "../map/CommandMap";
import { UnitStatusLegend } from "../units/UnitStatusLegend";
import type {
  DispatchAlert,
  DiscoveryServerInfo,
  Incident,
  IncidentPriority,
  IncidentStatus,
  User,
} from "../../types";

/**
 * IncidentPanel component
 * Provides incident list, detail timeline, map tab, and dispatch console.
 */
interface IncidentPanelProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  allUsers: User[];
  isDispatch: boolean;
  dispatchAlerts: DispatchAlert[];
  discoveredServers: DiscoveryServerInfo[];
  onSelectIncident: (incidentId: string) => void;
  onCreateIncidentClick: () => void;
  onUpdateIncidentStatus: (incidentId: string, status: IncidentStatus) => Promise<void>;
  onAssignUnits: (incidentId: string, unitsAssigned: string[]) => Promise<void>;
  onBroadcast: (content: string, priority: "priority" | "emergency") => Promise<boolean>;
  onScanNetwork: () => void;
}

type IncidentTab = "incidents" | "map" | "dispatch";

const TAB_CONFIG: Array<{ id: IncidentTab; label: string }> = [
  { id: "incidents", label: "Incidents" },
  { id: "map", label: "Map" },
  { id: "dispatch", label: "Dispatch" },
];

const PRIORITY_LABEL: Record<IncidentPriority, string> = {
  low: "LOW",
  medium: "MED",
  high: "HIGH",
  critical: "CRITICAL",
};

const PRIORITY_CLASS: Record<IncidentPriority, string> = {
  low: "bg-emerald-600/20 text-emerald-200 border-emerald-500/40",
  medium: "bg-amber-600/20 text-amber-100 border-amber-500/40",
  high: "bg-orange-600/20 text-orange-100 border-orange-500/40",
  critical: "bg-red-700/20 text-red-100 border-red-500/50",
};

const STATUS_OPTIONS: IncidentStatus[] = ["active", "contained", "resolved"];

function formatElapsed(timestamp: number): string {
  const elapsedMs = Date.now() - timestamp;
  const totalMinutes = Math.max(0, Math.floor(elapsedMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export const IncidentPanel: React.FC<IncidentPanelProps> = ({
  incidents,
  selectedIncidentId,
  allUsers,
  isDispatch,
  dispatchAlerts,
  discoveredServers,
  onSelectIncident,
  onCreateIncidentClick,
  onUpdateIncidentStatus,
  onAssignUnits,
  onBroadcast,
  onScanNetwork,
}) => {
  const [activeTab, setActiveTab] = useState<IncidentTab>("incidents");
  const [assignedUnitsDraft, setAssignedUnitsDraft] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedIncidentId) || null,
    [incidents, selectedIncidentId]
  );

  useEffect(() => {
    if (selectedIncident) {
      setAssignedUnitsDraft(selectedIncident.unitsAssigned);
    } else {
      setAssignedUnitsDraft([]);
    }
  }, [selectedIncident]);

  const activeIncidents = incidents.filter((incident) => incident.status !== "resolved");

  const handleAssignToggle = (unitId: string) => {
    setAssignedUnitsDraft((current) =>
      current.includes(unitId) ? current.filter((value) => value !== unitId) : [...current, unitId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedIncident) return;

    setIsAssigning(true);
    try {
      await onAssignUnits(selectedIncident.id, assignedUnitsDraft);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <aside className="w-[28rem] h-full bg-[#060d18] border-l border-[#1f2a3c] flex flex-col">
      <div className="px-4 py-3 border-b border-[#1f2a3c]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Situational Panel</h2>
            <p className="text-xs text-dark-400">Live incidents, map view, and dispatch controls.</p>
          </div>
          <button type="button" className="btn-primary text-xs py-1.5" onClick={onCreateIncidentClick}>
            + Incident
          </button>
        </div>

        <div className="mt-3 flex gap-1 border border-dark-700 bg-dark-900 p-1">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-xs py-1.5 transition-colors ${
                activeTab === tab.id
                  ? "bg-fire-700/20 text-fire-200 border border-fire-500/40"
                  : "text-dark-300 hover:bg-dark-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "map" && (
        <div className="flex-1 p-3">
          <CommandMap incidents={incidents} selectedIncidentId={selectedIncidentId} onSelectIncident={onSelectIncident} />
        </div>
      )}

      {activeTab === "dispatch" && (
        <div className="flex-1 p-3">
          <DispatchConsole
            canBroadcast={isDispatch}
            alerts={dispatchAlerts}
            discoveredServers={discoveredServers}
            onBroadcast={onBroadcast}
            onScanNetwork={onScanNetwork}
          />
        </div>
      )}

      {activeTab === "incidents" && (
        <>
          <div className="px-4 py-3 border-b border-[#1f2a3c] bg-[#0a121f]">
            <UnitStatusLegend />
          </div>

          <div className="border-b border-[#1f2a3c] max-h-56 overflow-y-auto">
            {incidents.length === 0 && (
              <div className="px-4 py-5 text-xs text-dark-500">No incidents yet. Create one to begin dispatch flow.</div>
            )}

            {incidents.map((incident) => (
              <button
                key={incident.id}
                type="button"
                onClick={() => onSelectIncident(incident.id)}
                className={`w-full px-4 py-3 text-left border-b border-dark-800 transition-colors ${
                  selectedIncidentId === incident.id ? "bg-fire-700/15" : "hover:bg-dark-900"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-white font-semibold truncate">{incident.title}</p>
                  <span className={`text-[10px] border px-1.5 py-0.5 ${PRIORITY_CLASS[incident.priority]}`}>
                    {PRIORITY_LABEL[incident.priority]}
                  </span>
                </div>
                <p className="text-xs text-dark-400 truncate mt-0.5">{incident.address}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-dark-400">
                  <span>{incident.status.toUpperCase()}</span>
                  <span>Elapsed {formatElapsed(incident.timestamp)}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selectedIncident && incidents.length > 0 && (
              <p className="text-xs text-dark-500">Select an incident to view details.</p>
            )}

            {selectedIncident && (
              <div className="space-y-4">
                <div className="border border-[#243248] bg-[#0a121f] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{selectedIncident.title}</h3>
                      <p className="text-xs text-dark-400">{selectedIncident.address}</p>
                    </div>
                    <span className={`text-[10px] border px-1.5 py-0.5 ${PRIORITY_CLASS[selectedIncident.priority]}`}>
                      {PRIORITY_LABEL[selectedIncident.priority]}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onUpdateIncidentStatus(selectedIncident.id, status)}
                        className={`text-[11px] py-1.5 border transition-colors ${
                          selectedIncident.status === status
                            ? "bg-fire-700/20 border-fire-500/40 text-fire-200"
                            : "border-dark-700 text-dark-300 hover:bg-dark-800"
                        }`}
                      >
                        {status.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {selectedIncident.notes && (
                    <p className="mt-3 text-xs text-dark-200 border border-dark-700 bg-dark-900 p-2">{selectedIncident.notes}</p>
                  )}
                </div>

                <div className="border border-[#243248] bg-[#0a121f] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Assigned Units</h4>
                    <button
                      type="button"
                      onClick={handleSaveAssignments}
                      disabled={isAssigning}
                      className="btn-secondary text-xs py-1.5"
                    >
                      {isAssigning ? "Saving..." : "Save"}
                    </button>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {allUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleAssignToggle(user.id)}
                        className={`w-full text-left px-2 py-1.5 border text-xs ${
                          assignedUnitsDraft.includes(user.id)
                            ? "bg-fire-700/20 border-fire-500/40 text-fire-100"
                            : "border-dark-700 text-dark-300 hover:bg-dark-800"
                        }`}
                      >
                        {user.name} <span className="text-dark-500">({user.station})</span>
                      </button>
                    ))}
                    {allUsers.length === 0 && <p className="text-xs text-dark-500">No units online.</p>}
                  </div>
                </div>

                <div className="border border-[#243248] bg-[#0a121f] p-3">
                  <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Incident Timeline</h4>
                  <div className="max-h-52 overflow-y-auto space-y-2">
                    {[...selectedIncident.timeline]
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((entry) => (
                        <div key={entry.id} className="border-l-2 border-fire-500/50 pl-2">
                          <p className="text-[11px] text-dark-400">
                            [{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}] {entry.actor}
                          </p>
                          <p className="text-xs text-white">{entry.description}</p>
                        </div>
                      ))}
                    {selectedIncident.timeline.length === 0 && (
                      <p className="text-xs text-dark-500">No timeline entries yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-[#1f2a3c] text-[11px] text-dark-400 bg-[#0a121f]">
            {activeIncidents.length} active incident{activeIncidents.length !== 1 ? "s" : ""}
          </div>
        </>
      )}
    </aside>
  );
};
