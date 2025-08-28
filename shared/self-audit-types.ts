import { z } from "zod";

// Self-Audit Checklist Data Structures
export interface AuditSection {
  _id: string;
  title: string;
  description?: string;
  orderIndex: number;
  items: AuditItem[];
}

export interface AuditItem {
  _id: string;
  sectionId: string;
  text: string;
  isRequired: boolean;
  orderIndex: number;
  note?: string;
}

export interface AuditTemplate {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  sections: AuditSection[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditCompletion {
  _id: string;
  _templateId: string;
  templateName: string;
  completedBy: string;
  completedAt: Date;
  notes?: string;
  responses: AuditResponse[];
}

export interface AuditResponse {
  _id: string;
  _completionId: string;
  sectionId: string;
  sectionTitle: string;
  itemId: string;
  itemText: string;
  isCompliant: boolean;
  notes?: string;
  actionRequired?: string;
}

// Template with completion data for viewing
export interface AuditTemplateWithStats extends AuditTemplate {
  totalCompletions: number;
  lastCompletedAt?: Date;
  averageComplianceRate: number;
}

// Completion with full template data
export interface AuditCompletionDetailed extends AuditCompletion {
  template: AuditTemplate;
  complianceRate: number;
  nonCompliantItems: number;
  actionItems: string[];
}

// API Schemas
export const createAuditTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  sections: z
    .array(
      z.object({
        title: z.string().min(1, "Section title is required"),
        description: z.string().optional(),
        orderIndex: z.number().min(0),
        items: z
          .array(
            z.object({
              text: z.string().min(1, "Item text is required"),
              isRequired: z.boolean().default(true),
              orderIndex: z.number().min(0),
              note: z.string().optional(),
            })
          )
          .min(1, "Each section must have at least one item"),
      })
    )
    .min(1, "Template must have at least one section"),
});

export const updateAuditTemplateSchema = createAuditTemplateSchema.partial().extend({
  _id: z.string().min(1, "Template ID is required"),
});

export const completeAuditSchema = z.object({
  _templateId: z.string().min(1, "Template ID is required"),
  notes: z.string().optional(),
  responses: z
    .array(
      z.object({
        sectionId: z.string().min(1, "Section ID is required"),
        itemId: z.string().min(1, "Item ID is required"),
        isCompliant: z.boolean(),
        notes: z.string().optional(),
        actionRequired: z.string().optional(),
      })
    )
    .min(1, "At least one response is required"),
});

export const auditFiltersSchema = z.object({
  _templateId: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  completedBy: z.string().optional(),
  complianceThreshold: z.number().min(0).max(100).optional(),
});

// Type exports
export type CreateAuditTemplateRequest = z.infer<typeof createAuditTemplateSchema>;
export type UpdateAuditTemplateRequest = z.infer<typeof updateAuditTemplateSchema>;
export type CompleteAuditRequest = z.infer<typeof completeAuditSchema>;
export type AuditFiltersRequest = z.infer<typeof auditFiltersSchema>;

// Default compliance checklist structure
export const DEFAULT_COMPLIANCE_CHECKLIST: Omit<
  CreateAuditTemplateRequest,
  "name" | "description"
