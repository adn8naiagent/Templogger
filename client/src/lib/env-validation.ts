export interface EnvironmentVariable {
  key: string;
  value: string | "configured" | "missing";
  required: boolean;
  description: string;
}

export interface EnvironmentStatus {
  variables: EnvironmentVariable[];
  summary: {
    total: number;
    configured: number;
    status: "complete" | "partial" | "error";
  };
}

export const requiredEnvVars: Omit<EnvironmentVariable, "value">[] = [
  {
    key: "DATABASE_URL",
    required: true,
    description: "Supabase database connection string",
  },
  {
    key: "STRIPE_SECRET_KEY",
    required: true,
    description: "Stripe secret key for payment processing",
  },
  {
    key: "VITE_STRIPE_PUBLIC_KEY",
    required: true,
    description: "Stripe publishable key for client-side",
  },
  {
    key: "CLAUDE_API_KEY",
    required: false,
    description: "Claude API key for AI assistance",
  },
];

export function validateEnvironment(): EnvironmentStatus {
  const variables: EnvironmentVariable[] = requiredEnvVars.map((envVar) => ({
    ...envVar,
    value: process.env[envVar.key] ? "configured" : "missing",
  }));

  const configured = variables.filter((v) => v.value === "configured").length;
  const total = variables.length;

  return {
    variables,
    summary: {
      total,
      configured,
      status: configured === total ? "complete" : "partial",
    },
  };
}
