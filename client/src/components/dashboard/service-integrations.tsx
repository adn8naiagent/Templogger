import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, CreditCard, Brain } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ServiceData {
  name: string;
  status: "connected" | "disconnected";
  description: string;
  features: Record<string, string>;
}

interface ServicesResponse {
  supabase?: ServiceData;
  stripe?: ServiceData;
  claude?: ServiceData;
}

interface ServiceCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected";
  features: Record<string, string>;
  serviceKey: string;
}

function ServiceCard({ name, description, icon, status, features, serviceKey }: ServiceCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const testConnection = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/test-connection/${serviceKey}`);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Connection Test",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/services-status"] });
    },
    onError: (error) => {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "disconnected":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      default:
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
    }
  };

  return (
    <Card data-testid={`card-service-${serviceKey}`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold" data-testid={`title-${serviceKey}`}>{name}</h3>
            <p className="text-sm text-muted-foreground" data-testid={`description-${serviceKey}`}>
              {description}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Connection</span>
            <Badge className={getStatusColor(status)} data-testid={`status-${serviceKey}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          {Object.entries(features).map(([feature, value]) => (
            <div key={feature} className="flex items-center justify-between" data-testid={`feature-${feature}`}>
              <span className="text-sm">{feature}</span>
              <span className="text-green-600 dark:text-green-400 text-sm">{value}</span>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          className="w-full mt-4"
          onClick={() => testConnection.mutate()}
          disabled={testConnection.isPending}
          data-testid={`button-test-${serviceKey}`}
        >
          {testConnection.isPending ? "Testing..." : "Test Connection"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ServiceIntegrations() {
  const { data: services } = useQuery<ServicesResponse>({
    queryKey: ["/api/services-status"],
  });

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-6" data-testid="title-service-integrations">
        Service Integrations
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {services?.supabase && (
          <ServiceCard
            name={services.supabase.name}
            description={services.supabase.description}
            icon={<Database className="w-5 h-5 text-green-600 dark:text-green-400" />}
            status={services.supabase.status}
            features={services.supabase.features}
            serviceKey="supabase"
          />
        )}

        {services?.stripe && (
          <ServiceCard
            name={services.stripe.name}
            description={services.stripe.description}
            icon={<CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            status={services.stripe.status}
            features={services.stripe.features}
            serviceKey="stripe"
          />
        )}

        {services?.claude && (
          <ServiceCard
            name={services.claude.name}
            description={services.claude.description}
            icon={<Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            status={services.claude.status}
            features={services.claude.features}
            serviceKey="claude"
          />
        )}
      </div>
    </div>
  );
}
