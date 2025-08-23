import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createFridgeSchema, logTemperatureSchema, type CreateFridgeData, type LogTemperatureData } from "@shared/schema";

interface Fridge {
  id: string;
  name: string;
  minTemp: string;
  maxTemp: string;
  createdAt: string;
  recentLog?: {
    id: string;
    temperature: string;
    personName: string;
    isAlert: boolean;
    createdAt: string;
  };
}

export default function TempLogger() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddFridge, setShowAddFridge] = useState(false);

  // Fetch fridges with recent temperatures
  const { data: fridges = [], isLoading: fridgesLoading } = useQuery({
    queryKey: ["/api/fridges/recent-temps"],
    queryFn: async () => {
      const response = await fetch("/api/fridges/recent-temps");
      if (!response.ok) throw new Error("Failed to fetch fridges");
      return response.json();
    },
  });

  // Create fridge form
  const fridgeForm = useForm<CreateFridgeData>({
    resolver: zodResolver(createFridgeSchema),
    defaultValues: {
      name: "",
      minTemp: "2.0",
      maxTemp: "8.0",
    },
  });

  // Log temperature form
  const tempForm = useForm<LogTemperatureData>({
    resolver: zodResolver(logTemperatureSchema),
    defaultValues: {
      fridgeId: "",
      temperature: "",
      personName: "",
    },
  });

  // Create fridge mutation
  const createFridgeMutation = useMutation({
    mutationFn: async (data: CreateFridgeData) => {
      const response = await fetch("/api/fridges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create fridge");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fridge created!",
        description: "New fridge has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fridges/recent-temps"] });
      fridgeForm.reset();
      setShowAddFridge(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Log temperature mutation
  const logTempMutation = useMutation({
    mutationFn: async (data: LogTemperatureData) => {
      const response = await fetch("/api/temperature-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to log temperature");
      }
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Temperature logged!",
        description: result.alert 
          ? `⚠️ ${result.alert.message}` 
          : "Temperature recorded successfully.",
        variant: result.alert ? "destructive" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fridges/recent-temps"] });
      tempForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export data
  const handleExport = async () => {
    try {
      const response = await fetch("/api/export/temperature-logs");
      if (!response.ok) throw new Error("Failed to export data");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'temperature-logs.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful!",
        description: "Temperature logs have been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export temperature logs.",
        variant: "destructive",
      });
    }
  };

  const alertFridges = fridges.filter((fridge: Fridge) => fridge.recentLog?.isAlert);

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto" data-testid="temp-logger-container">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Thermometer className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-foreground">Temperature Logger</h1>
        </div>
        <p className="text-muted-foreground">Monitor your pharmacy fridges</p>
        
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
        <Dialog open={showAddFridge} onOpenChange={setShowAddFridge}>
          <DialogTrigger asChild>
            <Button className="h-16 text-lg" data-testid="button-add-fridge">
              <div className="flex flex-col items-center gap-1">
                <Plus className="h-6 w-6" />
                <span>Add Fridge</span>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Add New Fridge</DialogTitle>
              <DialogDescription>
                Set up a new fridge with temperature monitoring
              </DialogDescription>
            </DialogHeader>
            
            <Form {...fridgeForm}>
              <form onSubmit={fridgeForm.handleSubmit((data) => createFridgeMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={fridgeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fridge Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Main Vaccine Fridge" data-testid="input-fridge-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={fridgeForm.control}
                    name="minTemp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Temp (°C)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="2.0" data-testid="input-min-temp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fridgeForm.control}
                    name="maxTemp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Temp (°C)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="8.0" data-testid="input-max-temp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createFridgeMutation.isPending}
                  data-testid="button-create-fridge"
                >
                  {createFridgeMutation.isPending ? "Creating..." : "Create Fridge"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-fridge">
                            <SelectValue placeholder="Choose a fridge" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fridges.map((fridge: Fridge) => (
                            <SelectItem key={fridge.id} value={fridge.id}>
                              {fridge.name} ({fridge.minTemp}°C - {fridge.maxTemp}°C)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
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
                            placeholder="4.5" 
                            data-testid="input-temperature"
                          />
                        </FormControl>
                        <FormMessage />
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
                          <Input {...field} placeholder="John Doe" data-testid="input-person-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg" 
                  disabled={logTempMutation.isPending}
                  data-testid="button-log-temperature"
                >
                  {logTempMutation.isPending ? "Logging..." : "Log Temperature"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Fridges List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Refrigerator className="h-5 w-5" />
          Your Fridges ({fridges.length})
        </h2>

        {fridgesLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">Loading fridges...</p>
            </CardContent>
          </Card>
        ) : fridges.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Refrigerator className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No fridges yet</p>
                <Button onClick={() => setShowAddFridge(true)} data-testid="button-add-first-fridge">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Fridge
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          fridges.map((fridge: Fridge) => {
            const isAlert = fridge.recentLog?.isAlert;
            const hasRecentLog = fridge.recentLog;
            
            return (
              <Card key={fridge.id} className={isAlert ? "border-red-200 bg-red-50" : ""} data-testid={`fridge-card-${fridge.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{fridge.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Range: {fridge.minTemp}°C - {fridge.maxTemp}°C
                      </p>
                    </div>
                    {isAlert && (
                      <Badge variant="destructive" data-testid="alert-badge">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Alert
                      </Badge>
                    )}
                  </div>

                  {hasRecentLog ? (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-foreground">
                          {fridge.recentLog?.temperature}°C
                        </span>
                        {!isAlert && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {fridge.recentLog?.personName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {fridge.recentLog?.createdAt && new Date(fridge.recentLog.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-muted-foreground">No temperature readings yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}