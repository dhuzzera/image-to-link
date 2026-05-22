import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import { rateLimit } from "../rateLimit";

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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Add multipart form data middleware for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 50 * 1024 * 1024 } 
  });
  
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // HTTP endpoint for file upload with proper authentication
  const uploadRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // max 10 uploads per minute
    message: "Muitos uploads. Tente novamente em um minuto.",
  });

  app.post("/api/upload", uploadRateLimit, upload.single("file"), async (req, res) => {
    try {
      // Authenticate the request using session cookie
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Validate file type
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Tipo de arquivo não permitido. Use JPEG, PNG, GIF, WebP ou SVG." });
      }

      const { storagePut } = await import("../storage");
      const { createImage } = await import("../db");
      
      const fileKey = `images/${user.id}/${Date.now()}-${req.file.originalname}`;
      const { key, url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

      // Store the permanent proxy URL (not a signed URL that expires)
      await createImage({
        userId: user.id,
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
  // development mode uses Vite, production mode uses static files
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
