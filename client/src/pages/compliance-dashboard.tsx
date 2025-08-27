import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ChecklistWithScheduleAndItems } from "@shared/checklist-types";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  // Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  // TrendingUp,
  // TrendingDown,
  Thermometer,
  Shield,
  Activity,
  BarChart3,
  RefreshCw,
  Download,
  // Filter,
  Eye,
  AlertCircle,
  Target,
  Users,
  Building2,
  ClipboardCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface ComplianceOverview {
  totalFridges: number;
  compliantFridges: number;
  overallComplianceRate: number;
  missedReadings: number;
  outOfRangeEvents: number;
  unresolvedEvents: number;
  recentActivity: {
    temperatureLogsToday: number;
    checklistsCompleted: number;
    lateEntries: number;
  };
  complianceByFridge: {
    _fridgeId: string;
    fridgeName: string;
    complianceScore: number;
    lastReading: string;
    status: 'compliant' | 'warning' | 'critical';
    missedReadings: number;
  }[];
  trends: {
    week: { date: string; compliance: number; }[];
    month: { date: string; compliance: number; }[];
  };
}

interface DueChecklist {
  _id: string;
  title: string;
  frequency: string;
  fridgeName?: string;
  dueDate: string;
  overdue: boolean;
}

export default function ComplianceDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [_selectedTimeframe, _setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch compliance overview
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ["/api/compliance/overview"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/compliance/overview");
      return response.json() as Promise<ComplianceOverview>;
    },
    refetchInterval: autoRefresh ? 300000 : false, // Refresh every 5 minutes if enabled
  });

  // Fetch due checklists
  const { data: dueChecklists = [], isLoading: _checklistsLoading } = useQuery({
    queryKey: ["/api/checklists/due"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/checklists/due");
      return response.json() as Promise<DueChecklist[]>;
    },
    refetchInterval: autoRefresh ? 300000 : false, // Refresh every 5 minutes
  });

  // Fetch unresolved events count
  const { data: unresolvedCount = { count: 0 } } = useQuery({
    queryKey: ["/api/out-of-range-events/unresolved/count"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/out-of-range-events/unresolved/count");
      return response.json();
    },
    refetchInterval: autoRefresh ? 300000 : false, // Refresh every 5 minutes
  });

  // Auto-refresh toggle
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetchOverview();
      }, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, refetchOverview]);

  const _getComplianceColor = (_score: number) => {
    if (_score > 90) return "text-green-600";
    if (_score >= 80) return "text-amber-600";
    return "text-red-600";
  };

  const getComplianceBadge = (score: number) => {
    if (score > 90) return <Badge className="bg-green-600 text-white">{score.toFixed(1)}%</Badge>;
    if (score >= 80) return <Badge className="bg-amber-500 text-white">{score.toFixed(1)}%</Badge>;
    return <Badge className="bg-red-600 text-white">{score.toFixed(1)}%</Badge>;
  };

  const getStatusBadge = (_status: string) => {
    switch (_status) {
      case 'compliant':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Compliant</Badge>;
      case 'warning':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Critical</Badge>;
      case 'alert':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Alert</Badge>;
      case 'late':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Late</Badge>;
      case 'missing':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Missing</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-500"><Building2 className="h-3 w-3 mr-1" />Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const exportComplianceReport = async () => {
    try {
      const response = await apiRequest("GET", "/api/export/compliance-report");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful!",
        description: "Compliance report has been downloaded.",
      });
    } catch {
      toast({
        title: "Export failed",
        description: "Failed to export compliance report.",
        variant: "destructive",
      });
    }
  };

  if (overviewLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const overdueChecklists = dueChecklists.filter(
    (checklist: ChecklistWithScheduleAndItems & { overdue?: boolean }) => checklist.overdue
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Thermometer className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">FridgeSafe</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Compliance Dashboard</p>
                </div>
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="default" 
                size="default" 
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                data-testid="button-view-fridges"
              >
                <Link to="/fridges">
                  <Eye className="h-4 w-4 mr-2" />
                  View Fridges
                </Link>
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                data-testid="button-auto-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Auto Refresh</span> {autoRefresh ? 'On' : 'Off'}
              </Button>

              <Button 
                variant="outline" 
                size="default" 
                onClick={exportComplianceReport} 
                className="border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span> Report
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="default" className="border border-slate-300 dark:border-slate-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{user?.firstName || user?.email || 'User'}</span>
                    <span className="sm:hidden">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {user?.role === 'admin' && <Shield className="h-3 w-3 text-yellow-500" />}
                      {user?.role === 'manager' && <Shield className="h-3 w-3 text-blue-500" />}
                      {user?.role === 'staff' && <Users className="h-3 w-3 text-green-500" />}
                      <span className="capitalize">{(user as { role?: string })?.role}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link to="/">
                    <DropdownMenuItem>
                      <Thermometer className="h-4 w-4 mr-2" />
                      Temperature Logger
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/account">
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  {user?.role === 'admin' && (
                    <Link to="/admin">
                      <DropdownMenuItem>
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                    <Download className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8" data-testid="compliance-dashboard">
        {/* Critical Alerts */}
        {(unresolvedCount.count > 0 || overdueChecklists.length > 0) && (
          <div className="space-y-4">
            {unresolvedCount.count > 0 && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 shadow-sm" data-testid="unresolved-events-alert">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="font-semibold">⚠️ Critical Temperature Events</div>
                  <p className="mt-1"><span className="font-medium">{unresolvedCount.count}</span> unresolved temperature events require immediate attention.</p>
                </AlertDescription>
              </Alert>
            )}
            
            {overdueChecklists.length > 0 && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 shadow-sm" data-testid="overdue-checklists-alert">
                <ClipboardCheck className="h-5 w-5" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="font-semibold">📋 Overdue Checklists</div>
                  <p className="mt-1"><span className="font-medium">{overdueChecklists.length}</span> checklist{overdueChecklists.length > 1 ? 's' : ''} need to be completed.</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm" data-testid="metric-overall-compliance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">Overall Compliance</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {overview?.overallComplianceRate?.toFixed(1) || 0}%
              </div>
              <div className="space-y-2">
                <Progress value={overview?.overallComplianceRate || 0} className="h-2" />
                <div className="flex justify-between items-center">
                  {getComplianceBadge(overview?.overallComplianceRate || 0)}
                  <span className="text-xs text-slate-500 dark:text-slate-400">Target: 95%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm" data-testid="metric-active-fridges">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">Monitored Fridges</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{overview?.totalFridges || 0}</div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium text-green-600 dark:text-green-400">{overview?.compliantFridges || 0}</span> compliant
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm" data-testid="metric-temperature-alerts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">Temperature Alerts</CardTitle>
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">{overview?.outOfRangeEvents || 0}</div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium text-red-600 dark:text-red-400">{unresolvedCount.count}</span> unresolved
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm" data-testid="metric-daily-activity">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">Today&apos;s Activity</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{overview?.recentActivity?.temperatureLogsToday || 0}</div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                temperature readings today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Views */}
        <Tabs defaultValue="fridges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fridges">Fridge Status</TabsTrigger>
            <TabsTrigger value="checklists">Due Checklists</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Fridge Status Tab */}
          <TabsContent value="fridges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Fridge Compliance Status
                </CardTitle>
                <CardDescription>
                  Real-time compliance monitoring for all monitored fridges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview?.complianceByFridge?.map((
                    fridge: { name: string; compliance: number; _id: string }
                  ) => (
                    <div key={fridge.fridgeId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{fridge.fridgeName}</h4>
                          {getStatusBadge(fridge._status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Compliance: {fridge.complianceScore}%</span>
                          <span>Last Reading: {new Date(fridge.lastReading).toLocaleString()}</span>
                          {fridge.missedReadings > 0 && (
                            <span className="text-red-600">
                              {fridge.missedReadings} missed readings
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={fridge.complianceScore} className="w-24" />
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/fridge/${fridge.fridgeId}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      No fridges found. Add some fridges to start monitoring.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Due Checklists Tab */}
          <TabsContent value="checklists" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Due Checklists
                </CardTitle>
                <CardDescription>
                  Scheduled maintenance and inspection checklists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dueChecklists.map((
                    checklist: ChecklistWithScheduleAndItems & {
                      overdue?: boolean;
                      dueDate?: string;
                    }
                  ) => (
                    <div key={checklist.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{checklist.title}</h4>
                          {checklist.overdue && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Frequency: {checklist.frequency}</span>
                          {checklist.fridgeName && <span>Fridge: {checklist.fridgeName}</span>}
                          <span>Due: {new Date(checklist.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/checklist/${checklist.id}`}>
                          Complete
                        </Link>
                      </Button>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      No checklists due at this time.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Compliance Analytics
                </CardTitle>
                <CardDescription>
                  Track compliance trends and identify improvement opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium">Missed Readings</h4>
                    <div className="text-2xl font-bold text-red-600">
                      {overview?.missedReadings || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">This week</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Late Entries</h4>
                    <div className="text-2xl font-bold text-yellow-600">
                      {overview?.recentActivity?.lateEntries || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Checklists Completed</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {overview?.recentActivity?.checklistsCompleted || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}