import { 
  ChecklistWithScheduleAndItems,
  ChecklistSchedule,
  ChecklistInstance,
  CalendarData,
  CalendarInstance,
  ChecklistMetrics,
  ChecklistSummary,
  ChecklistCSVRecord,
  CreateChecklistRequest,
  ScheduleChecklistRequest,
  CompleteChecklistInstanceRequest,
  GeneratedInstance,
  ChecklistError,
  ScheduleError,
  InstanceError,
  CompletionError
} from "@shared/checklist-types";

import { IStorage } from "./storage";
import { 
  Checklist, 
  ChecklistItem, 
  ChecklistCompletion,
  InsertChecklist,
  InsertChecklistItem,
  InsertChecklistCompletion
} from "@shared/schema";

interface ScheduleMetadata {
  cadence: 'DAILY' | 'DOW' | 'WEEKLY';
  daysOfWeek?: number[];
  startDate: string;
  endDate?: string;
  timezone: string;
  isActive: boolean;
}

interface InstanceMetadata {
  instanceId: string;
  targetDate: string;
  status: 'REQUIRED' | 'COMPLETED' | 'MISSED';
  scheduleId: string;
  completedAt?: string;
}

export class ChecklistService {
  constructor(private storage: IStorage) {}

  // Create a new checklist with items
  async createChecklist(_userId: string, _data: CreateChecklistRequest): Promise<ChecklistWithScheduleAndItems> {
    try {
      // Map to existing schema format
      const checklistData: InsertChecklist = {
        title: _data.name,
        description: _data.description || null,
        frequency: 'custom', // We'll use custom for our enhanced scheduling
        _fridgeId: null, // Global checklists for now
        createdBy: _userId,
        isActive: true,
      };

      const itemsData: InsertChecklistItem[] = _data.items.map((item: any, index: any) => ({
        _userId,
        checklistId: '', // Will be set by storage method
        title: item.label,
        description: null,
        isRequired: item.required,
        sortOrder: item.orderIndex.toString(),
      }));

      const checklist = await this.storage.createChecklist(checklistData, itemsData);
      
      // Transform to enhanced format
      return this.transformToEnhancedChecklist(checklist, []);
    } catch (_) {
      throw new ChecklistError('Failed to create checklist', 'CREATE_FAILED', 500);
    }
  }

  // Update an existing checklist
  async updateChecklist(_userId: string, checklistId: string, _data: CreateChecklistRequest): Promise<ChecklistWithScheduleAndItems> {
    try {
      const existing = await this.storage.getChecklist(checklistId, _userId);
      if (!existing) {
        throw new ChecklistError('Checklist not found', 'NOT_FOUND', 404);
      }

      // Update checklist
      const updates = {
        title: _data.name,
        description: _data.description || null,
      };

      const updatedChecklist = await this.storage.updateChecklist(checklistId, _userId, updates);
      if (!updatedChecklist) {
        throw new ChecklistError('Failed to update checklist', 'UPDATE_FAILED', 500);
      }

      // For items, we'd need to implement item updates in storage
      // For now, we'll return the current state
      return this.transformToEnhancedChecklist(updatedChecklist, existing.items);
    } catch (error) {
      if (error instanceof ChecklistError) throw error;
      throw new ChecklistError('Failed to update checklist', 'UPDATE_FAILED', 500);
    }
  }

  // Schedule a checklist with cadence
  async createOrReplaceSchedule(_userId: string, checklistId: string, _data: ScheduleChecklistRequest): Promise<ChecklistSchedule> {
    try {
      const existing = await this.storage.getChecklist(checklistId, _userId);
      if (!existing) {
        throw new ScheduleError('Checklist not found');
      }

      // Store schedule metadata in the description field as JSON
      const scheduleMetadata: ScheduleMetadata = {
        cadence: _data.cadence,
        daysOfWeek: _data.daysOfWeek,
        startDate: _data.startDate,
        endDate: _data.endDate,
        timezone: _data.timezone,
        isActive: true,
      };

      // Combine existing description with schedule metadata
      let existingDesc = '';
      try {
        const parsed = JSON.parse(existing.description || '{}');
        if (typeof parsed === 'string') {
          existingDesc = parsed;
        } else if (parsed.description) {
          existingDesc = parsed.description;
        }
      } catch {
        existingDesc = existing.description || '';
      }

      const combinedDescription = JSON.stringify({
        description: existingDesc,
        schedule: scheduleMetadata,
      });

      await this.storage.updateChecklist(checklistId, _userId, {
        description: combinedDescription,
      });

      return {
        _id: `schedule_${checklistId}`,
        checklistId,
        ...scheduleMetadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof ScheduleError) throw error;
      throw new ScheduleError('Failed to create schedule');
    }
  }

