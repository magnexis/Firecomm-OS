# FireComm OS

![Build](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Status](https://img.shields.io/badge/status-Phase%204%2B%20Elite-orange) ![Socket.IO](https://img.shields.io/badge/realtime-Socket.IO-black) ![Map](https://img.shields.io/badge/map-Leaflet-1f7a1f)

## Overview
FireComm OS is a LAN-first emergency dispatch and situational awareness platform combining real-time chat, incident command, mapping, and unit tracking. It runs fully on local networks (offline capable) with optional desktop packaging via Tauri.

## Features
- Real-time station chat with priority/emergency alerts
- Incident management with assignments, timelines, and map pins
- Dispatch broadcasts and connection monitoring
- Map view with station/incident markers (Leaflet)
- Unit status tracking (available/enroute/on-scene/out-of-service)
- Offline-queue messaging and latency monitoring

## Screenshots
*(Placeholder)* Add screenshots of the 3-column command UI, incident panel, and map view.

## Tech Stack
- Frontend: React, TypeScript, Vite, Tailwind, Socket.IO Client, Leaflet
- Backend: Node.js, Express, Socket.IO
- Desktop: Tauri (optional)

## Installation
```bash
cd backend && npm install
cd ../frontend && npm install
```

## Running Locally
Backend:
```bash
cd backend
npm run dev
```
Frontend:
```bash
cd frontend
npm run dev
```
Open http://localhost:5173 and connect to the backend server IP:port (default 3001).

## LAN Setup Guide
1) Run backend on a host reachable over LAN (binds 0.0.0.0:3001).  
2) Note the host IP printed at startup (e.g., 192.168.1.50:3001).  
3) On each client, open the frontend, enter the host IP in the connection panel, and connect.  
4) Ensure firewall allows TCP 3001 (backend) and 5173 (if serving frontend from host).  
5) Keep all devices on the same subnet; disable captive portals/VPN split blocks.

## Project Structure
- `frontend/` React UI
- `backend/` Express + Socket.IO server
- `src-tauri/` Desktop packaging (optional)
- `docs/` Full documentation set (API, features, deployment, testing)
- `scripts/` Dev helpers (setup, dev-start, build)
- `.github/` Issue/PR templates

## Roadmap
- Phase 1: Core chat + stations + presence (done)
- Phase 2: Incidents, map, dispatch alerts, unit status (done)
- Phase 3: Documentation system, testing guidance, enterprise policies (this release)

## Contributing
See `CONTRIBUTING.md` for branching, commits, and PR guidelines.

## License
See `LICENSE` (MIT recommended).
