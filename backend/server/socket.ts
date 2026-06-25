import os from "os";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { logger } from "./utils/logger";

export type UnitStatus = "available" | "enroute" | "on-scene" | "out-of-service";

export interface User {
  id: string;
  name: string;
  station: string;
  status: UnitStatus;
  joinedAt: string;
  role: "dispatch" | "station" | "command";
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  station: string;
  content: string;
  priority: "normal" | "priority" | "emergency";
  timestamp: string;
  readBy: string[];
}

interface TypingEvent {
  userId: string;
  userName: string;
  station: string;
  isTyping: boolean;
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

interface DiscoveryServerInfo {
  hostname: string;
  localIPs: string[];
  port: string;
  status: "online";
  activeUsers: number;
  activeIncidents: number;
}

const users = new Map<string, User>();
const messageHistory = new Map<string, Message[]>();
const messageQueue = new Map<string, Message[]>();
const incidents = new Map<string, Incident>();
const dispatchAlerts: DispatchAlert[] = [];

const MAX_HISTORY = 200;
const MAX_ALERT_HISTORY = 40;
const DEFAULT_PORT = process.env.PORT || "3001";
const HASH_BASE_LAT = 39.8283;
const HASH_BASE_LNG = -98.5795;

function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }

  return ips;
}

function getStationHistory(station: string): Message[] {
  if (!messageHistory.has(station)) {
    messageHistory.set(station, []);
  }
  return messageHistory.get(station)!;
}

