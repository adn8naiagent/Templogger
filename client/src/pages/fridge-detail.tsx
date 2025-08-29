import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Thermometer,
  MapPin,
  Clock,
  Settings,
  AlertTriangle,
  CheckCircle,
  FileText,
  Plus,
  PowerOff,
  Download,
  Refrigerator,
  // Wrench,
  // Award,
  // Upload
} from "lucide-react";
import type {
  Fridge,
  TemperatureLog,
  CalibrationRecord,
  MaintenanceRecord,
  TimeWindow,
} from "@shared/schema";
import CalibrationManager from "@/components/calibration/calibration-manager";
import Navigation from "@/components/layout/navigation";
import { apiRequest } from "@/lib/queryClient";

interface FridgeWithLogs extends Fridge {
  logs: (TemperatureLog & { fridgeName: string })[];
  lastReading: string | null;
  lastTemperature: number | null;
  recentAlert: boolean;
}

export default function FridgeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: fridge, isLoading } = useQuery<FridgeWithLogs>({
    queryKey: [`/api/fridge/${id}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/fridge/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch fridge");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: timeWindows = [] } = useQuery<TimeWindow[]>({
    queryKey: [`/api/fridges/${id}/time-windows`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/fridges/${id}/time-windows`);
      if (!response.ok) {
        throw new Error("Failed to fetch time windows");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: _calibrationRecords = [] } = useQuery<CalibrationRecord[]>({
    queryKey: [`/api/fridges/${id}/calibrations`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/fridges/${id}/calibrations`);
      if (!response.ok) {
        throw new Error("Failed to fetch calibrations");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: _maintenanceRecords = [] } = useQuery<MaintenanceRecord[]>({
    queryKey: [`/api/fridges/${id}/maintenance`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/fridges/${id}/maintenance`);
      if (!response.ok) {
        throw new Error("Failed to fetch maintenance records");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const getTemperatureStatus = (log: TemperatureLog, _fridge: Fridge) => {
    if (log.isAlert) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Range
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle className="h-3 w-3" />
        Normal
      </Badge>
    );
  };

  const getTimingStatus = (log: TemperatureLog) => {
    if (!log.isOnTime) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Late
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        On Time
      </Badge>
    );
  };

  const exportLogs = () => {
    if (!fridge?.logs) return;

    const csvHeaders = [
      "Date",
      "Time",
      "Temperature (°C)",
      "Person",
      "Status",
      "On Time",
      "Late Reason",
      "Notes",
    ];
    const csvRows = [csvHeaders.join(",")];

    fridge.logs.forEach((log) => {
      const date = new Date(log.createdAt!);
      const row = [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        log.currentTempReading.toString(),
        `"${log.personName}"`,
        log.isAlert ? "Out of Range" : "Normal",
        log.isOnTime ? "Yes" : "No",
        log.lateReason ? `"${log.lateReason}"` : "",
        log.correctiveNotes ? `"${log.correctiveNotes}"` : "",
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fridge.name}-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!fridge) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Fridge not found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              The requested fridge could not be found or you don&apos;t have access to it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sortedLogs = [...fridge.logs].sort((a, b) => {
    const dateA = new Date(a.createdAt!).getTime();
    const dateB = new Date(b.createdAt!).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        data-testid="fridge-detail-container"
      >
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/fridges")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                style={{ backgroundColor: fridge.color || "#3b82f6" }}
              >
                <Refrigerator className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{fridge.name}</h1>
              {!fridge.isActive && (
                <Badge variant="secondary" className="gap-1">
                  <PowerOff className="h-3 w-3" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="default" asChild data-testid="button-log-temp">
              <Link to={`/?fridge=${fridge._id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Log Temperature
              </Link>
            </Button>
            <Button variant="outline" onClick={exportLogs} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
            <Button variant="outline" asChild data-testid="button-settings">
              <Link to={`/fridge/${fridge._id}/edit`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
        {/* Fridge Overview */}
        <Card
          className="mb-8"
          style={{
            borderLeft: `4px solid ${fridge.color || "#3b82f6"}`,
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Fridge Overview
                </CardTitle>
                <CardDescription>Current status and basic information</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild data-testid="button-header-settings">
                <Link to={`/fridge/${fridge._id}/edit`}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</h4>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {fridge.location || "Not specified"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Temperature Range
                </h4>
                <p className="text-lg font-semibold">
                  {fridge.minTemp}°C to {fridge.maxTemp}°C
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Last Reading
                </h4>
                <p className="text-lg font-semibold">
                  {fridge.lastTemperature ? `${fridge.lastTemperature}°C` : "No readings"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logs</h4>
                <p className="text-lg font-semibold">{fridge.logs.length}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Check Schedule
                </h4>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {timeWindows.length === 0
                    ? "No schedule"
                    : timeWindows.length === 1
                      ? timeWindows[0]!.checkType === "daily"
                        ? "Daily checks"
                        : timeWindows[0]!.startTime && timeWindows[0]!.endTime
                          ? `Daily ${timeWindows[0]!.startTime}-${timeWindows[0]!.endTime}`
                          : "Single check window"
                      : timeWindows.length === 2
                        ? "Twice daily"
                        : `${timeWindows.length} times daily`}
                </p>
              </div>
            </div>

            {fridge.notes && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Notes</h4>
                <p className="text-sm">{fridge.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Temperature Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Temperature Logs
                </CardTitle>
                <CardDescription>
                  Complete history of temperature readings and checks
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleSort} data-testid="button-sort">
                <Clock className="h-4 w-4 mr-2" />
                {sortOrder === "desc" ? "Newest First" : "Oldest First"}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {fridge.logs.length === 0 ? (
              <div className="text-center py-8">
                <Thermometer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No temperature logs
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No temperature readings have been recorded for this fridge yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>Person</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timing</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLogs.map((log) => (
                      <TableRow key={log._id} data-testid={`log-row-${log._id}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {new Date(log.createdAt!).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(log.createdAt!).toLocaleTimeString()}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`font-medium ${
                              log.isAlert ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {log.currentTempReading}°C
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="font-medium">{log.personName}</span>
                        </TableCell>

                        <TableCell>{getTemperatureStatus(log, fridge)}</TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {getTimingStatus(log)}
                            {log.lateReason && (
                              <div className="text-xs text-gray-500">{log.lateReason}</div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {log.correctiveAction && (
                              <div className="text-sm">
                                <span className="font-medium">Action:</span> {log.correctiveAction}
                              </div>
                            )}
                            {log.correctiveNotes && (
                              <div className="text-xs text-gray-500">{log.correctiveNotes}</div>
                            )}
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

        {/* Calibration Records */}
        <CalibrationManager ___fridgeId={fridge._id} fridgeName={fridge.name} />
      </div>
    </div>
  );
}
