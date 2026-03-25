# Testing

## Multi-client Simulation
- Open three browser tabs: Station 1, Station 2, Dispatch.
- Connect all to same backend IP.
- Send messages and verify delivery per-station; emergency messages should appear everywhere.

## LAN Connection
- Disconnect network cable on one client to confirm reconnect warning and offline queue.
- Measure latency indicator; compare to ping for accuracy.

## Incident Simulation
- Create an incident from Dispatch; confirm it appears on all tabs.
- Assign units; verify timeline updates and map marker appears.
- Change status to contained/resolved and ensure UI updates.

## 911 Calls (Planned)
- Simulate `911:incoming` event via Socket.IO client; verify high-priority notification behavior.

## Drone/GPS (Planned)
- Emit `unit:location:update` and `drone:update` events to ensure map markers move and telemetry displays.
