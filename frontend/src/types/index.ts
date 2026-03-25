export type UnitStatus = "available" | "enroute" | "on-scene" | "out-of-service";

export interface User {
  id: string;
  name: string;
  station: string;
  status: UnitStatus;
  joinedAt: string;
   role?: "dispatch" | "station" | "command";
}

export type MessagePriority = "normal" | "priority" | "emergency";

export interface Message {
  id: string;
  userId: string;
  userName: string;
  station: string;
  content: string;
  priority: MessagePriority;
  timestamp: string;
  readBy: string[];
}

export interface TypingEvent {
  userId: string;
  userName: string;
  station: string;
  isTyping: boolean;
}

export interface Station {
  name: string;
  id: string;
  userCount: number;
  location: { lat: number; lng: number };
}

export type IncidentPriority = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "active" | "contained" | "resolved";

export interface IncidentTimelineEntry {
  id: string;
  incidentId: string;
  timestamp: number;
  type: "created" | "status" | "assignment" | "message-linked" | "note" | "unit-status";
  actor: string;
  description: string;
}

export interface Incident {
  id: string;
  title: string;
  address: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  unitsAssigned: string[];
  timestamp: number;
  notes: string;
  createdBy: string;
  createdByStation: string;
  location: { lat: number; lng: number };
  timeline: IncidentTimelineEntry[];
}

export interface DispatchAlert {
  id: string;
  content: string;
  priority: "priority" | "emergency";
  userName: string;
  station: string;
  timestamp: number;
}

export interface DiscoveryServerInfo {
  hostname: string;
  localIPs: string[];
  port: string;
  status: "online";
  activeUsers: number;
  activeIncidents: number;
}

export const DEFAULT_STATIONS: Station[] = [
  { name: "Station 1", id: "station-1", userCount: 0, location: { lat: 40.7418, lng: -73.9892 } },
  { name: "Station 2", id: "station-2", userCount: 0, location: { lat: 40.7282, lng: -74.0776 } },
  { name: "Station 3", id: "station-3", userCount: 0, location: { lat: 40.7056, lng: -74.0137 } },
  { name: "Dispatch", id: "dispatch", userCount: 0, location: { lat: 40.7135, lng: -74.0067 } },
  { name: "Command", id: "command", userCount: 0, location: { lat: 40.7529, lng: -73.9778 } },
];

export type ConnectionStatus = "connected" | "connecting" | "disconnected";
