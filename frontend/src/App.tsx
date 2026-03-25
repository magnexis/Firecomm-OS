import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { LoginScreen } from "./components/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useSocket } from "./hooks/useSocket";
import { CreateIncidentModal, type IncidentFormSeed } from "./features/incidents/CreateIncidentModal";
import { IncidentPanel } from "./features/incidents/IncidentPanel";
import type { IncidentStatus, Message, UnitStatus } from "./types";
import { useAppStore } from "./store/useAppStore";

function inferIncidentSeed(message: Message): IncidentFormSeed {
  const words = message.content.trim().split(/\s+/).slice(0, 6).join(" ");
  const title = words.length > 0 ? words : "New Field Report";
  return {
    title: title.length > 34 ? `${title.slice(0, 34)}...` : title,
    address: "",
    priority: message.priority === "emergency" ? "critical" : message.priority === "priority" ? "high" : "medium",
    notes: `Converted from chat report by ${message.userName} (${message.station})`,
    sourceMessageId: message.id,
    sourceMessagePreview: message.content,
  };
}

const App: React.FC = () => {
  const [savedName, setSavedName] = useLocalStorage("firecomm-name", "");
  const [savedStation, setSavedStation] = useLocalStorage("firecomm-station", "station-1");
  const [savedServer, setSavedServer] = useLocalStorage("firecomm-server", "localhost:3001");
  const [savedToken, setSavedToken] = useLocalStorage("firecomm-token", "");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStation, setCurrentStation] = useState(savedStation);
  const [userStatus, setUserStatus] = useState<UnitStatus>("available");
  const [serverUrl, setServerUrl] = useState(savedServer);
  const [userName, setUserName] = useState(savedName);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [userPassword, setUserPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [incidentSeed, setIncidentSeed] = useState<IncidentFormSeed | null>(null);

  const {
    messages,
    users,
    allUsers,
    incidents,
    dispatchAlerts,
    discoveredServers,
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
    scanNetwork,
    startTyping,
    stopTyping,
    markAsRead,
    dismissEmergency,
    clearConnectionWarning,
  } = useSocket();
  const setAuth = useAppStore((state) => state.setAuth);
  const clearAuth = useAppStore((state) => state.clearAuth);
  const setSettings = useAppStore((state) => state.setSettings);

  const isDispatch = currentStation === "dispatch";

  const currentUserId = useMemo(() => {
    if (connectionStatus !== "connected") return "";
    const match = allUsers.find((user) => user.name === userName && user.station === currentStation);
    return match?.id || "";
  }, [allUsers, connectionStatus, userName, currentStation]);

  useEffect(() => {
    if (incidents.length === 0) {
      setSelectedIncidentId(null);
      return;
    }

    const stillExists = incidents.some((incident) => incident.id === selectedIncidentId);
    if (!selectedIncidentId || !stillExists) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents, selectedIncidentId]);

  const handleLogin = useCallback(
    (name: string, station: string, password: string, emailAddr: string, codeVal: string) => {
      setUserName(name);
      setSavedName(name);
      setCurrentStation(station);
      setSavedStation(station);
      setUserPassword(password);
      setEmail(emailAddr);
      setEmailCode(codeVal);
      setIsLoggedIn(true);
    },
    [setSavedName, setSavedStation]
  );

  const handleSignup = useCallback(
    async (name: string, station: string, password: string, email: string, code: string) => {
      const normalized = serverUrl.startsWith("http") ? serverUrl : `http://${serverUrl}`;
      await fetch(`${normalized.replace(/\/$/, "")}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, station, password, email, code }),
      });
      handleLogin(name, station, password, email, code);
    },
    [handleLogin, serverUrl]
  );

  const handleConnect = useCallback(
    async (url: string) => {
      const normalized = url.startsWith("http") ? url : `http://${url}`;
      setServerUrl(normalized);
      setSavedServer(normalized.replace(/^https?:\/\//, ""));

      const loginRes = await fetch(`${normalized.replace(/\/$/, "")}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, station: currentStation, password: userPassword }),
      });
      if (!loginRes.ok) {
        clearAuth();
        return;
      }
      const loginData = await loginRes.json();
      setAuth(loginData.token, loginData.role);
      setSavedToken(loginData.token);

      try {
        const settingsRes = await fetch(`${normalized.replace(/\/$/, "")}/api/settings`, {
          headers: { Authorization: `Bearer ${loginData.token}` },
        });
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings(data);
        }
      } catch {
        // settings fetch best-effort
      }

      connect(normalized, userName, currentStation, loginData.token);
    },
    [clearAuth, connect, currentStation, setAuth, setSavedServer, setSavedToken, setSettings, userName]
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
    clearAuth();
  }, [disconnect]);

  const handleSwitchStation = useCallback(
    (station: string) => {
      setCurrentStation(station);
      setSavedStation(station);
      switchStation(station);
    },
    [switchStation, setSavedStation]
  );

  const handleChangeStatus = useCallback(
    (status: UnitStatus) => {
      setUserStatus(status);
      changeStatus(status, selectedIncidentId || undefined);
    },
    [changeStatus, selectedIncidentId]
  );

  const handleSend = useCallback(
    (content: string, priority: "normal" | "priority" | "emergency") => {
      sendMessage(content, priority);
    },
    [sendMessage]
  );

  const handleOpenCreateIncident = useCallback((seed?: IncidentFormSeed) => {
    setIncidentSeed(seed || null);
    setIsCreateIncidentOpen(true);
  }, []);

  const handleCreateIncident = useCallback(
    async (payload: {
      title: string;
      address: string;
      priority: "low" | "medium" | "high" | "critical";
      notes: string;
      unitsAssigned: string[];
      sourceMessageId?: string;
      sourceMessagePreview?: string;
    }) => {
      const incident = await createIncident(payload);
      if (incident) {
        setSelectedIncidentId(incident.id);
      }
    },
    [createIncident]
  );

  const handleUpdateIncidentStatus = useCallback(
    async (incidentId: string, status: IncidentStatus) => {
      await updateIncident({ incidentId, status });
    },
    [updateIncident]
  );

  const handleAssignIncidentUnits = useCallback(
    async (incidentId: string, unitsAssigned: string[]) => {
      await assignIncidentUnits(incidentId, unitsAssigned);
    },
    [assignIncidentUnits]
  );

  const handleConvertToIncident = useCallback((message: Message) => {
    handleOpenCreateIncident(inferIncidentSeed(message));
  }, [handleOpenCreateIncident]);

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onSignup={handleSignup}
        onRequestCode={async (emailAddr: string) => {
          const normalized = serverUrl.startsWith("http") ? serverUrl : `http://${serverUrl}`;
          await fetch(`${normalized.replace(/\/$/, "")}/api/request-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailAddr }),
          });
        }}
        savedName={savedName}
        savedStation={savedStation}
      />
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-dark-950 text-white">
      <Sidebar
        currentStation={currentStation}
        allUsers={allUsers}
        activeIncidents={incidents.filter((incident) => incident.status !== "resolved").length}
        currentUser={{ name: userName, station: currentStation, status: userStatus }}
        onSwitchStation={handleSwitchStation}
        onChangeStatus={handleChangeStatus}
      />

      <ChatWindow
        messages={messages}
        currentStation={currentStation}
        currentUserId={currentUserId}
        users={users}
        typingUsers={typingUsers}
        connectionStatus={connectionStatus}
        latency={latency}
        serverUrl={serverUrl}
        emergencyMessages={emergencyMessages}
        dispatchAlerts={dispatchAlerts}
        connectionWarning={connectionWarning}
        canConvertToIncident={connectionStatus === "connected"}
        onSend={handleSend}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onScanNetwork={scanNetwork}
        onTypingStart={startTyping}
        onTypingStop={stopTyping}
        onMarkAsRead={markAsRead}
        onDismissEmergency={dismissEmergency}
        onConvertToIncident={handleConvertToIncident}
        onClearConnectionWarning={clearConnectionWarning}
      />

      <IncidentPanel
        incidents={incidents}
        selectedIncidentId={selectedIncidentId}
        allUsers={allUsers}
        isDispatch={isDispatch}
        dispatchAlerts={dispatchAlerts}
        discoveredServers={discoveredServers}
        onSelectIncident={setSelectedIncidentId}
        onCreateIncidentClick={() => handleOpenCreateIncident()}
        onUpdateIncidentStatus={handleUpdateIncidentStatus}
        onAssignUnits={handleAssignIncidentUnits}
        onBroadcast={sendDispatchBroadcast}
        onScanNetwork={scanNetwork}
      />

      <CreateIncidentModal
        open={isCreateIncidentOpen}
        onClose={() => setIsCreateIncidentOpen(false)}
        seed={incidentSeed}
        units={allUsers}
        onSubmit={handleCreateIncident}
      />
    </div>
  );
};

export default App;
