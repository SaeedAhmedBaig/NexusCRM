'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useSession } from '../../../components/providers/session-context';
import { listProjects, createProject } from '../../../lib/tasks-api';
import { getTenantUrl } from '../../../lib/tenant';
import { Spinner } from '../../../components/ui/spinner';
import { PageHeader } from '../../../components/ui/page-header';
import { Button } from '../../../components/ui/button';
import { KanbanStaticCard } from '../../../components/ui/kanban';
import { notifyError, notifySuccess } from '../../../lib/notify';

export default function ProjectsPage() {
  const { subdomain } = useSession();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#4f46e5' });

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      setForm({ name: '', description: '', color: '#4f46e5' });
      notifySuccess('Project created');
    },
    onError: notifyError,
  });

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  if (error) {
    return <div className="rounded-lg border border-danger/20 bg-danger-light p-6 text-sm text-danger">{error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Projects"
        description="Track progress across grouped tasks"
        actions={
          <Button type="button" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />

      {showCreate && (
        <form
          className="rounded-lg border border-border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return;
            createMutation.mutate(form);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-foreground">Name</span>
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-foreground">Color</span>
              <input
                type="color"
                className="mt-1 h-10 w-full rounded-lg border border-border"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              />
            </label>
          </div>
          <label className="mt-3 block text-sm">
            <span className="font-medium text-foreground">Description</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>Create</Button>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project) => (
          <KanbanStaticCard
            key={project.id}
            href={getTenantUrl(subdomain, `/projects/${project.id}`)}
            title={project.name}
            meta={project.description || 'No description'}
            badges={[
              {
                label: `${project.taskCompleted}/${project.taskTotal} tasks`,
                className: 'bg-muted text-muted-foreground',
              },
              {
                label: `${project.progress}%`,
                className: 'bg-brand/10 text-brand',
              },
            ]}
            footer={
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${project.progress}%`, backgroundColor: project.color || '#4f46e5' }}
                  />
                </div>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}
