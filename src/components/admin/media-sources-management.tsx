'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  createMediaSource,
  getMediaSources,
  removeMediaSource,
  type MediaSource,
} from '@/lib/api';
import { Loader2, Plus, Trash2, Tv } from 'lucide-react';

interface NewMediaSource {
  key: string;
  name: string;
  type: 'embedded' | 'fallback';
  streamBaseUrl: string;
  domain: string;
  refererUrl: string;
  priority: number;
}

const DEFAULT_SOURCE: NewMediaSource = {
  key: '',
  name: '',
  type: 'embedded',
  streamBaseUrl: '',
  domain: '',
  refererUrl: '',
  priority: 100,
};

export function MediaSourcesManagement() {
  const { toast } = useToast();
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewMediaSource>(DEFAULT_SOURCE);

  useEffect(() => {
    void loadSources();
  }, []);

  async function loadSources() {
    setIsLoading(true);
    try {
      const rows = await getMediaSources();
      setSources(rows);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddSource() {
    if (!form.key.trim() || !form.name.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Key and name are required.',
        variant: 'destructive',
      });
      return;
    }

    if (form.type === 'embedded' && !form.streamBaseUrl.trim()) {
      toast({
        title: 'Missing URL',
        description: 'Embedded sources require stream base URL.',
        variant: 'destructive',
      });
      return;
    }

    if (form.type === 'fallback' && !form.domain.trim()) {
      toast({
        title: 'Missing domain',
        description: 'Fallback sources require a domain.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await createMediaSource({
        key: form.key,
        name: form.name,
        type: form.type,
        streamBaseUrl: form.streamBaseUrl || undefined,
        domain: form.domain || undefined,
        refererUrl: form.refererUrl || undefined,
        priority: Number(form.priority),
      });

      if (result.success) {
        toast({
          title: 'Media source added',
          description: `${form.name} is now configured.`,
        });
        setForm(DEFAULT_SOURCE);
        await loadSources();
      } else {
        toast({
          title: 'Add failed',
          description: result.message || 'Unable to create media source.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(source: MediaSource) {
    const confirmed = window.confirm(`Remove media source "${source.name}"?`);
    if (!confirmed) return;

    setDeletingId(source.id);
    try {
      const result = await removeMediaSource(source.id);
      if (result.success) {
        toast({
          title: 'Removed',
          description: `${source.name} has been removed.`,
        });
        await loadSources();
      } else {
        toast({
          title: 'Remove failed',
          description: result.message || 'Unable to remove media source.',
          variant: 'destructive',
        });
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            Media Sources
          </CardTitle>
          <CardDescription>
            Add or remove embedded/fallback providers used by streaming.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Key (example: megaplay)"
            value={form.key}
            onChange={(event) => setForm((prev) => ({ ...prev, key: event.target.value }))}
          />
          <Input
            placeholder="Display name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <select
            value={form.type}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, type: event.target.value as 'embedded' | 'fallback' }))
            }
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="embedded">Embedded</option>
            <option value="fallback">Fallback</option>
          </select>
          <Input
            placeholder="Stream base URL (embedded)"
            value={form.streamBaseUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, streamBaseUrl: event.target.value }))}
          />
          <Input
            placeholder="Domain (fallback)"
            value={form.domain}
            onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
          />
          <Input
            placeholder="Referer URL (optional)"
            value={form.refererUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, refererUrl: event.target.value }))}
          />
          <Input
            type="number"
            placeholder="Priority"
            value={String(form.priority)}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, priority: Number(event.target.value) || 100 }))
            }
          />
          <Button onClick={handleAddSource} disabled={isSaving} className="md:col-span-2">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add Media Source
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{source.name}</p>
                      <Badge variant="outline">{source.type}</Badge>
                      <Badge variant="secondary">{source.key}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      URL: {source.streamBaseUrl || '-'} | Domain: {source.domain || '-'} | Priority: {source.priority}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => handleRemove(source)}
                    disabled={deletingId === source.id}
                  >
                    {deletingId === source.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Remove
                  </Button>
                </div>
              ))}

              {sources.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No media sources configured.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
