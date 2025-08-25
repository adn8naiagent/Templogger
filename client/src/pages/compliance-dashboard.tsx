import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Thermometer,
  Shield,
  Activity,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
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
    fridgeId: string;
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
  id: string;
  title: string;
  frequency: string;
  fridgeName?: string;
  dueDate: string;
  overdue: boolean;
}

export default function ComplianceDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch compliance overview
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ["/api/compliance/overview"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/compliance/overview");
      return response.json() as Promise<ComplianceOverview>;
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if enabled
  });

  // Fetch due checklists
  const { data: dueChecklists = [], isLoading: checklistsLoading } = useQuery({
    queryKey: ["/api/checklists/due"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/checklists/due");
      return response.json() as Promise<DueChecklist[]>;
    },
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  // Fetch unresolved events count
  const { data: unresolvedCount = { count: 0 } } = useQuery({
    queryKey: ["/api/out-of-range-events/unresolved/count"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/out-of-range-events/unresolved/count");
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Auto-refresh toggle
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetchOverview();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchOverview]);

  const getComplianceColor = (score: number) => {
    if (score >= 95) return "text-green-600";
    if (score >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 95) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 85) return <Badge variant="secondary">Good</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Compliant</Badge>;
      case 'warning':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Critical</Badge>;
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
    } catch (error) {
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

  const overdueChecklists = dueChecklists.filter(checklist => checklist.overdue);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Thermometer className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-foreground">FridgeSafe</h1>
              </Link>
              <Badge variant="secondary">Compliance Dashboard</Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                data-testid="button-auto-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh {autoRefresh ? 'On' : 'Off'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={exportComplianceReport} data-testid="button-export">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    {(user as any)?.firstName || 'User'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link href="/account">
                    <DropdownMenuItem>Account</DropdownMenuItem>
                  </Link>
                  <Link href="/">
                    <DropdownMenuItem>Temperature Logger</DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  {(user as any)?.role === 'admin' && (
                    <Link href="/admin">
                      <DropdownMenuItem>
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </Link>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6" data-testid="compliance-dashboard">
        {/* Critical Alerts */}
        {(unresolvedCount.count > 0 || overdueChecklists.length > 0) && (
          <div className="space-y-3">
            {unresolvedCount.count > 0 && (
              <Alert variant="destructive" data-testid="unresolved-events-alert">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{unresolvedCount.count} unresolved temperature events</strong> require immediate attention.
                </AlertDescription>
              </Alert>
            )}
            
            {overdueChecklists.length > 0 && (
              <Alert variant="destructive" data-testid="overdue-checklists-alert">
                <ClipboardCheck className="h-4 w-4" />
                <AlertDescription>
                  <strong>{overdueChecklists.length} overdue checklists</strong> need to be completed.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="metric-overall-compliance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {overview?.overallComplianceRate?.toFixed(1) || 0}%
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={overview?.overallComplianceRate || 0} className="flex-1" />
                {getComplianceBadge(overview?.overallComplianceRate || 0)}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-active-fridges">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitored Fridges</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalFridges || 0}</div>
              <p className="text-xs text-muted-foreground">
                {overview?.compliantFridges || 0} compliant
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-temperature-alerts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temperature Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overview?.outOfRangeEvents || 0}</div>
              <p className="text-xs text-muted-foreground">
                {unresolvedCount.count} unresolved
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-daily-activity">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.recentActivity?.temperatureLogsToday || 0}</div>
              <p className="text-xs text-muted-foreground">
                temperature readings
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
                  {overview?.complianceByFridge?.map((fridge) => (
                    <div key={fridge.fridgeId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{fridge.fridgeName}</h4>
                          {getStatusBadge(fridge.status)}
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
                          <Link href={`/fridge/${fridge.fridgeId}`}>
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
                  {dueChecklists.map((checklist) => (
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
                        <Link href={`/checklist/${checklist.id}`}>
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