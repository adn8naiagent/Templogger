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

// Authentication middleware - updated for token-based auth
export function requireAuth(req: Request, res: Response, next: NextFunction): Response | void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  let userId: string;
  
  try {
    // Decode the token (simple base64 decode for now)
    userId = Buffer.from(token, 'base64').toString();
  } catch (_) {
    return res.status(401).json({ message: "Invalid token" });
  }
  
  // Add userId to request object for downstream use
  (req as any).userId = userId;
  next();
}

// Admin middleware - updated for token-based auth
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.substring(7);
  let userId: string;
  
  try {
    // Decode the token
    userId = Buffer.from(token, 'base64').toString();
  } catch (_) {
    return res.status(401).json({ error: "Invalid token" });
  }
  
  try {
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.user = user;
    (req as any).userId = userId;
    next();
  } catch (_) {
    return res.status(500).json({ error: "Failed to verify admin status" });
  }
}

// Sign up route handler
export async function signUp(req: Request, res: Response): Promise<Response | void> {
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
    const now = new Date();
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "user",
      trialStartDate: now,
      trialEndDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    });

    // Create default audit template for new user
    try {
      await storage.createDefaultAuditTemplate(user._id);
    } catch (error: any) {
      console.error("Failed to create default audit template for new user:", error);
      // Don't fail user creation if template creation fails
    }

    // Create auth token for new user
    const authToken = Buffer.from(user._id).toString('base64');
    
    console.log("signUp - new user created:", user.email);
    
    // Return user without password and include the auth token
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ 
      ...userWithoutPassword, 
      authToken 
    });
  } catch (error: any) {
    console.error("Sign up error:", error);
    return res.status(500).json({ error: "Failed to create account" });
  }
}

// Sign in route handler
export async function signIn(req: Request, res: Response): Promise<Response | void> {
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

    // Create a simple token for the user (using userId as token for simplicity)
    const authToken = Buffer.from(user._id).toString('base64');
    
    console.log("signIn - user authenticated:", user.email);
    
    // Return user without password and include the auth token
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      ...userWithoutPassword, 
      authToken 
    });
  } catch (error: any) {
    console.error("Sign in error:", error);
    return res.status(500).json({ error: "Failed to sign in" });
  }
}

// Sign out route handler - for token-based auth, this is just a client-side operation
export async function signOut(req: Request, res: Response): Promise<Response> {
  // With token-based auth, logout is primarily handled on the client side
  // Server just confirms the logout request
  console.log("signOut - logout confirmed");
  return res.json({ message: "Signed out successfully" });
}

// Get current user route handler
export async function getCurrentUser(req: Request, res: Response): Promise<Response | void> {
  try {
    // Check for auth token in Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    let userId: string;
    
    try {
      // Decode the token (simple base64 decode for now)
      userId = Buffer.from(token, 'base64').toString();
    } catch (_) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Failed to get user" });
  }
}