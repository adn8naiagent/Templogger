import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Rocket, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ToolingCardProps {
  title: string;
  icon: React.ReactNode;
  tools: Record<string, { status: string; description: string }>;
  cardKey: string;
}

interface ToolingStatusType {
  codeQuality?: Record<string, { status: string; description: string }>;
  buildDeploy?: Record<string, { status: string; description: string }>;
}

function ToolingCard({ title, icon, tools, cardKey }: ToolingCardProps) {
  return (
    <Card data-testid={`card-${cardKey}`}>
      <CardContent className="p-6">
        <h3
          className="text-lg font-semibold mb-4 flex items-center space-x-2"
          data-testid={`title-${cardKey}`}
        >
          {icon}
          <span>{title}</span>
        </h3>
        <div className="space-y-4">
          {Object.entries(tools).map(([toolName, tool]) => (
            <div
              key={toolName}
              className="flex items-center justify-between"
              data-testid={`tool-${toolName}`}
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm" data-testid={`name-${toolName}`}>
                  {toolName}
                </span>
              </div>
              <span className="text-xs text-muted-foreground" data-testid={`status-${toolName}`}>
                {tool.status}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ToolingStatus() {
  const { data: tooling } = useQuery<ToolingStatusType>({
    queryKey: ["/api/tooling-status"],
  });

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-6" data-testid="title-development-tooling">
        Development Tooling
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tooling?.codeQuality && (
          <ToolingCard
            title="Code Quality"
            icon={<ShieldCheck className="w-5 h-5 text-accent" />}
            tools={tooling.codeQuality}
            cardKey="code-quality"
          />
        )}

        {tooling?.buildDeploy && (
          <ToolingCard
            title="Build & Deploy"
            icon={<Rocket className="w-5 h-5 text-secondary" />}
            tools={tooling.buildDeploy}
            cardKey="build-deploy"
          />
        )}
      </div>
    </div>
  );
}
