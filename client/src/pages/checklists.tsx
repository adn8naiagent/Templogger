import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { 
//   Dialog, 
//   DialogContent, 
//   DialogDescription, 
//   DialogHeader, 
//   DialogTitle, 
//   DialogTrigger 
// } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckSquare,
  Plus,
  Clock,
  // Settings,
  // Eye,
  Edit,
  MoreHorizontal,
  // PlayCircle,
  // PauseCircle,
  Search,
  Filter,
  // Download,
  BarChart3,
  // User,
  // LogOut,
  // Shield,
  // Crown,
  // Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
// import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
// import { Link } from "wouter";
import Navigation from "@/components/layout/navigation";
import ChecklistEditor from "@/components/checklists/checklist-editor";
import ScheduleEditor from "@/components/checklists/schedule-editor";
import ChecklistCalendar from "@/components/checklists/checklist-calendar";
import ChecklistDashboard from "@/components/checklists/checklist-dashboard";

interface ChecklistItem {
  _id: string;
  label: string;
  required: boolean;
  orderIndex: number;
  note?: string;
}

interface ChecklistSchedule {
  _id: string;
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
  _id: string;
  name: string;
  description?: string;
  items: ChecklistItem[];
  schedule?: ChecklistSchedule;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function Checklists() {
  const { toast } = useToast();
  const { user: _user, isAuthenticated, isLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistWithScheduleAndItems | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch checklists
  const { 
    _data: checklists = [], 
    isLoading: checklistsLoading, 
    error: _checklistsError 
  } = useQuery({
    queryKey: ['checklists', { activeOnly }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/v2/checklists?active=${activeOnly}`);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Failed to fetch checklists: ${response.status} - ${errorText}`);
        if (response.status === 401) {
          logout();
        }
        throw error;
      }

      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Create/Update checklist mutation
  const createChecklistMutation = useMutation({
    mutationFn: async (_data: { name: string; description?: string; items: Omit<ChecklistItem, 'id'>[] }) => {
      const response = await apiRequest('POST', '/api/v2/checklists', _data);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Failed to create checklist: ${response.status} - ${errorText}`);
        if (response.status === 401) {
          logout();
        }
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      setIsEditorOpen(false);
      setSelectedChecklist(null);
      toast({
        title: "Success",
        description: "Checklist created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create checklist",
        variant: "destructive",
      });
    },
  });

  // Delete checklist mutation
  const deleteChecklistMutation = useMutation({
    mutationFn: async (checklistId: string) => {
      const response = await apiRequest('DELETE', `/api/v2/checklists/${checklistId}`);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Failed to delete checklist: ${response.status} - ${errorText}`);
        if (response.status === 401) {
          logout();
        }
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast({
        title: "Success",
        description: "Checklist deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete checklist",
        variant: "destructive",
      });
    },
  });

  // Filter checklists based on search query
  const filteredChecklists = checklists.filter((checklist: ChecklistWithScheduleAndItems) =>
    checklist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    checklist.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateChecklist = () => {
    setSelectedChecklist(null);
    setIsEditorOpen(true);
  };

  const handleEditChecklist = (checklist: ChecklistWithScheduleAndItems) => {
    setSelectedChecklist(checklist);
    setIsEditorOpen(true);
  };

  const handleScheduleChecklist = (checklist: ChecklistWithScheduleAndItems) => {
    setSelectedChecklist(checklist);
    setIsScheduleEditorOpen(true);
  };

  const handleDeleteChecklist = (checklistId: string) => {
    if (confirm("Are you sure you want to delete this checklist? This action cannot be undone.")) {
      deleteChecklistMutation.mutate(checklistId);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="list">
              <CheckSquare className="w-4 h-4 mr-2" />
              Checklists
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          {/* Checklists List Tab */}
          <TabsContent value="list">
            {/* Search and Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search checklists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target._value)}
                    className="pl-10"
                  />
                </div>
                
                <Button
                  variant={activeOnly ? "default" : "outline"}
                  onClick={() => setActiveOnly(!activeOnly)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {activeOnly ? "Active Only" : "All"}
                </Button>
              </div>
            </div>

            {/* Checklists Grid */}
            {checklistsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading checklists...</p>
              </div>
            ) : filteredChecklists.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchQuery ? "No checklists found" : "No checklists yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? `No checklists match "${searchQuery}"`
                      : "Create your first checklist to get started"
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleCreateChecklist}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Checklist
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredChecklists.map((checklist: ChecklistWithScheduleAndItems) => (
                  <Card key={checklist.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{checklist.name}</CardTitle>
                          {checklist.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {checklist.description}
                            </CardDescription>
                          )}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditChecklist(checklist)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleScheduleChecklist(checklist)}>
                              <Clock className="w-4 h-4 mr-2" />
                              Schedule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteChecklist(checklist._id)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {/* Status and Schedule */}
                        <div className="flex items-center justify-between">
                          <Badge variant={checklist.isActive ? "default" : "secondary"}>
                            {checklist.isActive ? "Active" : "Inactive"}
                          </Badge>
                          
                          {checklist.schedule && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {checklist.schedule.cadence}
                            </div>
                          )}
                        </div>
                        
                        {/* Items Count */}
                        <div className="text-sm text-muted-foreground">
                          {checklist.items.length} item{checklist.items.length !== 1 ? 's' : ''}
                          {checklist.items.filter(i => i.required).length > 0 && (
                            <span> • {checklist.items.filter(i => i.required).length} required</span>
                          )}
                        </div>
                        
                        {/* Schedule Info */}
                        {checklist.schedule && (
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                            <div>Starts: {new Date(checklist.schedule.startDate).toLocaleDateString()}</div>
                            {checklist.schedule.endDate && (
                              <div>Ends: {new Date(checklist.schedule.endDate).toLocaleDateString()}</div>
                            )}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditChecklist(checklist)}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleScheduleChecklist(checklist)}
                            className="flex-1"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            Schedule
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <ChecklistCalendar />
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <ChecklistDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Checklist Editor Dialog */}
      <ChecklistEditor
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        checklist={selectedChecklist}
        onSave={createChecklistMutation.mutate}
        isSaving={createChecklistMutation.isPending}
      />

      {/* Schedule Editor Dialog */}
      <ScheduleEditor
        isOpen={isScheduleEditorOpen}
        onOpenChange={setIsScheduleEditorOpen}
        checklist={selectedChecklist}
      />
    </div>
  );
}