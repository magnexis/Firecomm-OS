# Architecture

## Overview
FireComm OS uses a real-time event-driven architecture:
- Frontend (React) renders chat, incidents, map, and dispatch surfaces.
- Socket layer (Socket.IO) delivers bi-directional events for chat, incidents, units, and dispatch alerts.
- Backend (Express + Socket.IO) orchestrates rooms per station, incident state, and broadcast logic.

## Data Flow
1. Client connects to Socket.IO and joins a station room.
2. Chat messages (`message:send`) stay within the station unless marked emergency (broadcast to all).
3. Incidents are created/updated server-side and broadcast to all clients for sync.
4. Unit status updates propagate to all clients and are reflected in incident timelines.
5. Dispatch broadcasts are sent to all stations with audio/visual prominence.

## Event System
- Room model: each station is a room; global broadcasts use `io.emit`.
- Timeline model: incident timeline entries append on status/assignment changes.
- Latency/ping: `ping:measure` round-trip per client.

## Components
- **frontend/src/hooks/useSocket.ts**: event wiring, queues, incident/unit state.
- **frontend/src/features/**: incident panel, map, dispatch console.
- **backend/server/socket.ts**: authoritative event handlers and in-memory stores.

## Diagram (described)
- React UI ⇄ Socket.IO Client ⇄ Socket.IO Server ⇄ In-memory stores (users, incidents, timelines)
- Express REST (health) runs alongside Socket.IO on the same port.
- Map layer consumes incident locations (hashed-from-address fallback) and station presets.
