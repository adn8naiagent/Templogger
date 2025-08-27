import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from "@/components/ui/dialog";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult } from "react-beautiful-dnd";
import {
  Plus,
  Trash2,
  GripVertical,
  CheckSquare,
  Save,
  X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  _id: string;
  label: string;
  required: boolean;
  orderIndex: number;
  note?: string;
}

interface ChecklistWithScheduleAndItems {
  _id: string;
  name: string;
  description?: string;
  items: ChecklistItem[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChecklistEditorProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  checklist?: ChecklistWithScheduleAndItems | null;
  onSave: (_data: { name: string; description?: string; items: Omit<ChecklistItem, 'id'>[] }) => void;
  isSaving: boolean;
}

interface EditingItem {
  _id: string;
  label: string;
  required: boolean;
  orderIndex: number;
  note?: string;
}

export default function ChecklistEditor({
  isOpen,
  onOpenChange,
  checklist,
  onSave,
  isSaving }: ChecklistEditorProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<EditingItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Initialize form when checklist changes
  useEffect(() => {
    if (checklist) {
      setName(checklist.name);
      setDescription(checklist.description || "");
      setItems(checklist.items.map(item => ({ ...item })));
    } else {
      setName("");
      setDescription("");
      setItems([]);
    }
    setEditingItemId(null);
  }, [checklist, isOpen]);

  // Add new item
  const addItem = () => {
    const newItem: EditingItem = {
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: "",
      required: true,
      orderIndex: items.length,
      note: "" };
    setItems([...items, newItem]);
    setEditingItemId(newItem._id);
  };

  // Update item
  const updateItem = (_id: string, _updates: Partial<EditingItem>) => {
    setItems(items.map(item => 
      item._id === _id ? { ...item, ..._updates } : item
    ));
  };

  // Remove item
  const removeItem = (_id: string) => {
    setItems(items.filter(item => item._id !== _id));
    if (editingItemId === _id) {
      setEditingItemId(null);
    }
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [reorderedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, reorderedItem);

    // Update order indices
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      orderIndex: index }));

    setItems(updatedItems);
  };

  // Validate form
  const validateForm = () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Checklist name is required",
        variant: "destructive" });
      return false;
    }

    if (items.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one checklist item is required",
        variant: "destructive" });
      return false;
    }

    const emptyItems = items.filter(item => !item.label.trim());
    if (emptyItems.length > 0) {
      toast({
        title: "Validation Error",
        description: "All items must have a label",
        variant: "destructive" });
      return false;
    }

    return true;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) return;

    const saveData = {
      name: name.trim(),
      description: description.trim() || undefined,
      items: items.map(({ _id, ...item }) => ({
        label: item.label.trim(),
        required: item.required,
        orderIndex: item.orderIndex })) };

    onSave(saveData);
  };

  // Handle cancel
  const handleCancel = () => {
    if (checklist) {
      setName(checklist.name);
      setDescription(checklist.description || "");
      setItems(checklist.items.map(item => ({ ...item })));
    } else {
      setName("");
      setDescription("");
      setItems([]);
    }
    setEditingItemId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {checklist ? "Edit Checklist" : "Create New Checklist"}
          </DialogTitle>
          <DialogDescription>
            {checklist 
              ? "Modify your checklist details and items"
              : "Create a new checklist with items that can be scheduled"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Checklist Name *</Label>
              <Input
                id="name"
                placeholder="Enter checklist name..."
                value={name}
                onChange={(e) => setName(e.target._value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target._value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">
                Checklist Items ({items.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">No items added yet</p>
                  <Button variant="outline" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="items">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {items.map((item, index) => (
                        <Draggable
                          key={item._id}
                          draggableId={item._id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${
                                snapshot.isDragging ? "shadow-lg" : ""
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  {/* Drag Handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-2 text-muted-foreground hover:text-foreground cursor-grab"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  {/* Required Toggle */}
                                  <div className="flex items-center mt-2">
                                    <button
                                      type="button"
                                      onClick={() => updateItem(item._id, { required: !item.required })}
                                      className="text-muted-foreground hover:text-foreground"
                                    >
                                      {item.required ? (
                                        <CheckSquare className="w-4 h-4 text-primary" />
                                      ) : (
                                        <Square className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>

                                  {/* Item Content */}
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        placeholder="Item label..."
                                        value={item.label}
                                        onChange={(e) => updateItem(item._id, { label: e.target.value })}
                                        className="flex-1"
                                      />
                                      <Badge variant={item.required ? "default" : "secondary"}>
                                        {item.required ? "Required" : "Optional"}
                                      </Badge>
                                    </div>

                                    {editingItemId === item._id && (
                                      <Textarea
                                        placeholder="Optional notes for this item..."
                                        value={item.note || ""}
                                        onChange={(e) => updateItem(item._id, { note: e.target.value })}
                                        rows={2}
                                      />
                                    )}

                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                      <span>Order: {item.orderIndex + 1}</span>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => 
                                            setEditingItemId(
                                              editingItemId === item._id ? null : item._id
                                            )
                                          }
                                        >
                                          {editingItemId === item._id ? "Done" : "Add Note"}
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeItem(item._id)}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim() || items.length === 0}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {checklist ? "Update" : "Create"} Checklist
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}