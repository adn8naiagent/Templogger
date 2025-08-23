import { 
  type User, 
  type InsertUser, 
  type UpsertUser,
  type Fridge, 
  type InsertFridge,
  type TemperatureLog,
  type InsertTemperatureLog,
  users,
  fridges,
  temperatureLogs
} from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc } from "drizzle-orm";

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
  
  // Temperature log methods
  getTemperatureLogs(fridgeId: string, userId: string): Promise<TemperatureLog[]>;
  getRecentTemperatureLog(fridgeId: string, userId: string): Promise<TemperatureLog | undefined>;
  createTemperatureLog(logData: InsertTemperatureLog): Promise<TemperatureLog>;
  getAllTemperatureLogsForUser(userId: string): Promise<(TemperatureLog & { fridgeName: string })[]>;
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
      await this.db.delete(fridges)
        .where(and(eq(fridges.id, id), eq(fridges.userId, userId)));
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
      temperature: temperatureLogs.temperature,
      personName: temperatureLogs.personName,
      isAlert: temperatureLogs.isAlert,
      createdAt: temperatureLogs.createdAt,
      fridgeName: fridges.name,
    }).from(temperatureLogs)
      .innerJoin(fridges, eq(temperatureLogs.fridgeId, fridges.id))
      .where(eq(fridges.userId, userId))
      .orderBy(desc(temperatureLogs.createdAt));
    
    return result;
  }
}

export const storage = new DatabaseStorage();
