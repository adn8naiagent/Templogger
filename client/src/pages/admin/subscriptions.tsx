import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { CreditCard, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  subscriptionStatus: string;
  subscriptionTier?: string;
  createdAt: string;
}

interface SubscriptionStats {
  totalRevenue: number;
  monthlyRevenue: number;
  subscriptionBreakdown: Array<{ tier: string; count: number; color: string; revenue: number }>;
  revenueGrowth: Array<{ month: string; revenue: number }>;
}

export default function AdminSubscriptions() {
  const { user: currentUser } = useAuth();

  // Redirect if not admin
  if ((currentUser as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You need administrator privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all users to calculate subscription stats
  const { _data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  // Calculate subscription statistics
  const subscriptionStats: SubscriptionStats = {
    totalRevenue: users.filter((u: AdminUser) => u.subscriptionStatus === "paid").length * 29,
    monthlyRevenue: users.filter((u: AdminUser) => u.subscriptionStatus === "paid").length * 29,
    subscriptionBreakdown: [
      { 
        tier: "Trial", 
        count: users.filter((u: AdminUser) => u.subscriptionStatus === "trial").length,
        color: "#94a3b8",
        revenue: 0
      },
      { 
        tier: "Paid", 
        count: users.filter((u: AdminUser) => u.subscriptionStatus === "paid").length,
        color: "#22c55e",
        revenue: users.filter((u: AdminUser) => u.subscriptionStatus === "paid").length * 29
      }
    ],
    revenueGrowth: [
      { month: "Jul", revenue: 2500 },
      { month: "Aug", revenue: 3200 },
      { month: "Sep", revenue: 3800 },
      { month: "Oct", revenue: 4200 },
      { month: "Nov", revenue: 4800 },
      { month: "Dec", revenue: 5500 }
    ]
  };

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case "free":
        return <Badge variant="secondary">Free</Badge>;
      case "pro":
        return <Badge className="bg-blue-600">Pro - $29/mo</Badge>;
      case "enterprise":
        return <Badge className="bg-purple-600">Enterprise - $99/mo</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const subscribedUsers = users.filter((u: AdminUser) => u.subscriptionTier !== "free");

  return (
    <div className="min-h-screen bg-background p-4 max-w-7xl mx-auto" data-testid="admin-subscriptions">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-foreground">Subscription Management</h1>
        </div>
        <p className="text-muted-foreground">Monitor and manage subscription tiers and revenue</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${subscriptionStats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribedUsers.length}</div>
            <p className="text-xs text-muted-foreground">Paying customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u: AdminUser) => u.subscriptionStatus === 'trial').length}
            </div>
            <p className="text-xs text-muted-foreground">Free trial period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u: AdminUser) => u.subscriptionStatus === 'paid').length}
            </div>
            <p className="text-xs text-muted-foreground">${users.filter((u: AdminUser) => u.subscriptionStatus === 'paid').length * 29}/mo</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card data-testid="card-subscription-breakdown">
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Users by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading chart...</div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscriptionStats.subscriptionBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ tier, count }) => `${tier}: ${count}`}
                    >
                      {subscriptionStats.subscriptionBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {subscriptionStats.subscriptionBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.tier}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{item.count} users</div>
                        <div className="text-xs text-muted-foreground">${item.revenue}/mo</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-revenue-growth">
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Monthly revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subscriptionStats.revenueGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(_value) => [`$${value}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subscriber List */}
      <Card data-testid="subscribers-table-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Active Subscribers
          </CardTitle>
          <CardDescription>
            All users with paid subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading subscribers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscriber</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monthly Revenue</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribedUsers.map((user: AdminUser) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-600">
                              {user.firstName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <span className="font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getSubscriptionBadge(user.subscriptionStatus || 'free')}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          ${user.subscriptionStatus === 'pro' ? '29' : user.subscriptionStatus === 'enterprise' ? '99' : '0'}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {subscribedUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No active subscribers found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}