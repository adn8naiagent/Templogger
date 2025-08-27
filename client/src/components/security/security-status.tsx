import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Package,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityVulnerabilities {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface SecurityStatusType {
  vulnerabilities: SecurityVulnerabilities;
  lastScan: string | null;
  packagesScanned: number;
  hasIssues: boolean;
  message?: string;
}

export default function SecurityStatus() {
  const { data: _status, isLoading, refetch, error } = useQuery<SecurityStatusType>({
    queryKey: ['/api/security/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false
  });

  // Don't show in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (error) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            Security monitoring not available
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 animate-pulse" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Loading security status...
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalIssues = status ? Object.values(status.vulnerabilities).reduce((a, b) => a + b, 0) : 0;
  const hasHighSeverity = status ? (status.vulnerabilities.high > 0 || status.vulnerabilities.critical > 0) : false;

  const getStatusIcon = () => {
    if (!status || status.message) return <Shield className="h-4 w-4" />;
    if (hasHighSeverity) return <ShieldAlert className="h-4 w-4 text-red-500" />;
    if (totalIssues > 0) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <ShieldCheck className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (): "default" | "destructive" | "secondary" | "outline" => {
    if (!status || status.message) return "outline";
    if (hasHighSeverity) return "destructive";
    if (totalIssues > 0) return "secondary";
    return "default";
  };

  return (
    <Card className={cn("border-muted", hasHighSeverity && "border-red-200 dark:border-red-800")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            Security Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-6 px-2"
            data-testid="button-refresh-security"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {status?.message ? (
          <div className="text-sm text-muted-foreground">
            {status.message}
          </div>
        ) : (
          <>
            {/* Overall Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Status:</span>
              <Badge variant={getStatusColor()}>
                {hasHighSeverity ? 'Critical Issues' : 
                 totalIssues > 0 ? `${totalIssues} Issues` : 
                 'Secure'}
              </Badge>
            </div>

            {/* Vulnerability Breakdown */}
            {status && totalIssues > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Vulnerabilities:</div>
                <div className="grid grid-cols-2 gap-2">
                  {status.vulnerabilities.critical > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-600">Critical:</span>
                      <Badge variant="destructive" className="h-4 px-1.5 text-xs">
                        {status.vulnerabilities.critical}
                      </Badge>
                    </div>
                  )}
                  {status.vulnerabilities.high > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-orange-600">High:</span>
                      <Badge variant="destructive" className="h-4 px-1.5 text-xs">
                        {status.vulnerabilities.high}
                      </Badge>
                    </div>
                  )}
                  {status.vulnerabilities.medium > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-600">Medium:</span>
                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                        {status.vulnerabilities.medium}
                      </Badge>
                    </div>
                  )}
                  {status.vulnerabilities.low > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-600">Low:</span>
                      <Badge variant="outline" className="h-4 px-1.5 text-xs">
                        {status.vulnerabilities.low}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scan Information */}
            <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>{status?.packagesScanned || 0} packages scanned</span>
              </div>
              {status?.lastScan && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Last scan: {new Date(status.lastScan).toLocaleString()}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}