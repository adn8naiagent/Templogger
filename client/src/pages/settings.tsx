import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Moon, Sun, ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: { darkMode: boolean }) => {
      return apiRequest("PUT", "/api/user/settings", settings);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated!",
        description: "Your preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error | { message: string }) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDarkModeToggle = (enabled: boolean) => {
    updateSettingsMutation.mutate({ darkMode: enabled });

    // Immediately apply the theme change
    if (enabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto" data-testid="settings-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-muted-foreground">Customize your experience</p>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <Card data-testid="appearance-card">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the application looks and feels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                <Switch
                  checked={user?.darkMode || false}
                  onCheckedChange={handleDarkModeToggle}
                  disabled={updateSettingsMutation.isPending}
                  data-testid="switch-dark-mode"
                />
                <Moon className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card data-testid="account-card">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Plan */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Current Plan</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {user?.subscriptionStatus || "free"} tier
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Manage Subscription
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Link to="/account">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  data-testid="button-account-info"
                >
                  Account Information
                </Button>
              </Link>

              {user?.role === "admin" && (
                <Link to="/admin">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    data-testid="button-admin-dashboard"
                  >
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Manage your current session</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
