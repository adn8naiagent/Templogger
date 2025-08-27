import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from "@/components/ui/dialog";
import {
  CheckSquare,
  Save,
  X,
  AlertTriangle,
  FileText,
  Clock,
  User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface ChecklistItem {
  _id: string;
  label: string;
  required: boolean;
  orderIndex: number;
  note?: string;
}

interface ChecklistInstance {
  _id: string;
  checklistId: string;
  checklistName: string;
  targetDate: string;
  status: 'REQUIRED' | 'COMPLETED' | 'MISSED';
  cadence: 'DAILY' | 'DOW' | 'WEEKLY';
  items: ChecklistItem[];
  completedAt?: Date;
  completedBy?: string;
}

interface CompleteChecklistModalProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  instance?: ChecklistInstance | null;
  onComplete?: () => void;
}

interface ItemCompletionState {
  itemId: string;
  checked: boolean;
  note: string;
}

export default function CompleteChecklistModal({
  isOpen,
  onOpenChange,
  instance,
  onComplete }: CompleteChecklistModalProps) {
  const { toast } = useToast();
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();

  const [itemStates, setItemStates] = useState<ItemCompletionState[]>([]);
  const [confirmationNote, setConfirmationNote] = useState('');

  // Initialize item states when instance changes
  useEffect(() => {
    if (instance?.items) {
      setItemStates(instance.items.map(item => ({
        itemId: item._id,
        checked: false,
        note: '' })));
      setConfirmationNote('');
    }
  }, [instance]);

  // Complete instance mutation
  const completeInstanceMutation = useMutation({
    mutationFn: async (_data: {
      items: Array<{ itemId: string; checked: boolean; note?: string }>;
      confirmationNote?: string;
    }) => {
      if (!instance) throw new Error('No instance to complete');

      const response = await apiRequest(
        'POST',
        `/api/v2/instances/${instance.id}/complete`,
        _data
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
        }
        const error = await response.json();
        throw new Error(error.error || `Failed to complete checklist: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-summaries'] });
      onOpenChange(false);
      onComplete?.();
      toast({
        title: "Success",
        description: "Checklist completed successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete checklist",
        variant: "destructive" });
    } });

  // Update item state
  const updateItemState = (itemId: string, _updates: Partial<ItemCompletionState>) => {
    setItemStates(prev => 
      prev.map(state => 
        state.itemId === itemId ? { ..._state, ...updates } : _state
      )
    );
  };

  // Check if all required items are completed
  const areRequiredItemsCompleted = () => {
    if (!instance?.items) return false;
    
    const requiredItems = instance.items.filter(item => item.required);
    const completedRequiredItems = itemStates.filter(state => {
      const item = instance.items.find(i => i.id === state.itemId);
      return item?.required && state.checked;
    });
    
    return completedRequiredItems.length === requiredItems.length;
  };

  // Handle completion
  const handleComplete = () => {
    if (!areRequiredItemsCompleted()) {
      toast({
        title: "Validation Error",
        description: "All required items must be completed",
        variant: "destructive" });
      return;
    }

    const _completionData = {
      items: itemStates.map(state => ({
        itemId: state.itemId,
        checked: state.checked,
        note: state.note || undefined })),
      confirmationNote: confirmationNote || undefined };

    completeInstanceMutation.mutate(_completionData);
  };

  // Format target date display
  const formatTargetDate = (targetDate: string, cadence: 'DAILY' | 'DOW' | 'WEEKLY') => {
    if (cadence === 'WEEKLY' && targetDate.includes('-W')) {
      // Parse week identifier like "2024-W08"
      const [year, week] = targetDate.split('-W');
      return `Week ${week}, ${year}`;
    } else {
      // Regular date
      return new Date(targetDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric' });
    }
  };

  if (!instance) return null;

  const requiredItems = instance.items.filter(item => item.required);
  const optionalItems = instance.items.filter(item => !item.required);
  const completedRequiredCount = itemStates.filter(state => {
    const item = instance.items.find(i => i.id === state.itemId);
    return item?.required && state.checked;
  }).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Complete Checklist
          </DialogTitle>
          <DialogDescription>
            Complete "{instance.checklistName}" for {formatTargetDate(instance.targetDate, instance.cadence)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Instance Info */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900 font-medium">
                    {formatTargetDate(instance.targetDate, instance.cadence)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                    {instance.cadence}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Progress</span>
                <Badge variant={areRequiredItemsCompleted() ? "default" : "secondary"}>
                  {completedRequiredCount} / {requiredItems.length} required completed
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    areRequiredItemsCompleted() ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${requiredItems.length > 0 ? (completedRequiredCount / requiredItems.length) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Required Items */}
          {requiredItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-medium text-lg">Required Items ({requiredItems.length})</h3>
              </div>
              
              <div className="space-y-3">
                {requiredItems.map((item) => {
                  const itemState = itemStates.find(s => s.itemId === item._id);
                  if (!itemState) return null;

                  return (
                    <Card key={item.id} className={`border-l-4 ${
                      itemState.checked 
                        ? 'border-l-green-500 bg-green-50/50' 
                        : 'border-l-red-500 bg-red-50/50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={itemState.checked}
                              onCheckedChange={(checked) => 
                                updateItemState(item._id, { checked: !!checked })
                              }
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium">{item.label}</div>
                              <Badge variant="destructive" className="mt-1 text-xs">
                                Required
                              </Badge>
                              {item.note && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.note}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Item-specific notes */}
                          <div>
                            <Label htmlFor={`note-${item.id}`} className="text-sm">
                              Notes (optional)
                            </Label>
                            <Textarea
                              id={`note-${item.id}`}
                              placeholder="Add notes about this item..."
                              value={itemState.note}
                              onChange={(e) => 
                                updateItemState(item._id, { note: e.target.value })
                              }
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Items */}
          {optionalItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-medium text-lg">Optional Items ({optionalItems.length})</h3>
              </div>
              
              <div className="space-y-3">
                {optionalItems.map((item) => {
                  const itemState = itemStates.find(s => s.itemId === item._id);
                  if (!itemState) return null;

                  return (
                    <Card key={item.id} className={`border-l-4 ${
                      itemState.checked 
                        ? 'border-l-blue-500 bg-blue-50/50' 
                        : 'border-l-gray-300'
                    }`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={itemState.checked}
                              onCheckedChange={(checked) => 
                                updateItemState(item._id, { checked: !!checked })
                              }
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium">{item.label}</div>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                Optional
                              </Badge>
                              {item.note && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.note}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Item-specific notes */}
                          <div>
                            <Label htmlFor={`note-${item.id}`} className="text-sm">
                              Notes (optional)
                            </Label>
                            <Textarea
                              id={`note-${item.id}`}
                              placeholder="Add notes about this item..."
                              value={itemState.note}
                              onChange={(e) => 
                                updateItemState(item._id, { note: e.target.value })
                              }
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overall Confirmation Note */}
          <div className="space-y-3">
            <Label htmlFor="confirmationNote" className="text-base font-medium">
              Completion Notes
            </Label>
            <Textarea
              id="confirmationNote"
              placeholder="Add any overall notes or observations about completing this checklist..."
              value={confirmationNote}
              onChange={(e) => setConfirmationNote(e.target._value)}
              rows={3}
            />
          </div>

          {/* Validation Messages */}
          {!areRequiredItemsCompleted() && requiredItems.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <div className="font-medium mb-1">Complete Required Items</div>
                    <div>
                      You must complete all {requiredItems.length} required items before submitting this checklist.
                      Currently {completedRequiredCount} of {requiredItems.length} required items are completed.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={completeInstanceMutation.isPending}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={completeInstanceMutation.isPending || !areRequiredItemsCompleted()}
          >
            {completeInstanceMutation.isPending ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2 border-white"></div>
                Completing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Complete Checklist
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}