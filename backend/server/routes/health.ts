import { Router, Request, Response } from "express";
import os from "os";

const router = Router();

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

router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    localIPs: getLocalIPs(),
  });
});

router.get("/network-info", (_req: Request, res: Response) => {
  res.json({
    hostname: os.hostname(),
    localIPs: getLocalIPs(),
    platform: os.platform(),
  });
});

export default router;
