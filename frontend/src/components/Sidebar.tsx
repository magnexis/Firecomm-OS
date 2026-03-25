import React from "react";
import { StatusIndicator } from "./StatusIndicator";
import type { UnitStatus, User, Station } from "../types";
import { DEFAULT_STATIONS } from "../types";

/**
 * Sidebar component
 * Shows user status, station list, and active unit roster.
 */
interface SidebarProps {
  currentStation: string;
  allUsers: User[];
  activeIncidents: number;
  currentUser: { name: string; station: string; status: UnitStatus };
  onSwitchStation: (stationId: string) => void;
  onChangeStatus: (status: UnitStatus) => void;
}

const STATUS_OPTIONS: Array<{ value: UnitStatus; label: string; activeClass: string }> = [
  { value: "available", label: "Available", activeClass: "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/40" },
  { value: "enroute", label: "En Route", activeClass: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40" },
  { value: "on-scene", label: "On Scene", activeClass: "bg-red-600/20 text-red-200 ring-1 ring-red-500/40" },
  {
    value: "out-of-service",
    label: "Out of Service",
    activeClass: "bg-slate-600/25 text-slate-200 ring-1 ring-slate-400/40",
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentStation,
  allUsers,
  activeIncidents,
  currentUser,
  onSwitchStation,
  onChangeStatus,
}) => {
  const stationsWithCounts: Station[] = DEFAULT_STATIONS.map((station) => ({
    ...station,
    userCount: allUsers.filter((user) => user.station === station.id).length,
  }));

  return (
    <aside className="w-80 bg-[#070d16] border-r border-[#1f2a3c] flex flex-col h-full">
      <div className="p-4 border-b border-[#1f2a3c] bg-gradient-to-b from-[#101928] to-[#070d16]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-fire-600 rounded-none flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">FireComm Command</h1>
            <p className="text-xs text-dark-400">Dispatch + Situational Awareness</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-dark-900/70 border border-dark-700 px-2 py-1.5">
            <p className="text-dark-400 uppercase">Units Online</p>
            <p className="text-white text-base font-semibold">{allUsers.length}</p>
          </div>
          <div className="bg-dark-900/70 border border-dark-700 px-2 py-1.5">
            <p className="text-dark-400 uppercase">Active Incidents</p>
            <p className="text-fire-300 text-base font-semibold">{activeIncidents}</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-[#1f2a3c]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-dark-700 rounded-none flex items-center justify-center text-sm font-bold text-fire-400">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
            <StatusIndicator status={currentUser.status} size="sm" showLabel />
          </div>
          {currentUser.station === "dispatch" && (
            <span className="text-[10px] uppercase tracking-widest bg-red-700/30 text-red-200 px-2 py-1 border border-red-500/40">
              Dispatch
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChangeStatus(option.value)}
              className={`text-[11px] py-1.5 px-1 transition-colors border ${
                currentUser.status === option.value
                  ? option.activeClass
                  : "bg-dark-900 text-dark-300 border-dark-700 hover:bg-dark-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 px-2">Stations</p>
          <div className="space-y-1">
            {stationsWithCounts.map((station) => (
              <button
                key={station.id}
                onClick={() => onSwitchStation(station.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-none text-left transition-all duration-150 border ${
                  currentStation === station.id
                    ? "bg-fire-700/20 text-fire-200 border-fire-500/50"
                    : "text-dark-300 border-transparent hover:bg-dark-900 hover:border-dark-700 hover:text-white"
                }`}
              >
                <span className="text-lg">
                  {station.id === "dispatch" ? "\u{1F4E1}" : station.id === "command" ? "\u2694" : "\u{1F692}"}
                </span>
                <span className="flex-1 text-sm font-medium">{station.name}</span>
                <span className="text-xs px-1.5 py-0.5 bg-dark-800 text-dark-300">{station.userCount}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#1f2a3c] p-3 bg-[#0b1320]">
        <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 px-2">
          Active Units ({allUsers.length})
        </p>
        <div className="max-h-52 overflow-y-auto space-y-1.5">
          {allUsers.map((user) => (
            <div key={user.id} className="border border-dark-700 bg-dark-900/70 px-2 py-1.5">
              <div className="flex items-center gap-2">
                <StatusIndicator status={user.status} size="sm" />
                <span className="text-xs text-white truncate flex-1 font-medium">{user.name}</span>
              </div>
              <p className="text-[10px] text-dark-400 mt-0.5">
                {DEFAULT_STATIONS.find((station) => station.id === user.station)?.name || user.station}
              </p>
            </div>
          ))}
          {allUsers.length === 0 && <p className="text-xs text-dark-500 px-2">No active units</p>}
        </div>
      </div>
    </aside>
  );
};
