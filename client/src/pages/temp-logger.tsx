import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  Calendar,
  Settings,
  LogOut,
  Shield,
  Crown,
  Star,
  MapPin,
  FileText,
  Palette,
  Tag,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { logTemperatureSchema, type LogTemperatureData } from "@shared/schema";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface Fridge {
  id: string;
  name: string;
  location?: string;
  minTemp: string;
  maxTemp: string;
  color: string;
  labels: string[];
  recentTemp?: {
    temperature: string;
    personName: string;
    timestamp: string;
    isOutOfRange: boolean;
    isOnTime: boolean;
    correctiveAction?: string;
  };
  isAlarm: boolean;
  lastTempTime?: string;
  complianceScore: number;
  status: 'good' | 'warning' | 'critical';
}

interface TimeWindow {
  id: string;
  fridgeId: string;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export default function TempLogger() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFridgeId, setSelectedFridgeId] = useState("");
  const [selectedTimeWindowId, setSelectedTimeWindowId] = useState("");
  const [isLateEntry, setIsLateEntry] = useState(false);
  const [showCorrectiveActions, setShowCorrectiveActions] = useState(false);

  // Fetch fridges with recent temperatures
  const { data: fridges = [], isLoading: fridgesLoading } = useQuery({
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

  // Fetch labels
  const { data: labels = [] } = useQuery({
    queryKey: ["/api/labels"],
  });

  // Fetch time windows for selected fridge
  const { data: timeWindows = [] } = useQuery({
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
      
      const missedWindow = timeWindows.find((window: TimeWindow) => 
        window.isActive && currentTime > window.endTime
      );
      
      if (missedWindow) {
        setIsLateEntry(true);
        setSelectedTimeWindowId(missedWindow.id);
      }
    }
  }, [timeWindows, currentTimeWindow]);

  // Log temperature form
  const tempForm = useForm<LogTemperatureData>({
    resolver: zodResolver(logTemperatureSchema),
    defaultValues: {
      fridgeId: "",
      temperature: "",
      personName: "",
      timeWindowId: "",
      isOnTime: true,
      lateReason: "",
      correctiveAction: "",
      correctiveNotes: "",
    },
  });

  // Check if temperature would be out of range
  const checkTemperatureRange = (temperature: string, fridgeId: string) => {
    const selectedFridge = fridges.find((f: Fridge) => f.id === fridgeId);
    if (!selectedFridge || !temperature) return false;
    
    const temp = parseFloat(temperature);
    const minTemp = parseFloat(selectedFridge.minTemp);
    const maxTemp = parseFloat(selectedFridge.maxTemp);
    
    return temp < minTemp || temp > maxTemp;
  };

  // Log temperature mutation
  const logTempMutation = useMutation({
    mutationFn: async (data: LogTemperatureData) => {
      const response = await apiRequest("POST", "/api/temperature-logs", data);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: result.isOutOfRange ? "Temperature Alert!" : "Temperature Logged",
        description: result.isOutOfRange 
          ? `Temperature ${result.temperature}°C is out of range. Corrective action required.`
          : `Temperature ${result.temperature}°C recorded successfully.`,
        variant: result.isOutOfRange ? "destructive" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fridges/recent-temps"] });
      tempForm.reset();
      setSelectedFridgeId("");
      setSelectedTimeWindowId("");
      setIsLateEntry(false);
      setShowCorrectiveActions(false);
    },
    onError: (error: any) => {
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
      const recent = fridge.recentTemp;
      return {
        Fridge: fridge.name,
        Location: fridge.location || 'N/A',
        Temperature: recent?.temperature ? `${recent.temperature}°C` : 'No recent reading',
        'Recorded By': recent?.personName || 'N/A',
        Timestamp: recent?.timestamp || 'N/A',
        'Within Range': recent ? (recent.isOutOfRange ? 'No' : 'Yes') : 'N/A',
        'On Time': recent ? (recent.isOnTime ? 'Yes' : 'No') : 'N/A',
        'Compliance Score': `${fridge.complianceScore}%`
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temperature-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Watch for temperature changes to show corrective actions
  const currentTemp = tempForm.watch("temperature");
  const currentFridgeId = tempForm.watch("fridgeId");
  
  useEffect(() => {
    if (currentTemp && currentFridgeId) {
      const isOutOfRange = checkTemperatureRange(currentTemp, currentFridgeId);
      setShowCorrectiveActions(isOutOfRange || isLateEntry);
    }
  }, [currentTemp, currentFridgeId, isLateEntry]);

  // Auto-fill time window and late entry detection
  useEffect(() => {
    if (selectedFridgeId && currentTimeWindow) {
      tempForm.setValue("timeWindowId", currentTimeWindow.id);
      tempForm.setValue("isOnTime", true);
      setIsLateEntry(false);
    } else if (selectedFridgeId && timeWindows.length > 0) {
      // Check for missed time windows
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      
      const missedWindow = timeWindows.find((window: TimeWindow) => 
        window.isActive && currentTime > window.endTime
      );
      
      if (missedWindow) {
        tempForm.setValue("timeWindowId", missedWindow.id);
        tempForm.setValue("isOnTime", false);
        setIsLateEntry(true);
        setSelectedTimeWindowId(missedWindow.id);
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
    "Other (see notes)"
  ];

  const lateReasonOptions = [
    "Staff meeting delayed routine check",
    "Emergency situation took priority",
    "Equipment malfunction prevented access",
    "Staff shortage during shift change",
    "Training session extended beyond schedule",
    "Other (see notes)"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-bold text-foreground">FridgeSafe</h1>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="user-menu">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user?.username}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {user?.role === 'admin' && <Crown className="h-3 w-3 text-yellow-500" />}
                    {user?.role === 'manager' && <Shield className="h-3 w-3 text-blue-500" />}
                    {user?.role === 'staff' && <Star className="h-3 w-3 text-green-500" />}
                    <span className="capitalize">{user?.role}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/compliance">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Compliance Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <User className="h-4 w-4 mr-2" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    App Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto" data-testid="temp-logger-container">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-foreground">Temperature Monitoring</h2>
              <p className="text-muted-foreground">Monitor your pharmacy fridges</p>
            </div>
            <Button 
              onClick={handleExport} 
              variant="outline" 
              size="sm" 
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          
          {alertFridges.length > 0 && (
            <Alert variant="destructive" className="mt-4" data-testid="alert-banner">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {alertFridges.length} fridge{alertFridges.length > 1 ? 's' : ''} with temperature alerts!
              </AlertDescription>
            </Alert>
          )}
        </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/add-fridge">
          <Button className="h-16 text-lg" data-testid="button-add-fridge">
            <div className="flex flex-col items-center gap-1">
              <Plus className="h-6 w-6" />
              <span>Add Fridge</span>
            </div>
          </Button>
        </Link>

        <Button variant="outline" className="h-16 text-lg" onClick={handleExport} data-testid="button-export">
          <div className="flex flex-col items-center gap-1">
            <Download className="h-6 w-6" />
            <span>Export CSV</span>
          </div>
        </Button>
      </div>

      {/* Log Temperature Form */}
      {fridges.length > 0 && (
        <Card className="mb-6" data-testid="log-temperature-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Log Temperature
            </CardTitle>
            <CardDescription>Record a new temperature reading</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...tempForm}>
              <form onSubmit={tempForm.handleSubmit((data) => logTempMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={tempForm.control}
                  name="fridgeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Fridge</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedFridgeId(value);
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-fridge">
                            <SelectValue placeholder="Choose a fridge" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fridges.map((fridge: Fridge) => (
                            <SelectItem key={fridge.id} value={fridge.id} data-testid={`fridge-option-${fridge.name}`}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: fridge.color }} />
                                <span>{fridge.name}</span>
                                {fridge.location && (
                                  <span className="text-muted-foreground text-sm">({fridge.location})</span>
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

                {selectedFridgeId && (
                  <>
                    <FormField
                      control={tempForm.control}
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.1" 
                              placeholder="e.g. 4.5" 
                              data-testid="input-temperature"
                            />
                          </FormControl>
                          <FormMessage />
                          {field.value && checkTemperatureRange(field.value, selectedFridgeId) && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Temperature is out of range! Corrective action required.
                              </AlertDescription>
                            </Alert>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={tempForm.control}
                      name="personName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your name" data-testid="input-person-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                                  <SelectItem key={window.id} value={window.id} data-testid={`time-window-${window.label}`}>
                                    <div className="flex items-center gap-2">
                                      <span>{window.label}</span>
                                      <span className="text-muted-foreground text-sm">
                                        ({window.startTime} - {window.endTime})
                                      </span>
                                      {window.id === currentTimeWindow?.id && (
                                        <Badge variant="default" className="text-xs">Current</Badge>
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
                                  <SelectItem key={index} value={reason} data-testid={`late-reason-${index}`}>
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
                                    <SelectItem key={index} value={action} data-testid={`corrective-action-${index}`}>
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
                      className="w-full" 
                      disabled={logTempMutation.isPending}
                      data-testid="button-log-temperature"
                    >
                      {logTempMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Logging...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Log Temperature
                        </>
                      )}
                    </Button>
                  </>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Fridge List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Your Fridges</h3>
        
        {fridgesLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : fridges.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Refrigerator className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No fridges added yet</p>
                <Link href="/add-fridge">
                  <Button className="mt-2" data-testid="button-add-first-fridge">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Fridge
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          fridges.map((fridge: Fridge) => (
            <Card 
              key={fridge.id} 
              className={`border-l-4 ${
                fridge.isAlarm ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' : 
                fridge.status === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                'border-l-green-500'
              }`}
              data-testid={`fridge-card-${fridge.name}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: fridge.color }} />
                      <h4 className="font-semibold text-foreground">{fridge.name}</h4>
                      <Badge 
                        variant={fridge.status === 'critical' ? 'destructive' : fridge.status === 'warning' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {fridge.complianceScore}% compliance
                      </Badge>
                    </div>
                    
                    {fridge.location && (
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {fridge.location}
                      </p>
                    )}

                    {fridge.labels && fridge.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {fridge.labels.map((label, index) => {
                          const labelObj = labels.find((l: Label) => l.name === label);
                          return (
                            <Badge key={index} variant="outline" className="text-xs" style={{
                              borderColor: labelObj?.color,
                              color: labelObj?.color
                            }}>
                              {label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      Range: {fridge.minTemp}°C to {fridge.maxTemp}°C
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {fridge.recentTemp ? (
                      <>
                        <div className={`text-xl font-bold ${
                          fridge.recentTemp.isOutOfRange ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {fridge.recentTemp.temperature}°C
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {fridge.recentTemp.personName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(fridge.recentTemp.timestamp).toLocaleString()}
                        </div>
                        {fridge.recentTemp.isOutOfRange && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Out of Range
                          </Badge>
                        )}
                        {!fridge.recentTemp.isOnTime && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Late Entry
                          </Badge>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No recent reading
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  </div>
);
}