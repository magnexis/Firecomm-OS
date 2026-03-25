import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import os from "os";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import healthRoutes from "./routes/health";
import { setupSocket } from "./socket";
import { logger } from "./utils/logger";

const PORT = parseInt(process.env.PORT || "3001", 10);
const JWT_SECRET = process.env.JWT_SECRET || "firecomm-secret";
const DEVICE_TOKENS = (process.env.DEVICE_TOKENS || "").split(",").filter(Boolean);
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 5000,
  pingTimeout: 10000,
});

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory stores
let settings: Record<string, unknown> = { notifications: true, policies: {} };
const actionLogs: Array<{ type: string; user: string; timestamp: number; details?: unknown }> = [];
const userAccounts: Array<{ name: string; station: string; role: string; passwordHash: string }> = [];
const emailCodes: Map<string, { code: string; expiresAt: number }> = new Map();

function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { name: string; station: string; role: string };
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// Routes
app.use("/api", healthRoutes);

app.post("/api/request-code", (req, res) => {
  const { email } = req.body || {};
  if (!email || !email.endsWith(".gov")) {
    return res.status(400).json({ error: "Valid .gov email required" });
  }
  const code = crypto.randomInt(100000, 999999).toString();
  emailCodes.set(email.toLowerCase(), { code, expiresAt: Date.now() + 10 * 60 * 1000 });
  logger.info(`Verification code for ${email}: ${code} (dev preview; send via SMTP in production)`);
  res.json({ success: true });
});

app.post("/api/verify-code", (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ error: "email and code required" });
  const entry = emailCodes.get(email.toLowerCase());
  if (!entry || entry.code !== code || entry.expiresAt < Date.now()) {
    return res.status(401).json({ error: "Invalid or expired code" });
  }
  res.json({ verified: true });
});

app.post("/api/users", async (req, res) => {
  const { name, station, password, role, email, code } = req.body || {};
  if (!name || !station || !password || !email || !code) {
    return res.status(400).json({ error: "name, station, password, email, code required" });
  }
  if (!email.endsWith(".gov")) {
    return res.status(400).json({ error: ".gov email required" });
  }
  const entry = emailCodes.get(email.toLowerCase());
  if (!entry || entry.code !== code || entry.expiresAt < Date.now()) {
    return res.status(401).json({ error: "Invalid or expired email code" });
  }
  if (userAccounts.find((u) => u.name === name)) {
    return res.status(409).json({ error: "user already exists" });
  }
  const derivedRole = role || (station === "dispatch" ? "dispatch" : "station");
  const passwordHash = await bcrypt.hash(password, 10);
  userAccounts.push({ name, station, role: derivedRole, passwordHash });
  actionLogs.push({ type: "user:create", user: name, timestamp: Date.now(), details: { station, role: derivedRole } });
  res.json({ success: true });
});

app.post("/api/login", (req, res) => {
  const { name, station, password, email, code } = req.body || {};
  if (!name || !station || !password || !email || !code) {
    return res.status(400).json({ error: "name, station, password, email, code required" });
  }
  if (!email.endsWith(".gov")) {
    return res.status(400).json({ error: ".gov email required" });
  }

  const account = userAccounts.find((u) => u.name === name && u.station === station);
  if (!account) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!bcrypt.compareSync(password, account.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const entry = emailCodes.get(email.toLowerCase());
  if (!entry || entry.code !== code || entry.expiresAt < Date.now()) {
    return res.status(401).json({ error: "Email verification required" });
  }

  const token = jwt.sign({ name, station, role: account.role }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, role: account.role, station });
});

app.get("/api/settings", auth, (_req, res) => {
  res.json(settings);
});

app.post("/api/settings", auth, (req, res) => {
  settings = { ...settings, ...req.body };
  actionLogs.push({ type: "settings:update", user: (req as any).user.name, timestamp: Date.now() });
  res.json(settings);
});

app.get("/api/logs", auth, (_req, res) => {
  res.json(actionLogs.slice(-500));
});

// Setup Socket.IO
setupSocket(io, {
  jwtSecret: JWT_SECRET,
  logAction: (entry) => actionLogs.push(entry),
  getSettings: () => settings,
  deviceTokens: new Set(DEVICE_TOKENS),
});

// Get local IPs for display
function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

httpServer.listen(PORT, "0.0.0.0", () => {
  const ips = getLocalIPs();
  logger.info("═══════════════════════════════════════════");
  logger.info("  🚒 FireComm OS Server Running");
  logger.info(`  Port: ${PORT}`);
  logger.info("  Local addresses:");
  logger.info(`    http://localhost:${PORT}`);
  ips.forEach((ip) => {
    logger.info(`    http://${ip}:${PORT}`);
  });
  logger.info("  Share the IP above with other stations");
  logger.info("═══════════════════════════════════════════");
});
