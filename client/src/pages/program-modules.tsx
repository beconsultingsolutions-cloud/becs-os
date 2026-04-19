import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, toSnake, toCamelArray } from "@/lib/supabase";
import { useEntity } from "@/lib/entity-context";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Plus, Pencil, Trash2 } from "lucide-react";

function label(s: string) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

interface ProgramModule {
  id: number;
  moduleId: string;
  title: string;
  description: string | null;
  entityId: string;
  sortOrder: number;
  content: any;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ModuleProgressCount {
  moduleId: string;
  count: number;
}

const EMPTY_FORM = {
  moduleId: "",
  title: "",
  description: "",
  sortOrder: 0,
  isPublished: false,
  content: "",
};

type ModuleForm = typeof EMPTY_FORM;

export default function ProgramModulesPage() {
  const { currentEntity } = useEntity();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ProgramModule | null>(null);
  const [form, setForm] = useState<ModuleForm>(EMPTY_FORM);
  const [contentError, setContentError] = useState<string | null>(null);

  const updateForm = (k: keyof ModuleForm, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditingModule(null);
    setForm(EMPTY_FORM);
    setContentError(null);
    setDialogOpen(true);
  };

  const openEdit = (m: ProgramModule) => {
    setEditingModule(m);
    setForm({
      moduleId: m.moduleId,
      title: m.title,
      description: m.description ?? "",
      sortOrder: m.sortOrder,
      isPublished: m.isPublished,
      content: m.content ? JSON.stringify(m.content, null, 2) : "",
    });
    setContentError(null);
    setDialogOpen(true);
  };

  const { data: modules = [], isLoading } = useQuery<ProgramModule[]>({
    queryKey: ["program-modules", currentEntity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_modules")
        .select("*")
        .eq("entity_id", currentEntity)
        .order("sort_order");
      if (error) throw error;
      return toCamelArray<ProgramModule>(data || []);
    },
  });

  // Load module_progress counts for all modules
  const moduleIds = modules.map((m) => m.moduleId);
  const { data: progressCounts = [] } = useQuery<ModuleProgressCount[]>({
    queryKey: ["module-progress-counts", moduleIds],
    queryFn: async () => {
      if (moduleIds.length === 0) return [];
      const { data, error } = await supabase
        .from("module_progress")
        .select("module_id, client_id")
        .in("module_id", moduleIds);
      if (error) throw error;

      // Count distinct client_ids per module_id
      const countMap: Record<string, Set<number>> = {};
      for (const row of data || []) {
        if (!countMap[row.module_id]) countMap[row.module_id] = new Set();
        countMap[row.module_id].add(row.client_id);
      }
      return Object.entries(countMap).map(([mId, clients]) => ({
        moduleId: mId,
        count: clients.size,
      }));
    },
    enabled: moduleIds.length > 0,
  });

  const progressMap: Record<string, number> = {};
  for (const p of progressCounts) {
    progressMap[p.moduleId] = p.count;
  }

  const validateAndParseContent = (): { parsed: any; ok: boolean } => {
    if (!form.content.trim()) return { parsed: null, ok: true };
    try {
      const parsed = JSON.parse(form.content);
      setContentError(null);
      return { parsed, ok: true };
    } catch {
      setContentError("Invalid JSON — please fix the content field.");
      return { parsed: null, ok: false };
    }
  };

  const saveModule = useMutation({
    mutationFn: async () => {
      const { parsed, ok } = validateAndParseContent();
      if (!ok) throw new Error("Invalid JSON content");

      const payload: Record<string, any> = {
        module_id: form.moduleId,
        title: form.title,
        description: form.description || null,
        sort_order: Number(form.sortOrder),
        is_published: form.isPublished,
        content: parsed,
        entity_id: currentEntity,
        updated_at: new Date().toISOString(),
      };

      if (editingModule) {
        const { error } = await supabase.from("program_modules").update(payload).eq("id", editingModule.id);
        if (error) throw error;
      } else {
        payload.created_at = new Date().toISOString();
        const { error } = await supabase.from("program_modules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["program-modules"] });
      toast({ title: editingModule ? "Module updated" : "Module created" });
      setDialogOpen(false);
    },
    onError: (err: any) => {
      if (err?.message !== "Invalid JSON content") {
        toast({ title: "Error saving module", variant: "destructive" });
      }
    },
  });

  const deleteModule = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("program_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["program-modules"] });
      toast({ title: "Module deleted" });
    },
    onError: () => toast({ title: "Failed to delete module", variant: "destructive" }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Program Modules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{modules.length} module{modules.length !== 1 ? "s" : ""} for this entity</p>
        </div>
        <Button size="sm" onClick={openCreate} data-testid="button-add-module">
          <Plus size={14} className="mr-1" /> Add Module
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-lg" />)}</div>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-sm">No modules yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create program modules to build your client curriculum.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {modules.map((m) => {
            const clientCount = progressMap[m.moduleId] ?? 0;
            return (
              <Card key={m.id} data-testid={`module-card-${m.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm">{m.title}</p>
                        <Badge variant="outline" className="text-xs font-mono">{m.moduleId}</Badge>
                        {m.isPublished ? (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>
                        )}
                      </div>
                      {m.description && (
                        <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Order: {m.sortOrder}</span>
                        <span>·</span>
                        <span data-testid={`module-client-count-${m.id}`}>
                          {clientCount} client{clientCount !== 1 ? "s" : ""} with progress
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(m)}
                        data-testid={`button-edit-module-${m.id}`}
                        title="Edit module"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                        onClick={() => deleteModule.mutate(m.id)}
                        data-testid={`button-delete-module-${m.id}`}
                        title="Delete module"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Module" : "New Module"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Module ID *</Label>
                <Input
                  value={form.moduleId}
                  onChange={(e) => updateForm("moduleId", e.target.value)}
                  placeholder="plan, evolve, succeed…"
                  data-testid="input-module-id"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => updateForm("sortOrder", Number(e.target.value))}
                  data-testid="input-module-sort-order"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="Foundation Builder"
                data-testid="input-module-title"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Brief description of this module…"
                data-testid="input-module-description"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Content (JSON)</Label>
              <Textarea
                rows={5}
                value={form.content}
                onChange={(e) => updateForm("content", e.target.value)}
                placeholder='{"steps": []}'
                className={`font-mono text-xs ${contentError ? "border-red-400" : ""}`}
                data-testid="input-module-content"
              />
              {contentError && <p className="text-xs text-red-600">{contentError}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={(e) => updateForm("isPublished", e.target.checked)}
                className="h-4 w-4 rounded border border-input"
                data-testid="checkbox-module-published"
              />
              <Label htmlFor="isPublished" className="text-xs cursor-pointer">Published (visible to clients in portal)</Label>
            </div>
            <Button
              onClick={() => saveModule.mutate()}
              disabled={saveModule.isPending || !form.moduleId || !form.title}
              className="w-full"
              data-testid="button-save-module"
            >
              {saveModule.isPending ? "Saving…" : editingModule ? "Update Module" : "Create Module"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
