import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, CreditCard, Activity, DollarSign, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AdminStats {
  totalUsers: number;
  totalSubscriptions: number;
  monthlyRevenue: number;
  activeAlerts: number;
  userGrowth: Array<{ month: string; users: number }>;
  subscriptionBreakdown: Array<{ tier: string; count: number; color: string }>;
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // All hooks must come first, before any conditional logic
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "admin",
  });

  // Then effects and other hooks
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [user, isLoading, toast]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">FridgeSafe Administration</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/users">
              <Button variant="outline" data-testid="button-manage-users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" data-testid="button-back-to-app">
                Back to App
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card data-testid="card-paid-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalSubscriptions || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active subscribers</p>
            </CardContent>
          </Card>

          <Card data-testid="card-revenue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${statsLoading ? "..." : (stats?.monthlyRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card data-testid="card-alerts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.activeAlerts || 0}
              </div>
              <p className="text-xs text-muted-foreground">Temperature alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <Card data-testid="card-user-growth">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Monthly user registration trends</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading chart...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats?.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card data-testid="card-subscription-breakdown">
              <CardHeader>
                <CardTitle>Subscription Breakdown</CardTitle>
                <CardDescription>Trial vs Paid Users</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading chart...</div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row items-center gap-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats?.subscriptionBreakdown || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ tier, count }) => `${tier}: ${count}`}
                        >
                          {(stats?.subscriptionBreakdown || []).map(
                            (
                              entry: { tier: string; count: number; color: string },
                              index: number
                            ) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {(stats?.subscriptionBreakdown || []).map(
                        (item: { tier: string; count: number; color: string }, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm">
                              {item.tier}: {item.count}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8" data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/users">
                <Button className="w-full" variant="outline" data-testid="button-user-management">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Button>
              </Link>
              <Link to="/admin/subscriptions">
                <Button
                  className="w-full"
                  variant="outline"
                  data-testid="button-subscription-management"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscription Management
                </Button>
              </Link>
              <Button className="w-full" variant="outline" data-testid="button-system-health">
                <Activity className="h-4 w-4 mr-2" />
                System Health
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
