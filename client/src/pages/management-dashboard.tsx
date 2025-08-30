import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  MapPin,
  Thermometer,
  Calendar,
  Users,
  Search,
  Download
} from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { useAuth } from "@/hooks/useAuth";

interface LocationData {
  _id: string;
  locationName: string;
  pharmacyUser: {
    _id: string;
    businessName: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  complianceData: {
    overallCompliance: number;
    fridgeCount: number;
    activeAlertsCount: number;
    temperatureLogsToday: number;
    lastCheckTime: string;
  };
  recentAlerts: Array<{
    fridgeName: string;
    temperature: number;
    timestamp: string;
    severity: "high" | "medium" | "low";
  }>;
}

interface ManagementOverview {
  totalLocations: number;
  totalFridges: number;
  averageCompliance: number;
  activeAlerts: number;
  locationsData: LocationData[];
}

export default function ManagementDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("compliance");

  // Query for management overview data
  const { data: overview, isLoading } = useQuery<ManagementOverview>({
    queryKey: ["/api/management/overview"],
    enabled: user?.role === "management_company",
  });

  // Filter and sort locations
  const filteredLocations = overview?.locationsData?.filter((location) => {
    const matchesSearch = 
      location.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.pharmacyUser.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompliance = 
      complianceFilter === "all" ||
      (complianceFilter === "high" && location.complianceData.overallCompliance >= 90) ||
      (complianceFilter === "medium" && location.complianceData.overallCompliance >= 70 && location.complianceData.overallCompliance < 90) ||
      (complianceFilter === "low" && location.complianceData.overallCompliance < 70);

    return matchesSearch && matchesCompliance;
  })?.sort((a, b) => {
    switch (sortBy) {
      case "compliance":
        return b.complianceData.overallCompliance - a.complianceData.overallCompliance;
      case "alerts":
        return b.complianceData.activeAlertsCount - a.complianceData.activeAlertsCount;
      case "location":
        return (a.locationName || a.pharmacyUser.businessName).localeCompare(b.locationName || b.pharmacyUser.businessName);
      default:
        return 0;
    }
  }) || [];

  const getComplianceBadgeVariant = (compliance: number) => {
    if (compliance >= 90) return "default";
    if (compliance >= 70) return "secondary";
    return "destructive";
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 90) return "text-green-600";
    if (compliance >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (user?.role !== "management_company") {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">
                  This dashboard is only available to management company users.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Management Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of temperature compliance across all managed pharmacy locations
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalLocations || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fridges</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalFridges || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Compliance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getComplianceColor(overview?.averageCompliance || 0)}`}>
                {Math.round(overview?.averageCompliance || 0)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overview?.activeAlerts === 0 ? "text-green-600" : "text-red-600"}`}>
                {overview?.activeAlerts || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by location name or business..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by compliance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="high">High (90%+)</SelectItem>
                  <SelectItem value="medium">Medium (70-89%)</SelectItem>
                  <SelectItem value="low">Low (&lt;70%)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliance">Compliance Rate</SelectItem>
                  <SelectItem value="alerts">Alert Count</SelectItem>
                  <SelectItem value="location">Location Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pharmacy Locations</CardTitle>
            <CardDescription>
              Detailed view of temperature compliance for each managed location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Compliance Rate</TableHead>
                  <TableHead>Fridges</TableHead>
                  <TableHead>Active Alerts</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((location) => (
                  <TableRow key={location._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {location.locationName || location.pharmacyUser.businessName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {location.pharmacyUser.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={location.complianceData.overallCompliance} 
                          className="w-20 h-2"
                        />
                        <Badge variant={getComplianceBadgeVariant(location.complianceData.overallCompliance)}>
                          {Math.round(location.complianceData.overallCompliance)}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        {location.complianceData.fridgeCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {location.complianceData.activeAlertsCount === 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        {location.complianceData.activeAlertsCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {location.complianceData.lastCheckTime ? 
                          new Date(location.complianceData.lastCheckTime).toLocaleTimeString() : 
                          "No checks today"
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredLocations.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No locations found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || complianceFilter !== "all" 
                    ? "Try adjusting your filters or search terms."
                    : "No pharmacy locations are currently managed by this account."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}