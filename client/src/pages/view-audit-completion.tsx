import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  // User,
  BarChart3,
  Download,
  // Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface AuditCompletion {
  _id: string;
  _templateId: string;
  templateName: string;
  completedBy: string;
  completedAt: Date;
  notes?: string;
  complianceRate: number;
  responses: AuditResponse[];
  template?: AuditTemplate;
}

interface AuditResponse {
  _id: string;
  sectionId: string;
  sectionTitle: string;
  itemId: string;
  itemText: string;
  isCompliant: boolean;
  notes?: string;
  actionRequired?: string;
}

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

export default function ViewAuditCompletion() {
  const { _completionId } = useParams<{ _completionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: _user, isAuthenticated, isLoading } = useAuth();

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

  // Fetch completion details
  const { 
    data: completion, 
    isLoading: completionLoading, 
    error: completionError 
  } = useQuery({
    queryKey: ['audit-completion', _completionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/audit-completions/${_completionId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Completion not found');
        }
        throw new Error('Failed to fetch completion');
      }
      return response.json() as Promise<AuditCompletion>;
    },
    enabled: isAuthenticated && !!_completionId,
  });

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const _getComplianceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-600">{rate}% Compliant</Badge>;
    if (rate >= 70) return <Badge variant="secondary">{rate}% Compliant</Badge>;
    return <Badge variant="destructive">{rate}% Compliant</Badge>;
  };

  const exportReport = () => {
    if (!completion) return;
    
    const csvHeaders = ['Section', 'Item', 'Compliant', 'Notes', 'Action Required'];
    const csvRows = [csvHeaders.join(',')];
    
    completion.responses.forEach((response: AuditResponse) => {
      const row = [
        `"${response.sectionTitle}"`,
        `"${response.itemText}"`,
        response.isCompliant ? 'Yes' : 'No',
        response.notes ? `"${response.notes}"` : '',
        response.actionRequired ? `"${response.actionRequired}"` : ''
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${completion.templateName}-${new Date(completion.completedAt).toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading || completionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit completion...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (completionError || !completion) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Completion Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The audit completion could not be found or you don&apos;t have access to it.
              </p>
              <Button onClick={() => setLocation('/self-audit-checklists')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Checklists
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Group responses by section
  const responsesBySection = completion.responses.reduce((
    acc: Record<string, { sectionTitle: string; responses: AuditResponse[] }>,
    response: AuditResponse
  ) => {
    if (!acc[response.sectionId]) {
      acc[response.sectionId] = {
        sectionTitle: response.sectionTitle,
        responses: []
      };
    }
    acc[response.sectionId].responses.push(response);
    return acc;
  }, {} as Record<string, { sectionTitle: string; responses: AuditResponse[] }>);

  const compliantCount = completion.responses.filter(
    (r: AuditResponse) => r.isCompliant
  ).length;
  const nonCompliantCount = completion.responses.filter(
    (r: AuditResponse) => !r.isCompliant
  ).length;
  const actionItems = completion.responses.filter(
    (r: AuditResponse) => r.actionRequired && r.actionRequired.trim() !== ''
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/self-audit-checklists')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Checklists
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Audit Completion</h1>
                <p className="text-sm text-muted-foreground">{completion.templateName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Audit Summary
            </CardTitle>
            <CardDescription>
              Completed on {new Date(completion.completedAt).toLocaleDateString()} at{' '}
              {new Date(completion.completedAt).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getComplianceColor(completion.complianceRate)}`}>
                  {completion.complianceRate}%
                </div>
                <div className="text-sm text-muted-foreground">Overall Compliance</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{compliantCount}</div>
                <div className="text-sm text-muted-foreground">Compliant Items</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{nonCompliantCount}</div>
                <div className="text-sm text-muted-foreground">Non-Compliant Items</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{actionItems.length}</div>
                <div className="text-sm text-muted-foreground">Action Items</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Notes */}
        {completion.notes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Overall Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{completion.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Items Summary */}
        {actionItems.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <AlertTriangle className="h-5 w-5" />
                Action Items Required
              </CardTitle>
              <CardDescription>
                Items that require corrective action or follow-up
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {actionItems.map((item: AuditResponse, index: number) => (
                  <div key={item._id} className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="text-xs mt-0.5">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">
                          {item.sectionTitle}: {item.itemText}
                        </h4>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                          {item.actionRequired}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong>Notes:</strong> {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Results by Section */}
        <div className="space-y-6">
          {Object.entries(responsesBySection).map(
            (
              [sectionId, { sectionTitle, responses }]: [
                string,
                { sectionTitle: string; responses: AuditResponse[] }
              ],
              index: number
            ) => (
            <Card key={sectionId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    {sectionTitle}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {responses.filter((r: AuditResponse) => r.isCompliant).length}/
                      {responses.length} Compliant
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responses.map((response: AuditResponse, itemIndex: number) => (
                    <div 
                      key={response._id}
                      className={`p-4 rounded-lg border-2 ${
                        response.isCompliant
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                          : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="text-xs mt-0.5">
                          {index + 1}.{itemIndex + 1}
                        </Badge>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <p className="font-medium text-foreground">
                              {response.itemText}
                            </p>
                            <div className="flex items-center gap-2">
                              {response.isCompliant ? (
                                <Badge className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Compliant
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Non-Compliant
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {(response.notes || response.actionRequired) && (
                            <div className="space-y-2">
                              {response.notes && (
                                <div className="bg-white dark:bg-gray-900 rounded p-3 text-sm">
                                  <strong className="text-muted-foreground">Notes:</strong>
                                  <p className="mt-1">{response.notes}</p>
                                </div>
                              )}
                              
                              {response.actionRequired && (
                                <div className="bg-orange-100 dark:bg-orange-950 rounded p-3 text-sm">
                                  <strong className="text-orange-800 dark:text-orange-200">Action Required:</strong>
                                  <p className="mt-1 text-orange-900 dark:text-orange-100">{response.actionRequired}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
}