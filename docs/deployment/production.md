# Production Deployment (Outline)
- Build backend: `cd backend && npm run build`
- Serve backend with process manager (pm2/systemd) on port 3001 behind a reverse proxy (nginx) if desired.
- Build frontend: `cd frontend && npm run build`; serve `dist/` via static server (nginx) or `vite preview` during staging.
- TLS: terminate at reverse proxy; ensure websockets proxied (`upgrade` headers) for Socket.IO.
- Observability: enable access logs on proxy; add health checks to `/api/health`.
- Backups: persist configuration and any future database storage (current state is in-memory).
