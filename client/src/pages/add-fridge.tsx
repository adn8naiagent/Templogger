import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { HexColorPicker } from "react-colorful";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  ArrowLeft,
  Save,
  Thermometer,
  MapPin,
  FileText,
  Palette,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFridgeSchema, type CreateFridgeData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export default function AddFridge() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch labels
  const { data: labels = [] } = useQuery({
    queryKey: ["/api/labels"],
  });

  // Create fridge form
  const form = useForm<CreateFridgeData>({
    resolver: zodResolver(createFridgeSchema),
    defaultValues: {
      name: "",
      location: "",
      notes: "",
      color: "#3b82f6",
      labels: [],
      minTemp: "2.0",
      maxTemp: "8.0",
    },
  });

  // Create fridge mutation
  const createFridgeMutation = useMutation({
    mutationFn: async (data: CreateFridgeData) => {
      const response = await apiRequest("POST", "/api/fridges", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fridge created!",
        description: "New fridge has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fridges/recent-temps"] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancel = () => {
    setLocation("/");
  };

  const onSubmit = (data: CreateFridgeData) => {
    createFridgeMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleCancel} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Thermometer className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-foreground">Add New Fridge</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4" data-testid="add-fridge-container">
        <Card>
          <CardHeader>
            <CardTitle>Set up a new fridge</CardTitle>
            <CardDescription>
              Configure temperature monitoring for a new fridge with compliance tracking
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fridge Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Main Vaccine Fridge" data-testid="input-fridge-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Pharmacy Main Floor" data-testid="input-fridge-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional information about this fridge..." rows={3} data-testid="input-fridge-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Color Theme
                      </FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              data-testid="button-color-picker"
                            >
                              <div 
                                className="w-4 h-4 rounded mr-2 border" 
                                style={{ backgroundColor: field.value }}
                              />
                              {field.value}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3">
                            <HexColorPicker color={field.value} onChange={field.onChange} />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Labels (Optional)
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                          {labels.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No labels available</p>
                          ) : (
                            labels.map((label: Label) => (
                              <div key={label.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={label.id}
                                  checked={field.value.includes(label.name)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, label.name]);
                                    } else {
                                      field.onChange(field.value.filter((l: string) => l !== label.name));
                                    }
                                  }}
                                  data-testid={`checkbox-label-${label.name}`}
                                />
                                <label htmlFor={label.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                  <div 
                                    className="w-3 h-3 rounded" 
                                    style={{ backgroundColor: label.color }}
                                  />
                                  {label.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minTemp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Temperature (°C) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="2.0" data-testid="input-min-temp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxTemp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Temperature (°C) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="8.0" data-testid="input-max-temp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1"
                    onClick={handleCancel}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={createFridgeMutation.isPending}
                    data-testid="button-save"
                  >
                    {createFridgeMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Fridge
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}