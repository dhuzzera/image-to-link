import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { verifySupabaseToken } from "./supabaseAdmin";
import { rateLimit } from "../rateLimit";
import * as db from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  // Rate limiting for uploads
  const uploadRateLimit = rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: "Muitos uploads. Tente novamente em um minuto.",
  });

  // File upload endpoint with Supabase auth
  app.post("/api/upload", uploadRateLimit, upload.single("file"), async (req, res) => {
    try {
      // Authenticate via Supabase token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const token = authHeader.slice(7);
      const supabaseUser = await verifySupabaseToken(token);
      if (!supabaseUser) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // Get or create user in our DB
      await db.upsertUser({
        openId: supabaseUser.id,
        email: supabaseUser.email ?? null,
        name: supabaseUser.user_metadata?.name ?? supabaseUser.email ?? null,
        lastSignedIn: new Date(),
      });
      const dbUser = await db.getUserByOpenId(supabaseUser.id);
      if (!dbUser) {
        return res.status(500).json({ error: "Failed to get user" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Validate file type
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Tipo de arquivo não permitido." });
      }

      const { storagePut } = await import("../storage");
      const { createImage } = await import("../db");

      const fileKey = `images/${dbUser.id}/${Date.now()}-${req.file.originalname}`;
      const { key, url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

      await createImage({
        userId: dbUser.id,
        fileKey: key,
        url,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      });

      res.json({ url, fileKey: key });
    } catch (error: any) {
      console.error("[Upload] Error:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
