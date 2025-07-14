import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { setupMovieRoutes } from "./api/movie";
import { setupAdminRoutes } from "./api/admin";
import { setupCommentRoutes } from "./api/comment";
import { setupNotificationRoutes } from "./api/notification";
import { setupUserRoutes } from "./api/user";

import { setupVideoRoutes } from "./api/video";
import { setupCacheManagementRoutes } from "./api/cache-management";
import { setupActorRoutes } from "./api/actors";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  await setupAuth(app);
  
  // Setup API routes
  setupMovieRoutes(app);
  setupAdminRoutes(app);
  setupCommentRoutes(app);
  setupNotificationRoutes(app);
  setupUserRoutes(app);

  setupVideoRoutes(app);
  setupCacheManagementRoutes(app);
  setupActorRoutes(app);
  
  // Tính năng chuỗi xem phim đã bị gỡ bỏ
  
  // Add route to check server status
  app.get("/api/status", (_req, res) => {
    res.json({
      status: "ok",
      message: "PhimXuyenDem API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Health check endpoint for offline detection
  app.head("/api/health", (_req, res) => {
    res.status(200).end();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: Date.now() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
