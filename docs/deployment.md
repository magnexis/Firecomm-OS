# Deployment Overview

## Environments
- **Local LAN**: rapid testing; no TLS; see `docs/deployment/local-network.md`.
- **Production**: reverse proxy + TLS; see `docs/deployment/production.md`.

## Quick Commands
```bash
cd backend && npm run build
cd ../frontend && npm run build
```
Serve backend with pm2/systemd; serve `frontend/dist` via nginx or similar. Ensure websockets are proxied with `Upgrade` and `Connection` headers.

## Configuration
- `PORT` (backend, default 3001)
- `JWT_SECRET` (backend auth)
- `DEVICE_TOKENS` (comma-separated hardware tokens for GPS/drone bridges)

## Health Checks
- `GET /api/health`
- `GET /api/network-info`

## Files to Note
- `docs/deployment/local-network.md`
- `docs/deployment/production.md`
