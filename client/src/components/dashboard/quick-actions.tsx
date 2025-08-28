import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Terminal, Package, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  actionKey: string;
}

function ActionButton({ icon, title, description, onClick, actionKey }: ActionButtonProps) {
  return (
    <Button
      variant="outline"
      className="p-4 h-auto text-left flex flex-col items-start space-y-2 hover:border-primary transition-colors"
      onClick={onClick}
      data-testid={`button-${actionKey}`}
    >
      <div className="flex items-center space-x-3 mb-2">
        {icon}
        <span className="font-medium" data-testid={`title-${actionKey}`}>
          {title}
        </span>
      </div>
      <p className="text-sm text-muted-foreground" data-testid={`description-${actionKey}`}>
        {description}
      </p>
    </Button>
  );
}

export default function QuickActions() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    try {
      toast({
        title: "Action Triggered",
        description: `${action} action has been initiated.`,
      });
    } catch (error) {
      console.error("Toast failed:", error);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-6" data-testid="title-quick-actions">
        Quick Actions
      </h2>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton
              icon={<Play className="w-5 h-5 text-accent" />}
              title="Start Dev Servers"
              description="Launch frontend & backend"
              onClick={() => handleAction("Start Dev Servers")}
              actionKey="start-dev-servers"
            />

            <ActionButton
              icon={<Terminal className="w-5 h-5 text-blue-600" />}
              title="Run Tests"
              description="Execute test suites"
              onClick={() => handleAction("Run Tests")}
              actionKey="run-tests"
            />

            <ActionButton
              icon={<Package className="w-5 h-5 text-purple-600" />}
              title="Build Project"
              description="Create production build"
              onClick={() => handleAction("Build Project")}
              actionKey="build-project"
            />

            <ActionButton
              icon={<Upload className="w-5 h-5 text-orange-600" />}
              title="Deploy"
              description="Deploy to Railway"
              onClick={() => handleAction("Deploy")}
              actionKey="deploy"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
