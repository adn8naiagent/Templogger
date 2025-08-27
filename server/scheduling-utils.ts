import { 
  ChecklistSchedule,
  ScheduleWindow,
  GeneratedInstance,
  ScheduleError 
} from "@shared/checklist-types";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface WeekInfo {
  year: number;
  week: number;
  identifier: string;
  startDate: Date;
  endDate: Date;
}

export class SchedulingUtils {
  // Convert timezone-aware date to UTC for consistent storage
  static toUTC(dateStr: string, timezone: string = 'UTC'): Date {
    // For simplicity, we'll work with UTC dates
    // In production, you'd want proper timezone handling
    return new Date(dateStr + 'T00:00:00.000Z');
  }

  // Generate instances for DAILY cadence
  static generateDailyInstances(
    schedule: ChecklistSchedule,
    dateRange: DateRange
  ): GeneratedInstance[] {
    const instances: GeneratedInstance[] = [];
    
    const scheduleStart = this.toUTC(schedule.startDate, schedule.timezone);
    const scheduleEnd = schedule.endDate ? this.toUTC(schedule.endDate, schedule.timezone) : dateRange.end;
    
    const effectiveStart = new Date(Math.max(dateRange.start.getTime(), scheduleStart.getTime()));
    const effectiveEnd = new Date(Math.min(dateRange.end.getTime(), scheduleEnd.getTime()));

    if (effectiveStart > effectiveEnd) return instances;

    for (let date = new Date(effectiveStart); date <= effectiveEnd; date.setUTCDate(date.getUTCDate() + 1)) {
      instances.push({
        checklistId: schedule.checklistId,
        scheduleId: schedule._id,
        targetDate: this.formatDateISO(new Date(date)),
        status: 'REQUIRED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return instances;
  }

  // Generate instances for DOW (Days of Week) cadence
  static generateDOWInstances(
    schedule: ChecklistSchedule,
    dateRange: DateRange
  ): GeneratedInstance[] {
    if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
      throw new ScheduleError('Days of week must be specified for DOW cadence');
    }

    const instances: GeneratedInstance[] = [];
    
    const scheduleStart = this.toUTC(schedule.startDate, schedule.timezone);
    const scheduleEnd = schedule.endDate ? this.toUTC(schedule.endDate, schedule.timezone) : dateRange.end;
    
    const effectiveStart = new Date(Math.max(dateRange.start.getTime(), scheduleStart.getTime()));
    const effectiveEnd = new Date(Math.min(dateRange.end.getTime(), scheduleEnd.getTime()));

    if (effectiveStart > effectiveEnd) return instances;

    for (let date = new Date(effectiveStart); date <= effectiveEnd; date.setUTCDate(date.getUTCDate() + 1)) {
      const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
      
      if (schedule.daysOfWeek.includes(dayOfWeek)) {
        instances.push({
          checklistId: schedule.checklistId,
          scheduleId: schedule._id,
          targetDate: this.formatDateISO(new Date(date)),
          status: 'REQUIRED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return instances;
  }

  // Generate instances for WEEKLY cadence
  static generateWeeklyInstances(
    schedule: ChecklistSchedule,
    dateRange: DateRange
  ): GeneratedInstance[] {
    const instances: GeneratedInstance[] = [];
    
    const scheduleStart = this.toUTC(schedule.startDate, schedule.timezone);
    const scheduleEnd = schedule.endDate ? this.toUTC(schedule.endDate, schedule.timezone) : dateRange.end;
    
    const effectiveStart = new Date(Math.max(dateRange.start.getTime(), scheduleStart.getTime()));
    const effectiveEnd = new Date(Math.min(dateRange.end.getTime(), scheduleEnd.getTime()));

    if (effectiveStart > effectiveEnd) return instances;

    // Get week boundaries
    const startWeek = this.getWeekInfo(effectiveStart);
    const endWeek = this.getWeekInfo(effectiveEnd);

    let currentWeek = startWeek;
    while (currentWeek.year <= endWeek.year && 
           (currentWeek.year < endWeek.year || currentWeek.week <= endWeek.week)) {
      
      // Check if the week overlaps with our effective date range
      if (currentWeek.endDate >= effectiveStart && currentWeek.startDate <= effectiveEnd) {
        instances.push({
          checklistId: schedule.checklistId,
          scheduleId: schedule._id,
          targetDate: currentWeek.identifier,
          status: 'REQUIRED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      currentWeek = this.getNextWeek(currentWeek);
    }

    return instances;
  }

  // Main instance generation method
  static generateInstances(
    schedule: ChecklistSchedule,
    dateRange: DateRange
  ): GeneratedInstance[] {
    if (!schedule.isActive) return [];

    switch (schedule.cadence) {
      case 'DAILY':
        return this.generateDailyInstances(schedule, dateRange);
      case 'DOW':
        return this.generateDOWInstances(schedule, dateRange);
      case 'WEEKLY':
        return this.generateWeeklyInstances(schedule, dateRange);
      default:
        throw new ScheduleError(`Unsupported cadence: ${schedule.cadence}`);
    }
  }

  // Check if an instance is on-time based on completion date and cadence
  static isInstanceOnTime(
    targetDate: string,
    completedAt: Date,
    cadence: 'DAILY' | 'DOW' | 'WEEKLY'
  ): boolean {
    switch (cadence) {
      case 'DAILY':
      case 'DOW':
        // On-time if completed on the same day
        const target = new Date(targetDate);
        return this.isSameDay(completedAt, target);
      
      case 'WEEKLY':
        // On-time if completed within the target week
        const weekInfo = this.parseWeekIdentifier(targetDate);
        if (!weekInfo) return false;
        
        return completedAt >= weekInfo.startDate && completedAt <= weekInfo.endDate;
      
      default:
        return false;
    }
  }

  // Check if an instance should be marked as MISSED
  static shouldMarkAsMissed(
    targetDate: string,
    currentDate: Date,
    cadence: 'DAILY' | 'DOW' | 'WEEKLY'
  ): boolean {
    switch (cadence) {
      case 'DAILY':
      case 'DOW':
        // Missed if current date is after target date
        const target = new Date(targetDate);
        target.setUTCHours(23, 59, 59, 999); // End of target day
        return currentDate > target;
      
      case 'WEEKLY':
        // Missed if current date is after the end of target week
        const weekInfo = this.parseWeekIdentifier(targetDate);
        if (!weekInfo) return false;
        
        const weekEnd = new Date(weekInfo.endDate);
        weekEnd.setUTCHours(23, 59, 59, 999); // End of last day of week
        return currentDate > weekEnd;
      
      default:
        return false;
    }
  }

  // Get upcoming instances that need attention
  static getUpcomingInstances(
    instances: GeneratedInstance[],
    currentDate: Date,
    daysBefore: number = 1
  ): GeneratedInstance[] {
    const cutoffDate = new Date(currentDate);
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() + daysBefore);

    return instances.filter(instance => {
      if (instance.status !== 'REQUIRED') return false;

      // For daily/DOW, check if within daysBefore
      if (instance.targetDate.includes('-W')) {
        // Weekly: check if we're in the current week or next week
        const weekInfo = this.parseWeekIdentifier(instance.targetDate);
        if (!weekInfo) return false;
        return weekInfo.startDate <= cutoffDate;
      } else {
        // Daily/DOW: check if within daysBefore days
        const targetDate = new Date(instance.targetDate);
        return targetDate >= currentDate && targetDate <= cutoffDate;
      }
    });
  }

  // Helper methods

  private static formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
  }

  private static getWeekInfo(date: Date): WeekInfo {
    const year = date.getUTCFullYear();
    const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
    const firstDayWeekday = firstDayOfYear.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate the number of days from the start of the year
    const daysSinceStart = Math.floor((date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate week number (ISO week)
    // Adjust for the first day of the year not being Monday
    const daysToFirstMonday = (7 - firstDayWeekday + 1) % 7;
    const adjustedDays = daysSinceStart + firstDayWeekday - 1;
    const weekNumber = Math.floor(adjustedDays / 7) + 1;
    
    // Calculate week start and end dates
    const weekStart = new Date(firstDayOfYear);
    weekStart.setUTCDate(1 + (weekNumber - 1) * 7 - firstDayWeekday + 1);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

    return {
      year,
      week: weekNumber,
      identifier: `${year}-W${weekNumber.toString().padStart(2, '0')}`,
      startDate: weekStart,
      endDate: weekEnd,
    };
  }

  private static getNextWeek(weekInfo: WeekInfo): WeekInfo {
    const nextWeekStart = new Date(weekInfo.startDate);
    nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7);
    return this.getWeekInfo(nextWeekStart);
  }

  private static parseWeekIdentifier(weekId: string): WeekInfo | null {
    const match = weekId.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return null;

    const year = parseInt(match[1]);
    const week = parseInt(match[2]);

    // Reconstruct week info
    const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
    const firstDayWeekday = firstDayOfYear.getUTCDay();
    
    const weekStart = new Date(firstDayOfYear);
    weekStart.setUTCDate(1 + (week - 1) * 7 - firstDayWeekday + 1);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

    return {
      year,
      week,
      identifier: weekId,
      startDate: weekStart,
      endDate: weekEnd,
    };
  }

  // Validation helpers
  static validateSchedule(schedule: Partial<ChecklistSchedule>): string[] {
    const errors: string[] = [];

    if (!schedule.cadence) {
      errors.push('Cadence is required');
    } else if (!['DAILY', 'DOW', 'WEEKLY'].includes(schedule.cadence)) {
      errors.push('Cadence must be DAILY, DOW, or WEEKLY');
    }

    if (!schedule.startDate) {
      errors.push('Start date is required');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(schedule.startDate)) {
      errors.push('Start date must be in YYYY-MM-DD format');
    }

    if (schedule.endDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(schedule.endDate)) {
        errors.push('End date must be in YYYY-MM-DD format');
      } else if (schedule.startDate && new Date(schedule.endDate) <= new Date(schedule.startDate)) {
        errors.push('End date must be after start date');
      }
    }

    if (schedule.cadence === 'DOW') {
      if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
        errors.push('Days of week must be specified for DOW cadence');
      } else if (schedule.daysOfWeek.some(day => day < 0 || day > 6)) {
        errors.push('Days of week must be between 0 (Sunday) and 6 (Saturday)');
      }
    }

    return errors;
  }

  // Generate preview of upcoming requirements
  static generatePreview(
    schedule: ChecklistSchedule,
    daysAhead: number = 30
  ): Array<{ date: string; displayDate: string }> {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setUTCDate(futureDate.getUTCDate() + daysAhead);

    const instances = this.generateInstances(schedule, { start: now, end: futureDate });
    
    return instances.slice(0, 10).map(instance => ({
      date: instance.targetDate,
      displayDate: this.formatDisplayDate(instance.targetDate, schedule.cadence),
    }));
  }

  private static formatDisplayDate(targetDate: string, cadence: 'DAILY' | 'DOW' | 'WEEKLY'): string {
    if (cadence === 'WEEKLY') {
      const weekInfo = this.parseWeekIdentifier(targetDate);
      if (!weekInfo) return targetDate;
      
      const startStr = weekInfo.startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const endStr = weekInfo.endDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return `Week of ${startStr} - ${endStr}`;
    } else {
      return new Date(targetDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
}