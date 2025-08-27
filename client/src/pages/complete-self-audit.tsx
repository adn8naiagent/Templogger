import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  // Save,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface AuditTemplate {
  _id: string;
  name: string;
  description?: string;
  sections: AuditSection[];
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

interface AuditResponse {
  sectionId: string;
  itemId: string;
  isCompliant: boolean;
  notes?: string;
  actionRequired?: string;
}

export default function CompleteSelfAudit() {
  const { templateId } = useParams<{ _templateId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: _user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const [responses, setResponses] = useState<Record<string, AuditResponse>>({});
  const [overallNotes, setOverallNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  // Fetch template
  const { 
    _data: template, 
    isLoading: templateLoading, 
    error: templateError 
  } = useQuery({
    queryKey: ['audit-template', templateId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/audit-templates/${templateId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Template not found');
        }
        throw new Error('Failed to fetch template');
      }
      return response.json() as Promise<AuditTemplate>;
    },
    enabled: isAuthenticated && !!_templateId,
  });

  // Submit audit completion
  const completeMutation = useMutation({
    mutationFn: async (_data: { responses: AuditResponse[]; notes?: string }) => {
      const response = await apiRequest('POST', '/api/audit-completions', {
        _templateId,
        responses: data.responses,
        notes: data.notes
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to complete audit: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['audit-completions'] });
      toast({
        title: "Audit Completed!",
        description: `Compliance rate: ${calculateComplianceRate()}%. View your results in the completed audits section.`,
      });
      setLocation('/self-audit-checklists');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete audit",
        variant: "destructive",
      });
    },
  });

  const handleResponseChange = (sectionId: string, itemId: string, field: keyof AuditResponse, value: any) => {
    const key = `${sectionId}-${itemId}`;
    setResponses(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        sectionId,
        itemId,
        [field]: value
      }
    }));
  };

  const getResponse = (sectionId: string, itemId: string): AuditResponse | undefined => {
    const key = `${sectionId}-${itemId}`;
    return responses[key];
  };

  const calculateComplianceRate = (): number => {
    if (!template) return 0;
    
    const totalItems = template.sections.reduce((total, section) => 
      total + section.items.length, 0);
    
    if (totalItems === 0) return 100;
    
    const compliantItems = Object.values(responses).filter(r => r.isCompliant).length;
    return Math.round((compliantItems / totalItems) * 100);
  };

  const getTotalProgress = (): number => {
    if (!template) return 0;
    
    const totalItems = template.sections.reduce((total, section) => 
      total + section.items.length, 0);
    
    if (totalItems === 0) return 100;
    
    const respondedItems = Object.keys(responses).length;
    return Math.round((respondedItems / totalItems) * 100);
  };

  const canSubmit = (): boolean => {
    if (!template) return false;
    
    // Check that all required items have responses
    for (const section of template.sections) {
      for (const item of section.items) {
        if (item.isRequired) {
          const response = getResponse(section._id, item._id);
          if (!response || response.isCompliant === undefined) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!canSubmit()) {
      toast({
        title: "Incomplete Audit",
        description: "Please complete all required items before submitting.",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmSubmit = () => {
    const responseArray = Object.values(responses);
    completeMutation.mutate({
      responses: responseArray,
      notes: overallNotes || undefined
    });
    setShowConfirmDialog(false);
  };

  if (isLoading || templateLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit template...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (templateError || !template) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Template Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The audit template could not be found or you don't have access to it.
              </p>
              <Button onClick={() => setLocation('/self-audit-checklists')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Templates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progress = getTotalProgress();
  const complianceRate = calculateComplianceRate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 z-10 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/self-audit-checklists')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">{template.name}</h1>
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="font-medium">{progress}% Complete</div>
              </div>
              <div className="w-24">
                <Progress value={progress} />
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit() || completeMutation.isPending}
                className="min-w-[120px]"
              >
                {completeMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Audit
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progress Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{progress}%</div>
                <div className="text-sm text-muted-foreground">Items Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{complianceRate}%</div>
                <div className="text-sm text-muted-foreground">Current Compliance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{template.sections.length}</div>
                <div className="text-sm text-muted-foreground">Total Sections</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Sections */}
        <div className="space-y-6">
          {template.sections
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((section, sectionIndex) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {sectionIndex + 1}
                        </Badge>
                        {section.title}
                      </CardTitle>
                      {section.description && (
                        <CardDescription className="mt-2">
                          {section.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.items
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((item, itemIndex) => {
                        const response = getResponse(section._id, item._id);
                        const isCompliant = response?.isCompliant;
                        
                        return (
                          <div 
                            key={item.id} 
                            className={`p-4 rounded-lg border-2 transition-colors ${
                              isCompliant === true 
                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                                : isCompliant === false 
                                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' 
                                : 'border-gray-200 dark:border-gray-800'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Badge variant="secondary" className="text-xs mt-0.5">
                                {sectionIndex + 1}.{itemIndex + 1}
                              </Badge>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground mb-2">
                                      {item.text}
                                      {item.isRequired && (
                                        <span className="text-red-500 ml-1">*</span>
                                      )}
                                    </p>
                                    {item.note && (
                                      <p className="text-sm text-muted-foreground mb-3">
                                        <strong>Note:</strong> {item.note}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant={isCompliant === true ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleResponseChange(section._id, item._id, 'isCompliant', true)}
                                        className={isCompliant === true ? "bg-green-600 hover:bg-green-700" : ""}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Compliant
                                      </Button>
                                      <Button
                                        variant={isCompliant === false ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleResponseChange(section._id, item._id, 'isCompliant', false)}
                                        className={isCompliant === false ? "bg-red-600 hover:bg-red-700" : ""}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Non-Compliant
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Additional Notes/Action Required */}
                                {isCompliant !== undefined && (
                                  <div className="mt-4 space-y-3">
                                    <div>
                                      <Label htmlFor={`notes-${item.id}`} className="text-sm font-medium">
                                        Notes
                                      </Label>
                                      <Textarea
                                        id={`notes-${item.id}`}
                                        placeholder="Add any additional notes or observations..."
                                        value={response?.notes || ""}
                                        onChange={(e) => handleResponseChange(section._id, item._id, 'notes', e.target._value)}
                                        className="mt-1"
                                        rows={2}
                                      />
                                    </div>
                                    
                                    {isCompliant === false && (
                                      <div>
                                        <Label htmlFor={`action-${item.id}`} className="text-sm font-medium">
                                          Action Required
                                        </Label>
                                        <Textarea
                                          id={`action-${item.id}`}
                                          placeholder="What corrective actions need to be taken?"
                                          value={response?.actionRequired || ""}
                                          onChange={(e) => handleResponseChange(section._id, item._id, 'actionRequired', e.target._value)}
                                          className="mt-1"
                                          rows={2}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Overall Notes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Overall Notes</CardTitle>
            <CardDescription>
              Add any general observations, recommendations, or comments about this audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your overall notes and recommendations..."
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target._value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit Section */}
        <Card className="mt-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Ready to Submit?</h3>
                <p className="text-sm text-muted-foreground">
                  Current compliance rate: <strong>{complianceRate}%</strong> • 
                  Progress: <strong>{progress}% complete</strong>
                </p>
                {!canSubmit() && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please complete all required items before submitting your audit.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit() || completeMutation.isPending}
                size="lg"
                className="min-w-[140px]"
              >
                {completeMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Audit
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Audit Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this audit? You won't be able to make changes after submission.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Template:</span>
                  <div className="font-medium">{template.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Compliance Rate:</span>
                  <div className="font-medium">{complianceRate}%</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmSubmit} disabled={completeMutation.isPending}>
                {completeMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  "Confirm Submission"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}