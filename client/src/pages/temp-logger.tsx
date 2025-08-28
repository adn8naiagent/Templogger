import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Thermometer,
  Plus,
  AlertTriangle,
  Download,
  Clock,
  Refrigerator,
  User,
  CheckCircle2,
  Settings,
  LogOut,
  Shield,
  Crown,
  Star,
  MapPin,
  // FileText,
  // Palette,
  // Tag,
  BarChart3,
  Eye,
  // CheckSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  logTemperatureSchema,
  type LogTemperatureData,
  type CalibrationRecord,
} from "@shared/schema";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface Fridge {
  _id: string;
  name: string;
  location?: string;
  minTemp: string;
  maxTemp: string;
  color: string;
  labels: string[];
  recentLog?: {
    temperature: string;
    personName: string;
    createdAt: string;
    isAlert: boolean;
    isOnTime: boolean;
    correctiveAction?: string;
    notes?: string;
  };
  isAlarm: boolean;
  lastTempTime?: string;
  complianceScore: number;
  status: "good" | "warning" | "critical";
  complianceStatus: string;
  latestCalibration?: CalibrationRecord;
  calibrationStatus: string;
}

interface TimeWindow {
  _id: string;
  _fridgeId: string;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

interface Label {
  _id: string;
  name: string;
  color: string;
  createdAt: string;
}

export default function TempLogger() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFridgeId, setSelectedFridgeId] = useState("");
  const [_selectedTimeWindowId, _setSelectedTimeWindowId] = useState("");
  const [isLateEntry, setIsLateEntry] = useState(false);
  const [showCorrectiveActions, setShowCorrectiveActions] = useState(false);

  // Fetch fridges with recent temperatures
  const {
    data: fridges = [],
    isLoading: fridgesLoading,
    error: _error,
    refetch,
  } = useQuery<Fridge[]>({
    queryKey: ["/api/fridges/recent-temps"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Debug logging (disabled in production)
  // console.log('[temp-logger] Fridges data:', fridges);
  // console.log('[temp-logger] Loading state:', fridgesLoading);
  // console.log('[temp-logger] Error:', _error);

  // Fetch labels
  const { data: labels = [] } = useQuery<Label[]>({
    queryKey: ["/api/labels"],
  });

  // Fetch time windows for selected fridge
  const { data: timeWindows = [] } = useQuery<TimeWindow[]>({
    queryKey: ["/api/fridges", selectedFridgeId, "time-windows"],
    queryFn: async () => {
      if (!selectedFridgeId) return [];
      const response = await apiRequest("GET", `/api/fridges/${selectedFridgeId}/time-windows`);
      return response.json();
    },
    enabled: !!selectedFridgeId,
  });

  // Check if current time is within a time window and detect late entries
  const getCurrentTimeWindow = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    return timeWindows.find((window: TimeWindow) => {
      if (!window.isActive) return false;
      return currentTime >= window.startTime && currentTime <= window.endTime;
    });
  };

  const currentTimeWindow = getCurrentTimeWindow();

  // Auto-detect late entries when time windows are loaded
  useEffect(() => {
    if (timeWindows.length > 0 && selectedFridgeId) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      const missedWindow = timeWindows.find(
        (window: TimeWindow) => window.isActive && currentTime > window.endTime
      );

      if (missedWindow) {
        setIsLateEntry(true);
        setSelectedTimeWindowId(missedWindow._id);
      }
    }
  }, [timeWindows, currentTimeWindow, selectedFridgeId]);

  // Helper function for compliance badge coloring
  const getComplianceBadgeClass = (score: number) => {
    if (score > 90) return "bg-green-600 text-white";
    if (score >= 80) return "bg-amber-500 text-white";
    return "bg-red-600 text-white";
  };

  // Helper function for calibration status badge
  const getCalibrationBadgeClass = (status: string) => {
    switch (status) {
      case "current":
        return "bg-green-600 text-white";
      case "due-soon":
        return "bg-amber-500 text-white";
      case "overdue":
        return "bg-red-600 text-white";
      case "no-calibration":
        return "bg-slate-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const getCalibrationStatusText = (status: string) => {
    switch (status) {
      case "current":
        return "Calibrated";
      case "due-soon":
        return "Due Soon";
      case "overdue":
        return "Overdue";
      case "no-calibration":
        return "No Cal";
      default:
        return "Unknown";
    }
  };

  // Log temperature form
  const tempForm = useForm<LogTemperatureData>({
    resolver: zodResolver(logTemperatureSchema),
    defaultValues: {
      _fridgeId: "",
      minTempReading: "",
      maxTempReading: "",
      currentTempReading: "",
      personName: "",
      notes: "",
      timeWindowId: "",
      isOnTime: true,
      lateReason: "",
      correctiveAction: "",
      correctiveNotes: "",
    },
  });

  // Check if any temperature would be out of range
  const checkTemperatureRange = useCallback(
    (minReading: string, maxReading: string, currentReading: string, _fridgeId: string) => {
      const selectedFridge = fridges.find((f: Fridge) => f._id === _fridgeId);
      if (!selectedFridge) return false;

      const minTemp = parseFloat(selectedFridge.minTemp);
      const maxTemp = parseFloat(selectedFridge.maxTemp);

      if (minReading) {
        const min = parseFloat(minReading);
        if (!isNaN(min) && (min < minTemp || min > maxTemp)) return true;
      }

      if (maxReading) {
        const max = parseFloat(maxReading);
        if (!isNaN(max) && (max < minTemp || max > maxTemp)) return true;
      }

      if (currentReading) {
        const current = parseFloat(currentReading);
        if (!isNaN(current) && (current < minTemp || current > maxTemp)) return true;
      }

      return false;
    },
    [fridges]
  );

  // Log temperature mutation
  const logTempMutation = useMutation({
    mutationFn: async (data: LogTemperatureData) => {
      const response = await apiRequest("POST", "/api/temperature-logs", data);
      return response.json();
    },
    onSuccess: (result) => {
      const temp = result.log?.temperature || result.temperature;
      const isOutOfRange = result.isOutOfRange || result.log?.isOutOfRange;
      toast({
        title: isOutOfRange ? "Temperature Alert!" : "Temperature Logged",
        description: isOutOfRange
          ? `Temperature ${temp}°C is out of range. Corrective action required.`
          : `Temperature ${temp}°C recorded successfully.`,
        variant: isOutOfRange ? "destructive" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fridges/recent-temps"] });
      tempForm.reset();
      setSelectedFridgeId("");
      setSelectedTimeWindowId("");
      setIsLateEntry(false);
      setShowCorrectiveActions(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export CSV functionality
  const handleExport = () => {
    const csvData = fridges.map((fridge: Fridge) => {
      const recent = fridge.recentLog;
      return {
        Fridge: fridge.name,
        Location: fridge.location || "N/A",
        Temperature: recent?.temperature ? `${recent.temperature}°C` : "No recent reading",
        "Recorded By": recent?.personName || "N/A",
        Timestamp: recent?.createdAt || "N/A",
        "Within Range": recent ? (recent.isAlert ? "No" : "Yes") : "N/A",
        "On Time": recent ? (recent.isOnTime ? "Yes" : "No") : "N/A",
        "Compliance Score": `${fridge.complianceScore || 0}%`,
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row: Record<string, string>) =>
        headers.map((header) => `"${row[header]}"`).join(",")
      ),
    ].join("\\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `temperature-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Watch for temperature changes to show corrective actions
  const minTemp = tempForm.watch("minTempReading");
  const maxTemp = tempForm.watch("maxTempReading");
  const currentTemp = tempForm.watch("currentTempReading");
  const currentFridgeId = tempForm.watch("_fridgeId");

  useEffect(() => {
    if ((minTemp || maxTemp || currentTemp) && currentFridgeId) {
      const isOutOfRange = checkTemperatureRange(minTemp, maxTemp, currentTemp, currentFridgeId);
      setShowCorrectiveActions(isOutOfRange || isLateEntry);
    }
  }, [minTemp, maxTemp, currentTemp, currentFridgeId, isLateEntry, checkTemperatureRange]);

  // Auto-fill time window and late entry detection
  useEffect(() => {
    if (selectedFridgeId && currentTimeWindow) {
      tempForm.setValue("timeWindowId", currentTimeWindow._id);
      tempForm.setValue("isOnTime", true);
      setIsLateEntry(false);
    } else if (selectedFridgeId && timeWindows.length > 0) {
      // Check for missed time windows
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      const missedWindow = timeWindows.find(
        (window: TimeWindow) => window.isActive && currentTime > window.endTime
      );

      if (missedWindow) {
        tempForm.setValue("timeWindowId", missedWindow._id);
        tempForm.setValue("isOnTime", false);
        setIsLateEntry(true);
        setSelectedTimeWindowId(missedWindow._id);
      }
    }
  }, [selectedFridgeId, timeWindows, currentTimeWindow, tempForm]);

  const alertFridges = fridges.filter((f: Fridge) => f.isAlarm);

  const correctiveActionOptions = [
    "Adjusted thermostat settings",
    "Checked door seal and closed properly",
    "Moved temperature-sensitive items to backup fridge",
    "Contacted maintenance team",
    "Documented incident and monitored closely",
    "Calibrated temperature monitoring device",
    "Other (see notes)",
  ];

  const lateReasonOptions = [
    "Staff meeting delayed routine check",
    "Emergency situation took priority",
    "Equipment malfunction prevented access",
    "Staff shortage during shift change",
    "Training session extended beyond schedule",
    "Other (see notes)",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Thermometer className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">FridgeSafe</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                  Temperature Compliance System
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 
                    dark:border-slate-600 dark:hover:border-blue-400 
                    dark:hover:bg-blue-950/20 shadow-sm hover:shadow-md transition-all duration-200"
                  data-testid="user-menu"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{user?.firstName || "User"}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {user?.role === "admin" && <Crown className="h-3 w-3 text-yellow-500" />}
                    {user?.role === "manager" && <Shield className="h-3 w-3 text-blue-500" />}
                    {user?.role === "staff" && <Star className="h-3 w-3 text-green-500" />}
                    <span className="capitalize">{user?.role}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/compliance">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Compliance Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <User className="h-4 w-4 mr-2" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    App Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => (window.location.href = "/api/logout")}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        data-testid="temp-logger-container"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Temperature Monitoring
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Monitor and track compliance across all pharmacy fridges
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="default"
                className="border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Refresh Fridges
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="default"
                className="border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          {alertFridges.length > 0 && (
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
              data-testid="alert-banner"
            >
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
                <span className="font-semibold">{alertFridges.length}</span> fridge
                {alertFridges.length > 1 ? "s" : ""} require immediate attention!
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Link to="/fridges">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Eye className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">View Fridges</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage all fridges</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/add-fridge">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Add Fridge</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Configure new monitoring
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/compliance">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Compliance Dashboard
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      View detailed analytics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/self-audit-checklists">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Self Audit and Checklists
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Compliance checklists
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Log Temperature Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {fridges.length > 0 && (
            <div className="lg:col-span-2">
              <Card
                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                data-testid="log-temperature-card"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Thermometer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Log Temperature Reading
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Record a new temperature measurement with compliance tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...tempForm}>
                    <form
                      onSubmit={tempForm.handleSubmit((_data) => logTempMutation.mutate(_data))}
                      className="space-y-6"
                    >
                      <FormField
                        control={tempForm.control}
                        name="_fridgeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              Select Fridge *
                            </FormLabel>
                            <Select
                              onValueChange={(_value) => {
                                field.onChange(_value);
                                setSelectedFridgeId(_value as string);
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className="h-11 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                  data-testid="select-fridge"
                                >
                                  <SelectValue placeholder="Choose a fridge to monitor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-slate-200 dark:border-slate-700">
                                {fridges.map((fridge: Fridge) => (
                                  <SelectItem
                                    key={fridge._id}
                                    value={fridge._id}
                                    data-testid={`fridge-option-${fridge.name}`}
                                    className="py-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 shadow-sm"
                                        style={{ backgroundColor: fridge.color || "#3b82f6" }}
                                      >
                                        <Refrigerator className="w-3 h-3 text-white" />
                                      </div>
                                      <div>
                                        <span className="font-medium">{fridge.name}</span>
                                        {fridge.location && (
                                          <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">
                                            — {fridge.location}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {selectedFridgeId && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={tempForm.control}
                              name="minTempReading"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Min Temp (°C) *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.1"
                                      placeholder="e.g. 2.1"
                                      className="h-11 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                      data-testid="input-min-temperature"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={tempForm.control}
                              name="maxTempReading"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Max Temp (°C) *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.1"
                                      placeholder="e.g. 7.8"
                                      className="h-11 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                      data-testid="input-max-temperature"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={tempForm.control}
                              name="currentTempReading"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Current Temp (°C) *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.1"
                                      placeholder="e.g. 4.5"
                                      className="h-11 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                      data-testid="input-current-temperature"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Temperature range validation alert */}
                          {(tempForm.watch("minTempReading") ||
                            tempForm.watch("maxTempReading") ||
                            tempForm.watch("currentTempReading")) &&
                            checkTemperatureRange(
                              tempForm.watch("minTempReading"),
                              tempForm.watch("maxTempReading"),
                              tempForm.watch("currentTempReading"),
                              selectedFridgeId
                            ) && (
                              <Alert
                                variant="destructive"
                                className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
                              >
                                <AlertTriangle className="h-5 w-5" />
                                <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
                                  ⚠️ One or more temperature readings are out of safe range!
                                  Corrective action required.
                                </AlertDescription>
                              </Alert>
                            )}

                          <FormField
                            control={tempForm.control}
                            name="personName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  Staff Member Name *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter your full name"
                                    className="h-11 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                    data-testid="input-person-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={tempForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  Notes (Optional)
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Add any additional observations or comments..."
                                    rows={3}
                                    className="border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                                    data-testid="input-notes"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Timestamp Info */}
                          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                            <Clock className="h-4 w-4" />
                            <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                              <strong>Automatic Timestamp:</strong> The current date and time will
                              be automatically recorded with this temperature reading.
                            </AlertDescription>
                          </Alert>

                          {/* Time Window Selection */}
                          {timeWindows.length > 0 && (
                            <FormField
                              control={tempForm.control}
                              name="timeWindowId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Time Window
                                  </FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-time-window">
                                        <SelectValue placeholder="Select time window" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {timeWindows.map((window: TimeWindow) => (
                                        <SelectItem
                                          key={window._id}
                                          value={window._id}
                                          data-testid={`time-window-${window.label}`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span>{window.label}</span>
                                            <span className="text-muted-foreground text-sm">
                                              ({window.startTime} - {window.endTime})
                                            </span>
                                            {window._id === currentTimeWindow?._id && (
                                              <Badge variant="default" className="text-xs">
                                                Current
                                              </Badge>
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {/* Late Entry Reason */}
                          {isLateEntry && (
                            <FormField
                              control={tempForm.control}
                              name="lateReason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2 text-orange-600">
                                    <Clock className="h-4 w-4" />
                                    Late Entry Reason (Required)
                                  </FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-late-reason">
                                        <SelectValue placeholder="Why is this entry late?" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {lateReasonOptions.map((reason, index) => (
                                        <SelectItem
                                          key={index}
                                          value={reason}
                                          data-testid={`late-reason-${index}`}
                                        >
                                          {reason}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {/* Corrective Actions */}
                          {showCorrectiveActions && (
                            <>
                              <FormField
                                control={tempForm.control}
                                name="correctiveAction"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2 text-red-600">
                                      <AlertTriangle className="h-4 w-4" />
                                      Corrective Action (Required)
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-corrective-action">
                                          <SelectValue placeholder="What action was taken?" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {correctiveActionOptions.map((action, index) => (
                                          <SelectItem
                                            key={index}
                                            value={action}
                                            data-testid={`corrective-action-${index}`}
                                          >
                                            {action}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={tempForm.control}
                                name="correctiveNotes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Additional Notes (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        {...field}
                                        placeholder="Provide any additional details about the corrective action..."
                                        rows={3}
                                        data-testid="input-corrective-notes"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          <Button
                            type="submit"
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-sm"
                            disabled={logTempMutation.isPending}
                            data-testid="button-log-temperature"
                          >
                            {logTempMutation.isPending ? (
                              <>
                                <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-3" />
                                Recording Temperature...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-5 w-5 mr-3" />
                                Record Temperature Reading
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sidebar - Quick Stats */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-900 dark:text-white">
                  Quick Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Total Fridges</span>
                  <Badge variant="outline" className="font-medium">
                    {fridges.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Alerts</span>
                  <Badge
                    variant={alertFridges.length > 0 ? "destructive" : "default"}
                    className="font-medium"
                  >
                    {alertFridges.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Avg. Compliance
                  </span>
                  <Badge
                    className={`font-medium ${getComplianceBadgeClass(
                      fridges.length > 0
                        ? Math.round(
                            fridges.reduce((acc: number, f: Fridge) => acc + f.complianceScore, 0) /
                              fridges.length
                          )
                        : 0
                    )}`}
                  >
                    {fridges.length > 0
                      ? Math.round(
                          fridges.reduce((acc: number, f: Fridge) => acc + f.complianceScore, 0) /
                            fridges.length
                        )
                      : 0}
                    %
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fridge List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Your Fridges</h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {fridges.length} fridge{fridges.length !== 1 ? "s" : ""} total
            </div>
          </div>

          {fridgesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : fridges.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <Refrigerator className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No fridges configured
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Get started by adding your first fridge for temperature monitoring
                  </p>
                  <Link to="/add-fridge">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-add-first-fridge"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Fridge
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {fridges.map((fridge: Fridge) => (
                <Card
                  key={fridge._id}
                  className={`relative overflow-hidden bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 ${
                    fridge.isAlarm
                      ? "ring-2 ring-red-200 dark:ring-red-800"
                      : fridge.status === "warning"
                        ? "ring-2 ring-yellow-200 dark:ring-yellow-800"
                        : "hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-800"
                  }`}
                  style={{ borderLeft: `4px solid ${fridge.color || "#3b82f6"}` }}
                  data-testid={`fridge-card-${fridge.name}`}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div
                              className="w-8 h-8 rounded-lg border-2 border-white shadow-sm flex items-center justify-center"
                              style={{ backgroundColor: fridge.color || "#3b82f6" }}
                            >
                              <Refrigerator className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white text-lg">
                              {fridge.name}
                            </h4>
                            {fridge.location && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {fridge.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            className={`font-medium ${getComplianceBadgeClass(fridge.complianceScore)}`}
                          >
                            {fridge.complianceScore}%
                          </Badge>
                          <Badge
                            className={`font-medium ${getCalibrationBadgeClass(fridge.calibrationStatus)}`}
                          >
                            {getCalibrationStatusText(fridge.calibrationStatus)}
                          </Badge>
                        </div>
                      </div>

                      {/* Labels */}
                      {fridge.labels && fridge.labels.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {fridge.labels.map((label, index) => {
                            const labelObj = labels.find((l: Label) => l.name === label);
                            return (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: labelObj?.color,
                                  color: labelObj?.color,
                                }}
                              >
                                {label}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Temperature Range */}
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Thermometer className="h-4 w-4" />
                        <span>
                          Range: {fridge.minTemp}°C to {fridge.maxTemp}°C
                        </span>
                      </div>

                      {/* Recent Temperature */}
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                        {fridge.recentLog ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Latest Reading
                              </span>
                              <div
                                className={`text-2xl font-bold ${
                                  fridge.recentLog.isAlert
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                {fridge.recentLog.temperature}°C
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                              Recorded by {fridge.recentLog.personName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                              {new Date(fridge.recentLog.createdAt).toLocaleString()}
                            </div>
                            <div className="flex gap-2">
                              {fridge.recentLog.isAlert && (
                                <Badge variant="destructive" className="text-xs">
                                  Out of Range
                                </Badge>
                              )}
                              {!fridge.recentLog.isOnTime && (
                                <Badge variant="secondary" className="text-xs">
                                  Late Entry
                                </Badge>
                              )}
                              {!fridge.recentLog.isAlert && fridge.recentLog.isOnTime && (
                                <Badge className="bg-green-600 text-xs">Normal</Badge>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <Clock className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              No recent reading
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {/* View Details Button */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                      data-testid={`button-view-details-${fridge._id}`}
                    >
                      <Link to={`/fridge/${fridge._id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
