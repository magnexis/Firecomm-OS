import { useState, useEffect, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import CryptoJS from "crypto-js";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import {
  playDisconnectWarning,
  playEmergencyAlert,
  playMessageSound,
  playPriorityTone,
} from "../services/audio";
import type {
  ConnectionStatus,
  DispatchAlert,
  DiscoveryServerInfo,
  Incident,
  IncidentPriority,
  IncidentStatus,
  Message,
  TypingEvent,
  UnitStatus,
  User,
} from "../types";

interface IncidentCreatePayload {
  title: string;
  address: string;
  priority: IncidentPriority;
  notes?: string;
  unitsAssigned?: string[];
  sourceMessageId?: string;
  sourceMessagePreview?: string;
}

interface IncidentUpdatePayload {
  incidentId: string;
  title?: string;
  address?: string;
  priority?: IncidentPriority;
  status?: IncidentStatus;
  notes?: string;
}

interface UseSocketReturn {
  messages: Message[];
  users: User[];
  allUsers: User[];
  incidents: Incident[];
  dispatchAlerts: DispatchAlert[];
  discoveredServers: DiscoveryServerInfo[];
  unitLocations: Record<string, { lat: number; lng: number; accuracy?: number; speed?: number; heading?: number; timestamp: number }>;
  drones: Array<{ id: string; lat: number; lng: number; altitude: number; battery: number; heading: number; speed: number; cameraFeedUrl?: string; signalStrength?: number; status: string; timestamp: number }>;
  typingUsers: string[];
  connectionStatus: ConnectionStatus;
  latency: number;
  connectionWarning: string | null;
  emergencyMessages: Message[];
  connect: (serverUrl: string, name: string, station: string, token: string) => void;
  disconnect: () => void;
  sendMessage: (content: string, priority: Message["priority"]) => void;
  switchStation: (station: string) => void;
  changeStatus: (status: UnitStatus, incidentId?: string) => void;
  createIncident: (payload: IncidentCreatePayload) => Promise<Incident | null>;
  updateIncident: (payload: IncidentUpdatePayload) => Promise<Incident | null>;
  assignIncidentUnits: (incidentId: string, unitIds: string[]) => Promise<Incident | null>;
  sendDispatchBroadcast: (content: string, priority?: "priority" | "emergency") => Promise<boolean>;
  sendUnitLocation: (update: { unitId: string; lat: number; lng: number; accuracy?: number; speed?: number; heading?: number }) => void;
  sendDroneCommand: (cmd: { id: string; type: string; lat?: number; lng?: number }) => void;
  scanNetwork: () => void;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: (messageId: string, station: string) => void;
  dismissEmergency: (messageId: string) => void;
  clearConnectionWarning: () => void;
}

function upsertIncident(current: Incident[], incident: Incident): Incident[] {
  const index = current.findIndex((entry) => entry.id === incident.id);
  if (index === -1) {
    return [incident, ...current].sort((a, b) => b.timestamp - a.timestamp);
  }

  const next = [...current];
  next[index] = incident;
  return next.sort((a, b) => b.timestamp - a.timestamp);
}

export function useSocket(): UseSocketReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dispatchAlerts, setDispatchAlerts] = useState<DispatchAlert[]>([]);
  const [discoveredServers, setDiscoveredServers] = useState<DiscoveryServerInfo[]>([]);
  const [unitLocations, setUnitLocations] = useState<Record<string, { lat: number; lng: number; accuracy?: number; speed?: number; heading?: number; timestamp: number }>>({});
  const [drones, setDrones] = useState<
    Array<{
      id: string;
      lat: number;
      lng: number;
      altitude: number;
      battery: number;
      heading: number;
      speed: number;
      cameraFeedUrl?: string;
      signalStrength?: number;
      status: string;
      timestamp: number;
    }>
  >([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [latency, setLatency] = useState(0);
  const [connectionWarning, setConnectionWarning] = useState<string | null>(null);
  const [emergencyMessages, setEmergencyMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const latencyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStationRef = useRef<string>("");
  const offlineQueueRef = useRef<{ content: string; priority: Message["priority"] }[]>([]);
  const manualDisconnectRef = useRef(false);
  const tokenRef = useRef<string>("");

  const getKey = useCallback(() => {
    if (!tokenRef.current) return "";
    return CryptoJS.SHA256(tokenRef.current).toString();
  }, []);

  const encryptContent = useCallback(
    (plain: string) => {
      const key = getKey();
      if (!key) return plain;
      return CryptoJS.AES.encrypt(plain, key).toString();
    },
    [getKey]
  );

  const decryptContent = useCallback(
    (cipher: string) => {
      const key = getKey();
      if (!key) return cipher;
      try {
        const bytes = CryptoJS.AES.decrypt(cipher, key);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        return text || cipher;
      } catch {
        return "[decryption failed]";
      }
    },
    [getKey]
  );

  const emitWithAck = useCallback(<TResponse,>(event: string, payload?: unknown): Promise<TResponse | null> => {
    return new Promise((resolve) => {
      const socket = getSocket();
      if (!socket?.connected) {
        resolve(null);
        return;
      }

      socket.emit(event, payload, (response: TResponse) => {
        resolve(response);
      });
    });
  }, []);

  const measureLatency = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) {
      const start = Date.now();
      socket.emit("ping:measure", () => {
        setLatency(Date.now() - start);
      });
    }
  }, []);

  const connect = useCallback((serverUrl: string, name: string, station: string, token: string) => {
    setConnectionStatus("connecting");
    currentStationRef.current = station;
    manualDisconnectRef.current = false;
    tokenRef.current = token;

    const socket = connectSocket(serverUrl, token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("connected");
      setConnectionWarning(null);
      socket.emit("user:join", { name, station });
      socket.emit("incidents:request");
      socket.emit("network:discover");

      offlineQueueRef.current.forEach((msg) => {
        socket.emit("message:send", msg);
      });
      offlineQueueRef.current = [];
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
      if (!manualDisconnectRef.current) {
        playDisconnectWarning();
        setConnectionWarning("Connection to server lost. Attempting reconnect...");
      }
    });

    socket.on("connect_error", () => {
      setConnectionStatus("disconnected");
      setConnectionWarning("Unable to connect to server. Check IP and network status.");
    });

    socket.on("message:history", (history: Message[]) => {
      setMessages(history.map((msg) => ({ ...msg, content: decryptContent(msg.content) })));
    });

    socket.on("message:receive", (message: Message) => {
      const decrypted = { ...message, content: decryptContent(message.content) };
      setMessages((prev) => [...prev, decrypted]);
      if (message.priority === "emergency") {
        playEmergencyAlert();
        setEmergencyMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, decrypted];
        });
      } else if (message.priority === "priority") {
        playPriorityTone();
      } else if (message.userId !== socket.id) {
        playMessageSound();
      }
    });

    socket.on("message:emergency", (message: Message) => {
      playEmergencyAlert();
      const decrypted = { ...message, content: decryptContent(message.content) };
      setEmergencyMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, decrypted];
      });
    });

    socket.on("message:read-update", (data: { messageId: string; readBy: string[] }) => {
      setMessages((prev) => prev.map((msg) => (msg.id === data.messageId ? { ...msg, readBy: data.readBy } : msg)));
    });

    socket.on("users:update", (stationUsers: User[]) => {
      setUsers(stationUsers);
    });

    socket.on("users:all", (all: User[]) => {
      setAllUsers(all);
      setUsers(all.filter((u) => u.station === currentStationRef.current));
    });

    socket.on("units:update", (all: User[]) => {
      setAllUsers(all);
      setUsers(all.filter((u) => u.station === currentStationRef.current));
    });

    socket.on("typing:update", (event: TypingEvent) => {
      if (event.station === currentStationRef.current) {
        setTypingUsers((prev) => {
          if (event.isTyping) {
            return prev.includes(event.userName) ? prev : [...prev, event.userName];
          }
          return prev.filter((nameEntry) => nameEntry !== event.userName);
        });
      }
    });

    socket.on("incidents:sync", (incoming: Incident[]) => {
      setIncidents(incoming.sort((a, b) => b.timestamp - a.timestamp));
    });

    socket.on("incident:created", (incident: Incident) => {
      setIncidents((prev) => upsertIncident(prev, incident));
      playPriorityTone();
    });

    socket.on("incident:updated", (incident: Incident) => {
      setIncidents((prev) => upsertIncident(prev, incident));
    });

    socket.on("dispatch:history", (alerts: DispatchAlert[]) => {
      setDispatchAlerts(alerts);
    });

    socket.on("dispatch:broadcast", (alert: DispatchAlert) => {
      playEmergencyAlert();
      setDispatchAlerts((prev) => [...prev.slice(-10), alert]);
    });

    socket.on("network:servers", (servers: DiscoveryServerInfo[]) => {
      setDiscoveredServers(servers);
    });
  }, []);

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    disconnectSocket();
    socketRef.current = null;
    setConnectionStatus("disconnected");
    setMessages([]);
    setUsers([]);
    setTypingUsers([]);
    tokenRef.current = "";
  }, []);

  const sendMessage = useCallback((content: string, priority: Message["priority"]) => {
    const socket = getSocket();
    const encrypted = encryptContent(content);
    if (socket?.connected) {
      socket.emit("message:send", { content: encrypted, priority });
    } else {
      offlineQueueRef.current.push({ content: encrypted, priority });
    }
  }, [encryptContent]);

  const switchStation = useCallback(
    (station: string) => {
      const socket = getSocket();
      currentStationRef.current = station;
      setMessages([]);
      setTypingUsers([]);
      setUsers(allUsers.filter((user) => user.station === station));
      if (socket?.connected) {
        socket.emit("station:switch", { station });
      }
    },
    [allUsers]
  );

  const changeStatus = useCallback((status: UnitStatus, incidentId?: string) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("unit:status", { status, incidentId });
    }
  }, []);

  const createIncident = useCallback(
    async (payload: IncidentCreatePayload): Promise<Incident | null> => {
      const response = await emitWithAck<{ success: boolean; incident?: Incident }>("incident:create", payload);
      if (response?.success && response.incident) {
        setIncidents((prev) => upsertIncident(prev, response.incident as Incident));
        return response.incident;
      }
      return null;
    },
    [emitWithAck]
  );

  const updateIncident = useCallback(
    async (payload: IncidentUpdatePayload): Promise<Incident | null> => {
      const response = await emitWithAck<{ success: boolean; incident?: Incident }>("incident:update", payload);
      if (response?.success && response.incident) {
        setIncidents((prev) => upsertIncident(prev, response.incident as Incident));
        return response.incident;
      }
      return null;
    },
    [emitWithAck]
  );

  const assignIncidentUnits = useCallback(
    async (incidentId: string, unitIds: string[]): Promise<Incident | null> => {
      const response = await emitWithAck<{ success: boolean; incident?: Incident }>("incident:assign", {
        incidentId,
        unitsAssigned: unitIds,
      });

      if (response?.success && response.incident) {
        setIncidents((prev) => upsertIncident(prev, response.incident as Incident));
        return response.incident;
      }
      return null;
    },
    [emitWithAck]
  );

  const sendDispatchBroadcast = useCallback(
    async (content: string, priority: "priority" | "emergency" = "emergency"): Promise<boolean> => {
      const response = await emitWithAck<{ success: boolean }>("dispatch:broadcast", {
        content,
        priority,
      });
      return Boolean(response?.success);
    },
    [emitWithAck]
  );

  const scanNetwork = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("network:discover");
    }
  }, []);

  const startTyping = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("typing:start");
    }
  }, []);

  const stopTyping = useCallback(() => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("typing:stop");
    }
  }, []);

  const markAsRead = useCallback((messageId: string, station: string) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("message:read", { messageId, station });
    }
  }, []);

  const dismissEmergency = useCallback((messageId: string) => {
    setEmergencyMessages((prev) => prev.filter((entry) => entry.id !== messageId));
  }, []);

  const clearConnectionWarning = useCallback(() => {
    setConnectionWarning(null);
  }, []);

  const sendUnitLocation = useCallback(
    (update: { unitId: string; lat: number; lng: number; accuracy?: number; speed?: number; heading?: number }) => {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("unit:location:update", update);
      }
    },
    []
  );

  const sendDroneCommand = useCallback(
    (cmd: { id: string; type: string; lat?: number; lng?: number }) => {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("drone:command", cmd);
      }
    },
    []
  );

  useEffect(() => {
    if (connectionStatus === "connected") {
      measureLatency();
      latencyIntervalRef.current = setInterval(measureLatency, 5000);
    }

    return () => {
      if (latencyIntervalRef.current) {
        clearInterval(latencyIntervalRef.current);
      }
    };
  }, [connectionStatus, measureLatency]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return {
    messages,
    users,
    allUsers,
    incidents,
    dispatchAlerts,
    discoveredServers,
    unitLocations,
    drones,
    typingUsers,
    connectionStatus,
    latency,
    connectionWarning,
    emergencyMessages,
    connect,
    disconnect,
    sendMessage,
    switchStation,
    changeStatus,
    createIncident,
    updateIncident,
    assignIncidentUnits,
    sendDispatchBroadcast,
    sendUnitLocation,
    sendDroneCommand,
    scanNetwork,
    startTyping,
    stopTyping,
    markAsRead,
    dismissEmergency,
    clearConnectionWarning,
  };
}
