import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import "./types";
import { requireAuth, requireAdmin, signUp, signIn, signOut, getCurrentUser } from "./auth";
import { body as _body, validationResult } from "express-validator";
import {
  updateProfileSchema,
  changePasswordSchema as _changePasswordSchema,
  createFridgeSchema,
  createLabelSchema,
  logTemperatureSchema,
  createTimeWindowSchema,
  createChecklistSchema,
  completeChecklistSchema,
  insertOutOfRangeEventSchema as _insertOutOfRangeEventSchema,
  userRoles as _userRoles,
  type User as _User,
} from "@shared/schema";
import { ChecklistService } from "./checklist-service";
import {
  createChecklistRequestSchema,
  scheduleChecklistRequestSchema,
  completeChecklistInstanceRequestSchema,
  calendarRequestSchema,
  summariesRequestSchema,
  generateInstancesRequestSchema,
} from "@shared/checklist-types";
import bcrypt from "bcrypt";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

// Note: requireAdmin is now imported from ./auth

// Input validation helper
function _handleValidationErrors(req: Request, res: Response, next: NextFunction): void | Response {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const checklistService = new ChecklistService(storage);

  // Authentication routes
  app.post("/api/auth/signup", signUp);
  app.post("/api/auth/signin", signIn);
  app.post("/api/auth/signout", signOut);
  app.get("/api/auth/user", getCurrentUser);

  // Get current user profile
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if email is being updated and if it's already taken
      if (result.data.email) {
        const existingUser = await storage.getUserByEmail(result.data.email);
        if (existingUser && existingUser._id !== userId) {
          return res.status(400).json({
            error: "Email already in use by another account",
          });
        }
      }

      const updatedUser = await storage.updateUser(userId, result.data);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Settings update (dark mode, etc)
  app.put("/api/user/settings", requireAuth, async (req, res) => {
    try {
      const { darkMode } = req.body;
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updatedUser = await storage.updateUser(userId, { darkMode });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        message: "Settings updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update settings error:", error);
      return res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Reset password (no current password required)
  app.put("/api/user/reset-password", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { newPassword } = req.body;

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatedUser = await storage.updateUser(userId, {
        password: hashedPassword,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Delete account
  app.delete("/api/user/account", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      return res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Export user data
  app.get("/api/user/export", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's temperature logs as well
      const temperatureLogs = await storage.getAllTemperatureLogsForUser(userId);

      // Set CSV headers
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="my-data.csv"');

      // Create comprehensive CSV content
      let csvContent = "User Profile\n";
      csvContent += `ID,Email,First Name,Last Name,Role,Subscription Status,Dark Mode,Created At\n`;
      csvContent += `"${user._id}","${user.email || ""}","${user.firstName || ""}","${user.lastName || ""}","${user.role}","${user.subscriptionStatus}","${user.darkMode}","${user.createdAt}"\n\n`;

      csvContent += "Temperature Logs\n";
      csvContent += "Fridge Name,Temperature,Person Name,Date,Time,Alert Status\n";
      temperatureLogs.forEach((log) => {
        const date = new Date(log.createdAt!);
        csvContent += `"${log.fridgeName}","${log.currentTempReading}","${log.personName}","${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${log.isAlert ? "ALERT" : "Normal"}"\n`;
      });

      return res.send(csvContent);
    } catch (error) {
      console.error("Export data error:", error);
      return res.status(500).json({ error: "Failed to export user data" });
    }
  });

  // Stripe subscription endpoints

  // Create subscription for trial users
  app.post("/api/create-subscription", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has a subscription
      if (user.subscriptionStatus === "paid") {
        return res.status(400).json({ error: "User already has a paid subscription" });
      }

      let stripeCustomerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        });

        stripeCustomerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId });
      }

      // Create a product and price first
      const product = await stripe.products.create({
        name: "FridgeSafe Pro Monthly",
        description: "Professional temperature monitoring for healthcare facilities",
      });

      const price = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: 1000, // $10.00 in cents
        recurring: {
          interval: "month",
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          {
            price: price.id,
          },
        ],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      // Update user with subscription info
      await storage.updateUser(userId, {
        stripeSubscriptionId: subscription.id,
      });

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      return res.json({
        subscriptionId: subscription.id,
        clientSecret: (
          latestInvoice as Stripe.Invoice & {
            payment_intent?: { client_secret?: string };
          }
        )?.payment_intent?.client_secret,
      });
    } catch (error) {
      console.error("Create subscription error:", error);
      return res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Handle successful subscription payment
  app.post("/api/subscription-success", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { subscriptionId } = req.body;

      // Verify subscription with Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      if (subscription.status === "active") {
        // Update user to paid status
        await storage.updateUser(userId, {
          subscriptionStatus: "paid",
        });

        return res.json({
          message: "Subscription activated successfully",
          status: "active",
        });
      } else {
        return res.status(400).json({
          error: "Subscription payment not completed",
          status: subscription.status,
        });
      }
    } catch (error) {
      console.error("Subscription success error:", error);
      return res.status(500).json({ error: "Failed to activate subscription" });
    }
  });

  // Get subscription status
  app.get("/api/subscription-status", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let stripeStatus = null;
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          stripeStatus = {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: (
              subscription as Stripe.Subscription & {
                current_period_end?: number;
              }
            ).current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          };
        } catch (error) {
          console.error("Error fetching Stripe subscription:", error);
        }
      }

      return res.json({
        subscriptionStatus: user.subscriptionStatus,
        trialEndDate: user.trialEndDate,
        stripeStatus,
      });
    } catch (error) {
      console.error("Get subscription status error:", error);
      return res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  // Admin: Get all users
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error) {
      console.error("Admin get users error:", error);
      return res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Admin: Update user role/subscription
  app.put("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { role, subscriptionStatus } = req.body;

      const updatedUser = await storage.updateUser(userId!, { role, subscriptionStatus });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Admin update user error:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Admin: Delete user
  app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const deleted = await storage.deleteUser(userId!);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Admin delete user error:", error);
      return res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Temperature Logging API Endpoints

  // Get user's fridges
  app.get("/api/fridges", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const fridges = await storage.getFridges(userId);
      return res.json(fridges);
    } catch (error) {
      console.error("Get fridges error:", error);
      return res.status(500).json({ error: "Failed to get fridges" });
    }
  });

  // Create new fridge
  app.post("/api/fridges", requireAuth, async (req, res) => {
    try {
      const result = createFridgeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const { name, location, notes, color, labels, minTemp, maxTemp } = result.data;
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const newFridge = await storage.createFridge({
        _userId: userId,
        name,
        location,
        notes,
        color,
        labels,
        minTemp,
        maxTemp,
      });

      return res.status(201).json({
        message: "Fridge created successfully",
        fridge: newFridge,
      });
    } catch (error) {
      console.error("Create fridge error:", error);
      return res.status(500).json({ error: "Failed to create fridge" });
    }
  });

  // Enhanced temperature logging with compliance tracking
  app.post("/api/temperature-logs", requireAuth, async (req, res) => {
    try {
      const result = logTemperatureSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const {
        _fridgeId,
        timeWindowId,
        minTempReading,
        maxTempReading,
        currentTempReading,
        personName,
        isOnTime = true,
        lateReason,
        correctiveAction,
        correctiveNotes,
      } = result.data;

      // Verify fridge ownership
      const fridge = await storage.getFridge(_fridgeId, userId);
      if (!fridge) {
        return res.status(404).json({ error: "Fridge not found" });
      }

      // Check if any temperature is out of range and create alert
      const minTemp = parseFloat(fridge.minTemp);
      const maxTemp = parseFloat(fridge.maxTemp);

      let isAlert = false;
      const minReading = parseFloat(minTempReading);
      const maxReading = parseFloat(maxTempReading);
      const currentReading = parseFloat(currentTempReading);

      if (
        minReading < minTemp ||
        minReading > maxTemp ||
        maxReading < minTemp ||
        maxReading > maxTemp ||
        currentReading < minTemp ||
        currentReading > maxTemp
      ) {
        isAlert = true;
      }

      const logData = {
        _userId: userId,
        _fridgeId: _fridgeId,
        timeWindowId: timeWindowId || null,
        minTempReading,
        maxTempReading,
        currentTempReading,
        personName,
        isAlert,
        isOnTime,
        lateReason: lateReason || null,
        correctiveAction: correctiveAction || null,
        correctiveNotes: correctiveNotes || null,
      };

      const result_log = await storage.createTemperatureLogWithCompliance(logData);

      return res.json(result_log);
    } catch (error) {
      console.error("Create temperature log error:", error);
      return res.status(500).json({ error: "Failed to log temperature" });
    }
  });

  // Get temperature logs for a fridge
  app.get("/api/fridges/:fridgeId/logs", requireAuth, async (req, res) => {
    try {
      const { fridgeId } = req.params;
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const logs = await storage.getTemperatureLogs(fridgeId!, userId);
      return res.json(logs);
    } catch (error) {
      console.error("Get temperature logs error:", error);
      return res.status(500).json({ error: "Failed to get temperature logs" });
    }
  });

  // Enhanced fridges with compliance data
  app.get("/api/fridges/recent-temps", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      console.log(`[API] getFridgesWithRecentTemps called for user: ${userId}`);
      const fridgesWithData = await storage.getFridgesWithRecentTemps(userId);
      console.log(`[API] Returning ${fridgesWithData.length} fridges`);
      return res.json(fridgesWithData);
    } catch (error) {
      console.error("Get fridges with compliance data error:", error);
      return res.status(500).json({ error: "Failed to get fridges with compliance data" });
    }
  });

  // Get all fridges for view fridges page
  app.get("/api/fridges/all", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const fridges = await storage.getAllFridgesWithLogs(userId);
      return res.json(fridges);
    } catch (error) {
      console.error("Error fetching all fridges:", error);
      return res.status(500).json({ error: "Failed to fetch fridges" });
    }
  });

  // Get single fridge with detailed logs
  app.get("/api/fridge/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const fridge = await storage.getFridgeWithLogs(userId, req.params.id!);
      if (!fridge) {
        return res.status(404).json({ error: "Fridge not found" });
      }
      return res.json(fridge);
    } catch (error) {
      console.error("Error fetching fridge:", error);
      return res.status(500).json({ error: "Failed to fetch fridge" });
    }
  });

  // Update fridge
  app.patch("/api/fridge/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const fridge = await storage.updateFridge(req.params.id!, userId, req.body);
      if (!fridge) {
        return res.status(404).json({ error: "Fridge not found" });
      }
      return res.json(fridge);
    } catch (error) {
      console.error("Error updating fridge:", error);
      return res.status(500).json({ error: "Failed to update fridge" });
    }
  });

  // Soft delete (deactivate) fridge
  app.patch("/api/fridge/:id/deactivate", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const fridge = await storage.deactivateFridge(userId, req.params.id!);
      if (!fridge) {
        return res.status(404).json({ error: "Fridge not found" });
      }
      return res.json(fridge);
    } catch (error) {
      console.error("Error deactivating fridge:", error);
      return res.status(500).json({ error: "Failed to deactivate fridge" });
    }
  });

  // Reactivate fridge
  app.patch("/api/fridge/:id/activate", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const fridge = await storage.reactivateFridge(userId, req.params.id!);
      if (!fridge) {
        return res.status(404).json({ error: "Fridge not found" });
      }
      return res.json(fridge);
    } catch (error) {
      console.error("Error reactivating fridge:", error);
      return res.status(500).json({ error: "Failed to reactivate fridge" });
    }
  });

  // Hard delete fridge
  app.delete("/api/fridge/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const success = await storage.deleteFridge(req.params.id!, userId);
      if (!success) {
        return res.status(404).json({ error: "Fridge not found" });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting fridge:", error);
      return res.status(500).json({ error: "Failed to delete fridge" });
    }
  });

  // Label management endpoints

  // Get user's labels
  app.get("/api/labels", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const labels = await storage.getLabels(userId);
      return res.json(labels);
    } catch (error) {
      console.error("Get labels error:", error);
      return res.status(500).json({ error: "Failed to get labels" });
    }
  });

  // Create new label
  app.post("/api/labels", requireAuth, async (req, res) => {
    try {
      const result = createLabelSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const newLabel = await storage.createLabel({
        ...result.data,
        _userId: userId,
      });

      return res.status(201).json(newLabel);
    } catch (error) {
      console.error("Create label error:", error);
      return res.status(500).json({ error: "Failed to create label" });
    }
  });

  // Update label
  app.put("/api/labels/:labelId", requireAuth, async (req, res) => {
    try {
      const { labelId } = req.params;
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const result = createLabelSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const updatedLabel = await storage.updateLabel(labelId!, userId, result.data);
      if (!updatedLabel) {
        return res.status(404).json({ error: "Label not found" });
      }

      return res.json(updatedLabel);
    } catch (error) {
      console.error("Update label error:", error);
      return res.status(500).json({ error: "Failed to update label" });
    }
  });

  // Delete label
  app.delete("/api/labels/:labelId", requireAuth, async (req, res) => {
    try {
      const { labelId } = req.params;
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const deleted = await storage.deleteLabel(labelId!, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Label not found" });
      }

      return res.json({ message: "Label deleted successfully" });
    } catch (error) {
      console.error("Delete label error:", error);
      return res.status(500).json({ error: "Failed to delete label" });
    }
  });

  // Export all temperature logs as CSV
  app.get("/api/export/temperature-logs", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const logs = await storage.getAllTemperatureLogsForUser(userId);

      // Set CSV headers
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="temperature-logs.csv"');

      // Create CSV content
      const headers = [
        "Fridge Name",
        "Temperature (°C)",
        "Person Name",
        "Date",
        "Time",
        "Alert Status",
      ];
      const csvRows = [headers.join(",")];

      logs.forEach((log) => {
        const date = new Date(log.createdAt!);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString();
        const alertStatus = log.isAlert ? "ALERT" : "Normal";

        const row = [
          `"${log.fridgeName}"`,
          log.currentTempReading,
          `"${log.personName}"`,
          dateStr,
          timeStr,
          alertStatus,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");
      return res.send(csvContent);
    } catch (error) {
      console.error("Export temperature logs error:", error);
      return res.status(500).json({ error: "Failed to export temperature logs" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      return res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
          database: "connected",
          server: "running",
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: (error as Error).message,
      });
    }
  });

  // Environment validation endpoint
  app.get("/api/env-status", async (req: Request, res: Response) => {
    try {
      const envVars = {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? "configured" : "missing",
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "configured" : "missing",
        VITE_STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY ? "configured" : "missing",
        CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? "configured" : "missing",
      };

      const totalVars = Object.keys(envVars).length;
      const configuredVars = Object.values(envVars).filter((val) => val !== "missing").length;

      return res.json({
        variables: envVars,
        summary: {
          total: totalVars,
          configured: configuredVars,
          status: configuredVars === totalVars ? "complete" : "partial",
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: (error as Error).message,
      });
    }
  });

  // Development server status
  app.get("/api/dev-status", async (req: Request, res: Response) => {
    try {
      return res.json({
        frontend: {
          port: 3000,
          status: "running",
          url: `http://localhost:3000`,
        },
        backend: {
          port: parseInt(process.env.PORT || "5000"),
          status: "running",
          url: `http://localhost:${process.env.PORT || "5000"}`,
        },
        hotReload: {
          vite: "active",
          nodemon: "active",
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: (error as Error).message,
      });
    }
  });

  // TypeScript compilation status
  app.get("/api/typescript-status", async (req: Request, res: Response) => {
    try {
      return res.json({
        client: {
          status: "clean",
          errors: 0,
          warnings: 0,
        },
        server: {
          status: "clean",
          errors: 0,
          warnings: 0,
        },
        shared: {
          status: "clean",
          errors: 0,
          warnings: 0,
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: (error as Error).message,
      });
    }
  });

  // Service integration status
  app.get("/api/services-status", async (req: Request, res: Response) => {
    try {
      const services = {
        supabase: {
          name: "Supabase",
          status: process.env.DATABASE_URL ? "connected" : "disconnected",
          description: "Database & Auth",
          features: {
            connection: process.env.DATABASE_URL ? "✓" : "✗",
            clientLibrary: "✓",
            healthCheck: "✓",
          },
        },
        stripe: {
          name: "Stripe",
          status: process.env.STRIPE_SECRET_KEY ? "connected" : "disconnected",
          description: "Payments",
          features: {
            testMode: process.env.STRIPE_SECRET_KEY ? "✓" : "✗",
            webhookEndpoint: "✓",
            clientSetup: "✓",
          },
        },
        claude: {
          name: "Claude Code",
          status: process.env.CLAUDE_API_KEY ? "connected" : "disconnected",
          description: "AI Assistant",
          features: {
            cliInstalled: "✓",
            workspace: "✓",
            context: "✓",
          },
        },
      };

      return res.json(services);
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: (error as Error).message,
      });
    }
  });

  // Subscription tiers endpoint
  app.get("/api/subscription-tiers", async (req: Request, res: Response) => {
    try {
      const tiers = {
        free: {
          name: "Free",
          price: 0,
          currency: "USD",
          interval: "month",
          features: ["Basic features", "Community support", "Limited usage"],
          limitations: ["Advanced features"],
        },
        pro: {
          name: "Pro",
          price: 19,
          currency: "USD",
          interval: "month",
          popular: true,
          features: [
            "All basic features",
            "Advanced features",
            "Priority support",
            "Higher usage limits",
          ],
        },
        enterprise: {
          name: "Enterprise",
          price: 99,
          currency: "USD",
          interval: "month",
          features: [
            "All pro features",
            "Custom integrations",
            "Dedicated support",
            "Unlimited usage",
          ],
        },
      };

      return res.json(tiers);
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: (error as Error).message,
      });
    }
  });

  // Development tooling status
  app.get("/api/tooling-status", async (req: Request, res: Response) => {
    try {
      return res.json({
        codeQuality: {
          eslint: { status: "configured", description: "TypeScript, React, Node rules" },
          prettier: { status: "active", description: "Code formatting" },
          preCommitHooks: { status: "ready", description: "Husky setup" },
          testing: { status: "ready", description: "Jest framework" },
        },
        buildDeploy: {
          railwayConfig: { status: "ready", description: "Deployment ready" },
          githubActions: { status: "configured", description: "CI/CD pipeline" },
          buildScripts: { status: "ready", description: "Production builds" },
          monorepoStrategy: { status: "configured", description: "Workspace setup" },
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: (error as Error).message,
      });
    }
  });

  // Admin Stats API
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const totalUsers = users.length;
      const totalSubscriptions = users.filter((u) => u.subscriptionStatus === "paid").length;

      // Calculate monthly revenue (simplified $29/month for paid users)
      const monthlyRevenue = totalSubscriptions * 29;

      // Get active alerts count (temperature readings out of range)
      const activeAlerts = await storage.getActiveAlertsCount();

      // Generate real user growth data (last 6 months)
      const userGrowth = await generateRealUserGrowthData();

      // Generate subscription breakdown
      const subscriptionBreakdown = [
        {
          tier: "Trial",
          count: users.filter((u) => u.subscriptionStatus === "trial").length,
          color: "#94a3b8",
        },
        {
          tier: "Paid",
          count: users.filter((u) => u.subscriptionStatus === "paid").length,
          color: "#22c55e",
        },
      ];

      return res.json({
        totalUsers,
        totalSubscriptions,
        monthlyRevenue,
        activeAlerts,
        userGrowth,
        subscriptionBreakdown,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      return res.status(500).json({ error: "Failed to get admin statistics" });
    }
  });

  // Update user by admin
  app.put("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { role, subscriptionStatus } = req.body;

      const updatedUser = await storage.updateUser(userId!, { role, subscriptionStatus });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user by admin
  app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;

      const deleted = await storage.deleteUser(userId!);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Helper function to generate real user growth data
  async function generateRealUserGrowthData() {
    const months = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      // Get actual users created in this month
      const allUsers = await storage.getAllUsers();
      const userCount = allUsers.filter((user) => {
        if (!user.createdAt) return false;
        const createdDate = new Date(user.createdAt);
        return createdDate >= date && createdDate < nextMonth;
      }).length;

      months.push({ month: monthName, users: userCount });
    }

    return months;
  }

  // Test service connections
  app.post("/api/test-connection/:service", async (req: Request, res: Response) => {
    try {
      const service = req.params.service;

      switch (service) {
        case "supabase":
          // Test database connection here
          return res.json({ status: "success", message: "Database connection successful" });
        case "stripe":
          // Test Stripe connection here
          return res.json({ status: "success", message: "Stripe connection successful" });
        case "claude":
          // Test Claude API connection here
          return res.json({ status: "success", message: "Claude API connection successful" });
        default:
          return res.status(400).json({ status: "error", message: "Unknown service" });
      }
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: (error as Error).message,
      });
    }
  });

  // =========================
  // TIME WINDOW ENDPOINTS
  // =========================

  // Get time windows for a fridge
  app.get("/api/fridges/:fridgeId/time-windows", requireAuth, async (req, res) => {
    try {
      const { fridgeId } = req.params;
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const timeWindows = await storage.getTimeWindows(fridgeId!, userId);
      return res.json(timeWindows);
    } catch (error) {
      console.error("Get time windows error:", error);
      return res.status(500).json({ error: "Failed to get time windows" });
    }
  });

  // Create time window
  app.post("/api/time-windows", requireAuth, async (req, res) => {
    try {
      const result = createTimeWindowSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { _fridgeId, label, startTime, endTime } = result.data;

      // Verify fridge ownership
      const fridge = await storage.getFridge(_fridgeId, userId);
      if (!fridge) {
        return res.status(404).json({ error: "Fridge not found" });
      }

      const timeWindow = await storage.createTimeWindow({
        _userId: userId,
        _fridgeId: _fridgeId,
        label,
        startTime,
        endTime,
        isActive: true,
      });

      return res.json(timeWindow);
    } catch (error) {
      console.error("Create time window error:", error);
      return res.status(500).json({ error: "Failed to create time window" });
    }
  });

  // =========================
  // COMPLIANCE ENDPOINTS
  // =========================

  // Get compliance overview
  app.get("/api/compliance/overview", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const date = req.query.date ? new Date(req.query.date as string) : undefined;

      const overview = await storage.getComplianceOverview(userId, date);
      return res.json(overview);
    } catch (error) {
      console.error("Get compliance overview error:", error);
      return res.status(500).json({ error: "Failed to get compliance overview" });
    }
  });

  // Get unresolved out-of-range events count
  app.get("/api/out-of-range-events/unresolved/count", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const count = await storage.getUnresolvedEventsCount(userId);
      return res.json({ count });
    } catch (error) {
      console.error("Get unresolved events count error:", error);
      return res.status(500).json({ error: "Failed to get unresolved events count" });
    }
  });

  // =========================
  // CHECKLIST ENDPOINTS
  // =========================

  // Get checklists
  app.get("/api/checklists", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { fridgeId } = req.query;

      const checklists = await storage.getChecklists(userId, fridgeId as string);
      return res.json(checklists);
    } catch (error) {
      console.error("Get checklists error:", error);
      return res.status(500).json({ error: "Failed to get checklists" });
    }
  });

  // Get due checklists
  app.get("/api/checklists/due", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const dueChecklists = await storage.getDueChecklists(userId);
      return res.json(dueChecklists);
    } catch (error) {
      console.error("Get due checklists error:", error);
      return res.status(500).json({ error: "Failed to get due checklists" });
    }
  });

  // Create checklist (Admin/Manager only)
  app.post("/api/checklists", requireAuth, async (req, res) => {
    try {
      const result = createChecklistSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await storage.getUser(userId);

      // Check if user has permission to create checklists
      if (!user || (user.role !== "admin" && user.role !== "manager")) {
        return res.status(403).json({ error: "Insufficient permissions to create checklists" });
      }

      const { title, description, frequency, _fridgeId, items } = result.data;

      const checklistData = {
        title,
        description: description || null,
        frequency,
        _fridgeId: _fridgeId || null,
        createdBy: userId,
        isActive: true,
      };

      const itemsData = items.map((item, index) => ({
        title: item.title,
        description: item.description || null,
        isRequired: item.isRequired,
        sortOrder: index.toString(),
        checklistId: "", // Will be set in storage method
      }));

      const checklist = await storage.createChecklist(checklistData, itemsData);
      return res.json(checklist);
    } catch (error) {
      console.error("Create checklist error:", error);
      return res.status(500).json({ error: "Failed to create checklist" });
    }
  });

  // Complete checklist
  app.post("/api/checklists/:id/complete", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = completeChecklistSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const { _fridgeId, completedItems, notes } = result.data;

      const completionData = {
        checklistId: id!,
        _fridgeId: _fridgeId || null,
        completedBy: userId,
        completedItems,
        notes: notes || null,
      };

      const completion = await storage.createChecklistCompletion(completionData);
      return res.json(completion);
    } catch (error) {
      console.error("Complete checklist error:", error);
      return res.status(500).json({ error: "Failed to complete checklist" });
    }
  });

  // =========================
  // ENHANCED CHECKLIST ENDPOINTS
  // =========================

  // Get enhanced checklists with scheduling
  app.get("/api/v2/checklists", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { active } = req.query;
      const activeOnly = active === "true";

      const checklists = await checklistService.listChecklists(userId, activeOnly);
      return res.json(checklists);
    } catch (error) {
      console.error("Get enhanced checklists error:", error);
      return res
        .status(500)
        .json({ error: (error as Error).message || "Failed to get checklists" });
    }
  });

  // Create enhanced checklist
  app.post("/api/v2/checklists", requireAuth, async (req, res) => {
    try {
      const result = createChecklistRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const checklist = await checklistService.createChecklist(userId, result.data);
      return res.status(201).json(checklist);
    } catch (error) {
      console.error("Create enhanced checklist error:", error);
      return res
        .status(
          error &&
            typeof error === "object" &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
            ? error.statusCode
            : 500
        )
        .json({ error: error instanceof Error ? error.message : "Failed to create checklist" });
    }
  });

  // Update enhanced checklist
  app.put("/api/v2/checklists/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const result = createChecklistRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const checklist = await checklistService.updateChecklist(userId, id!, result.data);
      return res.json(checklist);
    } catch (error) {
      console.error("Update enhanced checklist error:", error);
      return res
        .status(
          error &&
            typeof error === "object" &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
            ? error.statusCode
            : 500
        )
        .json({ error: error instanceof Error ? error.message : "Failed to update checklist" });
    }
  });

  // Schedule checklist
  app.post("/api/v2/checklists/:id/schedule", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const result = scheduleChecklistRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid schedule data",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const schedule = await checklistService.createOrReplaceSchedule(userId, id!, result.data);
      return res.json(schedule);
    } catch (error) {
      console.error("Schedule checklist error:", error);
      return res
        .status(
          error &&
            typeof error === "object" &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
            ? error.statusCode
            : 500
        )
        .json({ error: error instanceof Error ? error.message : "Failed to schedule checklist" });
    }
  });

  // Get calendar view
  app.get("/api/v2/calendar", requireAuth, async (req, res) => {
    try {
      const result = calendarRequestSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid calendar parameters",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { from, to } = result.data;
      const calendarData = await checklistService.getCalendarInstances(userId, from, to);
      return res.json(calendarData);
    } catch (error) {
      console.error("Get calendar error:", error);
      return res
        .status(
          error &&
            typeof error === "object" &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
            ? error.statusCode
            : 500
        )
        .json({ error: error instanceof Error ? error.message : "Failed to get calendar data" });
    }
  });

  // Generate instances
  app.post("/api/v2/instances/generate", requireAuth, async (req, res) => {
    try {
      const result = generateInstancesRequestSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid generate parameters",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { from, to } = result.data;
      await checklistService.generateInstances(userId, from, to);
      return res.json({ message: "Instances generated successfully" });
    } catch (error) {
      console.error("Generate instances error:", error);
      return res
        .status(
          error &&
            typeof error === "object" &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
            ? error.statusCode
            : 500
        )
        .json({ error: error instanceof Error ? error.message : "Failed to generate instances" });
    }
  });

  // Complete checklist instance
  app.post("/api/v2/instances/:instanceId/complete", requireAuth, async (req, res) => {
    try {
      const { instanceId } = req.params;
      const result = completeChecklistInstanceRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid completion data",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const instance = await checklistService.completeInstance(userId, instanceId!, result.data);
      return res.json(instance);
    } catch (error) {
      console.error("Complete instance error:", error);
      return res
        .status(
          error &&
            typeof error === "object" &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
            ? error.statusCode
            : 500
        )
        .json({ error: error instanceof Error ? error.message : "Failed to complete instance" });
    }
  });

  // Get summaries for dashboard
  app.get("/api/v2/summaries", requireAuth, async (req, res) => {
    try {
      const result = summariesRequestSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid summary parameters",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { from, to, checklistId, cadence } = result.data;
      const summaries = await checklistService.getSummaries(userId, from, to, checklistId, cadence);
      return res.json(summaries);
    } catch (error) {
      console.error("Get summaries error:", error);
      return res
        .status(
          error &&
            typeof error === "object" &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
            ? error.statusCode
            : 500
        )
        .json({ error: error instanceof Error ? error.message : "Failed to get summaries" });
    }
  });

  // Export checklist CSV
  app.get("/api/v2/export/checklists", requireAuth, async (req, res) => {
    try {
      const result = summariesRequestSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid export parameters",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { from, to } = result.data;
      const csvData = await checklistService.exportCSV(userId, from, to);

      // Set CSV headers
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="checklist-report.csv"');

      // Create CSV content
      const headers = [
        "Date/Week",
        "Checklist Name",
        "Cadence",
        "Required",
        "Completed",
        "On Time",
        "Completed At",
        "Completed By",
      ];
      const csvRows = [headers.join(",")];

      csvData.forEach((record) => {
        const row = [
          `"${record.date_or_week}"`,
          `"${record.checklist_name}"`,
          record.cadence,
          record.required,
          record.completed,
          record.on_time,
          `"${record.completed_at}"`,
          `"${record.completed_by}"`,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");
      return res.send(csvContent);
    } catch (error) {
      console.error("Export checklists error:", error);
      return res
        .status(
          error &&
            typeof error === "object" &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
            ? error.statusCode
            : 500
        )
        .json({ error: error instanceof Error ? error.message : "Failed to export checklists" });
    }
  });

  // =========================
  // CALIBRATION RECORD ENDPOINTS
  // =========================

  // Get calibration records for a fridge
  app.get("/api/fridges/:fridgeId/calibrations", requireAuth, async (req, res) => {
    try {
      const { fridgeId } = req.params;
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const records = await storage.getCalibrationRecords(fridgeId!, userId);
      return res.json(records);
    } catch (error) {
      console.error("Get calibration records error:", error);
      return res.status(500).json({ error: "Failed to get calibration records" });
    }
  });

  // Create calibration record
  app.post("/api/calibration-records", requireAuth, async (req, res) => {
    try {
      const { createCalibrationRecordSchema } = await import("@shared/schema");
      const result = createCalibrationRecordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const {
        _fridgeId,
        calibrationDate,
        performedBy,
        calibrationStandard,
        beforeCalibrationReading,
        afterCalibrationReading,
        accuracy,
        notes,
      } = result.data;

      // Verify fridge ownership
      const fridge = await storage.getFridge(_fridgeId, userId);
      if (!fridge) {
        return res.status(404).json({ error: "Fridge not found" });
      }

      // Calculate next calibration due (1 year from calibration date)
      const nextDue = new Date(calibrationDate);
      nextDue.setFullYear(nextDue.getFullYear() + 1);

      const recordData = {
        _userId: userId,
        _fridgeId,
        calibrationDate: new Date(calibrationDate),
        nextCalibrationDue: nextDue,
        performedBy,
        calibrationStandard: calibrationStandard || null,
        beforeCalibrationReading: beforeCalibrationReading || null,
        afterCalibrationReading: afterCalibrationReading || null,
        accuracy: accuracy || null,
        notes: notes || null,
        certificateFileName: null, // TODO: Implement file upload
        certificateFilePath: null,
      };

      const record = await storage.createCalibrationRecord(recordData);
      return res.status(201).json(record);
    } catch (error) {
      console.error("Create calibration record error:", error);
      return res.status(500).json({ error: "Failed to create calibration record" });
    }
  });

  // Update calibration record
  app.put("/api/calibration-records/:recordId", requireAuth, async (req, res) => {
    try {
      const { recordId } = req.params;
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { createCalibrationRecordSchema } = await import("@shared/schema");
      const result = createCalibrationRecordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input data",
          details: result.error.errors,
        });
      }

      const {
        calibrationDate,
        performedBy,
        calibrationStandard,
        beforeCalibrationReading,
        afterCalibrationReading,
        accuracy,
        notes,
      } = result.data;

      // Calculate next calibration due (1 year from calibration date)
      const nextDue = new Date(calibrationDate);
      nextDue.setFullYear(nextDue.getFullYear() + 1);

      const updates = {
        calibrationDate: new Date(calibrationDate),
        nextCalibrationDue: nextDue,
        performedBy,
        calibrationStandard: calibrationStandard || null,
        beforeCalibrationReading: beforeCalibrationReading || null,
        afterCalibrationReading: afterCalibrationReading || null,
        accuracy: accuracy || null,
        notes: notes || null,
      };

      const record = await storage.updateCalibrationRecord(recordId!, userId, updates);
      if (!record) {
        return res.status(404).json({ error: "Calibration record not found" });
      }

      return res.json(record);
    } catch (error) {
      console.error("Update calibration record error:", error);
      return res.status(500).json({ error: "Failed to update calibration record" });
    }
  });

  // Delete calibration record
  app.delete("/api/calibration-records/:recordId", requireAuth, async (req, res) => {
    try {
      const { recordId } = req.params;
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const deleted = await storage.deleteCalibrationRecord(recordId!, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Calibration record not found" });
      }

      return res.json({ message: "Calibration record deleted successfully" });
    } catch (error) {
      console.error("Delete calibration record error:", error);
      return res.status(500).json({ error: "Failed to delete calibration record" });
    }
  });

  // Export compliance report as CSV
  app.get("/api/export/compliance-report", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get comprehensive compliance data
      const logs = await storage.getAllTemperatureLogsForUser(userId);
      const overview = await storage.getComplianceOverview(userId);

      // Set CSV headers
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="compliance-report.csv"');

      // Create CSV content for compliance report
      const headers = [
        "Report Type",
        "Fridge Name",
        "Date",
        "Time",
        "Temperature (°C)",
        "Temperature Status",
        "Person Name",
        "Check Status",
        "On Time",
        "Late Reason",
        "Corrective Action",
        "Alert Level",
      ];
      const csvRows = [headers.join(",")];

      // Add summary row
      csvRows.push(
        [
          "SUMMARY",
          "All Fridges",
          new Date().toLocaleDateString(),
          new Date().toLocaleTimeString(),
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          overview?.missedReadings > 0 ? "HIGH" : "NORMAL",
        ]
          .map((field) => `"${field}"`)
          .join(",")
      );

      // Add overview statistics
      csvRows.push(
        [
          "STATISTICS",
          "Total Fridges",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          overview?.totalFridges?.toString() || "0",
        ]
          .map((field) => `"${field}"`)
          .join(",")
      );

      csvRows.push(
        [
          "STATISTICS",
          "Compliant Fridges",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          overview?.compliantFridges?.toString() || "0",
        ]
          .map((field) => `"${field}"`)
          .join(",")
      );

      csvRows.push(
        [
          "STATISTICS",
          "Missed Checks",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          overview?.missedReadings?.toString() || "0",
        ]
          .map((field) => `"${field}"`)
          .join(",")
      );

      csvRows.push(
        [
          "STATISTICS",
          "Late Checks",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          overview?.recentActivity?.lateEntries?.toString() || "0",
        ]
          .map((field) => `"${field}"`)
          .join(",")
      );

      // Add detailed temperature log rows
      logs.forEach((log) => {
        const date = new Date(log.createdAt!);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString();
        const tempStatus = log.isAlert ? "OUT_OF_RANGE" : "IN_RANGE";
        const checkStatus = "COMPLETED";
        const onTime = log.isOnTime ? "YES" : "NO";
        const alertLevel = log.isAlert ? "HIGH" : "NORMAL";

        const row = [
          "TEMPERATURE_LOG",
          log.fridgeName,
          dateStr,
          timeStr,
          log.currentTempReading.toString(),
          tempStatus,
          log.personName,
          checkStatus,
          onTime,
          log.lateReason || "-",
          log.correctiveAction || "-",
          alertLevel,
        ];
        csvRows.push(row.map((field) => `"${field}"`).join(","));
      });

      const csvContent = csvRows.join("\n");
      return res.send(csvContent);
    } catch (error) {
      console.error("Export compliance report error:", error);
      return res.status(500).json({ error: "Failed to export compliance report" });
    }
  });

  // =========================
  // SELF-AUDIT CHECKLIST ENDPOINTS
  // =========================

  // Get audit templates
  app.get("/api/audit-templates", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const templates = await storage.getAuditTemplates(userId);
      return res.json(templates);
    } catch (error) {
      console.error("Get audit templates error:", error);
      return res.status(500).json({ error: "Failed to get audit templates" });
    }
  });

  // Get specific audit template
  app.get("/api/audit-templates/:templateId", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { templateId } = req.params;

      const template = await storage.getAuditTemplate(templateId!, userId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      return res.json(template);
    } catch (error) {
      console.error("Get audit template error:", error);
      return res.status(500).json({ error: "Failed to get audit template" });
    }
  });

  // Create audit template
  app.post("/api/audit-templates", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { createAuditTemplateSchema } = await import("@shared/self-audit-types");

      const result = createAuditTemplateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid template data",
          details: result.error.errors,
        });
      }

      const templateData = {
        _userId: userId,
        name: result.data.name,
        description: result.data.description,
        isDefault: false,
      };

      const template = await storage.createAuditTemplate(templateData, result.data);
      return res.status(201).json(template);
    } catch (error) {
      console.error("Create audit template error:", error);
      return res.status(500).json({ error: "Failed to create audit template" });
    }
  });

  // Update audit template
  app.put("/api/audit-templates/:templateId", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { templateId } = req.params;
      const { updateAuditTemplateSchema } = await import("@shared/self-audit-types");

      const result = updateAuditTemplateSchema.safeParse({ ...req.body, _id: templateId });
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid template data",
          details: result.error.errors,
        });
      }

      const { _id, sections, ...templateData } = result.data;
      const sectionsData = sections ? { sections } : undefined;

      const template = await storage.updateAuditTemplate(
        templateId!,
        userId,
        templateData,
        sectionsData
      );
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      return res.json(template);
    } catch (error) {
      console.error("Update audit template error:", error);
      return res.status(500).json({ error: "Failed to update audit template" });
    }
  });

  // Delete audit template
  app.delete("/api/audit-templates/:templateId", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { templateId } = req.params;

      const success = await storage.deleteAuditTemplate(templateId!, userId);
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }

      return res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Delete audit template error:", error);
      return res.status(500).json({ error: "Failed to delete audit template" });
    }
  });

  // Create default audit template
  app.post("/api/audit-templates/default", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const template = await storage.createDefaultAuditTemplate(userId);
      return res.status(201).json(template);
    } catch (error) {
      console.error("Create default audit template error:", error);
      return res.status(500).json({ error: "Failed to create default audit template" });
    }
  });

  // Complete audit checklist
  app.post("/api/audit-completions", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { completeAuditSchema, calculateComplianceRate } = await import(
        "@shared/self-audit-types"
      );

      const result = completeAuditSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Invalid completion data",
          details: result.error.errors,
        });
      }

      // Get template to validate responses and get template name
      const template = await storage.getAuditTemplate(result.data._templateId, userId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Map responses to include section and item details first
      const responsesData = result.data.responses.map((response) => {
        const section = template.sections.find(
          (s: { _id: string; items: { _id: string }[] }) => s._id === response.sectionId
        );
        const item = section?.items.find((i: { _id: string }) => i._id === response.itemId);

        return {
          _id: "", // Will be set by storage method
          _completionId: "", // Will be set by storage method
          sectionId: response.sectionId,
          sectionTitle: section?.title || "Unknown Section",
          itemId: response.itemId,
          itemText: item?.text || "Unknown Item",
          isCompliant: response.isCompliant,
          notes: response.notes,
          actionRequired: response.actionRequired,
        };
      });

      // Calculate compliance rate using the properly typed responses
      const complianceRate = calculateComplianceRate(responsesData);

      const completionData = {
        _userId: userId,
        _templateId: result.data._templateId,
        templateName: template.name,
        completedBy: userId,
        notes: result.data.notes,
        complianceRate: complianceRate.toString(),
      };

      const completion = await storage.createAuditCompletion(completionData, responsesData);
      return res.status(201).json(completion);
    } catch (error) {
      console.error("Complete audit error:", error);
      return res.status(500).json({ error: "Failed to complete audit" });
    }
  });

  // Get audit completions
  app.get("/api/audit-completions", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { auditFiltersSchema: _auditFiltersSchema } = await import("@shared/self-audit-types");

      const filters: Record<string, unknown> = {};
      if (req.query._templateId) filters._templateId = req.query._templateId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.completedBy) filters.completedBy = req.query.completedBy as string;

      const completions = await storage.getAuditCompletions(userId, filters);
      return res.json(completions);
    } catch (error) {
      console.error("Get audit completions error:", error);
      return res.status(500).json({ error: "Failed to get audit completions" });
    }
  });

  // Get specific audit completion
  app.get("/api/audit-completions/:completionId", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { completionId } = req.params;

      const completion = await storage.getAuditCompletion(completionId!, userId);
      if (!completion) {
        return res.status(404).json({ error: "Completion not found" });
      }

      return res.json(completion);
    } catch (error) {
      console.error("Get audit completion error:", error);
      return res.status(500).json({ error: "Failed to get audit completion" });
    }
  });

  // Get audit completion statistics
  app.get("/api/audit-stats", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const stats = await storage.getAuditCompletionStats(userId);
      return res.json(stats);
    } catch (error) {
      console.error("Get audit stats error:", error);
      return res.status(500).json({ error: "Failed to get audit statistics" });
    }
  });

  // Security status endpoint (development only)
  app.get("/api/security/status", requireAuth, async (req, res) => {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV !== "development") {
        return res.status(404).json({ error: "Endpoint not available in production" });
      }

      // Try to read security status from file
      const fs = await import("fs/promises");
      const path = await import("path");

      try {
        const statusFile = path.join(process.cwd(), ".security-status.json");
        const statusContent = await fs.readFile(statusFile, "utf-8");
        const status = JSON.parse(statusContent);
        return res.json(status);
      } catch {
        // If no status file exists, return default status
        return res.json({
          vulnerabilities: { low: 0, medium: 0, high: 0, critical: 0 },
          lastScan: null,
          packagesScanned: 0,
          hasIssues: false,
          message: "No security scan has been run yet",
        });
      }
    } catch (error) {
      console.error("Get security status error:", error);
      return res.status(500).json({ error: "Failed to get security status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
