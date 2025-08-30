import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Thermometer, Settings, User, LogOut, Crown, Shield, Star, RefreshCw, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface NavigationProps {
  onRefresh?: () => void;
}

export default function Navigation({ onRefresh }: NavigationProps) {
  const { user, logout } = useAuth();

  return (
    <div className="border-b bg-white dark:bg-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* FridgeSafe Branding */}
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Thermometer className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">FridgeSafe</h1>
          </Link>

          <div className="flex items-center gap-3">
            {/* Optional Refresh Button */}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}

            {/* User Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  data-testid="user-menu"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {user?.firstName || user?.email?.split("@")[0] || "User"}
                  </span>
                  {user?.role === "admin" && <Crown className="w-4 h-4 text-yellow-500" />}
                  {user?.role === "management_company" && <Building2 className="w-4 h-4 text-purple-500" />}
                  {user?.role === "manager" && <Shield className="w-4 h-4 text-blue-500" />}
                  {user?.role === "staff" && <Star className="w-4 h-4 text-green-500" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <User className="w-4 h-4 mr-2" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Account
                  </Link>
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard">
                        <Crown className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {user?.role === "management_company" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/management">
                        <Building2 className="w-4 h-4 mr-2" />
                        Management Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
