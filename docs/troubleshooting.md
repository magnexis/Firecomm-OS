# Troubleshooting

## Cannot Connect
- Verify backend is reachable: `curl http://<host>:3001/api/health`
- Check firewall for TCP 3001/5173.
- Confirm clients are on same subnet; guest networks often block peer traffic.

## No WebSocket Upgrade
- Check browser console for Socket.IO upgrade errors.
- Ensure reverse proxy preserves `Upgrade` and `Connection` headers.

## Audio Alerts Not Playing
- Browser may block autoplay; interact with page once to unlock audio context.

## Messages Not Syncing
- Ensure the correct station is selected on all clients.
- Check server logs for disconnect/reconnect churn.

## High Latency
- Prefer wired or 5GHz Wi-Fi; minimize VPN usage.
- Watch latency indicator; >150ms suggests network issues.
