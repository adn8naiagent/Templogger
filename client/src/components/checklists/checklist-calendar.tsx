import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CompleteChecklistModal from "./complete-checklist-modal";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

interface CalendarInstance {
  id: string;
  checklistId: string;
  checklistName: string;
  targetDate: string;
  status: 'REQUIRED' | 'COMPLETED' | 'MISSED';
  cadence: 'DAILY' | 'DOW' | 'WEEKLY';
  completedAt?: Date;
  completedBy?: string;
}

interface CalendarData {
  instances: CalendarInstance[];
  period: {
    start: string;
    end: string;
  };
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ChecklistCalendar() {
  const { toast } = useToast();
  const { logout } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [completingInstance, setCompletingInstance] = useState<CalendarInstance | null>(null);

  // Calculate calendar period
  const getCalendarPeriod = () => {
    if (viewMode === 'month') {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Extend to include previous month days to fill the first week
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      // Extend to include next month days to fill the last week
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
      
      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      };
    } else {
      // Week view
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0],
      };
    }
  };

  const period = getCalendarPeriod();

  // Fetch calendar data
  const { 
    data: calendarData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['calendar', period.start, period.end],
    queryFn: async (): Promise<CalendarData> => {
      const response = await apiRequest(
        'GET',
        `/api/v2/calendar?from=${period.start}&to=${period.end}`
      );

      if (!response.ok) {
        if (isUnauthorizedError(response.status)) {
          logout();
        }
        throw new Error(`Failed to fetch calendar data: ${response.status}`);
      }

      return response.json();
    },
  });

  // Group instances by date
  const instancesByDate = calendarData?.instances.reduce((acc, instance) => {
    const date = instance.targetDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(instance);
    return acc;
  }, {} as Record<string, CalendarInstance[]>) || {};

  // Navigation handlers
  const navigatePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get status indicator for a date
  const getDateStatus = (date: string) => {
    const instances = instancesByDate[date] || [];
    if (instances.length === 0) return null;

    const hasRequired = instances.some(i => i.status === 'REQUIRED');
    const hasCompleted = instances.some(i => i.status === 'COMPLETED');
    const hasMissed = instances.some(i => i.status === 'MISSED');

    if (hasMissed) return 'missed';
    if (hasCompleted && !hasRequired) return 'completed';
    if (hasRequired) return 'required';
    return null;
  };

  // Render calendar days for month view
  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = current.toISOString().split('T')[0];
        const isCurrentMonth = current.getMonth() === currentDate.getMonth();
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        const status = getDateStatus(dateStr);
        const instances = instancesByDate[dateStr] || [];
        
        weekDays.push(
          <div
            key={dateStr}
            className={`min-h-[80px] p-2 border border-border cursor-pointer transition-colors ${
              isCurrentMonth ? 'bg-background' : 'bg-muted/30'
            } ${
              isToday ? 'ring-2 ring-primary' : ''
            } hover:bg-muted/50`}
            onClick={() => instances.length > 0 ? setSelectedDate(dateStr) : null}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm ${
                isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
              } ${isToday ? 'font-bold' : ''}`}>
                {current.getDate()}
              </span>
              
              {status && (
                <div className={`w-2 h-2 rounded-full ${
                  status === 'completed' ? 'bg-green-500' :
                  status === 'required' ? 'bg-blue-500' :
                  status === 'missed' ? 'bg-red-500' : ''
                }`} />
              )}
            </div>
            
            {instances.length > 0 && (
              <div className="space-y-1">
                {instances.slice(0, 2).map((instance, idx) => (
                  <div key={idx} className="text-xs p-1 rounded bg-muted/80 truncate">
                    <div className="flex items-center gap-1">
                      {instance.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : instance.status === 'MISSED' ? (
                        <XCircle className="w-3 h-3 text-red-500" />
                      ) : (
                        <Clock className="w-3 h-3 text-blue-500" />
                      )}
                      <span className="truncate">{instance.checklistName}</span>
                    </div>
                  </div>
                ))}
                {instances.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{instances.length - 2} more
                  </div>
                )}
              </div>
            )}
          </div>
        );
        
        current.setDate(current.getDate() + 1);
      }
      days.push(
        <div key={week} className="grid grid-cols-7">
          {weekDays}
        </div>
      );
    }
    
    return days;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Calendar</h3>
          <p className="text-muted-foreground mb-4">
            Failed to load calendar data. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {viewMode === 'month' 
              ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            }
          </h2>
          <p className="text-muted-foreground">
            Track your scheduled checklist requirements
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <div className="flex">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Required</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Missed</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="p-4 text-center font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar body */}
          {viewMode === 'month' ? (
            <div>
              {renderMonthView()}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-center text-muted-foreground">
                Week view coming soon...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Detail Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </DialogTitle>
            <DialogDescription>
              Checklist requirements for this date
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDate && instancesByDate[selectedDate] ? (
              instancesByDate[selectedDate].map((instance) => (
                <Card key={instance.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{instance.checklistName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {instance.cadence} requirement
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          instance.status === 'COMPLETED' ? 'default' :
                          instance.status === 'MISSED' ? 'destructive' :
                          'secondary'
                        }>
                          {instance.status === 'COMPLETED' ? 'Completed' :
                           instance.status === 'MISSED' ? 'Missed' :
                           'Required'}
                        </Badge>
                        
                        {instance.status === 'REQUIRED' && (
                          <Button
                            size="sm"
                            onClick={() => setCompletingInstance(instance)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {instance.completedAt && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Completed at {new Date(instance.completedAt).toLocaleString()}
                        {instance.completedBy && ` by ${instance.completedBy}`}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No checklist requirements for this date.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Checklist Modal */}
      <CompleteChecklistModal
        isOpen={!!completingInstance}
        onOpenChange={() => setCompletingInstance(null)}
        instance={completingInstance ? {
          ...completingInstance,
          items: [], // This would need to be populated from the checklist data
        } : null}
        onComplete={() => {
          setCompletingInstance(null);
          setSelectedDate(null);
        }}
      />
    </div>
  );
}