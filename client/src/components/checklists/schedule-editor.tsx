import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Play,
  Square,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

interface ChecklistSchedule {
  id: string;
  checklistId: string;
  cadence: 'DAILY' | 'DOW' | 'WEEKLY';
  daysOfWeek?: number[];
  startDate: string;
  endDate?: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ChecklistWithScheduleAndItems {
  id: string;
  name: string;
  description?: string;
  schedule?: ChecklistSchedule;
  isActive: boolean;
}

interface ScheduleEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checklist?: ChecklistWithScheduleAndItems | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const CADENCE_OPTIONS = [
  {
    value: 'DAILY',
    label: 'Daily',
    description: 'Required every day within the date range',
  },
  {
    value: 'DOW',
    label: 'Days of Week',
    description: 'Required on specific days of the week',
  },
  {
    value: 'WEEKLY',
    label: 'Weekly',
    description: 'Required once per week (any day within the week)',
  },
];

export default function ScheduleEditor({
  isOpen,
  onOpenChange,
  checklist,
}: ScheduleEditorProps) {
  const { toast } = useToast();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const [cadence, setCadence] = useState<'DAILY' | 'DOW' | 'WEEKLY'>('DAILY');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timezone] = useState('UTC'); // For simplicity, using UTC

  // Initialize form when checklist changes
  useEffect(() => {
    if (checklist?.schedule) {
      setCadence(checklist.schedule.cadence);
      setSelectedDays(checklist.schedule.daysOfWeek || []);
      setStartDate(checklist.schedule.startDate);
      setEndDate(checklist.schedule.endDate || '');
    } else {
      // Set defaults
      setCadence('DAILY');
      setSelectedDays([]);
      setStartDate(new Date().toISOString().split('T')[0]); // Today
      setEndDate('');
    }
  }, [checklist, isOpen]);

  // Create/Update schedule mutation
  const scheduleChecklistMutation = useMutation({
    mutationFn: async (data: {
      cadence: 'DAILY' | 'DOW' | 'WEEKLY';
      daysOfWeek?: number[];
      startDate: string;
      endDate?: string;
      timezone: string;
    }) => {
      if (!checklist) throw new Error('No checklist selected');

      const response = await apiRequest(
        'POST',
        `/api/v2/checklists/${checklist.id}/schedule`,
        data
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
        }
        const error = await response.json();
        throw new Error(error.error || `Failed to schedule checklist: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Checklist schedule updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule",
        variant: "destructive",
      });
    },
  });

  // Toggle day selection for DOW cadence
  const toggleDay = (dayValue: number) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter(d => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue].sort());
    }
  };

  // Validate form
  const validateForm = () => {
    if (!startDate) {
      toast({
        title: "Validation Error",
        description: "Start date is required",
        variant: "destructive",
      });
      return false;
    }

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      toast({
        title: "Validation Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return false;
    }

    if (cadence === 'DOW' && selectedDays.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one day of the week",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Generate preview of upcoming requirements
  const generatePreview = () => {
    if (!startDate) return [];

    const preview = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from start
    
    const today = new Date();
    let current = new Date(Math.max(start.getTime(), today.getTime()));
    const maxPreview = 10;
    let count = 0;

    while (current <= end && count < maxPreview) {
      if (cadence === 'DAILY') {
        preview.push({
          date: current.toISOString().split('T')[0],
          display: current.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
        });
        current.setDate(current.getDate() + 1);
        count++;
      } else if (cadence === 'DOW') {
        if (selectedDays.includes(current.getDay())) {
          preview.push({
            date: current.toISOString().split('T')[0],
            display: current.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }),
          });
          count++;
        }
        current.setDate(current.getDate() + 1);
      } else if (cadence === 'WEEKLY') {
        // Find the start of the week (Sunday)
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - current.getDay());
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        preview.push({
          date: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          display: `Week ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        });
        current.setDate(current.getDate() + 7);
        count++;
      }
    }

    return preview;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) return;

    const saveData = {
      cadence,
      daysOfWeek: cadence === 'DOW' ? selectedDays : undefined,
      startDate,
      endDate: endDate || undefined,
      timezone,
    };

    scheduleChecklistMutation.mutate(saveData);
  };

  const preview = generatePreview();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Schedule Checklist
          </DialogTitle>
          <DialogDescription>
            Set up when "{checklist?.name}" should be required for completion
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Cadence Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Schedule Type</Label>
            <div className="grid gap-3">
              {CADENCE_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-colors ${
                    cadence === option.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setCadence(option.value as 'DAILY' | 'DOW' | 'WEEKLY')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        cadence === option.value
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {cadence === option.value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Days of Week Selection (only for DOW cadence) */}
          {cadence === 'DOW' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Select Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={selectedDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(day.value)}
                    className="flex-shrink-0"
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
              {selectedDays.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Preview - Upcoming Requirements</Label>
              <Card>
                <CardContent className="p-4">
                  <div className="grid gap-2">
                    {preview.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-muted-foreground">{item.display}</span>
                      </div>
                    ))}
                    {preview.length >= 10 && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Showing first 10 upcoming requirements...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Current Schedule Status */}
          {checklist?.schedule && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">Current Schedule</div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>Type: {checklist.schedule.cadence}</div>
                      <div>Active since: {new Date(checklist.schedule.startDate).toLocaleDateString()}</div>
                      {checklist.schedule.endDate && (
                        <div>Ends: {new Date(checklist.schedule.endDate).toLocaleDateString()}</div>
                      )}
                      {checklist.schedule.daysOfWeek && (
                        <div>
                          Days: {checklist.schedule.daysOfWeek
                            .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.short)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Important Notes */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <div className="font-medium mb-2">Important Notes:</div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Scheduling will generate required instances automatically</li>
                    <li>Past instances will be generated for the last 14 days for reporting</li>
                    <li>Future instances will be generated up to 60 days ahead</li>
                    <li>Changing the schedule will only affect future instances</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={scheduleChecklistMutation.isPending}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={scheduleChecklistMutation.isPending || !validateForm()}
          >
            {scheduleChecklistMutation.isPending ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {checklist?.schedule ? 'Update' : 'Create'} Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}