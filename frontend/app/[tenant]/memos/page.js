'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle, ArrowRightCircle, FolderKanban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MemoEditor } from '../../../components/memos/MemoEditor';
import {
  listMemos,
  createMemo,
  updateMemo,
  reviewMemo,
  convertMemoToTask,
  convertMemoToProject,
} from '../../../lib/tasks-api';
import { getTenantUrl } from '../../../lib/tenant';
import { useSession } from '../../../components/providers/session-context';
import { Spinner } from '../../../components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { PageHeader } from '../../../components/ui/page-header';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';

const STATUS_VARIANT = {
  draft: 'muted',
  pending: 'warning',
  reviewed: 'success',
  postponed: 'brand',
};

export default function MemosPage() {
  const { subdomain } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: memos = [], isLoading } = useQuery({
    queryKey: ['memos', statusFilter],
    queryFn: () => listMemos(statusFilter ? { status: statusFilter } : {}),
  });

  const selected = memos.find((m) => m.id === selectedId) || memos[0];

  const saveMutation = useMutation({
    mutationFn: (payload) => (selected?.id ? updateMemo(selected.id, payload) : createMemo(payload)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      if (!selectedId) setSelectedId(data.id);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () => reviewMemo(selected.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memos'] }),
  });

  const convertTaskMutation = useMutation({
    mutationFn: () => convertMemoToTask(selected.id),
    onSuccess: () => router.push(getTenantUrl(subdomain, '/tasks')),
  });

  const convertProjectMutation = useMutation({
    mutationFn: () => convertMemoToProject(selected.id),
    onSuccess: () => router.push(getTenantUrl(subdomain, '/projects')),
  });

  function startNew() {
    setSelectedId(null);
    setTitle('');
    setContent('');
  }

  function selectMemo(memo) {
    setSelectedId(memo.id);
    setTitle(memo.title);
    setContent(memo.content || '');
  }

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  const canEdit = selected ? selected.canEdit !== false : true;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Office Memos"
        description="Draft, review, and convert memos to work items"
        actions={
          <Button onClick={startNew} size="sm">
            <Plus className="h-4 w-4" /> New memo
          </Button>
        }
      />

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="input-base w-auto max-w-xs"
      >
        <option value="">All statuses</option>
        {['draft', 'pending', 'reviewed', 'postponed'].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">All memos</CardTitle>
            <CardDescription>{memos.length} total</CardDescription>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
              {memos.map((memo) => (
                <li key={memo.id}>
                  <button
                    type="button"
                    onClick={() => selectMemo(memo)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      selected?.id === memo.id
                        ? 'bg-brand-light text-foreground ring-1 ring-brand/20'
                        : 'hover:bg-surface',
                    )}
                  >
                    <p className="truncate font-medium">{memo.title}</p>
                    <Badge variant={STATUS_VARIANT[memo.status] || 'muted'} className="mt-1.5">
                      {memo.status}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              placeholder="Memo title"
              className="input-base text-lg font-semibold disabled:opacity-60"
            />
            <MemoEditor content={content} onChange={setContent} editable={canEdit} />
            {!canEdit && (
              <p className="text-sm text-warning">This memo has been reviewed — editing is locked.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => saveMutation.mutate({ title, content, status: 'draft' })}>
                    Save draft
                  </Button>
                  <Button size="sm" onClick={() => saveMutation.mutate({ title, content, status: 'pending' })}>
                    Submit for review
                  </Button>
                </>
              )}
              {selected?.status === 'pending' && (
                <Button variant="secondary" size="sm" onClick={() => reviewMutation.mutate()}>
                  <CheckCircle className="h-4 w-4" /> Mark reviewed
                </Button>
              )}
              {selected && (
                <>
                  <Button variant="outline" size="sm" onClick={() => convertTaskMutation.mutate()}>
                    <ArrowRightCircle className="h-4 w-4" /> Convert to Task
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => convertProjectMutation.mutate()}>
                    <FolderKanban className="h-4 w-4" /> Convert to Project
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
