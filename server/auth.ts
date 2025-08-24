import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { signUpSchema, signInSchema, type SignUpData, type SignInData } from "@shared/schema";

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Admin middleware
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: "Failed to verify admin status" });
  }
}

// Sign up route handler
export async function signUp(req: Request, res: Response) {
  try {
    const result = signUpSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: result.error.errors 
      });
    }

    const { email, password, firstName, lastName } = result.data;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "user",
    });

    // Set session and save it explicitly
    req.session.userId = user.id;
    
    // Explicitly save the session before responding
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Failed to save session" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    });
  } catch (error: any) {
    console.error("Sign up error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
}

// Sign in route handler
export async function signIn(req: Request, res: Response) {
  try {
    const result = signInSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: result.error.errors 
      });
    }

    const { email, password } = result.data;

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Set session and save it explicitly
    req.session.userId = user.id;
    console.log("signIn - setting session userId:", user.id);
    console.log("signIn - session ID:", req.sessionID);
    
    // Force session regeneration to ensure fresh session
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ error: "Failed to create session" });
      }
      
      // Set userId again after regeneration
      req.session.userId = user.id;
      
      // Save the session
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        console.log("signIn - session regenerated and saved successfully");
        console.log("signIn - new session ID:", req.sessionID);
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    });
  } catch (error: any) {
    console.error("Sign in error:", error);
    res.status(500).json({ error: "Failed to sign in" });
  }
}

// Sign out route handler
export async function signOut(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Sign out error:", err);
      return res.status(500).json({ error: "Failed to sign out" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Signed out successfully" });
  });
}

// Get current user route handler
export async function getCurrentUser(req: Request, res: Response) {
  try {
    console.log("getCurrentUser - session ID:", req.sessionID);
    console.log("getCurrentUser - session data:", req.session);
    console.log("getCurrentUser - userId:", req.session.userId);
    
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
}