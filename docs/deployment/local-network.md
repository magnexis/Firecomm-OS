# Local Network Deployment

## Host Setup
1. Choose a machine on the LAN; ensure a stable IP (static or DHCP reservation).
2. Open firewall for TCP 3001 (backend) and 5173 (if serving frontend from same host).
3. Run backend: `cd backend && npm run dev` (or `npm run start` after build).
4. Note printed LAN IPs (e.g., http://192.168.1.50:3001).

## Client Connection
- Open frontend (served locally or from host) at http://<host>:5173.
- In connection bar, enter `<host-ip>:3001` and click Connect.
- Verify latency indicator and online user list update.

## Tips
- Keep all devices on same subnet; avoid guest networks with client isolation.
- Disable VPN/split tunneling that blocks local subnets.
- For Wi-Fi, prefer 5GHz for lower latency; wired is best.
- If using tablets/phones, ensure browser allows autoplay for alert sounds.

## Troubleshooting LAN
- Ping host IP from client.
- Check firewall logs for blocked 3001/5173.
- If captive portal, reconnect to trusted SSID.
- Validate Socket.IO upgrade: watch browser devtools for websocket upgrade success.
