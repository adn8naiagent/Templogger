import { ChecklistService } from "./checklist-service";
import { storage } from "./storage";
import { CreateChecklistRequest, ScheduleChecklistRequest } from "@shared/checklist-types";

export interface SeedChecklistsOptions {
  _userId: string;
  generateInstances?: boolean;
  daysBack?: number;
  daysAhead?: number;
}

export async function seedChecklists(options: SeedChecklistsOptions): Promise<void> {
  const { _userId, generateInstances = true, daysBack = 14, daysAhead = 60 } = options;

  console.log(`Seeding checklists for user ${_userId}...`);

  const checklistService = new ChecklistService(storage);

  try {
    // Sample checklist 1: Daily Safety Check
    const dailyChecklist: CreateChecklistRequest = {
      name: "Daily Safety Check",
      description: "Essential daily safety verification for food service operations",
      items: [
        {
          label: "Check refrigerator temperature readings",
          required: true,
          orderIndex: 0,
        },
        {
          label: "Verify freezer temperature is within range",
          required: true,
          orderIndex: 1,
        },
        {
          label: "Inspect door seals and gaskets",
          required: true,
          orderIndex: 2,
        },
        {
          label: "Check for any unusual sounds or vibrations",
          required: false,
          orderIndex: 3,
        },
        {
          label: "Clean exterior surfaces",
          required: false,
          orderIndex: 4,
        },
      ],
    };

    console.log("Creating daily safety checklist...");
    const createdDailyChecklist = await checklistService.createChecklist(_userId, dailyChecklist);

    // Schedule for daily
    const dailySchedule: ScheduleChecklistRequest = {
      cadence: "DAILY",
      startDate: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
      endDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
      timezone: "UTC",
    };

    console.log("Scheduling daily safety checklist...");
    await checklistService.createOrReplaceSchedule(
      _userId,
      createdDailyChecklist._id,
      dailySchedule
    );

    // Sample checklist 2: Weekly Maintenance
    const weeklyChecklist: CreateChecklistRequest = {
      name: "Weekly Maintenance Check",
      description: "Comprehensive weekly maintenance and deep cleaning tasks",
      items: [
        {
          label: "Deep clean interior surfaces",
          required: true,
          orderIndex: 0,
        },
        {
          label: "Check and clean condenser coils",
          required: true,
          orderIndex: 1,
        },
        {
          label: "Test door alarms and alerts",
          required: true,
          orderIndex: 2,
        },
        {
          label: "Calibrate temperature monitoring equipment",
          required: true,
          orderIndex: 3,
        },
        {
          label: "Review temperature logs from past week",
          required: true,
          orderIndex: 4,
        },
        {
          label: "Update maintenance log",
          required: false,
          orderIndex: 5,
        },
        {
          label: "Order replacement parts if needed",
          required: false,
          orderIndex: 6,
        },
      ],
    };

    console.log("Creating weekly maintenance checklist...");
    const createdWeeklyChecklist = await checklistService.createChecklist(_userId, weeklyChecklist);

    // Schedule for weekly
    const weeklySchedule: ScheduleChecklistRequest = {
      cadence: "WEEKLY",
      startDate: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
      endDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
      timezone: "UTC",
    };

    console.log("Scheduling weekly maintenance checklist...");
    await checklistService.createOrReplaceSchedule(
      _userId,
      createdWeeklyChecklist._id,
      weeklySchedule
    );

    // Sample checklist 3: Monday/Wednesday/Friday Equipment Check
    const equipmentChecklist: CreateChecklistRequest = {
      name: "Equipment Status Check",
      description: "Regular equipment inspection and status verification",
      items: [
        {
          label: "Check compressor operation",
          required: true,
          orderIndex: 0,
        },
        {
          label: "Verify fan motor functionality",
          required: true,
          orderIndex: 1,
        },
        {
          label: "Inspect electrical connections",
          required: true,
          orderIndex: 2,
        },
        {
          label: "Test backup power systems",
          required: false,
          orderIndex: 3,
        },
        {
          label: "Check water filters",
          required: false,
          orderIndex: 4,
        },
      ],
    };

    console.log("Creating equipment check checklist...");
    const createdEquipmentChecklist = await checklistService.createChecklist(
      _userId,
      equipmentChecklist
    );

    // Schedule for Monday, Wednesday, Friday (1, 3, 5)
    const equipmentSchedule: ScheduleChecklistRequest = {
      cadence: "DOW",
      daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
      startDate: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
      endDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
      timezone: "UTC",
    };

    console.log("Scheduling equipment check checklist...");
    await checklistService.createOrReplaceSchedule(
      _userId,
      createdEquipmentChecklist._id,
      equipmentSchedule
    );

    // Generate instances if requested
    if (generateInstances) {
      console.log("Generating checklist instances...");
      const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]!;
      const toDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]!;

      await checklistService.generateInstances(_userId, fromDate!, toDate!);
      console.log("Instances generated successfully");

      // Simulate some completions for the past week
      console.log("Simulating some past completions...");
      await simulateCompletions(checklistService, _userId);
    }

    console.log("Checklist seeding completed successfully!");

    return;
  } catch (error) {
    console.error("Error seeding checklists:", error);
    throw error;
  }
}

async function simulateCompletions(
  _checklistService: ChecklistService,
  _userId: string
): Promise<void> {
  // This would simulate completing some instances
  // For now, we'll just log that it would happen
  console.log("Would simulate completions for past instances...");

  // In a real implementation, you would:
  // 1. Get calendar instances for the past week
  // 2. Randomly select some to mark as completed
  // 3. Call completeInstance for each selected instance

  // Example logic (commented out since we'd need to implement the calendar fetch):
  /*
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const calendarData = await checklistService.getCalendarInstances(_userId, weekAgo, yesterday);
  
  // Complete about 70% of required instances from the past week
  const instancesToComplete = calendarData.instances
    .filter(i => i.status === 'REQUIRED')
    .filter(() => Math.random() < 0.7);
  
  for (const instance of instancesToComplete) {
    // Get checklist details to know what items to complete
    const checklist = await checklistService.getChecklist(instance.checklistId, _userId);
    if (!checklist) continue;
    
    // Complete all required items and some optional ones
    const _completionData = {
      items: checklist.items.map(item => ({
        itemId: item._id,
        checked: item.required || Math.random() < 0.5,
        note: item.required 
          ? undefined 
          : (Math.random() < 0.3 ? "Completed during routine check" : undefined)
      })),
      confirmationNote: "Automated completion during seed data generation"
    };
    
    await checklistService.completeInstance(_userId, instance._id, _completionData);
  }
  */
}

// CLI function to seed data
export async function runChecklistSeed(): Promise<void> {
  try {
    // Get the first user from the database to seed for
    const users = await storage.getAllUsers();
    if (users.length === 0) {
      console.log("No users found. Please create a user first.");
      return;
    }

    const targetUser = users.find((u) => u.role === "admin") || users[0];
    console.log(`Seeding checklists for user: ${targetUser!.email}`);

    await seedChecklists({
      _userId: targetUser!._id,
      generateInstances: true,
      daysBack: 14,
      daysAhead: 60,
    });

    console.log("Checklist seed completed successfully!");
  } catch (error) {
    console.error("Checklist seed failed:", error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runChecklistSeed();
}
