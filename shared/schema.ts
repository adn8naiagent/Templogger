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
  isActive: boolean("is_active").notNull().default(true),
  enableScheduledChecks: boolean("enable_scheduled_checks").notNull().default(false),
  checkFrequency: text("check_frequency"), // "once", "twice", "multiple"
  excludedDays: text("excluded_days").array().default([]), // Array of day numbers
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

// Time windows for fridge monitoring schedules
export const timeWindows = pgTable("time_windows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fridgeId: varchar("fridge_id").notNull().references(() => fridges.id),
  label: text("label").notNull(), // e.g. "Morning", "Afternoon", "Daily Check"
  checkType: text("check_type").notNull().default("specific"), // "specific" or "daily"
  startTime: text("start_time"), // HH:MM format - nullable for daily checks
  endTime: text("end_time"), // HH:MM format - nullable for daily checks
  excludedDays: text("excluded_days").array().default([]), // Array of day numbers (0=Sunday, 1=Monday, etc.)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced temperature logs with compliance tracking
export const temperatureLogs = pgTable("temperature_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fridgeId: varchar("fridge_id").notNull().references(() => fridges.id),
  timeWindowId: varchar("time_window_id").references(() => timeWindows.id),
  minTempReading: decimal("min_temp_reading", { precision: 4, scale: 1 }).notNull(),
  maxTempReading: decimal("max_temp_reading", { precision: 4, scale: 1 }).notNull(),
  currentTempReading: decimal("current_temp_reading", { precision: 4, scale: 1 }).notNull(),
  personName: text("person_name").notNull(),
  isAlert: boolean("is_alert").notNull().default(false),
  isOnTime: boolean("is_on_time").notNull().default(true),
  lateReason: text("late_reason"), // Required if isOnTime is false
  correctiveAction: text("corrective_action"), // For out-of-range temps
  correctiveNotes: text("corrective_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance records for tracking at different levels
export const complianceRecords = pgTable("compliance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fridgeId: varchar("fridge_id").notNull().references(() => fridges.id),
  date: timestamp("date").notNull(),
  level: text("level").notNull(), // "window", "fridge-day", "overall"
  status: text("status").notNull(), // "compliant", "missed", "partial", "late"
  temperatureCompliance: decimal("temperature_compliance", { precision: 5, scale: 2 }).default("100.00"),
  checkingCompliance: decimal("checking_compliance", { precision: 5, scale: 2 }).default("100.00"),
  requiredChecks: decimal("required_checks", { precision: 3, scale: 0 }).notNull().default("0"),
  completedChecks: decimal("completed_checks", { precision: 3, scale: 0 }).notNull().default("0"),
  onTimeChecks: decimal("on_time_checks", { precision: 3, scale: 0 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Missed checks tracking with manual override capability
export const missedChecks = pgTable("missed_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fridgeId: varchar("fridge_id").notNull().references(() => fridges.id),
  timeWindowId: varchar("time_window_id").references(() => timeWindows.id),
  missedDate: timestamp("missed_date").notNull(),
  checkType: text("check_type").notNull(), // "specific" or "daily"
  reason: text("reason"), // Auto-generated or user provided
  isOverridden: boolean("is_overridden").notNull().default(false),
  overrideReason: text("override_reason"), // User explanation for override
  overriddenBy: varchar("overridden_by").references(() => users.id),
  overriddenAt: timestamp("overridden_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom checklists for admin-created tasks
export const checklists = pgTable("checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(), // "daily", "weekly", "monthly"
  isActive: boolean("is_active").notNull().default(true),
  fridgeId: varchar("fridge_id").references(() => fridges.id), // Optional - can be global
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist items 
export const checklistItems = pgTable("checklist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  checklistId: varchar("checklist_id").notNull().references(() => checklists.id),
  title: text("title").notNull(),
  description: text("description"),
  isRequired: boolean("is_required").notNull().default(true),
  sortOrder: decimal("sort_order", { precision: 3, scale: 0 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist completions
export const checklistCompletions = pgTable("checklist_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  checklistId: varchar("checklist_id").notNull().references(() => checklists.id),
  fridgeId: varchar("fridge_id").references(() => fridges.id),
  completedBy: varchar("completed_by").notNull().references(() => users.id),
  completedItems: text("completed_items").array(), // Array of checklist item IDs
  notes: text("notes"),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Out-of-range events tracking
export const outOfRangeEvents = pgTable("out_of_range_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  temperatureLogId: varchar("temperature_log_id").notNull().references(() => temperatureLogs.id),
  fridgeId: varchar("fridge_id").notNull().references(() => fridges.id),
  violationType: text("violation_type").notNull(), // "min", "max", "current", "multiple"
  minTempReading: decimal("min_temp_reading", { precision: 4, scale: 1 }),
  maxTempReading: decimal("max_temp_reading", { precision: 4, scale: 1 }),
  currentTempReading: decimal("current_temp_reading", { precision: 4, scale: 1 }),
  expectedMin: decimal("expected_min", { precision: 4, scale: 1 }).notNull(),
  expectedMax: decimal("expected_max", { precision: 4, scale: 1 }).notNull(),
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  correctiveAction: text("corrective_action"),
  notes: text("notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calibration records for fridge thermometers
export const calibrationRecords = pgTable("calibration_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fridgeId: varchar("fridge_id").notNull().references(() => fridges.id),
  calibrationDate: timestamp("calibration_date").notNull(),
  nextCalibrationDue: timestamp("next_calibration_due").notNull(),
  performedBy: text("performed_by").notNull(),
  calibrationStandard: text("calibration_standard"), // Reference standard used
  beforeCalibrationReading: decimal("before_calibration_reading", { precision: 4, scale: 1 }),
  afterCalibrationReading: decimal("after_calibration_reading", { precision: 4, scale: 1 }),
  accuracy: decimal("accuracy", { precision: 4, scale: 2 }), // ±°C accuracy
  certificateFileName: text("certificate_file_name"),
  certificateFilePath: text("certificate_file_path"),
  certificateFileSize: decimal("certificate_file_size", { precision: 10, scale: 0 }),
  notes: text("notes"),
  status: text("status").notNull().default("valid"), // "valid", "expired", "overdue"
  createdAt: timestamp("created_at").defaultNow(),
});

// Maintenance records for fridges
export const maintenanceRecords = pgTable("maintenance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fridgeId: varchar("fridge_id").notNull().references(() => fridges.id),
  maintenanceDate: timestamp("maintenance_date").notNull(),
  maintenanceType: text("maintenance_type").notNull(), // "routine", "repair", "emergency", "cleaning"
  performedBy: text("performed_by").notNull(),
  description: text("description").notNull(),
  partsReplaced: text("parts_replaced").array(),
  cost: decimal("cost", { precision: 8, scale: 2 }),
  nextMaintenanceDue: timestamp("next_maintenance_due"),
  attachmentFileName: text("attachment_file_name"),
  attachmentFilePath: text("attachment_file_path"),
  attachmentFileSize: decimal("attachment_file_size", { precision: 10, scale: 0 }),
  status: text("status").notNull().default("completed"), // "completed", "pending", "scheduled"
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
  trialStartDate: true,
  trialEndDate: true,
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
  timeWindowId: true,
  minTempReading: true,
  maxTempReading: true,
  currentTempReading: true,
  personName: true,
  isAlert: true,
  isOnTime: true,
  lateReason: true,
  correctiveAction: true,
  correctiveNotes: true,
});

export const insertTimeWindowSchema = createInsertSchema(timeWindows).pick({
  fridgeId: true,
  label: true,
  checkType: true,
  startTime: true,
  endTime: true,
  excludedDays: true,
  isActive: true,
});

export const insertComplianceRecordSchema = createInsertSchema(complianceRecords).pick({
  fridgeId: true,
  date: true,
  level: true,
  status: true,
  requiredChecks: true,
  completedChecks: true,
  onTimeChecks: true,
});

export const insertChecklistSchema = createInsertSchema(checklists).pick({
  title: true,
  description: true,
  frequency: true,
  isActive: true,
  fridgeId: true,
  createdBy: true,
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  checklistId: true,
  title: true,
  description: true,
  isRequired: true,
  sortOrder: true,
});

export const insertChecklistCompletionSchema = createInsertSchema(checklistCompletions).pick({
  checklistId: true,
  fridgeId: true,
  completedBy: true,
  completedItems: true,
  notes: true,
});

export const insertOutOfRangeEventSchema = createInsertSchema(outOfRangeEvents).pick({
  temperatureLogId: true,
  fridgeId: true,
  violationType: true,
  minTempReading: true,
  maxTempReading: true,
  currentTempReading: true,
  expectedMin: true,
  expectedMax: true,
  severity: true,
  correctiveAction: true,
  notes: true,
});

export const insertCalibrationRecordSchema = createInsertSchema(calibrationRecords).pick({
  fridgeId: true,
  calibrationDate: true,
  nextCalibrationDue: true,
  performedBy: true,
  calibrationStandard: true,
  beforeCalibrationReading: true,
  afterCalibrationReading: true,
  accuracy: true,
  certificateFileName: true,
  certificateFilePath: true,
  certificateFileSize: true,
  notes: true,
  status: true,
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).pick({
  fridgeId: true,
  maintenanceDate: true,
  maintenanceType: true,
  performedBy: true,
  description: true,
  partsReplaced: true,
  cost: true,
  nextMaintenanceDue: true,
  attachmentFileName: true,
  attachmentFilePath: true,
  attachmentFileSize: true,
  status: true,
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
  timeWindowId: z.string().optional(),
  minTempReading: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -50 && num <= 50;
  }, "Minimum temperature reading must be between -50°C and 50°C"),
  maxTempReading: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -50 && num <= 50;
  }, "Maximum temperature reading must be between -50°C and 50°C"),
  currentTempReading: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -50 && num <= 50;
  }, "Current temperature reading must be between -50°C and 50°C"),
  personName: z.string().min(1, "Person name is required"),
  notes: z.string().optional(),
  isOnTime: z.boolean().default(true),
  lateReason: z.string().optional(),
  correctiveAction: z.string().optional(),
  correctiveNotes: z.string().optional(),
}).refine((data) => {
  const min = parseFloat(data.minTempReading);
  const max = parseFloat(data.maxTempReading);
  const current = parseFloat(data.currentTempReading);
  return min <= current && current <= max;
}, {
  message: "Current temperature must be between minimum and maximum readings",
  path: ["currentTempReading"],
});

// Time window schema
export const createTimeWindowSchema = z.object({
  fridgeId: z.string().min(1, "Please select a fridge"),
  label: z.string().min(1, "Label is required"),
  checkType: z.enum(["specific", "daily"]).default("specific"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional(),
  excludedDays: z.array(z.number().min(0).max(6)).default([]), // 0=Sunday, 6=Saturday
}).refine((data) => {
  // For specific checks, require start and end times
  if (data.checkType === "specific") {
    return data.startTime && data.endTime && data.startTime < data.endTime;
  }
  return true;
}, {
  message: "Start and end times are required for specific checks, and end time must be after start time",
  path: ["endTime"],
});

// Checklist schema
export const createChecklistSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  fridgeId: z.string().optional(),
  items: z.array(z.object({
    title: z.string().min(1, "Item title is required"),
    description: z.string().optional(),
    isRequired: z.boolean().default(true),
  })).min(1, "At least one checklist item is required"),
});

// Checklist completion schema
export const completeChecklistSchema = z.object({
  checklistId: z.string().min(1, "Checklist ID is required"),
  fridgeId: z.string().optional(),
  completedItems: z.array(z.string()),
  notes: z.string().optional(),
});

// Calibration record schema
export const createCalibrationRecordSchema = z.object({
  fridgeId: z.string().min(1, "Fridge selection is required"),
  calibrationDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Valid calibration date is required"),
  performedBy: z.string().min(1, "Performed by is required"),
  calibrationStandard: z.string().optional(),
  beforeCalibrationReading: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= -50 && num <= 50;
  }, "Before calibration reading must be between -50°C and 50°C"),
  afterCalibrationReading: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= -50 && num <= 50;
  }, "After calibration reading must be between -50°C and 50°C"),
  accuracy: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 10;
  }, "Accuracy must be between 0 and 10°C"),
  notes: z.string().optional(),
});

// Maintenance record schema
export const createMaintenanceRecordSchema = z.object({
  fridgeId: z.string().min(1, "Fridge selection is required"),
  maintenanceDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Valid maintenance date is required"),
  maintenanceType: z.enum(["routine", "repair", "emergency", "cleaning"], {
    required_error: "Maintenance type is required",
  }),
  performedBy: z.string().min(1, "Performed by is required"),
  description: z.string().min(1, "Description is required"),
  partsReplaced: z.array(z.string()).default([]),
  cost: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Cost must be a positive number"),
  nextMaintenanceDue: z.string().optional().refine((val) => {
    if (!val) return true;
    return !isNaN(Date.parse(val));
  }, "Valid next maintenance date required"),
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
export type CreateTimeWindowData = z.infer<typeof createTimeWindowSchema>;
export type CreateChecklistData = z.infer<typeof createChecklistSchema>;
export type CompleteChecklistData = z.infer<typeof completeChecklistSchema>;
export type CreateCalibrationRecordData = z.infer<typeof createCalibrationRecordSchema>;
export type CreateMaintenanceRecordData = z.infer<typeof createMaintenanceRecordSchema>;

// Table select types
export type TimeWindow = typeof timeWindows.$inferSelect;
export type ComplianceRecord = typeof complianceRecords.$inferSelect;
export type Checklist = typeof checklists.$inferSelect;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type OutOfRangeEvent = typeof outOfRangeEvents.$inferSelect;
export type CalibrationRecord = typeof calibrationRecords.$inferSelect;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;

// Insert types 
export type InsertTimeWindow = z.infer<typeof insertTimeWindowSchema>;
export type InsertComplianceRecord = z.infer<typeof insertComplianceRecordSchema>;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type InsertChecklistCompletion = z.infer<typeof insertChecklistCompletionSchema>;
export type InsertOutOfRangeEvent = z.infer<typeof insertOutOfRangeEventSchema>;
export type InsertCalibrationRecord = z.infer<typeof insertCalibrationRecordSchema>;
export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;

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
  STAFF: "staff",
  MANAGER: "manager", 
  ADMIN: "admin"
} as const;

export type SubscriptionStatus = typeof subscriptionStatus[keyof typeof subscriptionStatus];
export type UserRole = typeof userRoles[keyof typeof userRoles];
