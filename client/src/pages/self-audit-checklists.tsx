import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
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
  Settings,
  Eye,
  Edit,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  BarChart3,
  User,
  LogOut,
  Shield,
  Crown,
  Star,
  FileText,
  Copy,
  Trash2,
  PlayCircle,
  History
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Navigation from "@/components/layout/navigation";

interface AuditTemplate {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  sections: AuditSection[];
  createdAt: Date;
  updatedAt: Date;
}

interface AuditSection {
  _id: string;
  title: string;
  description?: string;
  orderIndex: number;
  items: AuditItem[];
}

interface AuditItem {
  _id: string;
  text: string;
  isRequired: boolean;
  orderIndex: number;
  note?: string;
}

interface AuditCompletion {
  _id: string;
  templateName: string;
  completedAt: Date;
  complianceRate: number;
  notes?: string;
}

export default function SelfAuditChecklists() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<AuditTemplate | null>(null);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [isCompletionViewOpen, setIsCompletionViewOpen] = useState(false);

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

  // Fetch audit templates
  const { 
    _data: templates = [], 
    isLoading: templatesLoading, 
    error: templatesError 
  } = useQuery({
    queryKey: ['audit-templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/audit-templates');
      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Failed to fetch templates: ${response.status} - ${errorText}`);
        if (response.status === 401) {
          logout();
        }
        throw error;
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch recent completions
  const { _data: recentCompletions = [] } = useQuery({
    queryKey: ['audit-completions-recent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/audit-completions');
      if (!response.ok) throw new Error('Failed to fetch completions');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Create default template mutation
  const createDefaultMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/audit-templates/default');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create default template: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-templates'] });
      toast({
        title: "Success",
        description: "Default compliance checklist created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create default template",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (_templateId: string) => {
      const response = await apiRequest('DELETE', `/api/audit-templates/${templateId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete template: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  // Filter templates based on search query
  const filteredTemplates = templates.filter((template: AuditTemplate) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDefaultTemplate = () => {
    createDefaultMutation.mutate();
  };

  const handleEditTemplate = (template: AuditTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateEditorOpen(true);
  };

  const handleDeleteTemplate = (_templateId: string) => {
    if (confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      deleteTemplateMutation.mutate(_templateId);
    }
  };

  const getTotalItems = (template: AuditTemplate) => {
    return template.sections.reduce((total, section) => total + section.items.length, 0);
  };

  const getRequiredItems = (template: AuditTemplate) => {
    return template.sections.reduce((total, section) => 
      total + section.items.filter(item => item.isRequired).length, 0);
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
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="templates">
              <CheckSquare className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="completions">
              <History className="w-4 h-4 mr-2" />
              Completed Audits
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates">
            {/* Search */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target._value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Templates Grid */}
            {templatesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchQuery ? "No templates found" : "No templates yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? `No templates match "${searchQuery}"`
                      : "Create your first self-audit template to get started"
                    }
                  </p>
                  {!searchQuery && (
                    <div className="flex items-center space-x-2 justify-center">
                      <Button onClick={handleCreateDefaultTemplate} disabled={createDefaultMutation.isPending} variant="outline">
                        <Star className="w-4 h-4 mr-2" />
                        Create Default Template
                      </Button>
                      <Button asChild>
                        <Link to="/self-audit/create-template">
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Template
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template: AuditTemplate) => (
                  <Card key={template.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                            {template.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          {template.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {template.description}
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
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/self-audit/${template.id}/complete`}>
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Complete Audit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTemplate(template._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          {template.sections.length} section{template.sections.length !== 1 ? 's' : ''} • {getTotalItems(template)} items
                          {getRequiredItems(template) > 0 && (
                            <span> • {getRequiredItems(template)} required</span>
                          )}
                        </div>
                        
                        {/* Section Preview */}
                        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 max-h-20 overflow-hidden">
                          <div className="font-medium mb-1">Sections:</div>
                          {template.sections.slice(0, 3).map((section, idx) => (
                            <div key={section.id}>• {section.title}</div>
                          ))}
                          {template.sections.length > 3 && (
                            <div>• ... and {template.sections.length - 3} more</div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            asChild
                            className="flex-1"
                          >
                            <Link to={`/self-audit/${template.id}/complete`}>
                              <PlayCircle className="w-3 h-3 mr-1" />
                              Complete
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditTemplate(template)}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Audits Tab */}
          <TabsContent value="completions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Completed Audits
                </CardTitle>
                <CardDescription>
                  View and analyze your completed self-audit checklists
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentCompletions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No completed audits</h3>
                    <p className="text-muted-foreground">Complete your first audit to see results here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentCompletions.slice(0, 10).map((completion: AuditCompletion) => (
                      <div key={completion.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{completion.templateName}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>Completed: {new Date(completion.completedAt).toLocaleDateString()}</span>
                            <Badge variant={completion.complianceRate >= 90 ? "default" : completion.complianceRate >= 70 ? "secondary" : "destructive"}>
                              {completion.complianceRate}% Compliant
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/self-audit/completion/${completion.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{templates.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Audits</CardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentCompletions.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Compliance</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentCompletions.length > 0 
                      ? Math.round(recentCompletions.reduce((sum: number, c: AuditCompletion) => sum + c.complianceRate, 0) / recentCompletions.length)
                      : 0
                    }%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recentCompletions.filter((c: AuditCompletion) => {
                      const completedDate = new Date(c.completedAt);
                      const now = new Date();
                      return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear();
                    }).length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}