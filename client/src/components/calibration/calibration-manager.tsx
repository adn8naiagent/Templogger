import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  FileText,
  Upload,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CalibrationRecord } from "@shared/schema";

// Form validation schema
const calibrationSchema = z.object({
  ___fridgeId: z.string().min(1, "Fridge is required"),
  calibrationDate: z.string().min(1, "Calibration date is required"),
  performedBy: z.string().min(1, "Performed by is required"),
  calibrationStandard: z.string().optional(),
  beforeCalibrationReading: z.string().optional(),
  afterCalibrationReading: z.string().optional(),
  accuracy: z.string().optional(),
  notes: z.string().optional(),
});

type CalibrationForm = z.infer<typeof calibrationSchema>;

interface CalibrationManagerProps {
  ___fridgeId: string;
  fridgeName: string;
}

export default function CalibrationManager({ ___fridgeId, fridgeName }: CalibrationManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CalibrationRecord | null>(null);

  const form = useForm<CalibrationForm>({
    resolver: zodResolver(calibrationSchema),
    defaultValues: {
      ___fridgeId,
      calibrationDate: "",
      performedBy: "",
      calibrationStandard: "",
      beforeCalibrationReading: "",
      afterCalibrationReading: "",
      accuracy: "",
      notes: "",
    },
  });

  // Fetch calibration records
  const { data: records = [], isLoading } = useQuery({
    queryKey: [`/api/fridges/${___fridgeId}/calibrations`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/fridges/${___fridgeId}/calibrations`);
      if (!response.ok) throw new Error('Failed to fetch calibration records');
      return response.json();
    },
  });

  // Create calibration record mutation
  const createMutation = useMutation({
    mutationFn: async (_data: CalibrationForm) => {
      const response = await apiRequest('POST', '/api/calibration-records', _data);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create calibration record: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/fridges/${___fridgeId}/calibrations`] });
      toast({
        title: "Success",
        description: "Calibration record created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create calibration record",
        variant: "destructive",
      });
    },
  });

  // Update calibration record mutation
  const updateMutation = useMutation({
    mutationFn: async ({ _id, _data }: { _id: string; _data: CalibrationForm }) => {
      const response = await apiRequest('PUT', `/api/calibration-records/${_id}`, _data);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update calibration record: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/fridges/${___fridgeId}/calibrations`] });
      toast({
        title: "Success",
        description: "Calibration record updated successfully",
      });
      setEditingRecord(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update calibration record",
        variant: "destructive",
      });
    },
  });

  // Delete calibration record mutation
  const deleteMutation = useMutation({
    mutationFn: async (_id: string) => {
      const response = await apiRequest('DELETE', `/api/calibration-records/${_id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete calibration record: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/fridges/${___fridgeId}/calibrations`] });
      toast({
        title: "Success",
        description: "Calibration record deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete calibration record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (_data: CalibrationForm) => {
    if (editingRecord) {
      updateMutation.mutate({ _id: editingRecord._id, _data });
    } else {
      createMutation.mutate(_data);
    }
  };

  const handleEdit = (record: CalibrationRecord) => {
    setEditingRecord(record);
    form.reset({
      ___fridgeId,
      calibrationDate: new Date(record.calibrationDate).toISOString().split('T')[0],
      performedBy: record.performedBy,
      calibrationStandard: record.calibrationStandard || "",
      beforeCalibrationReading: record.beforeCalibrationReading?.toString() || "",
      afterCalibrationReading: record.afterCalibrationReading?.toString() || "",
      accuracy: record.accuracy?.toString() || "",
      notes: record.notes || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (_id: string) => {
    if (confirm("Are you sure you want to delete this calibration record?")) {
      deleteMutation.mutate(_id);
    }
  };

  const getCalibrationStatus = (record: CalibrationRecord) => {
    const nextDue = new Date(record.nextCalibrationDue);
    const now = new Date();
    const daysDiff = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return { status: 'overdue', color: 'destructive', text: `${Math.abs(daysDiff)} days overdue` };
    } else if (daysDiff <= 30) {
      return { status: 'due-soon', color: 'secondary', text: `Due in ${daysDiff} days` };
    } else {
      return { status: 'current', color: 'default', text: `Due ${nextDue.toLocaleDateString()}` };
    }
  };

  const latestRecord = records[0]; // Records are ordered by date desc

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Thermometer Calibration
            </CardTitle>
            <CardDescription>
              Calibration records for {fridgeName}
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRecord(null);
                form.reset({
                  ___fridgeId,
                  calibrationDate: "",
                  performedBy: "",
                  calibrationStandard: "",
                  beforeCalibrationReading: "",
                  afterCalibrationReading: "",
                  accuracy: "",
                  notes: "",
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Calibration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRecord ? "Edit Calibration Record" : "New Calibration Record"}
                </DialogTitle>
                <DialogDescription>
                  Record thermometer calibration details for compliance tracking
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="calibrationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calibration Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="performedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Performed By *</FormLabel>
                          <FormControl>
                            <Input placeholder="Name of person/company" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="calibrationStandard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calibration Standard</FormLabel>
                          <FormControl>
                            <Input placeholder="Reference standard used" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accuracy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accuracy (±°C)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="e.g. 0.5" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="beforeCalibrationReading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Before Calibration (°C)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              placeholder="Temperature reading before" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="afterCalibrationReading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>After Calibration (°C)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              placeholder="Temperature reading after" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes or observations"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Certificate Upload Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Certificate Upload (Coming Soon)
                    </h4>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Upload className="h-5 w-5" />
                        <span className="text-sm">Document upload feature will be available soon</span>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Record"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* Status Summary */}
        {latestRecord && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Current Status</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Last Calibrated:</span>{" "}
                  <span className="font-medium">
                    {new Date(latestRecord.calibrationDate).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant={getCalibrationStatus(latestRecord).color as any}>
                  {getCalibrationStatus(latestRecord).status === 'overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {getCalibrationStatus(latestRecord).status === 'current' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {getCalibrationStatus(latestRecord).text}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Records Table */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading calibration records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No calibration records</h3>
            <p className="text-muted-foreground mb-4">
              Add the first calibration record for this thermometer
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record: CalibrationRecord) => {
                const status = getCalibrationStatus(record);
                return (
                  <TableRow key={record._id}>
                    <TableCell>
                      {new Date(record.calibrationDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{record.performedBy}</TableCell>
                    <TableCell>
                      {record.accuracy ? `±${record.accuracy}°C` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(record.nextCalibrationDue).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.color as any}>
                        {status.status === 'overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {status.status === 'current' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {status.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(record)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}