> = {
  sections: [
    {
      title: "1. Equipment & Certification",
      description: "Verify equipment specifications and compliance certifications",
      orderIndex: 0,
      items: [
        {
          text: "Purpose-built refrigerator(s) in use (not domestic).",
          isRequired: true,
          orderIndex: 0,
        },
        {
          text: "Current Cold Chain Certificate (valid ≤ 2 years from issue).",
          isRequired: true,
          orderIndex: 1,
        },
        {
          text: "Refrigerator is QCPP-compliant and/or ARTG-listed.",
          isRequired: true,
          orderIndex: 2,
        },
        {
          text: "Evidence of annual thermometer calibration (certificate available).",
          isRequired: true,
          orderIndex: 3,
        },
        {
          text: "Back-up power arrangements documented.",
          isRequired: true,
          orderIndex: 4,
        },
      ],
    },
    {
      title: "2. Temperature Monitoring",
      description: "Assess temperature monitoring practices and compliance",
      orderIndex: 1,
      items: [
        {
          text: "Fridge(s) consistently maintaining +2 °C to +8 °C (optimal +5 °C).",
          isRequired: true,
          orderIndex: 0,
        },
        {
          text: "Twice-daily monitoring completed (current, min, max recorded).",
          isRequired: true,
          orderIndex: 1,
        },
        {
          text: "Reset function used after each min/max recording.",
          isRequired: true,
          orderIndex: 2,
        },
        {
          text: "Logs clearly show time, date, and staff initials.",
          isRequired: true,
          orderIndex: 3,
        },
        {
          text: "Excursion alerts are clearly visible and acted upon.",
          isRequired: true,
          orderIndex: 4,
        },
      ],
    },
    {
      title: "3. Recording & Documentation",
      description: "Review documentation and record-keeping practices",
      orderIndex: 2,
      items: [
        {
          text: "Paper or digital logs are up-to-date and legible.",
          isRequired: true,
          orderIndex: 0,
        },
        {
          text: "Logs stored for ≥ 3 years (QCPP requirement).",
          isRequired: true,
          orderIndex: 1,
        },
        {
          text: "Calibration certificates filed and accessible.",
          isRequired: true,
          orderIndex: 2,
        },
        {
          text: "Vaccine/medicine management protocols documented and accessible to staff.",
          isRequired: true,
          orderIndex: 3,
        },
        {
          text: "Records include batch numbers, delivery dates, and expiry dates.",
          isRequired: true,
          orderIndex: 4,
        },
      ],
    },
    {
      title: "4. Cold Chain Breach Management",
      description: "Evaluate cold chain breach protocols and training",
      orderIndex: 3,
      items: [
        {
          text: "Staff trained in cold chain breach protocol.",
          isRequired: true,
          orderIndex: 0,
        },
        {
          text: "Protocol followed:",
          isRequired: true,
          orderIndex: 1,
        },
        {
          text: 'Isolate vaccines/medicines, label "Do Not Use".',
          isRequired: true,
          orderIndex: 2,
        },
        {
          text: "Contact state/territory health department (vaccines).",
          isRequired: true,
          orderIndex: 3,
        },
        {
          text: "Record incident details, corrective action, and outcome.",
          isRequired: true,
          orderIndex: 4,
        },
        {
          text: "No vaccines/medicines discarded without official advice.",
          isRequired: true,
          orderIndex: 5,
        },
        {
          text: "Evidence of corrective actions filed with logs.",
          isRequired: true,
          orderIndex: 6,
        },
      ],
    },
    {
      title: "5. Broader Cold Chain (Non-Vaccine Medicines)",
      description: "Assess storage requirements for various medicines and biologics",
      orderIndex: 4,
      items: [
        {
          text: "Insulins stored at 2–8 °C (room-temp storage tracked once opened).",
          isRequired: true,
          orderIndex: 0,
        },
        {
          text: "Biologics (mAbs, growth hormones, etc.) stored at 2–8 °C per PI.",
          isRequired: true,
          orderIndex: 1,
        },
        {
          text: "Eye drops/antibiotics/probiotics requiring refrigeration identified and stored correctly.",
          isRequired: true,
          orderIndex: 2,
        },
        {
          text: "Blood & blood products stored per standards:",
          isRequired: false,
          orderIndex: 3,
          note: "Only applicable if handling blood products",
        },
        {
          text: "Red cells: 2–6 °C",
          isRequired: false,
          orderIndex: 4,
          note: "Only applicable if handling blood products",
        },
        {
          text: "Platelets: 20–24 °C with agitation",
          isRequired: false,
          orderIndex: 5,
          note: "Only applicable if handling blood products",
        },
        {
          text: "Plasma: ≤ −25 °C",
          isRequired: false,
          orderIndex: 6,
          note: "Only applicable if handling blood products",
        },
        {
          text: "Staff aware of individual product requirements (per manufacturer PI).",
          isRequired: true,
          orderIndex: 7,
        },
      ],
    },
    {
      title: "6. Staff & Training",
      description: "Review staff training and coordination arrangements",
      orderIndex: 5,
      items: [
        {
          text: "Vaccine/medicine coordinator appointed.",
          isRequired: true,
          orderIndex: 0,
        },
        {
          text: "Back-up coordinator nominated.",
          isRequired: true,
          orderIndex: 1,
        },
        {
          text: "All staff trained in Strive for 5 and QCPP protocols.",
          isRequired: true,
          orderIndex: 2,
        },
        {
          text: "Staff know who to contact in event of breach.",
          isRequired: true,
          orderIndex: 3,
        },
        {
          text: "Training records kept up to date.",
          isRequired: true,
          orderIndex: 4,
        },
      ],
    },
    {
      title: "7. Self-Audit & Review",
      description: "Evaluate audit and review processes",
      orderIndex: 6,
      items: [
        {
          text: "Annual vaccine storage self-audit completed (Strive for 5 Appendix 2).",
          isRequired: true,
          orderIndex: 0,
        },
        {
          text: "Action plan developed for any deficiencies identified.",
          isRequired: true,
          orderIndex: 1,
        },
        {
          text: "Previous corrective actions reviewed for effectiveness.",
          isRequired: true,
          orderIndex: 2,
        },
        {
          text: "Policy/protocols reviewed and signed off within the past 12 months.",
          isRequired: true,
          orderIndex: 3,
        },
      ],
    },
  ],
};

// Utility functions
export function calculateComplianceRate(responses: AuditResponse[]): number {
  if (responses.length === 0) return 0;
  const compliantCount = responses.filter((r) => r.isCompliant).length;
  return Math.round((compliantCount / responses.length) * 100);
}

export function getActionItems(responses: AuditResponse[]): string[] {
  return responses
    .filter((r) => r.actionRequired && r.actionRequired.trim() !== "")
    .map((r) => r.actionRequired!)
    .filter(Boolean);
}

export function getNonCompliantItems(responses: AuditResponse[]): AuditResponse[] {
  return responses.filter((r) => !r.isCompliant);
}

// Error classes
export class AuditTemplateError extends Error {
  constructor(
    message: string,
    public _code: string = "TEMPLATE_ERROR"
  ) {
    super(message);
    this.name = "AuditTemplateError";
  }
}

export class AuditCompletionError extends Error {
  constructor(
    message: string,
    public _code: string = "COMPLETION_ERROR"
  ) {
    super(message);
    this.name = "AuditCompletionError";
  }
}
