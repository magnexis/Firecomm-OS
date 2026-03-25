# REST API

## Health
`GET /api/health`
- Response: `{ status: "ok", uptime: number, timestamp: string, localIPs: string[] }`

## Network Info
`GET /api/network-info`
- Response: `{ hostname: string, localIPs: string[], platform: string }`

## Users (planned)
`GET /api/users`
- Returns list of connected users (id, name, station, status).

## Incidents (planned)
`POST /api/incidents`
- Body: `{ title, address, priority, notes?, unitsAssigned? }`
- Creates an incident and emits socket updates.
