import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  CheckSquare,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/layout/navigation";

// Schema for the template creation form
const auditItemSchema = z.object({
  text: z.string().min(1, "Item text is required"),
  isRequired: z.boolean().default(true),
  note: z.string().optional(),
});

const auditSectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  description: z.string().optional(),
  items: z.array(auditItemSchema).min(1, "Each section must have at least one item"),
});

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  sections: z.array(auditSectionSchema).min(1, "Template must have at least one section"),
});

type CreateTemplateForm = z.infer<typeof createTemplateSchema>;

export default function CreateAuditTemplate() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<CreateTemplateForm>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      sections: [
        {
          title: "",
          description: "",
          items: [
            {
              text: "",
              isRequired: true,
              note: "",
            }
          ],
        }
      ],
    },
  });

  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
    control: form.control,
    name: "sections",
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: CreateTemplateForm) => {
      // Transform data to match API structure
      const templateData = {
        name: data.name,
        description: data.description,
        sections: data.sections.map((section, sectionIndex) => ({
          title: section.title,
          description: section.description,
          orderIndex: sectionIndex,
          items: section.items.map((item, itemIndex) => ({
            text: item.text,
            isRequired: item.isRequired,
            orderIndex: itemIndex,
            note: item.note || undefined,
          })),
        })),
      };

      const response = await apiRequest('POST', '/api/audit-templates', templateData);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create template: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-templates'] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      setLocation("/self-audit-checklists");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTemplateForm) => {
    createTemplateMutation.mutate(data);
  };

  const addSection = () => {
    appendSection({
      title: "",
      description: "",
      items: [{ text: "", isRequired: true, note: "" }],
    });
  };

  const addItemToSection = (sectionIndex: number) => {
    const currentItems = form.getValues(`sections.${sectionIndex}.items`);
    form.setValue(`sections.${sectionIndex}.items`, [
      ...currentItems,
      { text: "", isRequired: true, note: "" }
    ]);
  };

  const removeItemFromSection = (sectionIndex: number, itemIndex: number) => {
    const currentItems = form.getValues(`sections.${sectionIndex}.items`);
    if (currentItems.length > 1) {
      const newItems = currentItems.filter((_, index) => index !== itemIndex);
      form.setValue(`sections.${sectionIndex}.items`, newItems);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/self-audit-checklists">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Create Audit Template</h1>
                  <p className="text-muted-foreground">Create a custom self-audit checklist template</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Template Details */}
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>
                  Basic information about your audit template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter template name..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter template description..." 
                          rows={3} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Sections & Items</h2>
                <Button type="button" onClick={addSection} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>

              {sectionFields.map((section, sectionIndex) => (
                <Card key={section.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Section {sectionIndex + 1}
                      </CardTitle>
                      {sectionFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(sectionIndex)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Section Title */}
                    <FormField
                      control={form.control}
                      name={`sections.${sectionIndex}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter section title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Section Description */}
                    <FormField
                      control={form.control}
                      name={`sections.${sectionIndex}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter section description..." 
                              rows={2} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Items */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Audit Points</h3>
                        <Button
                          type="button"
                          onClick={() => addItemToSection(sectionIndex)}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      {form.watch(`sections.${sectionIndex}.items`).map((_, itemIndex) => (
                        <Card key={itemIndex} className="p-4 bg-muted/30">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Item {itemIndex + 1}</h4>
                              {form.watch(`sections.${sectionIndex}.items`).length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItemFromSection(sectionIndex, itemIndex)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>

                            <FormField
                              control={form.control}
                              name={`sections.${sectionIndex}.items.${itemIndex}.text`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Item Text</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Enter audit point..." 
                                      rows={2} 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex items-center space-x-4">
                              <FormField
                                control={form.control}
                                name={`sections.${sectionIndex}.items.${itemIndex}.isRequired`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>Required</FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`sections.${sectionIndex}.items.${itemIndex}.note`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Note (Optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Add any notes or clarifications..." 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" asChild>
                <Link to="/self-audit-checklists">Cancel</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={createTemplateMutation.isPending}
                className="min-w-[120px]"
              >
                {createTemplateMutation.isPending ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Template
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}