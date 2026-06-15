'use client';

import { Suspense, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CheckCircle2, Clock3, LayoutGrid, List, Plus, Search } from 'lucide-react';
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
    q: searchParams.get('q') || '',
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
  const boardTasks = data?.columns ? Object.values(data.columns).flat() : listData;
  const taskStats = {
    total: data?.total ?? boardTasks.length,
    due: boardTasks.filter((task) => task.dueDate && new Date(task.dueDate) <= new Date()).length,
    done: boardTasks.filter((task) => task.status === 'done').length,
  };

  return (
    <div className="space-y-5">
      <div className="effix-panel overflow-hidden p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Work board</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plan, assign, checklist, discuss, and move work like a Trello board.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setParam('view', 'kanban')}
              className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${view === 'kanban' ? 'bg-brand text-brand-foreground' : 'text-muted-foreground'}`}
            >
              <LayoutGrid className="h-4 w-4" /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setParam('view', 'list')}
              className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${view === 'list' ? 'bg-brand text-brand-foreground' : 'text-muted-foreground'}`}
            >
              <List className="h-4 w-4" /> List
            </button>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground"
          >
            <Plus className="h-4 w-4" /> Add task
          </button>
        </div>
      </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Visible cards', value: taskStats.total, icon: LayoutGrid, tone: 'bg-info-light text-info' },
            { label: 'Due or overdue', value: taskStats.due, icon: Clock3, tone: 'bg-warning-light text-warning' },
            { label: 'Completed', value: taskStats.done, icon: CheckCircle2, tone: 'bg-success-light text-success' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-[1.35rem] border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  </div>
                  <span className={`flex size-10 items-center justify-center rounded-2xl ${item.tone}`}>
                    <Icon className="size-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="effix-panel flex flex-wrap items-center gap-2 p-3">
        <div className="flex h-11 min-w-[260px] flex-1 items-center gap-2 rounded-full border border-border bg-control px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            defaultValue={filters.q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', e.currentTarget.value);
            }}
            placeholder="Search cards..."
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={filters.priority}
          onChange={(e) => setParam('priority', e.target.value)}
          className="h-11 rounded-full border border-border bg-control px-4 text-sm"
        >
          <option value="">All priorities</option>
          {['low', 'medium', 'high', 'urgent'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filters.projectId}
          onChange={(e) => setParam('projectId', e.target.value)}
          className="h-11 rounded-full border border-border bg-control px-4 text-sm"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <label className="flex h-11 items-center gap-2 rounded-full border border-border bg-control px-4 text-sm">
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
          className="h-11 rounded-full border border-border bg-control px-4 text-sm"
          title="Due before"
        />
        <label className="flex h-11 items-center gap-2 rounded-full border border-border bg-control px-4 text-sm">
          <input
            type="checkbox"
            checked={filters.showCompleted === 'true'}
            onChange={(e) => setParam('showCompleted', e.target.checked ? 'true' : '')}
          />
          Show completed
        </label>
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
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-muted-foreground">
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
                  className="cursor-pointer border-b border-border hover:bg-muted/70"
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
          </div>
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
