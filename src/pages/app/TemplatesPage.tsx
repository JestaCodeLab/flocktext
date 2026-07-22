import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, LayoutTemplate, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate, type Template } from '@/api/templates';
import { useNavigate } from 'react-router-dom';

const TEMPLATE_VARIABLES = [
  { token: '{firstName}', description: "recipient's first name" },
  { token: '{lastName}', description: "recipient's last name" },
  { token: '{orgName}', description: 'your organization name' },
];

export function TemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');

  const templates = useQuery({ queryKey: ['templates'], queryFn: fetchTemplates });

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setName('');
    setBody('');
  }

  function openCreate() {
    setEditing(null);
    setName('');
    setBody('');
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setEditing(t);
    setName(t.name);
    setBody(t.body);
    setShowForm(true);
  }

  const create = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      closeForm();
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const update = useMutation({
    mutationFn: updateTemplate,
    onSuccess: () => {
      closeForm();
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const remove = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const saving = create.isPending || update.isPending;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold">Templates</div>
          <div className="mt-0.5 text-sm text-muted-foreground">Pre-built and custom message templates.</div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-[15px] w-[15px]" /> New template
        </Button>
      </div>

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-[13px] text-foreground/80">
          <span className="font-semibold">Personalize your messages</span> — these variables are replaced per
          recipient when a template is sent:{' '}
          {TEMPLATE_VARIABLES.map((v, i) => (
            <span key={v.token}>
              <b className="font-semibold text-foreground">{v.token}</b>
              <span className="text-muted-foreground"> ({v.description})</span>
              {i < TEMPLATE_VARIABLES.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => (open ? setShowForm(true) : closeForm())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit template' : 'New template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <div className="text-[13px] font-semibold">Template name</div>
              <Input placeholder="e.g. Youth camp reminder" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="text-[13px] font-semibold">Message body</div>
              <Textarea
                placeholder="Use {firstName}, {lastName} or {orgName} to personalize"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[90px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              disabled={saving || !name.trim()}
              onClick={() => (editing ? update.mutate({ id: editing.id, name, body }) : create.mutate({ name, body }))}
            >
              {saving ? 'Saving…' : 'Save template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!templates.isLoading && templates.data?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LayoutTemplate className="h-5 w-5" />
          </div>
          <div className="text-sm text-muted-foreground">No templates yet. Create one to get started.</div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3.5">
        {templates.isLoading &&
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[164px] rounded-xl" />)}
        {templates.data?.map((t) => (
          <div key={t.id} className="flex flex-col rounded-xl border border-border bg-card p-4.5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="text-[15px] font-bold">{t.name}</div>
              {t.isCustom && <Badge className="bg-accent text-accent-foreground">Custom</Badge>}
            </div>
            <div className="mb-4 min-h-[56px] flex-1 text-[13px] leading-relaxed text-muted-foreground">
              {t.preview || 'Blank template'}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                onClick={() => navigate('/app/compose', { state: { templateId: t.id, body: t.body } })}
              >
                Use template
              </Button>
              {t.isCustom && (
                <>
                  <Button size="icon" variant="outline" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" className="text-destructive" onClick={() => remove.mutate(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
