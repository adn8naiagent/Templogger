import Navigation from "@/components/layout/navigation";
import ProjectOverview from "@/components/dashboard/project-overview";
import ServiceIntegrations from "@/components/dashboard/service-integrations";
import SubscriptionTiers from "@/components/dashboard/subscription-tiers";
import ToolingStatus from "@/components/dashboard/tooling-status";
import QuickActions from "@/components/dashboard/quick-actions";
import ProjectStructure from "@/components/dashboard/project-structure";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast({
      title: "Dashboard Refreshed",
      description: "All status information has been updated.",
    });
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground font-sans"
      data-testid="dashboard-container"
    >
      <Navigation onRefresh={handleRefresh} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="main-content">
        <ProjectOverview />
        <ServiceIntegrations />
        <SubscriptionTiers />
        <ToolingStatus />
        <QuickActions />
        <ProjectStructure />

        <footer className="text-center text-muted-foreground py-8" data-testid="footer">
          <p className="text-sm" data-testid="footer-title">
            Fullstack Foundation Dashboard - Development Environment Ready
          </p>
          <p className="text-xs mt-1" data-testid="footer-tech-stack">
            TypeScript • React • Express • Supabase • Stripe • Railway
          </p>
        </footer>
      </main>
    </div>
  );
}
