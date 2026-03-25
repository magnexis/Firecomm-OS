# Socket Events

All events are emitted over Socket.IO. Times are ISO strings unless noted.

## message:send
- Payload: `{ content: string, priority: "normal" | "priority" | "emergency" }`
- Behavior: Broadcasts to sender's station; emergency also emits `message:emergency` globally. Stored in station history with read receipts.

## incident:create
- Payload: `{ title, address, priority: "low"|"medium"|"high"|"critical", notes?: string, unitsAssigned?: string[], sourceMessageId?: string, sourceMessagePreview?: string }`
- Behavior: Creates incident, seeds timeline, optional message link, emits `incident:created` and `incidents:sync` to all clients.

## unit:status
- Payload: `{ status: "available"|"enroute"|"on-scene"|"out-of-service", incidentId?: string, unitId?: string }`
- Behavior: Updates unit status (dispatch can target another unit with `unitId`), emits `units:update`; if `incidentId`, appends timeline entry and emits `incident:updated`.

## unit:location:update
- Payload: `{ unitId: string, lat: number, lng: number, heading?: number, speedKts?: number }`
- Behavior: (Planned) Pushes live GPS for map layers; clients update unit markers; should be throttled client-side.

## drone:update
- Payload: `{ droneId: string, status: "idle"|"enroute"|"on-mission", lat: number, lng: number, battery: number }`
- Behavior: (Planned) Updates drone telemetry for map/mission board; dispatch can broadcast assignments.

## ai:incident:suggest
- Payload: `{ messageId?: string, summary: string, confidence: number, suggestedPriority: "low"|"medium"|"high"|"critical" }`
- Behavior: (Planned) AI suggests incident creation from chat; UI can render one-click “Create Incident” with suggested values.

## 911:incoming
- Payload: `{ caller: string, phone: string, location: string, notes?: string, recordingUrl?: string }`
- Behavior: (Planned) Creates a high-priority notification and prefilled incident draft for dispatch.

## dispatch:broadcast
- Payload: `{ content: string, priority?: "priority" | "emergency" }`
- Behavior: Dispatch-only; emits alert to all clients with audio/visual banner; logged in alert history.

## network:discover
- Payload: none
- Behavior: Client asks server to enumerate itself; server replies `network:servers` with `{ hostname, localIPs, port, activeUsers, activeIncidents }`.

## ping:measure
- Payload: callback only
- Behavior: RTT measurement for latency display.
