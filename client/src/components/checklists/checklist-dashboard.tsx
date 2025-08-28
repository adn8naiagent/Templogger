import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Download,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";

interface ChecklistSummary {
  checklistId: string;
  checklistName: string;
  cadence: "DAILY" | "DOW" | "WEEKLY";
  period: {
    start: string;
    end: string;
  };
  required: number;
  completed: number;
  onTime: number;
  completionRate: number;
  onTimeRate: number;
}

interface ChecklistMetrics {
  totalRequired: number;
  totalCompleted: number;
  totalOnTime: number;
  overallCompletionRate: number;
  overallOnTimeRate: number;
  byChecklist: ChecklistSummary[];
}

export default function ChecklistDashboard() {
  const { toast } = useToast();
  const { logout } = useAuth();

  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // 30 days ago
    return date.toISOString().split("T")[0]!;
  });

  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split("T")[0]!; // Today
  });

  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("");
  const [selectedCadence, setSelectedCadence] = useState<string>("");

  // Fetch summaries
  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["checklist-summaries", { dateFrom, dateTo, selectedChecklistId, selectedCadence }],
    queryFn: async (): Promise<ChecklistMetrics> => {
      const params = new URLSearchParams({
        from: dateFrom,
        to: dateTo,
      });

      if (selectedChecklistId) params.append("checklistId", selectedChecklistId);
      if (selectedCadence) params.append("cadence", selectedCadence);

      const response = await apiRequest("GET", `/api/v2/summaries?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Failed to fetch metrics: ${response.status} - ${errorText}`);
        if (response.status === 401) {
          logout();
        }
        throw error;
      }

      return response.json();
    },
  });

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        from: dateFrom,
        to: dateTo,
      });

      if (selectedChecklistId) params.append("checklistId", selectedChecklistId);
      if (selectedCadence) params.append("cadence", selectedCadence);

      const response = await apiRequest("GET", `/api/v2/export/checklists?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Export failed: ${response.status} - ${errorText}`);
        if (response.status === 401) {
          logout();
        }
        throw error;
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `checklist-report-${dateFrom}-to-${dateTo}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Checklist report has been downloaded",
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export checklist report",
        variant: "destructive",
      });
    }
  };

  const formatPercentage = (value: number) => `${Math.round(value)}%`;

  const getTrendIcon = (rate: number) => {
    if (rate >= 90) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rate >= 70) return <Minus className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground mb-4">
            Failed to load dashboard data. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Checklist Dashboard
          </h2>
          <p className="text-muted-foreground">Track completion rates and performance metrics</p>
        </div>

        <Button onClick={handleExportCSV} disabled={isLoading}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Checklist</Label>
              <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All checklists" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All checklists</SelectItem>
                  {metrics?.byChecklist.map((summary) => (
                    <SelectItem key={summary.checklistId} value={summary.checklistId}>
                      {summary.checklistName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cadence</Label>
              <Select value={selectedCadence} onValueChange={setSelectedCadence}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All cadences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All cadences</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="DOW">Days of Week</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Required</p>
                <p className="text-3xl font-bold">{metrics?.totalRequired || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Completed</p>
                <p className="text-3xl font-bold">{metrics?.totalCompleted || 0}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">
                    {formatPercentage(metrics?.overallCompletionRate || 0)}
                  </p>
                  {getTrendIcon(metrics?.overallCompletionRate || 0)}
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On-Time Rate</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">
                    {formatPercentage(metrics?.overallOnTimeRate || 0)}
                  </p>
                  {getTrendIcon(metrics?.overallOnTimeRate || 0)}
                </div>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checklist Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Checklist</CardTitle>
          <CardDescription>
            Detailed breakdown of completion rates for each checklist
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!metrics || metrics.byChecklist.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Data Available</h3>
              <p className="text-muted-foreground">
                No checklist data found for the selected period and filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Checklist Name</TableHead>
                    <TableHead className="text-center">Cadence</TableHead>
                    <TableHead className="text-center">Required</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">On Time</TableHead>
                    <TableHead className="text-center">Completion Rate</TableHead>
                    <TableHead className="text-center">On-Time Rate</TableHead>
                    <TableHead className="text-center">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.byChecklist.map((summary) => (
                    <TableRow key={summary.checklistId}>
                      <TableCell className="font-medium">{summary.checklistName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{summary.cadence}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{summary.required}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {summary.completed}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-4 h-4 text-blue-500" />
                          {summary.onTime}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`font-medium ${
                              summary.completionRate >= 90
                                ? "text-green-600"
                                : summary.completionRate >= 70
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {formatPercentage(summary.completionRate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`font-medium ${
                              summary.onTimeRate >= 90
                                ? "text-green-600"
                                : summary.onTimeRate >= 70
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {formatPercentage(summary.onTimeRate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {getTrendIcon(summary.completionRate)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {metrics && metrics.byChecklist.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {metrics.byChecklist.filter((s) => s.completionRate >= 90).length}
              </div>
              <p className="text-sm text-muted-foreground">Checklists with ≥90% completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {
                  metrics.byChecklist.filter((s) => s.completionRate >= 70 && s.completionRate < 90)
                    .length
                }
              </div>
              <p className="text-sm text-muted-foreground">Checklists with 70-89% completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600 mb-2">
                {metrics.byChecklist.filter((s) => s.completionRate < 70).length}
              </div>
              <p className="text-sm text-muted-foreground">Checklists with &lt;70% completion</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
