'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useSession } from '../../../../components/providers/session-context';
import { getProject } from '../../../../lib/tasks-api';
import { getTenantUrl } from '../../../../lib/tenant';
import { Spinner } from '../../../../components/ui/spinner';
import { ObjectChat } from '../../../../components/chat/ObjectChat';

const STATUS_LABELS = { todo: 'Pending', in_progress: 'In Progress', done: 'Completed' };

export default function ProjectDetailPage({ params }) {
  const { id } = use(params);
  const { subdomain, profile } = useSession();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id),
  });

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  if (error || !project) {
    return <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-sm text-danger">{error?.message || 'Project not found'}</div>;
  }

  return (
    <div className="space-y-6">
      <Link href={getTenantUrl(subdomain, '/projects')} className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="mt-1 text-sm text-muted">{project.description}</p>
        <div className="mt-4 max-w-md">
          <div className="mb-1 flex justify-between text-sm text-muted">
            <span>{project.taskCompleted} of {project.taskTotal} tasks completed</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-brand" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Chat</h2>
        <ObjectChat
          entityType="Project"
          objectId={id}
          currentUserId={profile?.user?.id}
          currentUserName={profile?.user?.name}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
            {(project.tasks || []).map((task) => (
              <tr key={task.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{task.title}</td>
                <td className="px-4 py-3">{STATUS_LABELS[task.status]}</td>
                <td className="px-4 py-3 capitalize">{task.priority}</td>
                <td className="px-4 py-3">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">{task.progress || 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
