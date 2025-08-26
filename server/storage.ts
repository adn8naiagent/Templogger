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
  missedChecks
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
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(userData: InsertUser): Promise<User>;
  upsertUser(userData: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Fridge methods
  getFridges(userId: string): Promise<Fridge[]>;
  getFridge(id: string, userId: string): Promise<Fridge | undefined>;
  createFridge(fridgeData: InsertFridge): Promise<Fridge>;
  updateFridge(id: string, userId: string, updates: Partial<Fridge>): Promise<Fridge | undefined>;
  deleteFridge(id: string, userId: string): Promise<boolean>;
  
  // Label methods
  getLabels(userId: string): Promise<Label[]>;
  getLabel(id: string, userId: string): Promise<Label | undefined>;
  createLabel(labelData: InsertLabel): Promise<Label>;
  updateLabel(id: string, userId: string, updates: Partial<Label>): Promise<Label | undefined>;
  deleteLabel(id: string, userId: string): Promise<boolean>;
  
  // Temperature log methods
  getTemperatureLogs(fridgeId: string, userId: string): Promise<TemperatureLog[]>;
  getRecentTemperatureLog(fridgeId: string, userId: string): Promise<TemperatureLog | undefined>;
  createTemperatureLog(logData: InsertTemperatureLog): Promise<TemperatureLog>;
  getAllTemperatureLogsForUser(userId: string): Promise<(TemperatureLog & { fridgeName: string })[]>;
  
  // Time Window methods
  getTimeWindows(fridgeId: string, userId: string): Promise<TimeWindow[]>;
  getTimeWindow(id: string, userId: string): Promise<TimeWindow | undefined>;
  createTimeWindow(timeWindowData: InsertTimeWindow): Promise<TimeWindow>;
  updateTimeWindow(id: string, userId: string, updates: Partial<TimeWindow>): Promise<TimeWindow | undefined>;
  deleteTimeWindow(id: string, userId: string): Promise<boolean>;
  getCurrentTimeWindow(fridgeId: string): Promise<TimeWindow | undefined>;
  
  // Compliance Record methods
  getComplianceRecords(fridgeId: string, startDate: Date, endDate: Date): Promise<ComplianceRecord[]>;
  getComplianceRecord(id: string): Promise<ComplianceRecord | undefined>;
  createComplianceRecord(recordData: InsertComplianceRecord): Promise<ComplianceRecord>;
  updateComplianceRecord(id: string, updates: Partial<ComplianceRecord>): Promise<ComplianceRecord | undefined>;
  getComplianceOverview(userId: string, date?: Date): Promise<{
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
      fridgeId: string;
      fridgeName: string;
      complianceScore: number;
      lastReading: string;
      status: 'compliant' | 'warning' | 'critical';
      missedReadings: number;
    }[];
    trends: {
      week: { date: string; compliance: number; }[];
      month: { date: string; compliance: number; }[];
    };
  }>;
  
  // Checklist methods
  getChecklists(userId: string, fridgeId?: string): Promise<(Checklist & { items: ChecklistItem[] })[]>;
  getChecklist(id: string, userId: string): Promise<(Checklist & { items: ChecklistItem[] }) | undefined>;
  createChecklist(checklistData: InsertChecklist, items: InsertChecklistItem[]): Promise<Checklist>;
  updateChecklist(id: string, userId: string, updates: Partial<Checklist>): Promise<Checklist | undefined>;
  deleteChecklist(id: string, userId: string): Promise<boolean>;
  
  // Checklist completion methods
  getChecklistCompletions(checklistId: string, fridgeId?: string): Promise<ChecklistCompletion[]>;
  createChecklistCompletion(completionData: InsertChecklistCompletion): Promise<ChecklistCompletion>;
  getDueChecklists(userId: string): Promise<Checklist[]>;
  
  // Out-of-range event methods
  getOutOfRangeEvents(fridgeId: string, resolved?: boolean): Promise<OutOfRangeEvent[]>;
  createOutOfRangeEvent(eventData: InsertOutOfRangeEvent): Promise<OutOfRangeEvent>;
  resolveOutOfRangeEvent(id: string, notes?: string): Promise<OutOfRangeEvent | undefined>;
  getUnresolvedEventsCount(userId: string): Promise<number>;
  
  // Enhanced temperature log methods with compliance
  getFridgesWithRecentTemps(userId: string): Promise<(Fridge & { 
    recentLog?: TemperatureLog; 
    timeWindows: TimeWindow[];
    complianceStatus: string;
  })[]>;
  createTemperatureLogWithCompliance(logData: InsertTemperatureLog): Promise<{
    log: TemperatureLog;
    alert?: { message: string; severity: string };
    outOfRangeEvent?: OutOfRangeEvent;
  }>;
  
  // Admin methods
  getActiveAlertsCount(): Promise<number>;
  
  // Missed checks methods
  getMissedChecks(fridgeId: string, userId: string): Promise<MissedCheck[]>;
  createMissedCheck(missedCheckData: InsertMissedCheck): Promise<MissedCheck>;
  overrideMissedCheck(id: string, userId: string, overrideReason: string): Promise<MissedCheck | undefined>;
  getMissedChecksForDate(userId: string, date: Date): Promise<(MissedCheck & { fridgeName: string })[]>;

  // New fridge management methods
  getAllFridgesWithLogs(userId: string): Promise<any[]>;
  getFridgeWithLogs(userId: string, fridgeId: string): Promise<any>;
  deactivateFridge(userId: string, fridgeId: string): Promise<any>;
  reactivateFridge(userId: string, fridgeId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users).orderBy(users.createdAt);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(userData).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await this.db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await this.db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Fridge methods
  async getFridges(userId: string): Promise<Fridge[]> {
    return await this.db.select().from(fridges).where(eq(fridges.userId, userId)).orderBy(fridges.createdAt);
  }

  async getFridge(id: string, userId: string): Promise<Fridge | undefined> {
    const result = await this.db.select().from(fridges)
      .where(and(eq(fridges.id, id), eq(fridges.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createFridge(fridgeData: InsertFridge): Promise<Fridge> {
    const result = await this.db.insert(fridges).values(fridgeData).returning();
    return result[0];
  }

  async updateFridge(id: string, userId: string, updates: Partial<Fridge>): Promise<Fridge | undefined> {
    const result = await this.db.update(fridges).set({
      ...updates,
      updatedAt: new Date()
    }).where(and(eq(fridges.id, id), eq(fridges.userId, userId))).returning();
    return result[0];
  }

  async deleteFridge(id: string, userId: string): Promise<boolean> {
    try {
      // Delete all related data first (cascading delete)
      await this.db.delete(temperatureLogs).where(eq(temperatureLogs.fridgeId, id));
      await this.db.delete(timeWindows).where(eq(timeWindows.fridgeId, id));
      await this.db.delete(missedChecks).where(eq(missedChecks.fridgeId, id));
      
      // Delete the fridge
      const result = await this.db.delete(fridges)
        .where(and(eq(fridges.id, id), eq(fridges.userId, userId)));
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting fridge:", error);
      return false;
    }
  }

  // Label methods
  async getLabels(userId: string): Promise<Label[]> {
    return await this.db.select().from(labels).where(eq(labels.userId, userId)).orderBy(labels.createdAt);
  }

  async getLabel(id: string, userId: string): Promise<Label | undefined> {
    const result = await this.db.select().from(labels)
      .where(and(eq(labels.id, id), eq(labels.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createLabel(labelData: InsertLabel): Promise<Label> {
    const result = await this.db.insert(labels).values(labelData).returning();
    return result[0];
  }

  async updateLabel(id: string, userId: string, updates: Partial<Label>): Promise<Label | undefined> {
    const result = await this.db.update(labels).set(updates)
      .where(and(eq(labels.id, id), eq(labels.userId, userId))).returning();
    return result[0];
  }

  async deleteLabel(id: string, userId: string): Promise<boolean> {
    try {
      await this.db.delete(labels)
        .where(and(eq(labels.id, id), eq(labels.userId, userId)));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Temperature log methods
  async getTemperatureLogs(fridgeId: string, userId: string): Promise<TemperatureLog[]> {
    // First verify the fridge belongs to the user
    const fridge = await this.getFridge(fridgeId, userId);
    if (!fridge) return [];
    
    return await this.db.select().from(temperatureLogs)
      .where(eq(temperatureLogs.fridgeId, fridgeId))
      .orderBy(desc(temperatureLogs.createdAt));
  }

  async getRecentTemperatureLog(fridgeId: string, userId: string): Promise<TemperatureLog | undefined> {
    const logs = await this.getTemperatureLogs(fridgeId, userId);
    return logs[0];
  }

  async createTemperatureLog(logData: InsertTemperatureLog): Promise<TemperatureLog> {
    const result = await this.db.insert(temperatureLogs).values(logData).returning();
    return result[0];
  }

  async getAllTemperatureLogsForUser(userId: string): Promise<(TemperatureLog & { fridgeName: string })[]> {
    const result = await this.db.select({
      id: temperatureLogs.id,
      fridgeId: temperatureLogs.fridgeId,
      timeWindowId: temperatureLogs.timeWindowId,
      temperature: temperatureLogs.temperature,
      personName: temperatureLogs.personName,
      isAlert: temperatureLogs.isAlert,
      isOnTime: temperatureLogs.isOnTime,
      lateReason: temperatureLogs.lateReason,
      correctiveAction: temperatureLogs.correctiveAction,
      correctiveNotes: temperatureLogs.correctiveNotes,
      createdAt: temperatureLogs.createdAt,
      fridgeName: fridges.name,
    }).from(temperatureLogs)
      .innerJoin(fridges, eq(temperatureLogs.fridgeId, fridges.id))
      .where(eq(fridges.userId, userId))
      .orderBy(desc(temperatureLogs.createdAt));
    
    return result;
  }

  // Time Window methods
  async getTimeWindows(fridgeId: string, userId: string): Promise<TimeWindow[]> {
    const result = await this.db.select().from(timeWindows)
      .innerJoin(fridges, eq(timeWindows.fridgeId, fridges.id))
      .where(and(eq(timeWindows.fridgeId, fridgeId), eq(fridges.userId, userId)))
      .orderBy(timeWindows.startTime);
    return result.map(r => r.time_windows);
  }

  async getTimeWindow(id: string, userId: string): Promise<TimeWindow | undefined> {
    const result = await this.db.select().from(timeWindows)
      .innerJoin(fridges, eq(timeWindows.fridgeId, fridges.id))
      .where(and(eq(timeWindows.id, id), eq(fridges.userId, userId)))
      .limit(1);
    return result[0]?.time_windows;
  }

  async createTimeWindow(timeWindowData: InsertTimeWindow): Promise<TimeWindow> {
    const result = await this.db.insert(timeWindows).values(timeWindowData).returning();
    return result[0];
  }

  async updateTimeWindow(id: string, userId: string, updates: Partial<TimeWindow>): Promise<TimeWindow | undefined> {
    const timeWindow = await this.getTimeWindow(id, userId);
    if (!timeWindow) return undefined;
    
    const result = await this.db.update(timeWindows).set(updates).where(eq(timeWindows.id, id)).returning();
    return result[0];
  }

  async deleteTimeWindow(id: string, userId: string): Promise<boolean> {
    const timeWindow = await this.getTimeWindow(id, userId);
    if (!timeWindow) return false;
    
    try {
      await this.db.delete(timeWindows).where(eq(timeWindows.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCurrentTimeWindow(fridgeId: string): Promise<TimeWindow | undefined> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const result = await this.db.select().from(timeWindows)
      .where(and(
        eq(timeWindows.fridgeId, fridgeId),
        eq(timeWindows.isActive, true)
      ));
    
    return result.find(tw => 
      tw.startTime && 
      tw.endTime && 
      tw.startTime <= currentTime && 
      tw.endTime >= currentTime
    );
  }

  // Compliance Record methods
  async getComplianceRecords(fridgeId: string, startDate: Date, endDate: Date): Promise<ComplianceRecord[]> {
    return await this.db.select().from(complianceRecords)
      .where(and(
        eq(complianceRecords.fridgeId, fridgeId),
        and(
          sql`${complianceRecords.date} >= ${startDate}`,
          sql`${complianceRecords.date} <= ${endDate}`
        )
      ))
      .orderBy(desc(complianceRecords.date));
  }

  async getComplianceRecord(id: string): Promise<ComplianceRecord | undefined> {
    const result = await this.db.select().from(complianceRecords)
      .where(eq(complianceRecords.id, id))
      .limit(1);
    return result[0];
  }

  async createComplianceRecord(recordData: InsertComplianceRecord): Promise<ComplianceRecord> {
    const result = await this.db.insert(complianceRecords).values(recordData).returning();
    return result[0];
  }

  async updateComplianceRecord(id: string, updates: Partial<ComplianceRecord>): Promise<ComplianceRecord | undefined> {
    const result = await this.db.update(complianceRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(complianceRecords.id, id))
      .returning();
    return result[0];
  }

  async getComplianceOverview(userId: string, date?: Date): Promise<{
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
      fridgeId: string;
      fridgeName: string;
      complianceScore: number;
      lastReading: string;
      status: 'compliant' | 'warning' | 'critical';
      missedReadings: number;
    }[];
    trends: {
      week: { date: string; compliance: number; }[];
      month: { date: string; compliance: number; }[];
    };
  }> {
    const targetDate = date || new Date();
    const targetDateStr = targetDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
    const userFridges = await this.getFridges(userId);
    
    // Get today's temperature logs
    const todayLogs = await this.db.select().from(temperatureLogs)
      .innerJoin(fridges, eq(temperatureLogs.fridgeId, fridges.id))
      .where(and(
        eq(fridges.userId, userId),
        sql`DATE(${temperatureLogs.createdAt}) = ${targetDateStr}`
      ));

    // Get all temperature logs for user (for overall stats)
    const allUserLogs = await this.db.select().from(temperatureLogs)
      .innerJoin(fridges, eq(temperatureLogs.fridgeId, fridges.id))
      .where(eq(fridges.userId, userId));

    // Calculate basic stats
    const lateEntries = todayLogs.filter(log => !log.temperature_logs.isOnTime).length;
    const compliantFridges = userFridges.filter(fridge => 
      todayLogs.some(log => log.temperature_logs.fridgeId === fridge.id)
    ).length;

    // Get out-of-range events count
    const outOfRangeEventsCount = await this.db.select({ count: sql<number>`count(*)` })
      .from(outOfRangeEvents)
      .innerJoin(fridges, eq(outOfRangeEvents.fridgeId, fridges.id))
      .where(eq(fridges.userId, userId));
    
    const unresolvedEventsCount = await this.getUnresolvedEventsCount(userId);

    // Calculate overall compliance rate
    const totalLogs = allUserLogs.length;
    const alertLogs = allUserLogs.filter(log => log.temperature_logs.isAlert).length;
    const overallComplianceRate = totalLogs > 0 ? ((totalLogs - alertLogs) / totalLogs) * 100 : 100;

    // Get checklist completions for today
    const todayChecklistsCompleted = await this.db.select({ count: sql<number>`count(*)` })
      .from(checklistCompletions)
      .innerJoin(checklists, eq(checklistCompletions.checklistId, checklists.id))
      .where(and(
        eq(checklists.createdBy, userId),
        sql`DATE(${checklistCompletions.completedAt}) = ${targetDateStr}`
      ));

    // Build compliance by fridge data
    const complianceByFridge = await Promise.all(
      userFridges.map(async (fridge) => {
        // Get recent logs for this fridge
        const fridgeLogs = await this.db.select().from(temperatureLogs)
          .where(eq(temperatureLogs.fridgeId, fridge.id))
          .orderBy(desc(temperatureLogs.createdAt))
          .limit(10);

        const fridgeAlertLogs = fridgeLogs.filter(log => log.isAlert);
        const complianceScore = fridgeLogs.length > 0 ? 
          ((fridgeLogs.length - fridgeAlertLogs.length) / fridgeLogs.length) * 100 : 100;

        // Get last reading
        const lastReading = fridgeLogs.length > 0 ? fridgeLogs[0].createdAt!.toISOString() : new Date().toISOString();
        
        // Determine status
        let status: 'compliant' | 'warning' | 'critical' = 'compliant';
        if (complianceScore < 70) status = 'critical';
        else if (complianceScore < 90) status = 'warning';

        // Count missed readings (fridges that should have had readings today but didn't)
        const todayFridgeLogs = todayLogs.filter(log => log.temperature_logs.fridgeId === fridge.id);
        const missedReadings = todayFridgeLogs.length === 0 ? 1 : 0; // Simple logic for now

        return {
          fridgeId: fridge.id,
          fridgeName: fridge.name,
          complianceScore: Math.round(complianceScore),
          lastReading,
          status,
          missedReadings,
        };
      })
    );

    // Generate basic trends (simplified for now)
    const trends = {
      week: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        compliance: Math.round(overallComplianceRate + (Math.random() - 0.5) * 10)
      })),
      month: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        compliance: Math.round(overallComplianceRate + (Math.random() - 0.5) * 15)
      }))
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
  async getChecklists(userId: string, fridgeId?: string): Promise<(Checklist & { items: ChecklistItem[] })[]> {
    const whereConditions = [eq(checklists.createdBy, userId)];
    if (fridgeId) {
      whereConditions.push(eq(checklists.fridgeId, fridgeId));
    }

    const checklistsResult = await this.db.select().from(checklists)
      .where(and(...whereConditions))
      .orderBy(checklists.createdAt);

    const checklistsWithItems = await Promise.all(
      checklistsResult.map(async (checklist) => {
        const items = await this.db.select().from(checklistItems)
          .where(eq(checklistItems.checklistId, checklist.id))
          .orderBy(checklistItems.sortOrder);
        return { ...checklist, items };
      })
    );

    return checklistsWithItems;
  }

  async getChecklist(id: string, userId: string): Promise<(Checklist & { items: ChecklistItem[] }) | undefined> {
    const result = await this.db.select().from(checklists)
      .where(and(eq(checklists.id, id), eq(checklists.createdBy, userId)))
      .limit(1);
    
    if (!result[0]) return undefined;

    const items = await this.db.select().from(checklistItems)
      .where(eq(checklistItems.checklistId, id))
      .orderBy(checklistItems.sortOrder);

    return { ...result[0], items };
  }

  async createChecklist(checklistData: InsertChecklist, items: InsertChecklistItem[]): Promise<Checklist> {
    const checklistResult = await this.db.insert(checklists).values(checklistData).returning();
    const checklist = checklistResult[0];

    // Insert checklist items
    if (items.length > 0) {
      const itemsWithChecklistId = items.map((item, index) => ({
        ...item,
        checklistId: checklist.id,
        sortOrder: index.toString(),
      }));
      await this.db.insert(checklistItems).values(itemsWithChecklistId);
    }

    return checklist;
  }

  async updateChecklist(id: string, userId: string, updates: Partial<Checklist>): Promise<Checklist | undefined> {
    const existing = await this.getChecklist(id, userId);
    if (!existing) return undefined;

    const result = await this.db.update(checklists)
      .set(updates)
      .where(eq(checklists.id, id))
      .returning();
    return result[0];
  }

  async deleteChecklist(id: string, userId: string): Promise<boolean> {
    const existing = await this.getChecklist(id, userId);
    if (!existing) return false;

    try {
      // Delete checklist items first
      await this.db.delete(checklistItems).where(eq(checklistItems.checklistId, id));
      // Delete checklist
      await this.db.delete(checklists).where(eq(checklists.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Checklist completion methods
  async getChecklistCompletions(checklistId: string, fridgeId?: string): Promise<ChecklistCompletion[]> {
    const whereConditions = [eq(checklistCompletions.checklistId, checklistId)];
    if (fridgeId) {
      whereConditions.push(eq(checklistCompletions.fridgeId, fridgeId));
    }

    return await this.db.select().from(checklistCompletions)
      .where(and(...whereConditions))
      .orderBy(desc(checklistCompletions.completedAt));
  }

  async createChecklistCompletion(completionData: InsertChecklistCompletion): Promise<ChecklistCompletion> {
    const result = await this.db.insert(checklistCompletions).values(completionData).returning();
    return result[0];
  }

  async getDueChecklists(userId: string): Promise<Checklist[]> {
    // Get all active checklists for user
    const userChecklists = await this.db.select().from(checklists)
      .where(and(eq(checklists.createdBy, userId), eq(checklists.isActive, true)));

    // Filter based on frequency and last completion
    const dueChecklists = [];
    const today = new Date();

    for (const checklist of userChecklists) {
      const lastCompletion = await this.db.select().from(checklistCompletions)
        .where(eq(checklistCompletions.checklistId, checklist.id))
        .orderBy(desc(checklistCompletions.completedAt))
        .limit(1);

      let isDue = false;
      if (lastCompletion.length === 0) {
        isDue = true; // Never completed
      } else {
        const lastCompletedDate = new Date(lastCompletion[0].completedAt!);
        const daysDiff = Math.floor((today.getTime() - lastCompletedDate.getTime()) / (1000 * 3600 * 24));

        switch (checklist.frequency) {
          case 'daily':
            isDue = daysDiff >= 1;
            break;
          case 'weekly':
            isDue = daysDiff >= 7;
            break;
          case 'monthly':
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
  async getOutOfRangeEvents(fridgeId: string, resolved?: boolean): Promise<OutOfRangeEvent[]> {
    const whereConditions = [eq(outOfRangeEvents.fridgeId, fridgeId)];
    
    if (resolved !== undefined) {
      if (resolved) {
        whereConditions.push(sql`${outOfRangeEvents.resolvedAt} IS NOT NULL`);
      } else {
        whereConditions.push(sql`${outOfRangeEvents.resolvedAt} IS NULL`);
      }
    }

    return await this.db.select().from(outOfRangeEvents)
      .where(and(...whereConditions))
      .orderBy(desc(outOfRangeEvents.createdAt));
  }

  async createOutOfRangeEvent(eventData: InsertOutOfRangeEvent): Promise<OutOfRangeEvent> {
    const result = await this.db.insert(outOfRangeEvents).values(eventData).returning();
    return result[0];
  }

  async resolveOutOfRangeEvent(id: string, notes?: string): Promise<OutOfRangeEvent | undefined> {
    const result = await this.db.update(outOfRangeEvents)
      .set({ 
        resolvedAt: new Date(),
        notes: notes || outOfRangeEvents.notes
      })
      .where(eq(outOfRangeEvents.id, id))
      .returning();
    return result[0];
  }

  async getUnresolvedEventsCount(userId: string): Promise<number> {
    const result = await this.db.select().from(outOfRangeEvents)
      .innerJoin(fridges, eq(outOfRangeEvents.fridgeId, fridges.id))
      .where(and(
        eq(fridges.userId, userId),
        sql`${outOfRangeEvents.resolvedAt} IS NULL`
      ));
    return result.length;
  }

  // Enhanced temperature log methods with compliance
  async getFridgesWithRecentTemps(userId: string): Promise<(Fridge & { 
    recentLog?: TemperatureLog; 
    timeWindows: TimeWindow[];
    complianceStatus: string;
  })[]> {
    const userFridges = await this.getFridges(userId);
    
    const fridgesWithData = await Promise.all(
      userFridges.map(async (fridge) => {
        const recentLog = await this.getRecentTemperatureLog(fridge.id, userId);
        const fridgeTimeWindows = await this.getTimeWindows(fridge.id, userId);
        
        // Calculate compliance status, considering active status
        let complianceStatus = 'compliant';
        if (!fridge.isActive) {
          complianceStatus = 'inactive';
        } else if (recentLog?.isAlert) {
          complianceStatus = 'alert';
        } else if (recentLog && !recentLog.isOnTime) {
          complianceStatus = 'late';
        } else if (!recentLog) {
          complianceStatus = 'missing';
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
          status: complianceStatus === 'alert' ? 'critical' : complianceStatus === 'late' ? 'warning' : 'good'
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
    const fridge = await this.db.select().from(fridges)
      .where(eq(fridges.id, logData.fridgeId))
      .limit(1);
    
    if (!fridge[0]) {
      return { log };
    }

    const fridgeData = fridge[0];
    const temp = parseFloat(log.temperature);
    const minTemp = parseFloat(fridgeData.minTemp);
    const maxTemp = parseFloat(fridgeData.maxTemp);

    let alert;
    let outOfRangeEvent;

    // Check if temperature is out of range
    if (temp < minTemp || temp > maxTemp) {
      const severity = temp < minTemp - 2 || temp > maxTemp + 2 ? 'critical' : 
                      temp < minTemp - 1 || temp > maxTemp + 1 ? 'high' : 'medium';
      
      alert = {
        message: `Temperature ${temp}°C is outside acceptable range (${minTemp}°C - ${maxTemp}°C)`,
        severity
      };

      // Create out-of-range event
      const eventData: InsertOutOfRangeEvent = {
        temperatureLogId: log.id,
        fridgeId: log.fridgeId,
        temperature: log.temperature,
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
        temperature: temperatureLogs.temperature,
        minTemp: fridges.minTemp,
        maxTemp: fridges.maxTemp
      })
      .from(temperatureLogs)
      .innerJoin(fridges, eq(temperatureLogs.fridgeId, fridges.id))
      .orderBy(desc(temperatureLogs.createdAt))
      .limit(100); // Check recent logs

    const alertCount = logs.filter(log => 
      log.temperature < log.minTemp || log.temperature > log.maxTemp
    ).length;

    return alertCount;
  }

  // Missed checks methods implementation
  async getMissedChecks(fridgeId: string, userId: string): Promise<MissedCheck[]> {
    // Verify fridge ownership
    const fridge = await this.getFridge(fridgeId, userId);
    if (!fridge) return [];
    
    return await this.db
      .select()
      .from(missedChecks)
      .where(eq(missedChecks.fridgeId, fridgeId))
      .orderBy(desc(missedChecks.missedDate));
  }

  async createMissedCheck(missedCheckData: InsertMissedCheck): Promise<MissedCheck> {
    const result = await this.db.insert(missedChecks).values(missedCheckData).returning();
    return result[0];
  }

  async overrideMissedCheck(id: string, userId: string, overrideReason: string): Promise<MissedCheck | undefined> {
    // Verify the missed check belongs to a fridge owned by the user
    const result = await this.db
      .select({
        missedCheck: missedChecks,
        fridge: fridges
      })
      .from(missedChecks)
      .leftJoin(fridges, eq(missedChecks.fridgeId, fridges.id))
      .where(and(eq(missedChecks.id, id), eq(fridges.userId, userId)))
      .limit(1);

    if (!result[0]) return undefined;

    const updated = await this.db
      .update(missedChecks)
      .set({
        isOverridden: true,
        overrideReason,
        overriddenBy: userId,
        overriddenAt: new Date(),
      })
      .where(eq(missedChecks.id, id))
      .returning();

    return updated[0];
  }

  async getMissedChecksForDate(userId: string, date: Date): Promise<(MissedCheck & { fridgeName: string })[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.db
      .select({
        id: missedChecks.id,
        fridgeId: missedChecks.fridgeId,
        timeWindowId: missedChecks.timeWindowId,
        missedDate: missedChecks.missedDate,
        checkType: missedChecks.checkType,
        reason: missedChecks.reason,
        isOverridden: missedChecks.isOverridden,
        overrideReason: missedChecks.overrideReason,
        overriddenBy: missedChecks.overriddenBy,
        overriddenAt: missedChecks.overriddenAt,
        createdAt: missedChecks.createdAt,
        fridgeName: fridges.name
      })
      .from(missedChecks)
      .innerJoin(fridges, eq(missedChecks.fridgeId, fridges.id))
      .where(
        and(
          eq(fridges.userId, userId),
          sql`${missedChecks.missedDate} >= ${startOfDay}`,
          sql`${missedChecks.missedDate} <= ${endOfDay}`
        )
      )
      .orderBy(desc(missedChecks.missedDate));
  }

  // New fridge management methods implementation
  async getAllFridgesWithLogs(userId: string): Promise<any[]> {
    try {
      return await this.db
        .select({
          id: fridges.id,
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
             WHERE fridge_id = ${fridges.id} 
             ORDER BY created_at DESC LIMIT 1)`,
          lastReading: sql<string>`
            (SELECT created_at FROM ${temperatureLogs} 
             WHERE fridge_id = ${fridges.id} 
             ORDER BY created_at DESC LIMIT 1)`,
          logsCount: sql<number>`
            (SELECT COUNT(*) FROM ${temperatureLogs} 
             WHERE fridge_id = ${fridges.id})`,
          recentAlert: sql<boolean>`
            (SELECT is_alert FROM ${temperatureLogs} 
             WHERE fridge_id = ${fridges.id} 
             ORDER BY created_at DESC LIMIT 1)`
        })
        .from(fridges)
        .where(eq(fridges.userId, userId))
        .orderBy(desc(fridges.isActive), fridges.name);
    } catch (error) {
      console.error("Error getting all fridges with logs:", error);
      throw error;
    }
  }

  async getFridgeWithLogs(userId: string, fridgeId: string): Promise<any> {
    try {
      const [fridge] = await this.db
        .select()
        .from(fridges)
        .where(and(eq(fridges.id, fridgeId), eq(fridges.userId, userId)));

      if (!fridge) {
        return null;
      }

      const logs = await this.db
        .select({
          id: temperatureLogs.id,
          temperature: temperatureLogs.temperature,
          personName: temperatureLogs.personName,
          isAlert: temperatureLogs.isAlert,
          isOnTime: temperatureLogs.isOnTime,
          lateReason: temperatureLogs.lateReason,
          correctiveAction: temperatureLogs.correctiveAction,
          correctiveNotes: temperatureLogs.correctiveNotes,
          createdAt: temperatureLogs.createdAt,
          fridgeName: fridges.name
        })
        .from(temperatureLogs)
        .innerJoin(fridges, eq(temperatureLogs.fridgeId, fridges.id))
        .where(eq(temperatureLogs.fridgeId, fridgeId))
        .orderBy(desc(temperatureLogs.createdAt));

      const lastLog = logs[0];
      
      return {
        ...fridge,
        logs,
        lastTemperature: lastLog?.temperature || null,
        lastReading: lastLog?.createdAt || null,
        recentAlert: lastLog?.isAlert || false
      };
    } catch (error) {
      console.error("Error getting fridge with logs:", error);
      throw error;
    }
  }

  async deactivateFridge(userId: string, fridgeId: string): Promise<any> {
    try {
      const [updated] = await this.db
        .update(fridges)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(eq(fridges.id, fridgeId), eq(fridges.userId, userId)))
        .returning();

      return updated;
    } catch (error) {
      console.error("Error deactivating fridge:", error);
      throw error;
    }
  }

  async reactivateFridge(userId: string, fridgeId: string): Promise<any> {
    try {
      const [updated] = await this.db
        .update(fridges)
        .set({
          isActive: true,
          updatedAt: new Date()
        })
        .where(and(eq(fridges.id, fridgeId), eq(fridges.userId, userId)))
        .returning();

      return updated;
    } catch (error) {
      console.error("Error reactivating fridge:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
