import { z } from "zod";

// Base checklist data models extending existing schema
export interface ChecklistSchedule {
  _id: string;
  checklistId: string;
  cadence: 'DAILY' | 'DOW' | 'WEEKLY';
  daysOfWeek?: number[]; // For DOW: 0=Sunday, 1=Monday, etc.
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, nullable
  timezone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistInstance {
  _id: string;
  checklistId: string;
  scheduleId: string;
  // eslint-disable-next-line max-len
  targetDate: string; // ISO date string (for DAILY/DOW) or week identifier (for WEEKLY like "2024-W08")
  status: 'REQUIRED' | 'COMPLETED' | 'MISSED';
  completedAt?: Date;
  completedBy?: string;
  completedItems?: string[]; // Array of checklist item IDs
  confirmationNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistWithScheduleAndItems {
  _id: string;
  name: string;
  description?: string;
  items: Array<{
    _id: string;
    label: string;
    required: boolean;
    orderIndex: number;
    note?: string;
  }>;
  schedule?: ChecklistSchedule;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Calendar view types
export interface CalendarInstance {
  _id: string;
  checklistId: string;
  checklistName: string;
  targetDate: string;
  status: 'REQUIRED' | 'COMPLETED' | 'MISSED';
  cadence: 'DAILY' | 'DOW' | 'WEEKLY';
  completedAt?: Date;
  completedBy?: string;
}

export interface CalendarData {
  instances: CalendarInstance[];
  period: {
    start: string;
    end: string;
  };
}

// Dashboard summary types
export interface ChecklistSummary {
  checklistId: string;
  checklistName: string;
  cadence: 'DAILY' | 'DOW' | 'WEEKLY';
  period: {
    start: string;
    end: string;
  };
  required: number;
  completed: number;
  onTime: number;
  completionRate: number;
  onTimeRate: number;
}

export interface ChecklistMetrics {
  totalRequired: number;
  totalCompleted: number;
  totalOnTime: number;
  overallCompletionRate: number;
  overallOnTimeRate: number;
  byChecklist: ChecklistSummary[];
}

// API request/response schemas
export const createChecklistRequestSchema = z.object({
  name: z.string().min(1, "Checklist name is required"),
  description: z.string().optional(),
  items: z.array(z.object({
    label: z.string().min(1, "Item label is required"),
    required: z.boolean().default(true),
    orderIndex: z.number().min(0).default(0)
  })).min(1, "At least one checklist item is required")
});

export const scheduleChecklistRequestSchema = z.object({
  cadence: z.enum(['DAILY', 'DOW', 'WEEKLY'], {
    errorMap: () => ({ message: "Cadence must be DAILY, DOW, or WEEKLY" })
  }),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format").optional(),
  timezone: z.string().default("UTC")
}).refine((_data) => {
  // DOW cadence requires daysOfWeek
  if (_data.cadence === 'DOW') {
    return _data.daysOfWeek && _data.daysOfWeek.length > 0;
  }
  return true;
}, {
  message: "Days of week must be specified for DOW cadence",
  path: ["daysOfWeek"]
}).refine((_data) => {
  // End date must be after start date if provided
  if (_data.endDate) {
    return new Date(_data.endDate) > new Date(_data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export const completeChecklistInstanceRequestSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    checked: z.boolean(),
    note: z.string().optional()
  })),
  confirmationNote: z.string().optional()
});

export const calendarRequestSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "From date must be in YYYY-MM-DD format"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "To date must be in YYYY-MM-DD format")
}).refine((_data) => {
  return new Date(_data.to) >= new Date(_data.from);
}, {
  message: "To date must be on or after from date",
  path: ["to"]
});

export const summariesRequestSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "From date must be in YYYY-MM-DD format"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "To date must be in YYYY-MM-DD format"),
  checklistId: z.string().optional(),
  cadence: z.enum(['DAILY', 'DOW', 'WEEKLY']).optional()
});

export const generateInstancesRequestSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "From date must be in YYYY-MM-DD format"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "To date must be in YYYY-MM-DD format")
});

// Type exports
export type CreateChecklistRequest = z.infer<typeof createChecklistRequestSchema>;
export type ScheduleChecklistRequest = z.infer<typeof scheduleChecklistRequestSchema>;
// eslint-disable-next-line max-len
export type CompleteChecklistInstanceRequest = z.infer<typeof completeChecklistInstanceRequestSchema>;
export type CalendarRequest = z.infer<typeof calendarRequestSchema>;
export type SummariesRequest = z.infer<typeof summariesRequestSchema>;
export type GenerateInstancesRequest = z.infer<typeof generateInstancesRequestSchema>;

// Utility types for scheduling logic
export interface ScheduleWindow {
  start: Date;
  end: Date;
}

export interface GeneratedInstance {
  checklistId: string;
  scheduleId: string;
  targetDate: string;
  status: 'REQUIRED';
  createdAt: Date;
  updatedAt: Date;
}

// CSV export types
export interface ChecklistCSVRecord {
  date_or_week: string;
  checklist_name: string;
  cadence: string;
  required: 'Y' | 'N';
  completed: 'Y' | 'N';
  on_time: 'Y' | 'N';
  completed_at: string;
  completed_by: string;
}

// Error types
export class ChecklistError extends Error {
  constructor(message: string, public _code: string, public _statusCode: number = 400) {
    super(message);
    this.name = 'ChecklistError';
  }
}

export class ScheduleError extends ChecklistError {
  constructor(message: string) {
    super(message, 'SCHEDULE_ERROR', 400);
  }
}

export class InstanceError extends ChecklistError {
  constructor(message: string) {
    super(message, 'INSTANCE_ERROR', 400);
  }
}

export class CompletionError extends ChecklistError {
  constructor(message: string) {
    super(message, 'COMPLETION_ERROR', 400);
  }
}