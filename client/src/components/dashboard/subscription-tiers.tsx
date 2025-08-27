import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/subscription";
import type { SubscriptionTiers as SubscriptionTiersType } from "@/lib/subscription";

interface TierCardProps {
  name: string;
  price: number;
  currency: string;
  interval: string;
  popular?: boolean;
  features: string[];
  limitations?: string[];
  tierKey: string;
}

function TierCard({ name, price, currency, interval, popular, features, limitations, tierKey }: TierCardProps) {
  return (
    <div className={`p-6 ${popular ? 'bg-primary/5 dark:bg-primary/10' : ''}`} data-testid={`tier-${tierKey}`}>
      <div className="flex items-center space-x-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          tierKey === 'free' ? 'bg-gray-400' : 
          tierKey === 'pro' ? 'bg-primary' : 
          'bg-purple-600'
        }`}></div>
        <h4 className="font-semibold" data-testid={`name-${tierKey}`}>{name}</h4>
        {popular && (
          <Badge className="bg-primary text-primary-foreground" data-testid={`badge-popular-${tierKey}`}>
            Popular
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold mb-2" data-testid={`price-${tierKey}`}>
        {formatPrice(price, currency)}
        <span className="text-sm font-normal text-muted-foreground">/{interval}</span>
      </p>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center space-x-2" data-testid={`feature-${tierKey}-${index}`}>
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>{feature}</span>
          </li>
        ))}
        {limitations?.map((limitation, index) => (
          <li key={index} className="flex items-center space-x-2" data-testid={`limitation-${tierKey}-${index}`}>
            <X className="w-4 h-4 text-gray-400" />
            <span>{limitation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SubscriptionTiers() {
  const { _data: tiers } = useQuery<SubscriptionTiersType>({
    queryKey: ["/api/subscription-tiers"],
  });

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-6" data-testid="title-subscription-foundation">
        Subscription Foundation
      </h2>
      <Card>
        <CardHeader className="border-b">
          <CardTitle data-testid="title-tier-structure">Tier Structure</CardTitle>
          <p className="text-sm text-muted-foreground mt-1" data-testid="description-tier-structure">
            Basic subscription model implementation
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {tiers && (
              <>
                <TierCard
                  name={tiers.free.name}
                  price={tiers.free.price}
                  currency={tiers.free.currency}
                  interval={tiers.free.interval}
                  features={tiers.free.features}
                  limitations={tiers.free.limitations}
                  tierKey="free"
                />
                <TierCard
                  name={tiers.pro.name}
                  price={tiers.pro.price}
                  currency={tiers.pro.currency}
                  interval={tiers.pro.interval}
                  popular={tiers.pro.popular}
                  features={tiers.pro.features}
                  tierKey="pro"
                />
                <TierCard
                  name={tiers.enterprise.name}
                  price={tiers.enterprise.price}
                  currency={tiers.enterprise.currency}
                  interval={tiers.enterprise.interval}
                  features={tiers.enterprise.features}
                  tierKey="enterprise"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
