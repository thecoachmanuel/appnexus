"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, RefreshCw, Mail, Eye } from "lucide-react";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  variables: unknown;
  is_active: boolean;
}

interface EmailTemplateEditorProps {
  templates: EmailTemplate[];
  onUpdate: (id: string, updates: Partial<EmailTemplate>) => Promise<boolean>;
  onRefresh: () => void;
  loading?: boolean;
}

export const EmailTemplateEditor = ({
  templates,
  onUpdate,
  onRefresh,
  loading,
}: EmailTemplateEditorProps) => {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});

  const handleSave = async () => {
    if (!editingTemplate) return;
    const success = await onUpdate(editingTemplate.id, formData);
    if (success) {
      toast.success("Template updated successfully");
      setEditingTemplate(null);
    } else {
      toast.error("Failed to update template");
    }
    setFormData({});
  };

  const openEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Email Templates</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Customize your email communications</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 rounded" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          templates.map((template) => (
            <Card key={template.id} className={!template.is_active ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg capitalize">{template.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(template)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-foreground">{template.subject}</p>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(template.variables) && template.variables.map((v: string) => (
                    <Badge key={v} variant="secondary" className="text-xs">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">
                    {template.is_active ? "Active" : "Inactive"}
                  </span>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Live" : "Draft"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template: {editingTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={formData.subject || ""}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>HTML Content</Label>
              <Textarea
                value={formData.html_content || ""}
                onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Plain Text Content (Optional)</Label>
              <Textarea
                value={formData.text_content || ""}
                onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Subject:</p>
              <p className="font-medium">{previewTemplate?.subject}</p>
            </div>
            <div className="border rounded-lg p-4">
              <div
                dangerouslySetInnerHTML={{ __html: previewTemplate?.html_content || "" }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
