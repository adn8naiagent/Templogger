import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { 
  ArrowLeft, 
  Thermometer, 
  MapPin, 
  Clock, 
  Settings,
  Plus,
  Eye,
  Power,
  PowerOff
} from 'lucide-react';
import type { Fridge } from '@shared/schema';

interface FridgeWithLogs extends Fridge {
  lastReading: string | null;
  lastTemperature: number | null;
  recentAlert: boolean;
  logsCount: number;
}

export default function ViewFridges() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: fridges = [], isLoading } = useQuery<FridgeWithLogs[]>({
    queryKey: ['/api/fridges/all'],
    enabled: !!user,
  });

  const getStatusBadge = (fridge: FridgeWithLogs) => {
    if (!fridge.isActive) {
      return <Badge variant="secondary" className="gap-1"><PowerOff className="h-3 w-3" />Inactive</Badge>;
    }
    if (fridge.recentAlert) {
      return <Badge variant="destructive" className="gap-1"><Thermometer className="h-3 w-3" />Alert</Badge>;
    }
    return <Badge variant="default" className="gap-1 bg-green-600"><Power className="h-3 w-3" />Active</Badge>;
  };

  const getTemperatureDisplay = (fridge: FridgeWithLogs) => {
    if (!fridge.lastTemperature) return 'No readings';
    
    const temp = fridge.lastTemperature;
    const isOutOfRange = temp < parseFloat(fridge.minTemp) || temp > parseFloat(fridge.maxTemp);
    
    return (
      <span className={isOutOfRange ? 'text-red-600 font-medium' : 'text-green-600'}>
        {temp}°C
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')} data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <Thermometer className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-foreground">All Fridges</h1>
              </div>
            </div>
          </div>
        </header>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')} data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <Thermometer className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-foreground">All Fridges</h1>
              </div>
            </div>
            
            <Button asChild data-testid="button-add-fridge">
              <Link to="/add-fridge">
                <Plus className="h-4 w-4 mr-2" />
                Add Fridge
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8" data-testid="view-fridges-container">
        {fridges.length === 0 ? (
          <div className="text-center py-12">
            <Thermometer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No fridges found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by adding your first fridge for temperature monitoring.
            </p>
            <Button asChild>
              <Link to="/add-fridge">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Fridge
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Monitoring {fridges.filter(f => f.isActive).length} active fridges
                {fridges.filter(f => !f.isActive).length > 0 && 
                  ` (${fridges.filter(f => !f.isActive).length} inactive)`
                }
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click on any fridge to view detailed logs and temperature history
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fridges.map((fridge) => (
                <Card 
                  key={fridge.id} 
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    !fridge.isActive ? 'opacity-75' : ''
                  }`}
                  style={{ 
                    borderColor: fridge.color || '#3b82f6', 
                    borderWidth: '2px',
                    opacity: !fridge.isActive ? 0.75 : 1
                  }}
                  data-testid={`fridge-card-${fridge.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: fridge.color || '#3b82f6' }}
                          ></div>
                          <span className={!fridge.isActive ? 'text-gray-500' : ''}>{fridge.name}</span>
                        </CardTitle>
                        {fridge.location && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {fridge.location}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(fridge)}
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          data-testid={`button-settings-${fridge.id}`}
                        >
                          <Link to={`/fridge/${fridge.id}/edit`}>
                            <Settings className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Temperature Range:</span>
                        <span className="text-sm font-medium">
                          {fridge.minTemp}°C to {fridge.maxTemp}°C
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Reading:</span>
                        <span className="text-sm">{getTemperatureDisplay(fridge)}</span>
                      </div>
                      
                      {fridge.lastReading && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Last Check:</span>
                          <span className="text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(fridge.lastReading).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Logs:</span>
                        <span className="text-sm font-medium">{fridge.logsCount}</span>
                      </div>
                      
                      {fridge.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {fridge.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        asChild
                        data-testid={`button-view-${fridge.id}`}
                      >
                        <Link to={`/fridge/${fridge.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}