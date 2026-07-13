import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTemplates, createTemplate, deleteTemplate } from '@/api/templates';
import { useNavigate } from 'react-router-dom';

export function TemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');

  const templates = useQuery({ queryKey: ['templates'], queryFn: fetchTemplates });

  const create = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      setName('');
      setBody('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const remove = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold">Templates</div>
          <div className="mt-0.5 text-sm text-muted-foreground">Pre-built and custom message templates.</div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-[15px] w-[15px]" /> New template
        </Button>
      </div>

      {showForm && (
        <div className="mb-5 rounded-xl border border-border bg-card p-4.5">
          <div className="mb-3 space-y-1.5">
            <div className="text-[13px] font-semibold">Template name</div>
            <Input placeholder="e.g. Youth camp reminder" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="mb-3.5 space-y-1.5">
            <div className="text-[13px] font-semibold">Message body</div>
            <Textarea placeholder="Use {name} to personalize" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[90px]" />
          </div>
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button disabled={create.isPending} onClick={() => name && create.mutate({ name, body })}>
              Save template
            </Button>
          </div>
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
                <Button size="icon" variant="outline" className="text-destructive" onClick={() => remove.mutate(t.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
