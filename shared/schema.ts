import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("user"),
  subscriptionStatus: text("subscription_status").notNull().default("trial"),
  trialStartDate: timestamp("trial_start_date").defaultNow(),
  trialEndDate: timestamp("trial_end_date"),
  darkMode: boolean("dark_mode").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tier: text("tier").notNull(),
  status: text("status").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fridges = pgTable("fridges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  location: text("location"),
  notes: text("notes"),
  color: text("color").default("#3b82f6"),
  labels: text("labels").array(),
  minTemp: decimal("min_temp", { precision: 4, scale: 1 }).notNull(),
  maxTemp: decimal("max_temp", { precision: 4, scale: 1 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labels = pgTable("labels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  color: text("color").default("#6b7280"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const temperatureLogs = pgTable("temperature_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fridgeId: varchar("fridge_id").notNull().references(() => fridges.id),
  temperature: decimal("temperature", { precision: 4, scale: 1 }).notNull(),
  personName: text("person_name").notNull(),
  isAlert: boolean("is_alert").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  tier: true,
  status: true,
});

export const insertFridgeSchema = createInsertSchema(fridges).pick({
  userId: true,
  name: true,
  location: true,
  notes: true,
  color: true,
  labels: true,
  minTemp: true,
  maxTemp: true,
});

export const insertLabelSchema = createInsertSchema(labels).pick({
  userId: true,
  name: true,
  color: true,
});

export const insertTemperatureLogSchema = createInsertSchema(temperatureLogs).pick({
  fridgeId: true,
  temperature: true,
  personName: true,
  isAlert: true,
});

// Sign up schema for frontend forms
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must include uppercase, lowercase, numbers, and symbols"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Sign in schema
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Profile update schema
export const updateProfileSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  subscriptionStatus: z.enum(["trial", "paid"]).optional(),
  darkMode: z.boolean().optional(),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must include uppercase, lowercase, numbers, and symbols"),
});

// Reset password schema (no current password required)
export const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must include uppercase, lowercase, numbers, and symbols"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Fridge management schemas
export const createFridgeSchema = z.object({
  name: z.string().min(1, "Fridge name is required"),
  location: z.string().optional(),
  notes: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format").default("#3b82f6"),
  labels: z.array(z.string()).default([]),
  minTemp: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -50 && num <= 50;
  }, "Minimum temperature must be between -50°C and 50°C"),
  maxTemp: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -50 && num <= 50;
  }, "Maximum temperature must be between -50°C and 50°C"),
}).refine((data) => {
  const min = parseFloat(data.minTemp);
  const max = parseFloat(data.maxTemp);
  return min < max;
}, {
  message: "Minimum temperature must be less than maximum temperature",
  path: ["maxTemp"],
});

export const createLabelSchema = z.object({
  name: z.string().min(1, "Label name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format").default("#6b7280"),
});

export const logTemperatureSchema = z.object({
  fridgeId: z.string().min(1, "Fridge selection is required"),
  temperature: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -50 && num <= 50;
  }, "Temperature must be between -50°C and 50°C"),
  personName: z.string().min(1, "Person name is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertFridge = z.infer<typeof insertFridgeSchema>;
export type Fridge = typeof fridges.$inferSelect;
export type InsertTemperatureLog = z.infer<typeof insertTemperatureLogSchema>;
export type TemperatureLog = typeof temperatureLogs.$inferSelect;
export type CreateFridgeData = z.infer<typeof createFridgeSchema>;
export type LogTemperatureData = z.infer<typeof logTemperatureSchema>;

// Helper function to calculate trial end date (14 days from start)
export function calculateTrialEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14);
  return endDate;
}

// Helper function to check if trial has expired
export function isTrialExpired(trialEndDate: Date | null): boolean {
  if (!trialEndDate) return false;
  return new Date() > trialEndDate;
}

export const subscriptionStatus = {
  TRIAL: "trial",
  PAID: "paid"
} as const;

export const userRoles = {
  USER: "user",
  ADMIN: "admin"
} as const;

export type SubscriptionStatus = typeof subscriptionStatus[keyof typeof subscriptionStatus];
export type UserRole = typeof userRoles[keyof typeof userRoles];
