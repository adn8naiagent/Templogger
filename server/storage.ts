/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type User,
  type InsertUser,
  type UpsertUser,
  type Fridge,
  type InsertFridge,
  type TemperatureLog,
  type InsertTemperatureLog,
  type TimeWindow,
  type InsertTimeWindow,
  type AuditTemplate,
  type AuditSection,
  type AuditItem,
  type AuditCompletion,
  type AuditResponse,
  type InsertAuditTemplate,
  // type InsertAuditSection,
  // type InsertAuditItem,
  type InsertAuditCompletion,
  type InsertAuditResponse,
  type ComplianceRecord,
  type InsertComplianceRecord,
  type Checklist,
  type InsertChecklist,
  type ChecklistItem,
  type InsertChecklistItem,
  type ChecklistCompletion,
  type InsertChecklistCompletion,
  type OutOfRangeEvent,
  type InsertOutOfRangeEvent,
  type CalibrationRecord,
  type InsertCalibrationRecord,
  labels,
  users,
  fridges,
  temperatureLogs,
  timeWindows,
  complianceRecords,
  checklists,
  checklistItems,
  checklistCompletions,
  outOfRangeEvents,
  missedChecks,
  calibrationRecords,
  auditTemplates,
  auditSections,
  auditItems,
  auditCompletions,
  auditResponses,
} from "@shared/schema";

type MissedCheck = typeof missedChecks.$inferSelect;
type InsertMissedCheck = typeof missedChecks.$inferInsert;

