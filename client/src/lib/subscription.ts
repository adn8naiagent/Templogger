export interface SubscriptionTier {
  name: string;
  price: number;
  currency: string;
  interval: string;
  popular?: boolean;
  features: string[];
  limitations?: string[];
}

export interface SubscriptionTiers {
  free: SubscriptionTier;
  pro: SubscriptionTier;
  enterprise: SubscriptionTier;
}

export const defaultTiers: SubscriptionTiers = {
  free: {
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "month",
    features: [
      "Basic features",
      "Community support",
      "Limited usage"
    ],
    limitations: [
      "Advanced features"
    ]
  },
  pro: {
    name: "Pro",
    price: 19,
    currency: "USD", 
    interval: "month",
    popular: true,
    features: [
      "All basic features",
      "Advanced features",
      "Priority support",
      "Higher usage limits"
    ]
  },
  enterprise: {
    name: "Enterprise",
    price: 99,
    currency: "USD",
    interval: "month", 
    features: [
      "All pro features",
      "Custom integrations",
      "Dedicated support",
      "Unlimited usage"
    ]
  }
};

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(price);
}
