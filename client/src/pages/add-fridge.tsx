import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HexColorPicker } from "react-colorful";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  ArrowLeft,
  Save,
  Thermometer,
  MapPin,
  FileText,
  Palette,
  Tag,
  Clock,
  Plus,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFridgeSchema, type CreateFridgeData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface TimeWindow {
  id?: string;
  label: string;
  checkType: 'specific' | 'daily';
  startTime?: string;
  endTime?: string;
  excludedDays: number[];
}

export default function AddFridge() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Temperature check scheduling state
  const [enableScheduledChecks, setEnableScheduledChecks] = useState(false);
  const [checkFrequency, setCheckFrequency] = useState<'once' | 'twice' | 'multiple'>('once');
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([]);
  const [excludedDays, setExcludedDays] = useState<number[]>([]);

  // Day names for display
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch labels
  const { data: labels = [] } = useQuery<Label[]>({
    queryKey: ["/api/labels"],
  });

  // Create fridge form
  const form = useForm<CreateFridgeData>({
    resolver: zodResolver(createFridgeSchema),
    defaultValues: {
      name: "",
      location: "",
      notes: "",
      color: "#3b82f6",
      labels: [],
      minTemp: "2.0",
      maxTemp: "4.0",
    },
  });

  // Create fridge mutation
  const createFridgeMutation = useMutation({
    mutationFn: async (data: CreateFridgeData) => {
      const response = await apiRequest("POST", "/api/fridges", data);
      return response.json();
    },
    onSuccess: async (newFridge) => {
      // Create time windows if scheduled checks are enabled
      if (enableScheduledChecks && timeWindows.length > 0) {
        try {
          for (const window of timeWindows) {
            await apiRequest("POST", "/api/time-windows", {
              fridgeId: newFridge.id,
              label: window.label,
              checkType: window.checkType,
              startTime: window.startTime,
              endTime: window.endTime,
              excludedDays: window.excludedDays,
            });
          }
        } catch (error) {
          console.error("Error creating time windows:", error);
          toast({
            title: "Warning",
            description: "Fridge created but some check times couldn't be saved.",
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: "Fridge created!",
        description: enableScheduledChecks ? 
          "New fridge with scheduled temperature checks has been added successfully." :
          "New fridge has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fridges/recent-temps"] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancel = () => {
    setLocation("/");
  };

  const addTimeWindow = () => {
    const newWindow: TimeWindow = {
      label: `Check ${timeWindows.length + 1}`,
      checkType: 'specific',
      startTime: "09:00",
      endTime: "09:30",
      excludedDays: [],
    };
    setTimeWindows([...timeWindows, newWindow]);
  };

  const toggleExcludedDay = (dayIndex: number) => {
    setExcludedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const removeTimeWindow = (index: number) => {
    setTimeWindows(timeWindows.filter((_, i) => i !== index));
  };

  const updateTimeWindow = (index: number, field: keyof TimeWindow, value: string | number[]) => {
    const updated = [...timeWindows];
    updated[index] = { ...updated[index], [field]: value };
    setTimeWindows(updated);
  };

  const validateTimeWindow = (window: TimeWindow): string | null => {
    if (window.checkType === 'specific' && window.startTime && window.endTime) {
      if (window.startTime >= window.endTime) {
        return 'End time must be after start time';
      }
    }
    return null;
  };

  const onSubmit = async (data: CreateFridgeData) => {
    // Validate time windows if scheduled checks are enabled
    if (enableScheduledChecks && checkFrequency === 'multiple' && timeWindows.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one temperature check time.",
        variant: "destructive",
      });
      return;
    }

    // Validate each time window for proper start/end time ordering
    if (enableScheduledChecks && checkFrequency === 'multiple') {
      for (let i = 0; i < timeWindows.length; i++) {
        const error = validateTimeWindow(timeWindows[i]);
        if (error) {
          toast({
            title: "Validation Error",
            description: `${timeWindows[i].label}: ${error}`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    // Set default once-per-day check if selected and create the fridge with time windows
    if (enableScheduledChecks && checkFrequency === 'once') {
      const dailyCheck = {
        label: "Daily Check",
        checkType: "daily",
        excludedDays: excludedDays,
      };
      
      // Create fridge first, then add the daily check
      const fridgeData = { ...data };
      const response = await apiRequest("POST", "/api/fridges", fridgeData);
      const newFridge = await response.json();
      
      // Add the daily time window
      try {
        await apiRequest("POST", "/api/time-windows", {
          fridgeId: newFridge.id,
          label: dailyCheck.label,
          checkType: dailyCheck.checkType,
          excludedDays: dailyCheck.excludedDays,
        });
      } catch (error) {
        console.error("Error creating daily check:", error);
      }
      
      toast({
        title: "Fridge created!",
        description: "New fridge with daily temperature check has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fridges/recent-temps"] });
      setLocation("/");
      return;
    } else if (enableScheduledChecks && checkFrequency === 'twice') {
      // Create fridge first, then add AM and PM checks
      const fridgeData = { ...data };
      const response = await apiRequest("POST", "/api/fridges", fridgeData);
      const newFridge = await response.json();
      
      // Add AM and PM time windows
      try {
        await apiRequest("POST", "/api/time-windows", {
          fridgeId: newFridge.id,
          label: "Morning Check",
          checkType: "specific",
          startTime: "06:00",
          endTime: "12:00",
          excludedDays: excludedDays,
        });
        
        await apiRequest("POST", "/api/time-windows", {
          fridgeId: newFridge.id,
          label: "Evening Check",
          checkType: "specific",
          startTime: "12:00",
          endTime: "23:59",
          excludedDays: excludedDays,
        });
      } catch (error) {
        console.error("Error creating AM/PM checks:", error);
      }
      
      toast({
        title: "Fridge created!",
        description: "New fridge with AM/PM temperature checks has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fridges/recent-temps"] });
      setLocation("/");
      return;
    }
    
    createFridgeMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleCancel} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Thermometer className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-foreground">Add New Fridge</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4" data-testid="add-fridge-container">
        <Card>
          <CardHeader>
            <CardTitle>Set up a new fridge</CardTitle>
            <CardDescription>
              Configure temperature monitoring for a new fridge with compliance tracking
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fridge Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Main Vaccine Fridge" data-testid="input-fridge-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Pharmacy Main Floor" data-testid="input-fridge-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional information about this fridge..." rows={3} data-testid="input-fridge-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Color Theme
                      </FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              data-testid="button-color-picker"
                            >
                              <div 
                                className="w-4 h-4 rounded mr-2 border" 
                                style={{ backgroundColor: field.value }}
                              />
                              {field.value}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3">
                            <HexColorPicker color={field.value} onChange={field.onChange} />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Labels (Optional)
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                          {labels.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No labels available</p>
                          ) : (
                            labels.map((label: Label) => (
                              <div key={label.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={label.id}
                                  checked={field.value.includes(label.name)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, label.name]);
                                    } else {
                                      field.onChange(field.value.filter((l: string) => l !== label.name));
                                    }
                                  }}
                                  data-testid={`checkbox-label-${label.name}`}
                                />
                                <label htmlFor={label.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                  <div 
                                    className="w-3 h-3 rounded" 
                                    style={{ backgroundColor: label.color }}
                                  />
                                  {label.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minTemp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Temperature (°C) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="2.0" data-testid="input-min-temp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxTemp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Temperature (°C) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="8.0" data-testid="input-max-temp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Temperature Check Scheduling */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Scheduled Temperature Checks
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Set up automatic reminders for temperature monitoring
                      </p>
                    </div>
                    <Switch
                      checked={enableScheduledChecks}
                      onCheckedChange={setEnableScheduledChecks}
                      data-testid="switch-scheduled-checks"
                    />
                  </div>

                  {enableScheduledChecks && (
                    <div className="space-y-4 pt-2 border-t">
                      <RadioGroup
                        value={checkFrequency}
                        onValueChange={(value: 'once' | 'twice' | 'multiple') => setCheckFrequency(value)}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="once" id="once" data-testid="radio-once-daily" />
                          <label htmlFor="once" className="text-sm font-medium cursor-pointer">
                            Check once per day
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="twice" id="twice" data-testid="radio-twice-daily" />
                          <label htmlFor="twice" className="text-sm font-medium cursor-pointer">
                            Check twice a day (AM/PM)
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="multiple" id="multiple" data-testid="radio-multiple-times" />
                          <label htmlFor="multiple" className="text-sm font-medium cursor-pointer">
                            Set times for multiple checks a day
                          </label>
                        </div>
                      </RadioGroup>

                      {checkFrequency === 'multiple' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Set specific times for temperature checks
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addTimeWindow}
                              data-testid="button-add-time"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Time
                            </Button>
                          </div>

                          {timeWindows.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded">
                              No check times added yet. Click "Add Time" to set your first check.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {timeWindows.map((window, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 border rounded bg-background">
                                  <div className="flex-1">
                                    <Input
                                      type="text"
                                      placeholder="Check label"
                                      value={window.label}
                                      onChange={(e) => updateTimeWindow(index, 'label', e.target.value)}
                                      className="mb-2"
                                      data-testid={`input-check-label-${index}`}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-xs text-muted-foreground">Start Time</label>
                                        <Input
                                          type="time"
                                          value={window.startTime}
                                          onChange={(e) => updateTimeWindow(index, 'startTime', e.target.value)}
                                          data-testid={`input-start-time-${index}`}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-muted-foreground">End Time</label>
                                        <Input
                                          type="time"
                                          value={window.endTime}
                                          onChange={(e) => updateTimeWindow(index, 'endTime', e.target.value)}
                                          data-testid={`input-end-time-${index}`}
                                        />
                                      </div>
                                    </div>
                                    {validateTimeWindow(window) && (
                                      <p className="text-xs text-red-500 mt-1">
                                        {validateTimeWindow(window)}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTimeWindow(index)}
                                    className="text-destructive hover:text-destructive"
                                    data-testid={`button-remove-time-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {checkFrequency === 'twice' && (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">
                              <Clock className="h-4 w-4 inline mr-1" />
                              Two temperature checks will be required each day: one in the morning (AM) and one in the evening (PM)
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Exclude Days (Optional)</p>
                            <p className="text-xs text-muted-foreground">
                              Select days when temperature checks are not required (e.g., when store is closed)
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {dayNames.map((day, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`exclude-day-twice-${index}`}
                                    checked={excludedDays.includes(index)}
                                    onCheckedChange={() => toggleExcludedDay(index)}
                                    data-testid={`checkbox-exclude-twice-${day.toLowerCase()}`}
                                  />
                                  <label htmlFor={`exclude-day-twice-${index}`} className="text-sm cursor-pointer">
                                    {day}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {checkFrequency === 'once' && (
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <Clock className="h-4 w-4 inline mr-1" />
                              A daily temperature check will be required each day (any time during the day)
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Exclude Days (Optional)</p>
                            <p className="text-xs text-muted-foreground">
                              Select days when temperature checks are not required (e.g., when store is closed)
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {dayNames.map((day, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`exclude-day-${index}`}
                                    checked={excludedDays.includes(index)}
                                    onCheckedChange={() => toggleExcludedDay(index)}
                                    data-testid={`checkbox-exclude-${day.toLowerCase()}`}
                                  />
                                  <label htmlFor={`exclude-day-${index}`} className="text-sm cursor-pointer">
                                    {day}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1"
                    onClick={handleCancel}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={createFridgeMutation.isPending}
                    data-testid="button-save"
                  >
                    {createFridgeMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Fridge
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}