  // Generate instances for a date range (idempotent)
  async generateInstances(_userId: string, from: string, to: string): Promise<void> {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      // Get all active scheduled checklists for user
      const checklists = await this.storage.getChecklists(_userId);
      const scheduledChecklists = checklists.filter(c => this.hasSchedule(c));

      for (const checklist of scheduledChecklists) {
        const schedule = this.extractScheduleFromChecklist(checklist);
        if (!schedule || !schedule.isActive) continue;

        const instances = this.calculateRequiredInstances(schedule, checklist._id, fromDate, toDate);
        
        // Check existing instances to avoid duplicates
        const existingInstances = await this.getInstancesForChecklist(checklist._id, from, to);
        const existingTargetDates = new Set(existingInstances.map(i => i.targetDate));

        for (const instance of instances) {
          if (!existingTargetDates.has(instance.targetDate)) {
            await this.createInstance(_userId, instance);
          }
        }
      }
    } catch (_) {
      throw new InstanceError('Failed to generate instances');
    }
  }

  // Get calendar view data
  async getCalendarInstances(_userId: string, from: string, to: string): Promise<CalendarData> {
    try {
      // Ensure instances are generated for the requested period
      await this.generateInstances(_userId, from, to);

      const checklists = await this.storage.getChecklists(_userId);
      const scheduledChecklists = checklists.filter(c => this.hasSchedule(c));

      const calendarInstances: CalendarInstance[] = [];

      for (const checklist of scheduledChecklists) {
        const schedule = this.extractScheduleFromChecklist(checklist);
        if (!schedule) continue;

        const instances = await this.getInstancesForChecklist(checklist._id, from, to);
        
        for (const instance of instances) {
          calendarInstances.push({
            _id: instance._id,
            checklistId: checklist._id,
            checklistName: checklist.title,
            targetDate: instance.targetDate,
            status: instance.status,
            cadence: schedule.cadence,
            completedAt: instance.completedAt,
            completedBy: instance.completedBy,
          });
        }
      }

      return {
        instances: calendarInstances,
        period: { start: from, end: to },
      };
    } catch (_) {
      throw new ChecklistError('Failed to get calendar instances', 'CALENDAR_ERROR');
    }
  }

  // Complete a checklist instance
  async completeInstance(
    _userId: string,
    instanceId: string,
    _data: CompleteChecklistInstanceRequest
  ): Promise<ChecklistInstance> {
    try {
      // Find the instance in completions table
      const completions = await this.storage.getChecklistCompletions('');
      const instance = this.findInstanceInCompletions(completions, instanceId);
      
      if (!instance) {
        throw new CompletionError('Instance not found or already completed');
      }

      // Validate required items are checked
      const checklist = await this.storage.getChecklist(instance.checklistId, _userId);
      if (!checklist) {
        throw new CompletionError('Checklist not found');
      }

      const requiredItems = checklist.items.filter(item => item.isRequired);
      const checkedRequiredItems = _data.items
        .filter((item: any) => item.checked)
        .filter((item: any) => requiredItems.some(req => req._id === item.itemId));

      if (checkedRequiredItems.length < requiredItems.length) {
        throw new CompletionError('All required items must be completed');
      }

      // Create completion record
      const _completionData: InsertChecklistCompletion = {
        checklistId: instance.checklistId,
        _fridgeId: null,
        completedBy: _userId,
        completedItems: _data.items.filter((i: any) => i.checked).map((i: any) => i.itemId),
        notes: JSON.stringify({
          instanceId,
          confirmationNote: _data.confirmationNote,
          itemNotes: _data.items.reduce((acc: any, item: any) => {
            if (item.note) acc[item.itemId] = item.note;
            return acc;
          }, {} as Record<string, string>),
          completedAt: new Date().toISOString(),
        }),
      };

      await this.storage.createChecklistCompletion(_completionData);

      return {
        _id: instanceId,
        checklistId: instance.checklistId,
        scheduleId: instance.scheduleId,
        targetDate: instance.targetDate,
        status: 'COMPLETED',
        completedAt: new Date(),
        completedBy: _userId,
        completedItems: _completionData.completedItems || [],
        confirmationNote: _data.confirmationNote,
        createdAt: instance.createdAt,
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof CompletionError) throw error;
      throw new CompletionError('Failed to complete instance');
    }
  }

  // Get summary data for dashboard
  async getSummaries(
    _userId: string,
    from: string,
    to: string,
    checklistId?: string,
    cadence?: 'DAILY' | 'DOW' | 'WEEKLY'
  ): Promise<ChecklistMetrics> {
    try {
      const checklists = await this.storage.getChecklists(_userId);
      let targetChecklists = checklists.filter(c => this.hasSchedule(c));

      if (checklistId) {
        targetChecklists = targetChecklists.filter(c => c._id === checklistId);
      }

      if (cadence) {
        targetChecklists = targetChecklists.filter(c => {
          const schedule = this.extractScheduleFromChecklist(c);
          return schedule?.cadence === cadence;
        });
      }

      const summaries: ChecklistSummary[] = [];
      let totalRequired = 0;
      let totalCompleted = 0;
      let totalOnTime = 0;

      for (const checklist of targetChecklists) {
        const schedule = this.extractScheduleFromChecklist(checklist);
        if (!schedule) continue;

        const instances = await this.getInstancesForChecklist(checklist._id, from, to);
        const required = instances.length;
        const completed = instances.filter(i => i.status === 'COMPLETED').length;
        const onTime = this.calculateOnTimeInstances(instances, schedule.cadence);

        totalRequired += required;
        totalCompleted += completed;
        totalOnTime += onTime;

        summaries.push({
          checklistId: checklist._id,
          checklistName: checklist.title,
          cadence: schedule.cadence,
          period: { start: from, end: to },
          required,
          completed,
          onTime,
          completionRate: required > 0 ? (completed / required) * 100 : 100,
          onTimeRate: completed > 0 ? (onTime / completed) * 100 : 100,
        });
      }

      return {
        totalRequired,
        totalCompleted,
        totalOnTime,
        overallCompletionRate: totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 100,
        overallOnTimeRate: totalCompleted > 0 ? (totalOnTime / totalCompleted) * 100 : 100,
        byChecklist: summaries,
      };
    } catch (_) {
      throw new ChecklistError('Failed to get summaries', 'SUMMARIES_ERROR');
    }
  }

  // Get checklists with active=true filter
  async listChecklists(_userId: string, activeOnly: boolean = true): Promise<ChecklistWithScheduleAndItems[]> {
    try {
      const checklists = await this.storage.getChecklists(_userId);
      const filtered = activeOnly ? checklists.filter(c => c.isActive) : checklists;
      
      return filtered.map(c => this.transformToEnhancedChecklist(c, c.items));
    } catch (_) {
      throw new ChecklistError('Failed to list checklists', 'LIST_FAILED');
    }
  }

  // Export CSV data
  async exportCSV(_userId: string, from: string, to: string): Promise<ChecklistCSVRecord[]> {
    try {
      const calendarData = await this.getCalendarInstances(_userId, from, to);
      const records: ChecklistCSVRecord[] = [];

      for (const instance of calendarData.instances) {
        const targetDate = instance.cadence === 'WEEKLY' ? 
          this.formatWeekIdentifier(instance.targetDate) : 
          instance.targetDate;

        records.push({
          date_or_week: targetDate,
          checklist_name: instance.checklistName,
          cadence: instance.cadence,
          required: 'Y',
          completed: instance.status === 'COMPLETED' ? 'Y' : 'N',
          on_time: this.isInstanceOnTime(instance) ? 'Y' : 'N',
          completed_at: instance.completedAt?.toISOString() || '',
          completed_by: instance.completedBy || '',
        });
      }

      return records;
    } catch (_) {
      throw new ChecklistError('Failed to export CSV', 'EXPORT_ERROR');
    }
  }

  // Private helper methods

  private hasSchedule(checklist: Checklist & { items: ChecklistItem[] }): boolean {
    try {
      const parsed = JSON.parse(checklist.description || '{}');
      return !!parsed.schedule;
    } catch {
      return false;
    }
  }

  private extractScheduleFromChecklist(checklist: Checklist & { items: ChecklistItem[] }): ScheduleMetadata | null {
    try {
      const parsed = JSON.parse(checklist.description || '{}');
      return parsed.schedule || null;
    } catch {
      return null;
    }
  }

  private transformToEnhancedChecklist(
    checklist: Checklist,
    items: ChecklistItem[]
  ): ChecklistWithScheduleAndItems {
    const schedule = this.extractScheduleFromChecklist({ ...checklist, items });
    
    return {
      _id: checklist._id,
      name: checklist.title,
      description: this.extractDescription(checklist.description),
      items: items.map(item => ({
        _id: item._id,
        label: item.title,
        required: item.isRequired,
        orderIndex: parseInt(item.sortOrder) || 0,
        note: item.description || undefined,
      })),
      schedule: schedule ? {
        _id: `schedule_${checklist._id}`,
        checklistId: checklist._id,
        ...schedule,
        createdAt: checklist.createdAt || new Date(),
        updatedAt: checklist.createdAt || new Date(),
      } : undefined,
      isActive: checklist.isActive,
      createdBy: checklist.createdBy,
      createdAt: checklist.createdAt || new Date(),
      updatedAt: checklist.createdAt || new Date(),
    };
  }

  private extractDescription(description: string | null): string | undefined {
    if (!description) return undefined;
    
    try {
      const parsed = JSON.parse(description);
      return parsed.description || undefined;
    } catch {
      return description;
    }
  }

  private calculateRequiredInstances(
    schedule: ScheduleMetadata,
    checklistId: string,
    fromDate: Date,
    toDate: Date
  ): GeneratedInstance[] {
    const instances: GeneratedInstance[] = [];
    const scheduleStart = new Date(schedule.startDate);
    const scheduleEnd = schedule.endDate ? new Date(schedule.endDate) : toDate;
    
    const start = new Date(Math.max(fromDate.getTime(), scheduleStart.getTime()));
    const end = new Date(Math.min(toDate.getTime(), scheduleEnd.getTime()));

    if (start > end) return instances;

    switch (schedule.cadence) {
      case 'DAILY':
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          instances.push(this.createInstanceFromDate(checklistId, new Date(date)));
        }
        break;

      case 'DOW':
        if (!schedule.daysOfWeek?.length) break;
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          if (schedule.daysOfWeek.includes(date.getDay())) {
            instances.push(this.createInstanceFromDate(checklistId, new Date(date)));
          }
        }
        break;

      case 'WEEKLY': {
        const startWeek = this.getWeekIdentifier(start);
        const endWeek = this.getWeekIdentifier(end);
        
        const currentDate = this.getDateFromWeekIdentifier(startWeek);
        while (this.getWeekIdentifier(currentDate) <= endWeek) {
          instances.push({
            checklistId,
            scheduleId: `schedule_${checklistId}`,
            targetDate: this.getWeekIdentifier(currentDate),
            status: 'REQUIRED',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          currentDate.setDate(currentDate.getDate() + 7);
        }
        break;
      }
    }

    return instances;
  }

  private createInstanceFromDate(checklistId: string, date: Date): GeneratedInstance {
    return {
      checklistId,
      scheduleId: `schedule_${checklistId}`,
      targetDate: date.toISOString().split('T')[0]!,
      status: 'REQUIRED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private getWeekIdentifier(date: Date): string {
    const year = date.getFullYear();
    const firstDay = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + firstDay.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  private getDateFromWeekIdentifier(weekId: string): Date {
    const [year, week] = weekId.split('-W');
    const firstDay = new Date(parseInt(year!), 0, 1);
    const days = (parseInt(week!) - 1) * 7 - firstDay.getDay() + 1;
    return new Date(firstDay.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private formatWeekIdentifier(weekId: string): string {
    return weekId; // Already in YYYY-WNN format
  }

  private async getInstancesForChecklist(checklistId: string, from: string, to: string): Promise<ChecklistInstance[]> {
    // This would need to be implemented to query instances from completions table
    // For now, return empty array
    return [];
  }

  private async createInstance(_userId: string, instance: GeneratedInstance): Promise<void> {
    // Store instance metadata in completions table with special status
    const instanceMetadata: InstanceMetadata = {
      instanceId: `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      targetDate: instance.targetDate,
      status: instance.status,
      scheduleId: instance.scheduleId,
    };

    const _completionData: InsertChecklistCompletion = {
      checklistId: instance.checklistId,
      _fridgeId: null,
      completedBy: _userId,
      completedItems: [],
      notes: JSON.stringify({
        ...instanceMetadata,
        isInstance: true,
      }),
    };

    await this.storage.createChecklistCompletion(_completionData);
  }

  private findInstanceInCompletions(
    completions: ChecklistCompletion[],
    instanceId: string
  ): ChecklistInstance | null {
    // Implementation would search through completions for instance metadata
    return null;
  }

  private calculateOnTimeInstances(instances: ChecklistInstance[], cadence: string): number {
    return instances.filter(i => this.isInstanceOnTime({ ...i, cadence, checklistName: '' } as CalendarInstance)).length;
  }

  private isInstanceOnTime(instance: CalendarInstance): boolean {
    if (instance.status !== 'COMPLETED' || !instance.completedAt) return false;

    const completedDate = new Date(instance.completedAt);
    
    switch (instance.cadence) {
      case 'DAILY':
      case 'DOW': {
        // On-time if completed on the same day
        const targetDate = new Date(instance.targetDate);
        return completedDate.toDateString() === targetDate.toDateString();
      }
      
      case 'WEEKLY': {
        // On-time if completed within the week
        const weekStart = this.getDateFromWeekIdentifier(instance.targetDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return completedDate >= weekStart && completedDate <= weekEnd;
      }
      
      default:
        return false;
    }
  }
}