type Label = typeof labels.$inferSelect;
type InsertLabel = typeof labels.$inferInsert;
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(_id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(userData: InsertUser): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;
  updateUser(_id: string, _updates: Partial<User>): Promise<User | undefined>;
  deleteUser(_id: string): Promise<boolean>;

  // Fridge methods
  getFridges(_userId: string): Promise<Fridge[]>;
  getFridge(_id: string, _userId: string): Promise<Fridge | undefined>;
  createFridge(fridgeData: InsertFridge): Promise<Fridge>;
  updateFridge(
    _id: string,
    _userId: string,
    _updates: Partial<Fridge>
  ): Promise<Fridge | undefined>;
  deleteFridge(_id: string, _userId: string): Promise<boolean>;

  // Label methods
  getLabels(_userId: string): Promise<Label[]>;
  getLabel(_id: string, _userId: string): Promise<Label | undefined>;
  createLabel(labelData: InsertLabel): Promise<Label>;
  updateLabel(_id: string, _userId: string, _updates: Partial<Label>): Promise<Label | undefined>;
  deleteLabel(_id: string, _userId: string): Promise<boolean>;

  // Temperature log methods
  getTemperatureLogs(_fridgeId: string, _userId: string): Promise<TemperatureLog[]>;
  getRecentTemperatureLog(_fridgeId: string, _userId: string): Promise<TemperatureLog | undefined>;
  createTemperatureLog(logData: InsertTemperatureLog): Promise<TemperatureLog>;
  getAllTemperatureLogsForUser(
    _userId: string
  ): Promise<(TemperatureLog & { fridgeName: string })[]>;

  // Time Window methods
  getTimeWindows(_fridgeId: string, _userId: string): Promise<TimeWindow[]>;
  getTimeWindow(_id: string, _userId: string): Promise<TimeWindow | undefined>;
  createTimeWindow(timeWindowData: InsertTimeWindow): Promise<TimeWindow>;
  updateTimeWindow(
    _id: string,
    _userId: string,
    _updates: Partial<TimeWindow>
  ): Promise<TimeWindow | undefined>;
  deleteTimeWindow(_id: string, _userId: string): Promise<boolean>;
  getCurrentTimeWindow(_fridgeId: string): Promise<TimeWindow | undefined>;

  // Compliance Record methods
  getComplianceRecords(
    _fridgeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceRecord[]>;
  getComplianceRecord(_id: string): Promise<ComplianceRecord | undefined>;
  createComplianceRecord(
    _userId: string,
    _recordData: InsertComplianceRecord
  ): Promise<ComplianceRecord>;
  updateComplianceRecord(
    _id: string,
    _updates: Partial<ComplianceRecord>
  ): Promise<ComplianceRecord | undefined>;
  getComplianceOverview(
    _userId: string,
    date?: Date
  ): Promise<{
    totalFridges: number;
    compliantFridges: number;
    overallComplianceRate: number;
    missedReadings: number;
    outOfRangeEvents: number;
    unresolvedEvents: number;
    recentActivity: {
      temperatureLogsToday: number;
      checklistsCompleted: number;
      lateEntries: number;
    };
    complianceByFridge: {
      _fridgeId: string;
      fridgeName: string;
      complianceScore: number;
      lastReading: string;
      status: "compliant" | "warning" | "critical";
      missedReadings: number;
    }[];
    trends: {
      week: { date: string; compliance: number }[];
      month: { date: string; compliance: number }[];
    };
  }>;

  // Checklist methods
  getChecklists(
    _userId: string,
    _fridgeId?: string
  ): Promise<(Checklist & { items: ChecklistItem[] })[]>;
  getChecklist(
    _id: string,
    _userId: string
  ): Promise<(Checklist & { items: ChecklistItem[] }) | undefined>;
  createChecklist(
    _checklistData: InsertChecklist,
    _items: InsertChecklistItem[]
  ): Promise<Checklist>;
  updateChecklist(
    _id: string,
    _userId: string,
    _updates: Partial<Checklist>
  ): Promise<Checklist | undefined>;
  deleteChecklist(_id: string, _userId: string): Promise<boolean>;

  // Checklist completion methods
  getChecklistCompletions(_checklistId: string, _fridgeId?: string): Promise<ChecklistCompletion[]>;
  createChecklistCompletion(
    _completionData: InsertChecklistCompletion
  ): Promise<ChecklistCompletion>;
  getDueChecklists(_userId: string): Promise<Checklist[]>;

  // Out-of-range event methods
  getOutOfRangeEvents(_fridgeId: string, _resolved?: boolean): Promise<OutOfRangeEvent[]>;
  createOutOfRangeEvent(_eventData: InsertOutOfRangeEvent): Promise<OutOfRangeEvent>;
  resolveOutOfRangeEvent(_id: string, _notes?: string): Promise<OutOfRangeEvent | undefined>;
  getUnresolvedEventsCount(_userId: string): Promise<number>;

  // Enhanced temperature log methods with compliance
  getFridgesWithRecentTemps(_userId: string): Promise<
    (Fridge & {
      recentLog?: TemperatureLog;
      timeWindows: TimeWindow[];
      complianceStatus: string;
      latestCalibration?: CalibrationRecord;
      calibrationStatus: string;
    })[]
  >;
  createTemperatureLogWithCompliance(_logData: InsertTemperatureLog): Promise<{
    log: TemperatureLog;
    alert?: { message: string; severity: string };
    outOfRangeEvent?: OutOfRangeEvent;
  }>;

  // Admin methods
  getActiveAlertsCount(): Promise<number>;

  // Missed checks methods
  getMissedChecks(_fridgeId: string, _userId: string): Promise<MissedCheck[]>;
  createMissedCheck(_missedCheckData: InsertMissedCheck): Promise<MissedCheck>;
  overrideMissedCheck(
    _id: string,
    _userId: string,
    _overrideReason: string
  ): Promise<MissedCheck | undefined>;
  getMissedChecksForDate(
    _userId: string,
    _date: Date
  ): Promise<(MissedCheck & { fridgeName: string })[]>;

  // New fridge management methods
  getAllFridgesWithLogs(_userId: string): Promise<any[]>;
  getFridgeWithLogs(_userId: string, _fridgeId: string): Promise<any>;
  deactivateFridge(_userId: string, _fridgeId: string): Promise<any>;
  reactivateFridge(_userId: string, _fridgeId: string): Promise<any>;

  // Self-audit methods
  getAuditTemplates(_userId: string): Promise<
    (AuditTemplate & {
      sections: (AuditSection & { items: AuditItem[] })[];
    })[]
  >;
  getAuditTemplate(
    _templateId: string,
    _userId: string
  ): Promise<(AuditTemplate & { sections: (AuditSection & { items: AuditItem[] })[] }) | undefined>;
  createAuditTemplate(
    _templateData: InsertAuditTemplate,
    ____sectionsData: {
      sections: Array<{
        title: string;
        description?: string;
        orderIndex: number;
        items: Array<{ text: string; isRequired: boolean; orderIndex: number; note?: string }>;
      }>;
    }
  ): Promise<AuditTemplate>;
  updateAuditTemplate(
    _templateId: string,
    _userId: string,
    _templateData: Partial<AuditTemplate>,
    ____sectionsData?: {
      sections: Array<{
        id?: string;
        title: string;
        description?: string;
        orderIndex: number;
        items: Array<{
          id?: string;
          text: string;
          isRequired: boolean;
          orderIndex: number;
          note?: string;
        }>;
      }>;
    }
  ): Promise<AuditTemplate | undefined>;
  deleteAuditTemplate(_templateId: string, _userId: string): Promise<boolean>;
  createDefaultAuditTemplate(_userId: string): Promise<AuditTemplate>;

  // Self-audit completion methods
  createAuditCompletion(
    _completionData: InsertAuditCompletion,
    _responsesData: InsertAuditResponse[]
  ): Promise<AuditCompletion>;
  getAuditCompletions(
    _userId: string,
    _filters?: { templateId?: string; startDate?: Date; endDate?: Date; completedBy?: string }
  ): Promise<(AuditCompletion & { responses: AuditResponse[]; complianceRate: number })[]>;
  getAuditCompletion(
    _completionId: string,
    _userId: string
  ): Promise<
    (AuditCompletion & { responses: AuditResponse[]; template?: AuditTemplate }) | undefined
  >;
  getAuditCompletionStats(_userId: string): Promise<{
    totalCompletions: number;
    averageCompliance: number;
    recentCompletions: AuditCompletion[];
  }>;

  // Calibration record methods
  getCalibrationRecords(_fridgeId: string, _userId: string): Promise<CalibrationRecord[]>;
  getCalibrationRecord(_id: string, _userId: string): Promise<CalibrationRecord | undefined>;
  createCalibrationRecord(_recordData: InsertCalibrationRecord): Promise<CalibrationRecord>;
  updateCalibrationRecord(
    _id: string,
    _userId: string,
    _updates: Partial<CalibrationRecord>
  ): Promise<CalibrationRecord | undefined>;
  deleteCalibrationRecord(_id: string, _userId: string): Promise<boolean>;
  getLatestCalibrationForFridge(
    _fridgeId: string,
    _userId: string
  ): Promise<CalibrationRecord | undefined>;
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });
    this.db = drizzle(sql);
  }

  async getUser(_id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users._id, _id)).limit(1);
    return result[0]!;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0]!;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users).orderBy(users.createdAt);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(userData).returning();
    return result[0]!;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await this.db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users._id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0]!;
  }

  async updateUser(_id: string, _updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({
        ..._updates,
        updatedAt: new Date(),
      })
      .where(eq(users._id, _id))
      .returning();
    return result[0]!;
  }

  async deleteUser(_id: string): Promise<boolean> {
    try {
      await this.db.delete(users).where(eq(users._id, _id));
      return true;
    } catch (_) {
      return false;
    }
  }

  // Fridge methods
  async getFridges(_userId: string): Promise<Fridge[]> {
    const result = await this.db
      .select()
      .from(fridges)
      .where(eq(fridges._userId, _userId))
      .orderBy(fridges.createdAt);
    // eslint-disable-next-line no-console
    console.log(`[getFridges] User ${_userId}: Found ${result.length} fridges`);
    return result;
  }

  async getFridge(_id: string, _userId: string): Promise<any | undefined> {
    const result = await this.db
      .select()
      .from(fridges)
      .where(and(eq(fridges._id, _id), eq(fridges._userId, _userId)))
      .limit(1);

    const fridge = result[0];
    if (!fridge) {
      return undefined;
    }

    // Get associated time windows
    const fridgeTimeWindows = await this.db
      .select()
      .from(timeWindows)
      .where(and(eq(timeWindows._fridgeId, _id), eq(timeWindows.isActive, true)))
      .orderBy(timeWindows.createdAt);

    return {
      ...fridge,
      timeWindows: fridgeTimeWindows,
    };
  }

  async createFridge(fridgeData: InsertFridge): Promise<Fridge> {
    // eslint-disable-next-line no-console
    console.log(`[createFridge] Creating fridge for user: ${fridgeData._userId}`);
    const result = await this.db.insert(fridges).values(fridgeData).returning();
    // eslint-disable-next-line no-console
    console.log(`[createFridge] Created fridge with ID: ${result[0]?._id}`);
    return result[0]!;
  }

  async updateFridge(_id: string, _userId: string, _updates: any): Promise<Fridge | undefined> {
    // Extract time windows from updates
    const { timeWindows: newTimeWindows, ...fridgeUpdates } = _updates;

    // Update the fridge record
    const result = await this.db
      .update(fridges)
      .set({
        ...fridgeUpdates,
        updatedAt: new Date(),
      })
      .where(and(eq(fridges._id, _id), eq(fridges._userId, _userId)))
      .returning();

    if (!result[0]) {
      return undefined;
    }

    // If time windows are provided, update them
    if (newTimeWindows !== undefined) {
      // Delete existing time windows for this fridge
      await this.db.delete(timeWindows).where(eq(timeWindows._fridgeId, _id));

      // Insert new time windows if any
      if (Array.isArray(newTimeWindows) && newTimeWindows.length > 0) {
        const timeWindowInserts = newTimeWindows.map((tw: any) => ({
          _userId,
          _fridgeId: _id,
          label: tw.label,
          checkType: tw.checkType,
          startTime: tw.startTime,
          endTime: tw.endTime,
          excludedDays: tw.excludedDays || [],
          isActive: true,
        }));

        await this.db.insert(timeWindows).values(timeWindowInserts);
      }
    }

    return result[0]!;
  }

  async deleteFridge(_id: string, _userId: string): Promise<boolean> {
    try {
      // Delete all related data first (cascading delete)
      await this.db.delete(temperatureLogs).where(eq(temperatureLogs._fridgeId, _id));
      await this.db.delete(timeWindows).where(eq(timeWindows._fridgeId, _id));
      await this.db.delete(missedChecks).where(eq(missedChecks._fridgeId, _id));

      // Delete the fridge
      const result = await this.db
        .delete(fridges)
        .where(and(eq(fridges._id, _id), eq(fridges._userId, _userId)));

      return result.length > 0;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting fridge:", error);
      return false;
    }
  }

  // Label methods
  async getLabels(_userId: string): Promise<Label[]> {
    return await this.db
      .select()
      .from(labels)
      .where(eq(labels._userId, _userId))
      .orderBy(labels.createdAt);
  }

  async getLabel(_id: string, _userId: string): Promise<Label | undefined> {
    const result = await this.db
      .select()
      .from(labels)
      .where(and(eq(labels._id, _id), eq(labels._userId, _userId)))
      .limit(1);
    return result[0]!;
  }

  async createLabel(labelData: InsertLabel): Promise<Label> {
    const result = await this.db.insert(labels).values(labelData).returning();
    return result[0]!;
  }

  async updateLabel(
    _id: string,
    _userId: string,
    _updates: Partial<Label>
  ): Promise<Label | undefined> {
    const result = await this.db
      .update(labels)
      .set(_updates)
      .where(and(eq(labels._id, _id), eq(labels._userId, _userId)))
      .returning();
    return result[0]!;
  }

  async deleteLabel(_id: string, _userId: string): Promise<boolean> {
    try {
      await this.db.delete(labels).where(and(eq(labels._id, _id), eq(labels._userId, _userId)));
      return true;
    } catch (_) {
      return false;
    }
  }

  // Temperature log methods
  async getTemperatureLogs(_fridgeId: string, _userId: string): Promise<TemperatureLog[]> {
    // First verify the fridge belongs to the user
    const fridge = await this.getFridge(_fridgeId, _userId);
    if (!fridge) return [];

    return await this.db
      .select()
      .from(temperatureLogs)
      .where(eq(temperatureLogs._fridgeId, _fridgeId))
      .orderBy(desc(temperatureLogs.createdAt));
  }

  async getRecentTemperatureLog(
    _fridgeId: string,
    _userId: string
  ): Promise<TemperatureLog | undefined> {
    const logs = await this.getTemperatureLogs(_fridgeId, _userId);
    return logs[0];
  }

  async createTemperatureLog(logData: InsertTemperatureLog): Promise<TemperatureLog> {
    const result = await this.db.insert(temperatureLogs).values(logData).returning();
    return result[0]!;
  }

  async getAllTemperatureLogsForUser(
    _userId: string
  ): Promise<(TemperatureLog & { fridgeName: string })[]> {
    const result = await this.db
      .select({
        _id: temperatureLogs._id,
        _userId: temperatureLogs._userId,
        _fridgeId: temperatureLogs._fridgeId,
        timeWindowId: temperatureLogs.timeWindowId,
        temperature: temperatureLogs.currentTempReading,
        minTempReading: temperatureLogs.minTempReading,
        maxTempReading: temperatureLogs.maxTempReading,
        currentTempReading: temperatureLogs.currentTempReading,
        personName: temperatureLogs.personName,
        isAlert: temperatureLogs.isAlert,
        isOnTime: temperatureLogs.isOnTime,
        lateReason: temperatureLogs.lateReason,
        correctiveAction: temperatureLogs.correctiveAction,
        correctiveNotes: temperatureLogs.correctiveNotes,
        createdAt: temperatureLogs.createdAt,
        fridgeName: fridges.name,
      })
      .from(temperatureLogs)
      .innerJoin(fridges, eq(temperatureLogs._fridgeId, fridges._id))
      .where(eq(fridges._userId, _userId))
      .orderBy(desc(temperatureLogs.createdAt));

    return result;
  }

  // Time Window methods
  async getTimeWindows(_fridgeId: string, _userId: string): Promise<TimeWindow[]> {
    const result = await this.db
      .select()
      .from(timeWindows)
      .innerJoin(fridges, eq(timeWindows._fridgeId, fridges._id))
      .where(and(eq(timeWindows._fridgeId, _fridgeId), eq(fridges._userId, _userId)))
      .orderBy(timeWindows.startTime);
    return result.map((r) => r.time_windows);
  }

  async getTimeWindow(_id: string, _userId: string): Promise<TimeWindow | undefined> {
    const result = await this.db
      .select()
      .from(timeWindows)
      .innerJoin(fridges, eq(timeWindows._fridgeId, fridges._id))
      .where(and(eq(timeWindows._id, _id), eq(fridges._userId, _userId)))
      .limit(1);
    return result[0]?.time_windows;
  }

  async createTimeWindow(timeWindowData: InsertTimeWindow): Promise<TimeWindow> {
    const result = await this.db.insert(timeWindows).values(timeWindowData).returning();
    return result[0]!;
  }

  async updateTimeWindow(
    _id: string,
    _userId: string,
    _updates: Partial<TimeWindow>
  ): Promise<TimeWindow | undefined> {
    const timeWindow = await this.getTimeWindow(_id, _userId);
    if (!timeWindow) return undefined;

    const result = await this.db
      .update(timeWindows)
      .set(_updates)
      .where(eq(timeWindows._id, _id))
      .returning();
    return result[0]!;
  }

  async deleteTimeWindow(_id: string, _userId: string): Promise<boolean> {
    const timeWindow = await this.getTimeWindow(_id, _userId);
    if (!timeWindow) return false;

    try {
      await this.db.delete(timeWindows).where(eq(timeWindows._id, _id));
      return true;
    } catch (_) {
      return false;
    }
  }

  async getCurrentTimeWindow(_fridgeId: string): Promise<TimeWindow | undefined> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const result = await this.db
      .select()
      .from(timeWindows)
      .where(and(eq(timeWindows._fridgeId, _fridgeId), eq(timeWindows.isActive, true)));

    return result.find(
      (tw) => tw.startTime && tw.endTime && tw.startTime <= currentTime && tw.endTime >= currentTime
    );
  }

  // Compliance Record methods
  async getComplianceRecords(
    _fridgeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceRecord[]> {
    return await this.db
      .select()
      .from(complianceRecords)
      .where(
        and(
          eq(complianceRecords._fridgeId, _fridgeId),
          and(
            sql`${complianceRecords.date} >= ${startDate}`,
            sql`${complianceRecords.date} <= ${endDate}`
          )
        )
      )
      .orderBy(desc(complianceRecords.date));
  }

  async getComplianceRecord(_id: string): Promise<ComplianceRecord | undefined> {
    const result = await this.db
      .select()
      .from(complianceRecords)
      .where(eq(complianceRecords._id, _id))
      .limit(1);
    return result[0]!;
  }

  async createComplianceRecord(
    _userId: string,
    _recordData: InsertComplianceRecord
  ): Promise<ComplianceRecord> {
    const result = await this.db
      .insert(complianceRecords)
      .values({ ..._recordData, _userId })
      .returning();
    return result[0]!;
  }

  async updateComplianceRecord(
    _id: string,
    _updates: Partial<ComplianceRecord>
  ): Promise<ComplianceRecord | undefined> {
    const result = await this.db
      .update(complianceRecords)
      .set({ ..._updates, updatedAt: new Date() })
      .where(eq(complianceRecords._id, _id))
      .returning();
    return result[0]!;
  }

  async getComplianceOverview(
    _userId: string,
    date?: Date
  ): Promise<{
    totalFridges: number;
    compliantFridges: number;
    overallComplianceRate: number;
    missedReadings: number;
    outOfRangeEvents: number;
    unresolvedEvents: number;
    recentActivity: {
      temperatureLogsToday: number;
      checklistsCompleted: number;
      lateEntries: number;
    };
    complianceByFridge: {
      _fridgeId: string;
      fridgeName: string;
      complianceScore: number;
      lastReading: string;
      status: "compliant" | "warning" | "critical";
      missedReadings: number;
    }[];
    trends: {
      week: { date: string; compliance: number }[];
      month: { date: string; compliance: number }[];
    };
  }> {
    const targetDate = date || new Date();
    const targetDateStr = targetDate.toISOString().split("T")[0]; // Convert to YYYY-MM-DD format
    const userFridges = await this.getFridges(_userId);

    // Get today's temperature logs
    const todayLogs = await this.db
      .select()
      .from(temperatureLogs)
      .innerJoin(fridges, eq(temperatureLogs._fridgeId, fridges._id))
      .where(
        and(
          eq(fridges._userId, _userId),
          sql`DATE(${temperatureLogs.createdAt}) = ${targetDateStr}`
        )
      );

    // Get all temperature logs for user (for overall stats)
    const allUserLogs = await this.db
      .select()
      .from(temperatureLogs)
      .innerJoin(fridges, eq(temperatureLogs._fridgeId, fridges._id))
      .where(eq(fridges._userId, _userId));

    // Calculate basic stats
    const lateEntries = todayLogs.filter((log) => !log.temperature_logs.isOnTime).length;
    const compliantFridges = userFridges.filter((fridge) =>
      todayLogs.some((log) => log.temperature_logs._fridgeId === fridge._id)
    ).length;

    // Get out-of-range events count
    const outOfRangeEventsCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(outOfRangeEvents)
      .innerJoin(fridges, eq(outOfRangeEvents._fridgeId, fridges._id))
      .where(eq(fridges._userId, _userId));

    const unresolvedEventsCount = await this.getUnresolvedEventsCount(_userId);

    // Calculate overall compliance rate
    const totalLogs = allUserLogs.length;
    const alertLogs = allUserLogs.filter((log) => log.temperature_logs.isAlert).length;
    const overallComplianceRate = totalLogs > 0 ? ((totalLogs - alertLogs) / totalLogs) * 100 : 0;

    // Get checklist completions for today
    const todayChecklistsCompleted = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(checklistCompletions)
      .innerJoin(checklists, eq(checklistCompletions.checklistId, checklists._id))
      .where(
        and(
          eq(checklists.createdBy, _userId),
          sql`DATE(${checklistCompletions.completedAt}) = ${targetDateStr}`
        )
      );

    // Build compliance by fridge data
    const complianceByFridge = await Promise.all(
      userFridges.map(async (fridge) => {
        // Get recent logs for this fridge
        const fridgeLogs = await this.db
          .select()
          .from(temperatureLogs)
          .where(eq(temperatureLogs._fridgeId, fridge._id))
          .orderBy(desc(temperatureLogs.createdAt))
          .limit(10);

        const fridgeAlertLogs = fridgeLogs.filter((log) => log.isAlert);
        const complianceScore =
          fridgeLogs.length > 0
            ? ((fridgeLogs.length - fridgeAlertLogs.length) / fridgeLogs.length) * 100
            : 0;

        // Get last reading
        const lastReading =
          fridgeLogs.length > 0
            ? fridgeLogs[0]!.createdAt!.toISOString()
            : new Date().toISOString();

        // Determine status
        let _status: "compliant" | "warning" | "critical" = "compliant";
        if (complianceScore < 70) _status = "critical";
        else if (complianceScore < 90) _status = "warning";

        // Count missed readings (fridges that should have had readings today but didn't)
        const todayFridgeLogs = todayLogs.filter(
          (log) => log.temperature_logs._fridgeId === fridge._id
        );
        const missedReadings = todayFridgeLogs.length === 0 ? 1 : 0; // Simple logic for now

        return {
          _fridgeId: fridge._id,
          fridgeName: fridge.name,
          complianceScore: Math.round(complianceScore),
          lastReading,
          status: _status,
          missedReadings,
        };
      })
    );

    // Generate basic trends (simplified for now)
    const trends = {
      week: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
        compliance: Math.round(overallComplianceRate + (Math.random() - 0.5) * 10),
      })),
      month: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
        compliance: Math.round(overallComplianceRate + (Math.random() - 0.5) * 15),
      })),
    };

    return {
      totalFridges: userFridges.length,
      compliantFridges,
      overallComplianceRate: Math.round(overallComplianceRate * 10) / 10, // Round to 1 decimal place
      missedReadings: userFridges.length - compliantFridges,
      outOfRangeEvents: outOfRangeEventsCount[0]?.count || 0,
      unresolvedEvents: unresolvedEventsCount,
      recentActivity: {
        temperatureLogsToday: todayLogs.length,
        checklistsCompleted: todayChecklistsCompleted[0]?.count || 0,
        lateEntries,
      },
      complianceByFridge,
      trends,
    };
  }

  // Checklist methods
  async getChecklists(
    _userId: string,
    _fridgeId?: string
  ): Promise<(Checklist & { items: ChecklistItem[] })[]> {
    const whereConditions = [eq(checklists.createdBy, _userId)];
    if (_fridgeId) {
      whereConditions.push(eq(checklists._fridgeId, _fridgeId));
    }

    const checklistsResult = await this.db
      .select()
      .from(checklists)
      .where(and(...whereConditions))
      .orderBy(checklists.createdAt);

    const checklistsWithItems = await Promise.all(
      checklistsResult.map(async (checklist) => {
        const items = await this.db
          .select()
          .from(checklistItems)
          .where(eq(checklistItems.checklistId, checklist._id))
          .orderBy(checklistItems.sortOrder);
        return { ...checklist, items };
      })
    );

    return checklistsWithItems;
  }

  async getChecklist(
    _id: string,
    _userId: string
  ): Promise<(Checklist & { items: ChecklistItem[] }) | undefined> {
    const result = await this.db
      .select()
      .from(checklists)
      .where(and(eq(checklists._id, _id), eq(checklists.createdBy, _userId)))
      .limit(1);

    if (!result[0]) return undefined;

    const items = await this.db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.checklistId, _id))
      .orderBy(checklistItems.sortOrder);

    return { ...result[0], items };
  }

  async createChecklist(
    checklistData: InsertChecklist,
    items: InsertChecklistItem[]
  ): Promise<Checklist> {
    const checklistResult = await this.db.insert(checklists).values(checklistData).returning();
    const checklist = checklistResult[0];

    // Insert checklist items
    if (items.length > 0) {
      const itemsWithChecklistId = items.map((item, index) => ({
        ...item,
        _userId: checklist!.createdBy,
        checklistId: checklist!._id,
        sortOrder: index.toString(),
      }));
      await this.db.insert(checklistItems).values(itemsWithChecklistId);
    }

    return checklist!;
  }

  async updateChecklist(
    _id: string,
    _userId: string,
    _updates: Partial<Checklist>
  ): Promise<Checklist | undefined> {
    const existing = await this.getChecklist(_id, _userId);
    if (!existing) return undefined;

    const result = await this.db
      .update(checklists)
      .set(_updates)
      .where(eq(checklists._id, _id))
      .returning();
    return result[0]!;
  }

  async deleteChecklist(_id: string, _userId: string): Promise<boolean> {
    const existing = await this.getChecklist(_id, _userId);
    if (!existing) return false;

    try {
      // Delete checklist items first
      await this.db.delete(checklistItems).where(eq(checklistItems.checklistId, _id));
      // Delete checklist
      await this.db.delete(checklists).where(eq(checklists._id, _id));
      return true;
    } catch (_) {
      return false;
    }
  }

  // Checklist completion methods
  async getChecklistCompletions(
    _checklistId: string,
    _fridgeId?: string
  ): Promise<ChecklistCompletion[]> {
    const whereConditions = [eq(checklistCompletions.checklistId, _checklistId)];
    if (_fridgeId) {
      whereConditions.push(eq(checklistCompletions._fridgeId, _fridgeId));
    }

    return await this.db
      .select()
      .from(checklistCompletions)
      .where(and(...whereConditions))
      .orderBy(desc(checklistCompletions.completedAt));
  }

  async createChecklistCompletion(
    _completionData: InsertChecklistCompletion
  ): Promise<ChecklistCompletion> {
    const result = await this.db
      .insert(checklistCompletions)
      .values({ ..._completionData, _userId: _completionData.completedBy })
      .returning();
    return result[0]!;
  }

  async getDueChecklists(_userId: string): Promise<Checklist[]> {
    // Get all active checklists for user
    const userChecklists = await this.db
      .select()
      .from(checklists)
      .where(and(eq(checklists.createdBy, _userId), eq(checklists.isActive, true)));

    // Filter based on frequency and last completion
    const dueChecklists = [];
    const today = new Date();

    for (const checklist of userChecklists) {
      const lastCompletion = await this.db
        .select()
        .from(checklistCompletions)
        .where(eq(checklistCompletions.checklistId, checklist._id))
        .orderBy(desc(checklistCompletions.completedAt))
        .limit(1);

      let isDue = false;
      if (lastCompletion.length === 0) {
        isDue = true; // Never completed
      } else {
        const lastCompletedDate = new Date(lastCompletion[0]?.completedAt!);
        const daysDiff = Math.floor(
          (today.getTime() - lastCompletedDate.getTime()) / (1000 * 3600 * 24)
        );

        switch (checklist.frequency) {
          case "daily":
            isDue = daysDiff >= 1;
            break;
          case "weekly":
            isDue = daysDiff >= 7;
            break;
          case "monthly":
            isDue = daysDiff >= 30;
            break;
        }
      }

      if (isDue) {
        dueChecklists.push(checklist);
      }
    }

    return dueChecklists;
  }

  // Out-of-range event methods
  async getOutOfRangeEvents(_fridgeId: string, resolved?: boolean): Promise<OutOfRangeEvent[]> {
    const whereConditions = [eq(outOfRangeEvents._fridgeId, _fridgeId)];

    if (resolved !== undefined) {
      if (resolved) {
        whereConditions.push(sql`${outOfRangeEvents.resolvedAt} IS NOT NULL`);
      } else {
        whereConditions.push(sql`${outOfRangeEvents.resolvedAt} IS NULL`);
      }
    }

    return await this.db
      .select()
      .from(outOfRangeEvents)
      .where(and(...whereConditions))
      .orderBy(desc(outOfRangeEvents.createdAt));
  }

  async createOutOfRangeEvent(eventData: InsertOutOfRangeEvent): Promise<OutOfRangeEvent> {
    // Get the userId from the fridge associated with this event
    const fridge = await this.db
      .select({ _userId: fridges._userId })
      .from(fridges)
      .where(eq(fridges._id, eventData._fridgeId))
      .limit(1);

    if (!fridge[0]) {
      throw new Error(`Fridge not found: ${eventData._fridgeId}`);
    }

    const result = await this.db
      .insert(outOfRangeEvents)
      .values({ ...eventData, _userId: fridge[0]._userId })
      .returning();
    return result[0]!;
  }

  async resolveOutOfRangeEvent(_id: string, notes?: string): Promise<OutOfRangeEvent | undefined> {
    const result = await this.db
      .update(outOfRangeEvents)
      .set({
        resolvedAt: new Date(),
        notes: notes || outOfRangeEvents.notes,
      })
      .where(eq(outOfRangeEvents._id, _id))
      .returning();
    return result[0]!;
  }

  async getUnresolvedEventsCount(_userId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(outOfRangeEvents)
      .innerJoin(fridges, eq(outOfRangeEvents._fridgeId, fridges._id))
      .where(and(eq(fridges._userId, _userId), sql`${outOfRangeEvents.resolvedAt} IS NULL`));
    return result.length;
  }

  // Enhanced temperature log methods with compliance
  async getFridgesWithRecentTemps(_userId: string): Promise<
    (Fridge & {
      recentLog?: TemperatureLog;
      timeWindows: TimeWindow[];
      complianceStatus: string;
      latestCalibration?: CalibrationRecord;
      calibrationStatus: string;
    })[]
  > {
    const userFridges = await this.getFridges(_userId);

    const fridgesWithData = await Promise.all(
      userFridges.map(async (fridge) => {
        const recentLog = await this.getRecentTemperatureLog(fridge._id, _userId);
        const fridgeTimeWindows = await this.getTimeWindows(fridge._id, _userId);
        const latestCalibration = await this.getLatestCalibrationForFridge(fridge._id, _userId);

        // Calculate calibration status
        let calibrationStatus = "no-calibration";
        if (latestCalibration) {
          const nextDue = new Date(latestCalibration.nextCalibrationDue);
          const now = new Date();
          const daysDiff = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff < 0) {
            calibrationStatus = "overdue";
          } else if (daysDiff <= 30) {
            calibrationStatus = "due-soon";
          } else {
            calibrationStatus = "current";
          }
        }

        // Calculate compliance _status, considering active status
        let complianceStatus = "compliant";
        if (!fridge.isActive) {
          complianceStatus = "inactive";
        } else if (recentLog?.isAlert) {
          complianceStatus = "alert";
        } else if (recentLog && !recentLog.isOnTime) {
          complianceStatus = "late";
        } else if (!recentLog) {
          complianceStatus = "missing";
        }

        // Calculate compliance score based on recent activity
        let complianceScore = 100;
        if (!fridge.isActive) {
          complianceScore = 0;
        } else if (recentLog?.isAlert) {
          complianceScore = 60;
        } else if (recentLog && !recentLog.isOnTime) {
          complianceScore = 80;
        } else if (!recentLog) {
          complianceScore = 50;
        }

        return {
          ...fridge,
          recentLog,
          timeWindows: fridgeTimeWindows,
          complianceStatus,
          complianceScore,
          isAlarm: recentLog?.isAlert || false,
          status:
            complianceStatus === "alert"
              ? "critical"
              : complianceStatus === "late"
                ? "warning"
                : "good",
          latestCalibration,
          calibrationStatus,
        };
      })
    );

    return fridgesWithData;
  }

  async createTemperatureLogWithCompliance(logData: InsertTemperatureLog): Promise<{
    log: TemperatureLog;
    alert?: { message: string; severity: string };
    outOfRangeEvent?: OutOfRangeEvent;
  }> {
    // Create temperature log
    const log = await this.createTemperatureLog(logData);

    // Get fridge to check temperature ranges
    const fridge = await this.db
      .select()
      .from(fridges)
      .where(eq(fridges._id, logData._fridgeId))
      .limit(1);

    if (!fridge[0]) {
      return { log };
    }

    const fridgeData = fridge[0];
    const temp = parseFloat(log.currentTempReading);
    const minTemp = parseFloat(fridgeData.minTemp);
    const maxTemp = parseFloat(fridgeData.maxTemp);

    let alert;
    let outOfRangeEvent;

    // Check if temperature is out of range
    if (temp < minTemp || temp > maxTemp) {
      const severity =
        temp < minTemp - 2 || temp > maxTemp + 2
          ? "critical"
          : temp < minTemp - 1 || temp > maxTemp + 1
            ? "high"
            : "medium";

      alert = {
        message: `Temperature ${temp}°C is outside acceptable range (${minTemp}°C - ${maxTemp}°C)`,
        severity,
      };

      // Create out-of-range event
      const eventData: InsertOutOfRangeEvent = {
        temperatureLogId: log._id,
        _fridgeId: log._fridgeId,
        violationType: "current", // TODO: Determine violation type based on which reading is out of range
        minTempReading: log.minTempReading,
        maxTempReading: log.maxTempReading,
        currentTempReading: log.currentTempReading,
        expectedMin: fridgeData.minTemp,
        expectedMax: fridgeData.maxTemp,
        severity,
        correctiveAction: logData.correctiveAction || null,
        notes: logData.correctiveNotes || null,
      };

      outOfRangeEvent = await this.createOutOfRangeEvent(eventData);
    }

    return { log, alert, outOfRangeEvent };
  }

  async getActiveAlertsCount(): Promise<number> {
    // Count temperature logs that are outside their fridge's acceptable range
    const logs = await this.db
      .select({
        temperature: temperatureLogs.currentTempReading,
        minTemp: fridges.minTemp,
        maxTemp: fridges.maxTemp,
      })
      .from(temperatureLogs)
      .innerJoin(fridges, eq(temperatureLogs._fridgeId, fridges._id))
      .orderBy(desc(temperatureLogs.createdAt))
      .limit(100); // Check recent logs

    const alertCount = logs.filter((log) => {
      const temp = parseFloat(log.temperature);
      const minTemp = parseFloat(log.minTemp);
      const maxTemp = parseFloat(log.maxTemp);
      return temp < minTemp || temp > maxTemp;
    }).length;

    return alertCount;
  }

  // Missed checks methods implementation
  async getMissedChecks(_fridgeId: string, _userId: string): Promise<MissedCheck[]> {
    // Verify fridge ownership
    const fridge = await this.getFridge(_fridgeId, _userId);
    if (!fridge) return [];

    return await this.db
      .select()
      .from(missedChecks)
      .where(eq(missedChecks._fridgeId, _fridgeId))
      .orderBy(desc(missedChecks.missedDate));
  }

  async createMissedCheck(missedCheckData: InsertMissedCheck): Promise<MissedCheck> {
    const result = await this.db.insert(missedChecks).values(missedCheckData).returning();
    return result[0]!;
  }

  async overrideMissedCheck(
    _id: string,
    _userId: string,
    overrideReason: string
  ): Promise<MissedCheck | undefined> {
    // Verify the missed check belongs to a fridge owned by the user
    const result = await this.db
      .select({
        missedCheck: missedChecks,
        fridge: fridges,
      })
      .from(missedChecks)
      .leftJoin(fridges, eq(missedChecks._fridgeId, fridges._id))
      .where(and(eq(missedChecks._id, _id), eq(fridges._userId, _userId)))
      .limit(1);

    if (!result[0]) return undefined;

    const updated = await this.db
      .update(missedChecks)
      .set({
        isOverridden: true,
        overrideReason,
        overriddenBy: _userId,
        overriddenAt: new Date(),
      })
      .where(eq(missedChecks._id, _id))
      .returning();

    return updated[0];
  }

  async getMissedChecksForDate(
    _userId: string,
    date: Date
  ): Promise<(MissedCheck & { fridgeName: string })[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.db
      .select({
        _id: missedChecks._id,
        _userId: missedChecks._userId,
        _fridgeId: missedChecks._fridgeId,
        timeWindowId: missedChecks.timeWindowId,
        missedDate: missedChecks.missedDate,
        checkType: missedChecks.checkType,
        reason: missedChecks.reason,
        isOverridden: missedChecks.isOverridden,
        overrideReason: missedChecks.overrideReason,
        overriddenBy: missedChecks.overriddenBy,
        overriddenAt: missedChecks.overriddenAt,
        createdAt: missedChecks.createdAt,
        fridgeName: fridges.name,
      })
      .from(missedChecks)
      .innerJoin(fridges, eq(missedChecks._fridgeId, fridges._id))
      .where(
        and(
          eq(fridges._userId, _userId),
          sql`${missedChecks.missedDate} >= ${startOfDay}`,
          sql`${missedChecks.missedDate} <= ${endOfDay}`
        )
      )
      .orderBy(desc(missedChecks.missedDate));
  }

  // New fridge management methods implementation
  async getAllFridgesWithLogs(_userId: string): Promise<any[]> {
    try {
      return await this.db
        .select({
          _id: fridges._id,
          name: fridges.name,
          location: fridges.location,
          notes: fridges.notes,
          color: fridges.color,
          labels: fridges.labels,
          minTemp: fridges.minTemp,
          maxTemp: fridges.maxTemp,
          isActive: fridges.isActive,
          createdAt: fridges.createdAt,
          updatedAt: fridges.updatedAt,
          lastTemperature: sql<number>`
            (SELECT temperature FROM ${temperatureLogs} 
             WHERE fridge_id = ${fridges._id} 
             ORDER BY created_at DESC LIMIT 1)`,
          lastReading: sql<string>`
            (SELECT created_at FROM ${temperatureLogs} 
             WHERE fridge_id = ${fridges._id} 
             ORDER BY created_at DESC LIMIT 1)`,
          logsCount: sql<number>`
            (SELECT COUNT(*) FROM ${temperatureLogs} 
             WHERE fridge_id = ${fridges._id})`,
          recentAlert: sql<boolean>`
            (SELECT is_alert FROM ${temperatureLogs} 
             WHERE fridge_id = ${fridges._id} 
             ORDER BY created_at DESC LIMIT 1)`,
        })
        .from(fridges)
        .where(eq(fridges._userId, _userId))
        .orderBy(desc(fridges.isActive), fridges.name);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error getting all fridges with logs:", error);
      throw error;
    }
  }

  async getFridgeWithLogs(_userId: string, _fridgeId: string): Promise<any> {
    try {
      const [fridge] = await this.db
        .select()
        .from(fridges)
        .where(and(eq(fridges._id, _fridgeId), eq(fridges._userId, _userId)));

      if (!fridge) {
        return null;
      }

      const logs = await this.db
        .select({
          _id: temperatureLogs._id,
          temperature: temperatureLogs.currentTempReading,
          minTempReading: temperatureLogs.minTempReading,
          maxTempReading: temperatureLogs.maxTempReading,
          currentTempReading: temperatureLogs.currentTempReading,
          personName: temperatureLogs.personName,
          isAlert: temperatureLogs.isAlert,
          isOnTime: temperatureLogs.isOnTime,
          lateReason: temperatureLogs.lateReason,
          correctiveAction: temperatureLogs.correctiveAction,
          correctiveNotes: temperatureLogs.correctiveNotes,
          createdAt: temperatureLogs.createdAt,
          fridgeName: fridges.name,
        })
        .from(temperatureLogs)
        .innerJoin(fridges, eq(temperatureLogs._fridgeId, fridges._id))
        .where(eq(temperatureLogs._fridgeId, _fridgeId))
        .orderBy(desc(temperatureLogs.createdAt));

      const lastLog = logs[0];

      return {
        ...fridge,
        logs,
        lastTemperature: lastLog?.temperature || null,
        lastReading: lastLog?.createdAt || null,
        recentAlert: lastLog?.isAlert || false,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error getting fridge with logs:", error);
      throw error;
    }
  }

  async deactivateFridge(_userId: string, _fridgeId: string): Promise<any> {
    try {
      const [updated] = await this.db
        .update(fridges)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(eq(fridges._id, _fridgeId), eq(fridges._userId, _userId)))
        .returning();

      return updated;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deactivating fridge:", error);
      throw error;
    }
  }

  async reactivateFridge(_userId: string, _fridgeId: string): Promise<any> {
    try {
      const [updated] = await this.db
        .update(fridges)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(and(eq(fridges._id, _fridgeId), eq(fridges._userId, _userId)))
        .returning();

      return updated;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error reactivating fridge:", error);
      throw error;
    }
  }

  // Self-audit template methods
  async getAuditTemplates(
    _userId: string
  ): Promise<(AuditTemplate & { sections: (AuditSection & { items: AuditItem[] })[] })[]> {
    const templates = await this.db
      .select()
      .from(auditTemplates)
      .where(eq(auditTemplates._userId, _userId))
      .orderBy(auditTemplates.name);

    const templatesWithSections = await Promise.all(
      templates.map(async (template) => {
        const sections = await this.db
          .select()
          .from(auditSections)
          .where(eq(auditSections._templateId, template._id))
          .orderBy(auditSections.orderIndex);

        const sectionsWithItems = await Promise.all(
          sections.map(async (section) => {
            const items = await this.db
              .select()
              .from(auditItems)
              .where(eq(auditItems.sectionId, section._id))
              .orderBy(auditItems.orderIndex);
            return { ...section, items };
          })
        );

        return { ...template, sections: sectionsWithItems };
      })
    );

    return templatesWithSections;
  }

  async getAuditTemplate(
    _templateId: string,
    _userId: string
  ): Promise<
    (AuditTemplate & { sections: (AuditSection & { items: AuditItem[] })[] }) | undefined
  > {
    const template = await this.db
      .select()
      .from(auditTemplates)
      .where(and(eq(auditTemplates._id, _templateId), eq(auditTemplates._userId, _userId)))
      .limit(1);

    if (!template[0]) return undefined;

    const sections = await this.db
      .select()
      .from(auditSections)
      .where(eq(auditSections._templateId, _templateId))
      .orderBy(auditSections.orderIndex);

    const sectionsWithItems = await Promise.all(
      sections.map(async (section) => {
        const items = await this.db
          .select()
          .from(auditItems)
          .where(eq(auditItems.sectionId, section._id))
          .orderBy(auditItems.orderIndex);
        return { ...section, items };
      })
    );

    return { ...template[0], sections: sectionsWithItems };
  }

  async createAuditTemplate(
    _templateData: InsertAuditTemplate,
    ____sectionsData: {
      sections: Array<{
        title: string;
        description?: string;
        orderIndex: number;
        items: Array<{ text: string; isRequired: boolean; orderIndex: number; note?: string }>;
      }>;
    }
  ): Promise<AuditTemplate> {
    const [template] = await this.db.insert(auditTemplates).values(_templateData).returning();

    for (const sectionData of ____sectionsData.sections) {
      const [section] = await this.db
        .insert(auditSections)
        .values({
          _templateId: template!._id,
          title: sectionData.title,
          description: sectionData.description,
          orderIndex: sectionData.orderIndex.toString(),
        })
        .returning();

      for (const itemData of sectionData.items) {
        await this.db.insert(auditItems).values({
          sectionId: section!._id,
          text: itemData.text,
          isRequired: itemData.isRequired,
          orderIndex: itemData.orderIndex.toString(),
          note: itemData.note,
        });
      }
    }

    return template!;
  }

  async updateAuditTemplate(
    _templateId: string,
    _userId: string,
    _templateData: Partial<AuditTemplate>,
    ___sectionsData?: {
      sections: Array<{
        id?: string;
        title: string;
        description?: string;
        orderIndex: number;
        items: Array<{
          id?: string;
          text: string;
          isRequired: boolean;
          orderIndex: number;
          note?: string;
        }>;
      }>;
    }
  ): Promise<AuditTemplate | undefined> {
    const [updated] = await this.db
      .update(auditTemplates)
      .set({ ..._templateData, updatedAt: new Date() })
      .where(and(eq(auditTemplates._id, _templateId), eq(auditTemplates._userId, _userId)))
      .returning();

    if (!updated) return undefined;

    if (___sectionsData) {
      // Delete existing sections and items (cascade will handle items)
      await this.db.delete(auditSections).where(eq(auditSections._templateId, _templateId));

      // Create new sections and items
      for (const sectionData of ___sectionsData.sections) {
        const [section] = await this.db
          .insert(auditSections)
          .values({
            _templateId: _templateId,
            title: sectionData.title,
            description: sectionData.description,
            orderIndex: sectionData.orderIndex.toString(),
          })
          .returning();

        for (const itemData of sectionData.items) {
          await this.db.insert(auditItems).values({
            sectionId: section!._id,
            text: itemData.text,
            isRequired: itemData.isRequired,
            orderIndex: itemData.orderIndex.toString(),
            note: itemData.note,
          });
        }
      }
    }

    return updated;
  }

  async deleteAuditTemplate(_templateId: string, _userId: string): Promise<boolean> {
    const result = await this.db
      .delete(auditTemplates)
      .where(and(eq(auditTemplates._id, _templateId), eq(auditTemplates._userId, _userId)));
    return result.length > 0;
  }

  async createDefaultAuditTemplate(_userId: string): Promise<AuditTemplate> {
    // Import the default checklist structure
    const { DEFAULT_COMPLIANCE_CHECKLIST } = await import("@shared/self-audit-types");

    const _templateData: InsertAuditTemplate = {
      _userId,
      name: "FridgeSafe Self Audit Checklist 🧾",
      description:
        "Cold Chain Self-Audit Checklist for healthcare facilities to ensure compliance with temperature monitoring, documentation, and staff training requirements for vaccine and medicine storage.",
      isDefault: true,
    };

    return await this.createAuditTemplate(_templateData, DEFAULT_COMPLIANCE_CHECKLIST);
  }

  // Self-audit completion methods
  async createAuditCompletion(
    _completionData: InsertAuditCompletion,
    _responsesData: InsertAuditResponse[]
  ): Promise<AuditCompletion> {
    const [completion] = await this.db.insert(auditCompletions).values(_completionData).returning();

    for (const responseData of _responsesData) {
      await this.db.insert(auditResponses).values({
        ...responseData,
        _completionId: completion!._id,
      });
    }

    return completion!;
  }

  async getAuditCompletions(
    _userId: string,
    filters?: { templateId?: string; startDate?: Date; endDate?: Date; completedBy?: string }
  ): Promise<(AuditCompletion & { responses: AuditResponse[]; complianceRate: number })[]> {
    // Build where conditions
    const whereConditions = [eq(auditCompletions._userId, _userId)];

    if (filters?.templateId) {
      whereConditions.push(eq(auditCompletions._templateId, filters.templateId));
    }
    if (filters?.startDate) {
      whereConditions.push(sql`${auditCompletions.completedAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      whereConditions.push(sql`${auditCompletions.completedAt} <= ${filters.endDate}`);
    }
    if (filters?.completedBy) {
      whereConditions.push(eq(auditCompletions.completedBy, filters.completedBy));
    }

    const query = this.db
      .select()
      .from(auditCompletions)
      .where(and(...whereConditions));

    const completions = await query.orderBy(desc(auditCompletions.completedAt));

    const completionsWithResponses = await Promise.all(
      completions.map(async (completion) => {
        const responses = await this.db
          .select()
          .from(auditResponses)
          .where(eq(auditResponses._completionId, completion._id));

        const complianceRate =
          responses.length > 0
            ? Math.round((responses.filter((r) => r.isCompliant).length / responses.length) * 100)
            : 0;

        return { ...completion, responses, complianceRate } as any;
      })
    );

    return completionsWithResponses;
  }

  async getAuditCompletion(
    _completionId: string,
    _userId: string
  ): Promise<
    (AuditCompletion & { responses: AuditResponse[]; template?: AuditTemplate }) | undefined
  > {
    const completion = await this.db
      .select()
      .from(auditCompletions)
      .where(and(eq(auditCompletions._id, _completionId), eq(auditCompletions._userId, _userId)))
      .limit(1);

    if (!completion[0]) return undefined;

    const responses = await this.db
      .select()
      .from(auditResponses)
      .where(eq(auditResponses._completionId, _completionId));

    const template = await this.db
      .select()
      .from(auditTemplates)
      .where(eq(auditTemplates._id, completion[0]._templateId))
      .limit(1);

    return {
      ...completion[0],
      responses,
      template: template[0],
    };
  }

  async getAuditCompletionStats(_userId: string): Promise<{
    totalCompletions: number;
    averageCompliance: number;
    recentCompletions: AuditCompletion[];
  }> {
    const completions = await this.db
      .select()
      .from(auditCompletions)
      .where(eq(auditCompletions._userId, _userId))
      .orderBy(desc(auditCompletions.completedAt));

    const totalCompletions = completions.length;
    const averageCompliance =
      completions.length > 0
        ? Math.round(
            completions.reduce((sum, c) => sum + Number(c.complianceRate), 0) / completions.length
          )
        : 0;

    const recentCompletions = completions.slice(0, 10);

    return { totalCompletions, averageCompliance, recentCompletions };
  }

  // Calibration record methods implementation
  async getCalibrationRecords(_fridgeId: string, _userId: string): Promise<CalibrationRecord[]> {
    // First verify the user owns this fridge
    const fridge = await this.getFridge(_fridgeId, _userId);
    if (!fridge) {
      return [];
    }

    return await this.db
      .select()
      .from(calibrationRecords)
      .where(
        and(eq(calibrationRecords._fridgeId, _fridgeId), eq(calibrationRecords._userId, _userId))
      )
      .orderBy(desc(calibrationRecords.calibrationDate));
  }

  async getCalibrationRecord(_id: string, _userId: string): Promise<CalibrationRecord | undefined> {
    const result = await this.db
      .select()
      .from(calibrationRecords)
      .where(and(eq(calibrationRecords._id, _id), eq(calibrationRecords._userId, _userId)))
      .limit(1);
    return result[0]!;
  }

  async createCalibrationRecord(_recordData: InsertCalibrationRecord): Promise<CalibrationRecord> {
    const [record] = await this.db.insert(calibrationRecords).values(_recordData).returning();
    return record!;
  }

  async updateCalibrationRecord(
    _id: string,
    _userId: string,
    _updates: Partial<CalibrationRecord>
  ): Promise<CalibrationRecord | undefined> {
    const [updated] = await this.db
      .update(calibrationRecords)
      .set(_updates)
      .where(and(eq(calibrationRecords._id, _id), eq(calibrationRecords._userId, _userId)))
      .returning();
    return updated;
  }

  async deleteCalibrationRecord(_id: string, _userId: string): Promise<boolean> {
    const result = await this.db
      .delete(calibrationRecords)
      .where(and(eq(calibrationRecords._id, _id), eq(calibrationRecords._userId, _userId)));
    return result.length > 0;
  }

  async getLatestCalibrationForFridge(
    _fridgeId: string,
    _userId: string
  ): Promise<CalibrationRecord | undefined> {
    const result = await this.db
      .select()
      .from(calibrationRecords)
      .where(
        and(eq(calibrationRecords._fridgeId, _fridgeId), eq(calibrationRecords._userId, _userId))
      )
      .orderBy(desc(calibrationRecords.calibrationDate))
      .limit(1);
    return result[0]!;
  }
}

export const storage = new DatabaseStorage();
