import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import connectPgSimple from "connect-pg-simple";
import MemoryStore from "memorystore";
import type { User } from "@shared/schema";

const _PgSession = connectPgSimple(session);
const MemoryStoreSession = MemoryStore(session);

const app = express();

// Trust proxy for rate limiting to work correctly in deployment
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
        imgSrc: ["'self'", "_data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "ws:", "wss:", "https://api.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      },
    },
  })
);

// Rate limiting - increased for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increase limit for development
  message: { error: "Too many requests from this IP, please try again later." },
});
app.use(limiter);

// Auth-specific rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit auth attempts
  message: { error: "Too many authentication attempts, please try again later." },
});
app.use("/auth", authLimiter);

// Session configuration - simplified for debugging
app.use(
  session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000,
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: true, // Change to true to force session save
    saveUninitialized: true,
    name: "sessionId", // Use simpler name
    cookie: {
      secure: false, // Try false first to eliminate HTTPS issues
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: false, // Disable SameSite completely
    },
  })
);

// CORS configuration for credentials
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Extend Request type for session user
declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

declare module "express" {
  interface Request {
    user?: User;
    userId?: string;
  }
}

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth")) {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Additional session error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err && err.message && err.message.includes("session")) {
    console.error("Session middleware error:", err);
    // Continue without session in case of database connection error
    return next();
  }
  next(err);
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const status = ('status' in err ? (err as { status: number }).status : undefined) || 
                   ('statusCode' in err ? (err as { statusCode: number }).statusCode : undefined) || 
                   500;
    const message = err.message || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    console.error("Error handled:", err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Serve static files from React build
    app.use(express.static(path.join(__dirname, "../client/dist")));

    // Handle React routing, return index.html for all non-API routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
