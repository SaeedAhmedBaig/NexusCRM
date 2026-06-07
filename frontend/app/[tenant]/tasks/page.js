'use client';

import { Suspense, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { useSession } from '../../../components/providers/session-context';
import { TaskKanban } from '../../../components/tasks/TaskKanban';
import { TaskDetailModal } from '../../../components/tasks/TaskDetailModal';
import { QuickAddTaskModal } from '../../../components/tasks/QuickAddTaskModal';
import { listTasks, createTask, updateTask, getTask } from '../../../lib/tasks-api';
import { listProjects } from '../../../lib/tasks-api';
import { listTenantUsers } from '../../../lib/api';
import { Spinner } from '../../../components/ui/spinner';
import { Card, CardContent } from '../../../components/ui/card';

const STATUS_LABELS = { todo: 'Pending', in_progress: 'In Progress', done: 'Completed' };

function TasksPageInner() {
  const { profile } = useSession();
  const currentUserId = profile?.user?.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const view = searchParams.get('view') || 'kanban';
  const [selectedTask, setSelectedTask] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const filters = {
    view: view === 'kanban' ? 'kanban' : undefined,
    priority: searchParams.get('priority') || '',
    projectId: searchParams.get('projectId') || '',
    assignedToMe: searchParams.get('assignedToMe') || '',
    dueBefore: searchParams.get('dueBefore') || '',
    showCompleted: searchParams.get('showCompleted') || '',
    limit: view === 'kanban' ? 200 : 50,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => listTasks(filters),
  });

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  const { data: users = [] } = useQuery({ queryKey: ['tenant-users'], queryFn: () => listTenantUsers() });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTask(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const setParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams],
  );

  async function openTask(task) {
    const full = await getTask(task.id);
    setSelectedTask(full);
  }

  if (error) {
    return <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-sm text-danger">{error.message}</div>;
  }

  const listData = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted">Manage work with list or Kanban views</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setParam('view', 'kanban')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-brand text-brand-foreground' : 'text-muted'}`}
            >
              <LayoutGrid className="h-4 w-4" /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setParam('view', 'list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${view === 'list' ? 'bg-brand text-brand-foreground' : 'text-muted'}`}
            >
              <List className="h-4 w-4" /> List
            </button>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            <Plus className="h-4 w-4" /> Add task
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.priority}
          onChange={(e) => setParam('priority', e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">All priorities</option>
          {['low', 'medium', 'high', 'urgent'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filters.projectId}
          onChange={(e) => setParam('projectId', e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={filters.assignedToMe === 'true'}
            onChange={(e) => setParam('assignedToMe', e.target.checked ? 'true' : '')}
          />
          Assigned to me
        </label>
        <input
          type="date"
          value={filters.dueBefore}
          onChange={(e) => setParam('dueBefore', e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
          title="Due before"
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>
      ) : view === 'kanban' ? (
        <TaskKanban
          columns={data?.columns}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          onTaskClick={openTask}
        />
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-muted">
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {listData.map((task) => (
                <tr
                  key={task.id}
                  className="cursor-pointer border-b border-border hover:bg-surface-elevated/80"
                  onClick={() => openTask(task)}
                >
                  <td className="px-4 py-3 font-medium">{task.title}</td>
                  <td className="px-4 py-3 capitalize">{STATUS_LABELS[task.status]}</td>
                  <td className="px-4 py-3 capitalize">{task.priority}</td>
                  <td className="px-4 py-3">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">{task.progress || 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          </CardContent>
        </Card>
      )}

      <TaskDetailModal
        task={selectedTask}
        users={users}
        projects={projects}
        currentUserId={currentUserId}
        currentUserName={profile?.user?.name}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={setSelectedTask}
      />
      <QuickAddTaskModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        projects={projects}
        loading={createMutation.isPending}
        onCreate={(payload) => createMutation.mutateAsync(payload)}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>}>
      <TasksPageInner />
    </Suspense>
  );
}
