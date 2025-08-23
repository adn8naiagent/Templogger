import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Zap, Settings, Sun, RefreshCw } from "lucide-react";

interface NavigationProps {
  onRefresh?: () => void;
}

export default function Navigation({ onRefresh }: NavigationProps) {
  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-primary" data-testid="logo-icon" />
              <h1 className="text-xl font-semibold" data-testid="app-title">
                Fullstack Foundation
              </h1>
            </div>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" data-testid="status-badge">
              Active
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onRefresh}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-theme">
              <Sun className="w-5 h-5" />
            </Button>
            <Avatar className="w-8 h-8" data-testid="avatar-user">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                U
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </nav>
  );
}
