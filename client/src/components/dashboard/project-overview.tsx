import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Code, Key, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StatusCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "online" | "clean" | "loaded" | "active";
  details: Array<{ label: string; status: "success" | "error" | "active" }>;
}

function StatusCard({ title, description, icon, status, details }: StatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
      case "clean": 
      case "loaded":
      case "active":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200";
    }
  };

  const getDetailIcon = (status: "success" | "error" | "active") => {
    switch (status) {
      case "success":
        return "✓";
      case "active":
        return "●";
      case "error":
        return "✗";
    }
  };

  const getDetailColor = (status: "success" | "error" | "active") => {
    switch (status) {
      case "success":
      case "active":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
    }
  };

  return (
    <Card data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            {icon}
          </div>
          <Badge className={getStatusColor(status)} data-testid={`status-${status}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <h3 className="text-lg font-semibold mb-1" data-testid={`title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3" data-testid={`description-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {description}
        </p>
        <div className="space-y-2">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between text-sm" data-testid={`detail-${index}`}>
              <span>{detail.label}</span>
              <span className={getDetailColor(detail.status)}>
                {getDetailIcon(detail.status)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectOverview() {
  const { data: devStatus } = useQuery({
    queryKey: ["/api/dev-status"],
  });

  const { data: tsStatus } = useQuery({
    queryKey: ["/api/typescript-status"], 
  });

  const { data: envStatus } = useQuery({
    queryKey: ["/api/env-status"],
  });

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" data-testid="title-project-dashboard">
            Project Dashboard
          </h2>
          <p className="text-muted-foreground mt-1" data-testid="description-project-dashboard">
            Monitor your fullstack foundation setup
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatusCard
          title="Development Servers"
          description="Frontend & Backend"
          icon={<Server className="w-5 h-5 text-green-600 dark:text-green-400" />}
          status="online"
          details={[
            { 
              label: `Frontend (${devStatus?.frontend?.port || 3000})`, 
              status: devStatus?.frontend?.status === "running" ? "active" : "error" 
            },
            { 
              label: `Backend (${devStatus?.backend?.port || 5000})`, 
              status: devStatus?.backend?.status === "running" ? "active" : "error" 
            },
          ]}
        />

        <StatusCard
          title="TypeScript"
          description="Compilation Status"
          icon={<Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          status="clean"
          details={[
            { 
              label: "Client", 
              status: tsStatus?.client?.status === "clean" ? "success" : "error" 
            },
            { 
              label: "Server", 
              status: tsStatus?.server?.status === "clean" ? "success" : "error" 
            },
          ]}
        />

        <StatusCard
          title="Environment"
          description="Variables Status"
          icon={<Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          status="loaded"
          details={[
            { 
              label: `${envStatus?.summary?.configured || 0} Variables`, 
              status: envStatus?.summary?.status === "complete" ? "success" : "error" 
            },
            { 
              label: "Validation", 
              status: envStatus?.summary?.status === "complete" ? "success" : "error" 
            },
          ]}
        />

        <StatusCard
          title="Hot Reload"
          description="Development Mode"
          icon={<Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
          status="active"
          details={[
            { 
              label: "Vite HMR", 
              status: devStatus?.hotReload?.vite === "active" ? "active" : "error" 
            },
            { 
              label: "Nodemon", 
              status: devStatus?.hotReload?.nodemon === "active" ? "active" : "error" 
            },
          ]}
        />
      </div>
    </div>
  );
}