function addMessage(station: string, message: Message): void {
  const history = getStationHistory(station);
  history.push(message);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function normalizeUnitStatus(status: string): UnitStatus {
  if (status === "enroute" || status === "on-scene" || status === "out-of-service") {
    return status;
  }

  // Backward-compatible mapping for old statuses.
  if (status === "busy") return "on-scene";
  if (status === "on-call") return "enroute";
  return "available";
}

function isDispatch(user: User): boolean {
  return user.station === "dispatch";
}

function getAllUsers(): User[] {
  return Array.from(users.values());
}

function getStationUsers(station: string): User[] {
  return getAllUsers().filter((user) => user.station === station);
}

function getAllIncidents(): Incident[] {
  return Array.from(incidents.values()).sort((a, b) => b.timestamp - a.timestamp);
}

function hashAddressToLocation(address: string): { lat: number; lng: number } {
  if (!address.trim()) {
    return { lat: HASH_BASE_LAT, lng: HASH_BASE_LNG };
  }

  let hash = 0;
  for (let i = 0; i < address.length; i += 1) {
    hash = (hash << 5) - hash + address.charCodeAt(i);
    hash |= 0;
  }

  const latOffset = ((hash % 1800) - 900) / 500;
  const lngOffset = ((((hash >> 3) % 2600) - 1300) / 500) * -1;

  return {
    lat: HASH_BASE_LAT + latOffset,
    lng: HASH_BASE_LNG + lngOffset,
  };
}

function createTimelineEntry(
  incidentId: string,
  type: IncidentTimelineEntry["type"],
  actor: string,
  description: string
): IncidentTimelineEntry {
  return {
    id: generateId(),
    incidentId,
    timestamp: Date.now(),
    type,
    actor,
    description,
  };
}

function sanitizeAssignedUnits(unitsAssigned: string[] | undefined): string[] {
  if (!unitsAssigned || unitsAssigned.length === 0) {
    return [];
  }
  return Array.from(new Set(unitsAssigned.filter(Boolean)));
}

function emitUserUpdates(io: Server, station: string): void {
  io.to(station).emit("users:update", getStationUsers(station));
  io.emit("users:all", getAllUsers());
  io.emit("units:update", getAllUsers());
}

function emitIncidentSync(io: Server): void {
  io.emit("incidents:sync", getAllIncidents());
}

function getDiscoveryInfo(): DiscoveryServerInfo {
  return {
    hostname: os.hostname(),
    localIPs: getLocalIPs(),
    port: DEFAULT_PORT,
    status: "online",
    activeUsers: users.size,
    activeIncidents: incidents.size,
  };
}

export function setupSocket(
  io: Server,
  opts: {
    jwtSecret: string;
    logAction: (entry: { type: string; user: string; timestamp: number; details?: unknown }) => void;
    getSettings: () => Record<string, unknown>;
    deviceTokens: Set<string>;
  }
): void {
  io.on("connection", (socket: Socket) => {
    logger.connection(`Client connected: ${socket.id}`);

    // Handle initial user join: register, join room, send history/state.
    socket.on("user:join", (data: { name: string; station: string }, callback?: (response: unknown) => void) => {
      const token = (socket.handshake.auth as any)?.token;
      try {
        const decoded = jwt.verify(token, opts.jwtSecret) as { name: string; station: string; role: User["role"] };
        if (decoded.name !== data.name || decoded.station !== data.station) {
          return callback?.({ success: false, error: "Auth mismatch" });
        }
        const user: User = {
          id: socket.id,
          name: data.name,
          station: data.station,
          role: decoded.role,
          status: "available",
          joinedAt: new Date().toISOString(),
        };

        users.set(socket.id, user);
        socket.join(data.station);

        logger.connection(`${data.name} joined station: ${data.station}`);

        const history = getStationHistory(data.station);
        socket.emit("message:history", history);
        socket.emit("incidents:sync", getAllIncidents());
        socket.emit("units:update", getAllUsers());
        socket.emit("dispatch:history", dispatchAlerts);

        const queued = messageQueue.get(socket.id) || [];
        if (queued.length > 0) {
          queued.forEach((msg) => socket.emit("message:receive", msg));
          messageQueue.delete(socket.id);
        }

        emitUserUpdates(io, data.station);
        opts.logAction({ type: "user:join", user: user.name, timestamp: Date.now(), details: { station: user.station } });

        if (callback) callback({ success: true, user });
      } catch (err) {
        return callback?.({ success: false, error: "Unauthorized" });
      }
    });

    // Allow user to change station; move rooms and refresh station state.
    socket.on("station:switch", (data: { station: string }, callback?: (response: unknown) => void) => {
      const user = users.get(socket.id);
      if (!user) return;

      const oldStation = user.station;
      socket.leave(oldStation);

      user.station = data.station;
      socket.join(data.station);

      logger.info(`${user.name} switched from ${oldStation} to ${data.station}`);

      io.to(oldStation).emit("users:update", getStationUsers(oldStation));

      const history = getStationHistory(data.station);
      socket.emit("message:history", history);

      emitUserUpdates(io, data.station);

      if (callback) callback({ success: true });
    });

    // Station-scoped chat messages; emergency broadcasts globally.
    socket.on("message:send", (data: { content: string; priority: "normal" | "priority" | "emergency" }) => {
      const user = users.get(socket.id);
      if (!user) return;

      const message: Message = {
        id: generateId(),
        userId: socket.id,
        userName: user.name,
        station: user.station,
        content: data.content,
        priority: data.priority,
        timestamp: new Date().toISOString(),
        readBy: [socket.id],
      };

      addMessage(user.station, message);

      logger.message(`[${user.station}] ${user.name}: [encrypted payload length=${data.content.length}] (${data.priority})`);

      io.to(user.station).emit("message:receive", message);

      if (data.priority === "emergency") {
        logger.warn(`EMERGENCY from ${user.name} @ ${user.station}`);
        socket.broadcast.emit("message:emergency", message);
      }

      opts.logAction({
        type: "message:send",
        user: user.name,
        timestamp: Date.now(),
        details: { station: user.station, priority: data.priority },
      });
    });

    // Read receipts per station history.
    socket.on("message:read", (data: { messageId: string; station: string }) => {
      const history = getStationHistory(data.station);
      const msg = history.find((m) => m.id === data.messageId);
      if (msg && !msg.readBy.includes(socket.id)) {
        msg.readBy.push(socket.id);
        io.to(data.station).emit("message:read-update", {
          messageId: data.messageId,
          readBy: msg.readBy,
        });
      }
    });

    // Typing indicators start.
    socket.on("typing:start", () => {
      const user = users.get(socket.id);
      if (!user) return;
      const event: TypingEvent = {
        userId: socket.id,
        userName: user.name,
        station: user.station,
        isTyping: true,
      };
      socket.to(user.station).emit("typing:update", event);
    });

    // Typing indicators stop.
    socket.on("typing:stop", () => {
      const user = users.get(socket.id);
      if (!user) return;
      const event: TypingEvent = {
        userId: socket.id,
        userName: user.name,
        station: user.station,
        isTyping: false,
      };
      socket.to(user.station).emit("typing:update", event);
    });

    // Backward compatibility for old status event (maps legacy statuses).
    socket.on("status:change", (data: { status: string; incidentId?: string }) => {
      const user = users.get(socket.id);
      if (!user) return;

      const normalizedStatus = normalizeUnitStatus(data.status);
      user.status = normalizedStatus;
      logger.info(`${user.name} status -> ${normalizedStatus}`);

      if (data.incidentId) {
        const incident = incidents.get(data.incidentId);
        if (incident) {
          incident.timeline.push(
            createTimelineEntry(
              incident.id,
              "unit-status",
              user.name,
              `${user.name} changed status to ${normalizedStatus.replace("-", " ")}`
            )
          );
          io.emit("incident:updated", incident);
        }
      }

      emitUserUpdates(io, user.station);
    });

    // Primary unit status update (dispatch can target another unit via unitId).
    socket.on(
      "unit:status",
      (
        data: { status: UnitStatus; incidentId?: string; unitId?: string },
        callback?: (response: unknown) => void
      ) => {
        const actor = users.get(socket.id);
        if (!actor) {
          if (callback) callback({ success: false, error: "Not authenticated" });
          return;
        }

        const targetUser =
          data.unitId && isDispatch(actor)
            ? users.get(data.unitId) || actor
            : actor;

        const normalizedStatus = normalizeUnitStatus(data.status);
        targetUser.status = normalizedStatus;

        logger.info(`${targetUser.name} unit status -> ${normalizedStatus}`);

        if (data.incidentId) {
          const incident = incidents.get(data.incidentId);
          if (incident) {
            incident.timeline.push(
              createTimelineEntry(
                incident.id,
                "unit-status",
                actor.name,
                `${targetUser.name} marked ${normalizedStatus.replace("-", " ")}`
              )
            );
            io.emit("incident:updated", incident);
          }
        }

        emitUserUpdates(io, targetUser.station);

        if (callback) callback({ success: true, user: targetUser });

        opts.logAction({
          type: "unit:status",
          user: actor.name,
          timestamp: Date.now(),
          details: { unit: targetUser.name, status: normalizedStatus, incidentId: data.incidentId },
        });
      }
    );

    // Real-time unit location updates (mobile or hardware). Device token or authenticated user required.
    socket.on("unit:location:update", (data: { unitId: string; lat: number; lng: number; accuracy?: number; speed?: number; heading?: number }) => {
      const user = users.get(socket.id);
      const deviceToken = (socket.handshake.auth as any)?.deviceToken;
      const authorized = user || (deviceToken && opts.deviceTokens.has(deviceToken));
      if (!authorized) return;

      io.emit("unit:location:update", { ...data, timestamp: Date.now() });
      opts.logAction({
        type: "unit:location:update",
        user: user?.name || data.unitId || "device",
        timestamp: Date.now(),
        details: { lat: data.lat, lng: data.lng },
      });
    });

    // Drone telemetry ingress (from bridge/device).
    socket.on("drone:update", (data: { id: string; lat: number; lng: number; altitude: number; battery: number; heading: number; speed: number; cameraFeedUrl?: string; signalStrength?: number; status: string }) => {
      const deviceToken = (socket.handshake.auth as any)?.deviceToken;
      if (!deviceToken || !opts.deviceTokens.has(deviceToken)) return;
      io.emit("drone:update", { ...data, timestamp: Date.now() });
      opts.logAction({ type: "drone:update", user: data.id || "drone", timestamp: Date.now(), details: { lat: data.lat, lng: data.lng } });
    });

    // Drone command from UI to bridge.
    socket.on("drone:command", (data: { id: string; type: string; lat?: number; lng?: number }) => {
      const user = users.get(socket.id);
      if (!user) return;
      if (!isDispatch(user) && user.role !== "command") return;
      io.emit("drone:command", { ...data, issuedBy: user.name, timestamp: Date.now() });
      opts.logAction({ type: "drone:command", user: user.name, timestamp: Date.now(), details: data });
    });

    // Create a new incident and broadcast to all clients. Dispatch/Command only.
    socket.on(
      "incident:create",
      (
        data: {
          title: string;
          address: string;
          priority: IncidentPriority;
          notes?: string;
          unitsAssigned?: string[];
          sourceMessageId?: string;
          sourceMessagePreview?: string;
          location?: { lat: number; lng: number };
        },
        callback?: (response: unknown) => void
      ) => {
        const user = users.get(socket.id);
        if (!user) {
          if (callback) callback({ success: false, error: "Not authenticated" });
          return;
        }

        if (!isDispatch(user) && user.role !== "command") {
          if (callback) callback({ success: false, error: "Forbidden" });
          return;
        }

        const incidentId = generateId();
        const assignedUnits = sanitizeAssignedUnits(data.unitsAssigned);

        const incident: Incident = {
          id: incidentId,
          title: data.title,
          address: data.address,
          priority: data.priority,
          status: "active",
          unitsAssigned: assignedUnits,
          timestamp: Date.now(),
          notes: data.notes?.trim() || "",
          createdBy: user.name,
          createdByStation: user.station,
          location: data.location ?? hashAddressToLocation(data.address),
          timeline: [
            createTimelineEntry(
              incidentId,
              "created",
              user.name,
              `${user.name} created incident (${data.priority.toUpperCase()})`
            ),
          ],
        };

        if (assignedUnits.length > 0) {
          const names = assignedUnits
            .map((unitId) => users.get(unitId)?.name || unitId)
            .join(", ");
          incident.timeline.push(
            createTimelineEntry(
              incidentId,
              "assignment",
              user.name,
              `${user.name} assigned units: ${names}`
            )
          );
        }

        if (data.sourceMessageId && data.sourceMessagePreview) {
          incident.timeline.push(
            createTimelineEntry(
              incidentId,
              "message-linked",
              user.name,
              `Converted from message: "${data.sourceMessagePreview.slice(0, 80)}"`
            )
          );
        }

        incidents.set(incident.id, incident);
        logger.warn(`Incident created: ${incident.title} (${incident.priority}) by ${user.name}`);

        io.emit("incident:created", incident);
        emitIncidentSync(io);

        if (callback) callback({ success: true, incident });

        opts.logAction({ type: "incident:create", user: user.name, timestamp: Date.now(), details: { incidentId } });
      }
    );

    // Update an existing incident (title/address/priority/status/notes).
    socket.on(
      "incident:update",
      (
        data: {
          incidentId: string;
          title?: string;
          address?: string;
          priority?: IncidentPriority;
          status?: IncidentStatus;
          notes?: string;
        },
        callback?: (response: unknown) => void
      ) => {
        const user = users.get(socket.id);
        if (!user) {
          if (callback) callback({ success: false, error: "Not authenticated" });
          return;
        }

        if (!isDispatch(user) && user.role !== "command") {
          if (callback) callback({ success: false, error: "Forbidden" });
          return;
        }

        const incident = incidents.get(data.incidentId);
        if (!incident) {
          if (callback) callback({ success: false, error: "Incident not found" });
          return;
        }

        if (data.title && data.title !== incident.title) {
          incident.title = data.title;
        }

        if (data.address && data.address !== incident.address) {
          incident.address = data.address;
          incident.location = hashAddressToLocation(data.address);
        }

        if (data.priority && data.priority !== incident.priority) {
          incident.priority = data.priority;
          incident.timeline.push(
            createTimelineEntry(
              incident.id,
              "note",
              user.name,
              `${user.name} changed priority to ${data.priority.toUpperCase()}`
            )
          );
        }

        if (data.status && data.status !== incident.status) {
          incident.status = data.status;
          incident.timeline.push(
            createTimelineEntry(
              incident.id,
              "status",
              user.name,
              `${user.name} marked incident ${data.status.toUpperCase()}`
            )
          );
        }

        if (typeof data.notes === "string" && data.notes.trim() !== incident.notes) {
          incident.notes = data.notes.trim();
          incident.timeline.push(
            createTimelineEntry(incident.id, "note", user.name, `${user.name} updated incident notes`)
          );
        }

        logger.info(`Incident updated: ${incident.title} (${incident.status})`);
        io.emit("incident:updated", incident);
        emitIncidentSync(io);

        if (callback) callback({ success: true, incident });

        opts.logAction({
          type: "incident:update",
          user: user.name,
          timestamp: Date.now(),
          details: { incidentId: incident.id, status: incident.status, priority: incident.priority },
        });
      }
    );

    // Assign units to incident and log timeline entry.
    socket.on(
      "incident:assign",
      (
        data: { incidentId: string; unitsAssigned: string[] },
        callback?: (response: unknown) => void
      ) => {
        const user = users.get(socket.id);
        if (!user) {
          if (callback) callback({ success: false, error: "Not authenticated" });
          return;
        }

        if (!isDispatch(user) && user.role !== "command") {
          if (callback) callback({ success: false, error: "Forbidden" });
          return;
        }

        const incident = incidents.get(data.incidentId);
        if (!incident) {
          if (callback) callback({ success: false, error: "Incident not found" });
          return;
        }

        const assignedUnits = sanitizeAssignedUnits(data.unitsAssigned);
        incident.unitsAssigned = assignedUnits;
        const names = assignedUnits.map((unitId) => users.get(unitId)?.name || unitId).join(", ");

        incident.timeline.push(
          createTimelineEntry(
            incident.id,
            "assignment",
            user.name,
            `${user.name} assigned units: ${names || "None"}`
          )
        );

        logger.info(`Incident assignment updated: ${incident.title} -> ${assignedUnits.length} unit(s)`);
        io.emit("incident:updated", incident);
        emitIncidentSync(io);

        if (callback) callback({ success: true, incident });

        opts.logAction({
          type: "incident:assign",
          user: user.name,
          timestamp: Date.now(),
          details: { incidentId: incident.id, units: assignedUnits },
        });
      }
    );

    // Dispatch-wide broadcast; restricted to dispatch station.
    socket.on(
      "dispatch:broadcast",
      (
        data: { content: string; priority?: "priority" | "emergency" },
        callback?: (response: unknown) => void
      ) => {
        const user = users.get(socket.id);
        if (!user) {
          if (callback) callback({ success: false, error: "Not authenticated" });
          return;
        }

        if (!isDispatch(user)) {
          if (callback) callback({ success: false, error: "Dispatch role required" });
          return;
        }

        const alert: DispatchAlert = {
          id: generateId(),
          content: data.content,
          priority: data.priority || "emergency",
          userName: user.name,
          station: user.station,
          timestamp: Date.now(),
        };

        dispatchAlerts.push(alert);
        if (dispatchAlerts.length > MAX_ALERT_HISTORY) {
          dispatchAlerts.splice(0, dispatchAlerts.length - MAX_ALERT_HISTORY);
        }

        logger.warn(`Dispatch broadcast from ${user.name}: ${data.content.slice(0, 70)}`);
        io.emit("dispatch:broadcast", alert);

        if (callback) callback({ success: true, alert });

        opts.logAction({ type: "dispatch:broadcast", user: user.name, timestamp: Date.now() });
      }
    );

    // Request current incidents snapshot.
    socket.on("incidents:request", () => {
      socket.emit("incidents:sync", getAllIncidents());
    });

    // LAN discovery: respond with server info.
    socket.on("network:discover", (callback?: (response: unknown) => void) => {
      const info = getDiscoveryInfo();
      socket.emit("network:servers", [info]);
      if (callback) callback({ success: true, servers: [info] });
    });

    // Simple discovery ping for single host.
    socket.on("discovery:ping", (callback?: (response: unknown) => void) => {
      if (callback) {
        callback({ success: true, server: getDiscoveryInfo() });
      }
    });

    // Latency measurement callback.
    socket.on("ping:measure", (callback: (timestamp: number) => void) => {
      if (typeof callback === "function") {
        callback(Date.now());
      }
    });

    // Cleanup on disconnect.
    socket.on("disconnect", (reason: string) => {
      const user = users.get(socket.id);
      if (user) {
        logger.connection(`${user.name} disconnected (${reason})`);
        const station = user.station;
        users.delete(socket.id);
        emitUserUpdates(io, station);

        opts.logAction({ type: "user:disconnect", user: user.name, timestamp: Date.now(), details: { station } });
      } else {
        logger.connection(`Unknown client disconnected: ${socket.id}`);
      }
    });
  });
}
