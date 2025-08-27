import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Power, 
  PowerOff, 
  Plus, 
  X, 
  Clock,
  Palette
} from 'lucide-react';
import { HexColorPicker } from "react-colorful";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { apiRequest } from '@/lib/queryClient';
import type { Fridge } from '@shared/schema';

interface TimeWindow {
  label: string;
  checkType: 'specific' | 'daily' | 'am_pm';
  startTime?: string;
  endTime?: string;
  excludedDays: number[];
}

export default function EditFridge() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Form state
  const [name, setName] = useState('');
  const [location, setFridgeLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [enableScheduledChecks, setEnableScheduledChecks] = useState(true);
  const [checkFrequency, setCheckFrequency] = useState<'once' | 'twice' | 'multiple'>('twice');
  const [excludedDays, setExcludedDays] = useState<number[]>([]);
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch fridge data
  const { data: fridge, isLoading } = useQuery<Fridge>({
    queryKey: [`/api/fridge/${id}`],
    enabled: !!id,
  });

  // Load fridge data into form
  useEffect(() => {
    if (fridge) {
      setName(fridge.name);
      setFridgeLocation(fridge.location || '');
      setNotes(fridge.notes || '');
      setColor(fridge.color || '#3b82f6');
      setMinTemp(fridge.minTemp);
      setMaxTemp(fridge.maxTemp);
      setEnableScheduledChecks(fridge.enableScheduledChecks ?? true);
      setCheckFrequency((fridge.checkFrequency as "once" | "twice" | "multiple") || 'twice');
      setExcludedDays((fridge.excludedDays as number[]) || []);
      setTimeWindows([]);
    }
  }, [fridge]);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const toggleExcludedDay = (dayIndex: number) => {
    const sundayFirstIndex = dayIndex === 6 ? 0 : dayIndex + 1;
    setExcludedDays(prev => 
      prev.includes(sundayFirstIndex) 
        ? prev.filter(d => d !== sundayFirstIndex)
        : [...prev, sundayFirstIndex]
    );
  };

  const isDayExcluded = (dayIndex: number) => {
    const sundayFirstIndex = dayIndex === 6 ? 0 : dayIndex + 1;
    return excludedDays.includes(sundayFirstIndex);
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

  const removeTimeWindow = (index: number) => {
    setTimeWindows(timeWindows.filter((_, i) => i !== index));
  };

  const updateTimeWindow = (index: number, field: keyof TimeWindow, value: string | number[]) => {
    const updated = [...timeWindows];
    updated[index] = { ...updated[index], [field]: value };
    setTimeWindows(updated);
  };

  // Update fridge mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/fridge/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fridge Updated",
        description: "Fridge settings have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/fridge/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/fridges/all'] });
      setLocation(`/fridge/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update fridge settings.",
        variant: "destructive",
      });
    },
  });

  // Soft delete (remove) mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/fridge/${id}/deactivate`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fridge Removed",
        description: "Fridge has been made inactive. It will still appear in compliance reports.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fridges/all'] });
      setLocation('/fridges');
    },
    onError: (error: any) => {
      toast({
        title: "Remove Failed",
        description: error.message || "Failed to remove fridge.",
        variant: "destructive",
      });
    },
  });

  // Reactivate mutation
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/fridge/${id}/activate`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fridge Reactivated",
        description: "Fridge has been made active again.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/fridge/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/fridges/all'] });
    },
    onError: (error: any) => {
      toast({
        title: "Reactivation Failed",
        description: error.message || "Failed to reactivate fridge.",
        variant: "destructive",
      });
    },
  });

  // Hard delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/fridge/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fridge Deleted",
        description: "Fridge and all its data have been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fridges/all'] });
      setLocation('/fridges');
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete fridge.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !minTemp || !maxTemp) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(minTemp) >= parseFloat(maxTemp)) {
      toast({
        title: "Validation Error",
        description: "Maximum temperature must be higher than minimum temperature.",
        variant: "destructive",
      });
      return;
    }

    const fridgeData = {
      name: name.trim(),
      location: location.trim() || null,
      notes: notes.trim() || null,
      color,
      minTemp: parseFloat(minTemp),
      maxTemp: parseFloat(maxTemp),
      enableScheduledChecks,
      checkFrequency: enableScheduledChecks ? checkFrequency : null,
      excludedDays: enableScheduledChecks ? excludedDays : [],
      timeWindows: enableScheduledChecks && checkFrequency === 'multiple' ? timeWindows : [],
    };

    updateMutation.mutate(fridgeData);
  };

  const handleRemove = () => {
    setIsRemoving(true);
    removeMutation.mutate();
  };

  const handleReactivate = () => {
    reactivateMutation.mutate();
  };

  const handleDelete = () => {
    if (deleteConfirmName.trim() !== fridge?.name) {
      toast({
        title: "Validation Error",
        description: "Please enter the fridge name exactly as shown to confirm deletion.",
        variant: "destructive",
      });
      return;
    }
    setIsDeleting(true);
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLocation(`/fridge/${id}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fridge
              </Button>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
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
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/fridges')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fridges
              </Button>
            </div>
          </div>
        </header>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fridge not found</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              The requested fridge could not be found or you don't have access to it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLocation(`/fridge/${id}`)} data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fridge
              </Button>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: color }}
                ></div>
                <h1 className="text-xl font-bold text-foreground">Edit {fridge.name}</h1>
                {!fridge.isActive && (
                  <Badge variant="secondary" className="gap-1">
                    <PowerOff className="h-3 w-3" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8" data-testid="edit-fridge-container">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic settings and temperature range for your fridge.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Fridge Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Main Vaccine Fridge"
                  required
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setFridgeLocation(e.target.value)}
                  placeholder="e.g., Room 101, Pharmacy"
                  data-testid="input-location"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes or instructions..."
                  rows={3}
                  data-testid="input-notes"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color Theme
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start mt-2"
                      data-testid="button-color-picker"
                    >
                      <div 
                        className="w-4 h-4 rounded mr-2 border" 
                        style={{ backgroundColor: color }}
                      />
                      {color}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <HexColorPicker color={color} onChange={setColor} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minTemp">Minimum Temperature (°C) *</Label>
                  <Input
                    id="minTemp"
                    type="number"
                    step="0.1"
                    value={minTemp}
                    onChange={(e) => setMinTemp(e.target.value)}
                    placeholder="2.0"
                    required
                    data-testid="input-min-temp"
                  />
                </div>
                <div>
                  <Label htmlFor="maxTemp">Maximum Temperature (°C) *</Label>
                  <Input
                    id="maxTemp"
                    type="number"
                    step="0.1"
                    value={maxTemp}
                    onChange={(e) => setMaxTemp(e.target.value)}
                    placeholder="8.0"
                    required
                    data-testid="input-max-temp"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Check Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Temperature Check Scheduling
              </CardTitle>
              <CardDescription>
                Configure when and how often temperature checks should be performed for this fridge.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Check Frequency</Label>
                    <RadioGroup
                      value={checkFrequency}
                      onValueChange={(value) => setCheckFrequency(value as 'once' | 'twice' | 'multiple')}
                      className="mt-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="once" id="once" />
                        <Label htmlFor="once">Once per day</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="twice" id="twice" />
                        <Label htmlFor="twice">Twice per day (AM & PM)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="multiple" id="multiple" />
                        <Label htmlFor="multiple">Multiple specific times</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {checkFrequency === 'multiple' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-medium">Temperature Check Times</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addTimeWindow}
                          data-testid="add-time-window"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Check Time
                        </Button>
                      </div>
                      
                      {timeWindows.map((window, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Input
                                value={window.label}
                                onChange={(e) => updateTimeWindow(index, 'label', e.target.value)}
                                placeholder="Check label"
                                className="flex-1 mr-4"
                                data-testid={`time-window-label-${index}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTimeWindow(index)}
                                data-testid={`remove-time-window-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`start-${index}`}>Start Time</Label>
                                <Input
                                  id={`start-${index}`}
                                  type="time"
                                  value={window.startTime || ''}
                                  onChange={(e) => updateTimeWindow(index, 'startTime', e.target.value)}
                                  data-testid={`start-time-${index}`}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`end-${index}`}>End Time</Label>
                                <Input
                                  id={`end-${index}`}
                                  type="time"
                                  value={window.endTime || ''}
                                  onChange={(e) => updateTimeWindow(index, 'endTime', e.target.value)}
                                  data-testid={`end-time-${index}`}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  <div>
                    <Label className="text-base font-medium">Excluded Days</Label>
                    <div className="mt-3 space-y-2">
                      {dayNames.map((day, index) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${index}`}
                            checked={isDayExcluded(index)}
                            onCheckedChange={() => toggleExcludedDay(index)}
                            data-testid={`exclude-${day.toLowerCase()}`}
                          />
                          <Label htmlFor={`day-${index}`} className="text-sm">
                            Skip {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Select days when temperature checks should be skipped
                    </p>
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="flex gap-4">
              {fridge.isActive ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      disabled={isRemoving}
                      data-testid="button-remove"
                    >
                      <PowerOff className="h-4 w-4 mr-2" />
                      {isRemoving ? 'Removing...' : 'Remove Fridge'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Fridge</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will make the fridge inactive. All data will be preserved and the fridge will still appear in compliance reports. You can reactivate it later if needed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReactivate}
                    disabled={reactivateMutation.isPending}
                    data-testid="button-reactivate"
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {reactivateMutation.isPending ? 'Reactivating...' : 'Reactivate'}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="destructive"
                        data-testid="button-delete"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Permanently
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Permanently Delete Fridge</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p>
                            This will permanently delete the fridge and ALL its data including temperature logs, 
                            compliance records, and history. This action cannot be undone.
                          </p>
                          <p>
                            To confirm, please type the fridge name exactly: <strong>{fridge.name}</strong>
                          </p>
                          <Input
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder="Enter fridge name to confirm"
                            data-testid="input-delete-confirm"
                          />
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmName('')}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDelete}
                          disabled={deleteConfirmName.trim() !== fridge.name || isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}