'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { KanbanCard, KanbanColumn } from '../ui/kanban';

const COLUMNS = [
  { id: 'todo', label: 'To do', accent: 'bg-warning', empty: 'Add ideas, requests, and next actions here.' },
  { id: 'in_progress', label: 'Doing', accent: 'bg-progress', empty: 'Drag active cards here when work starts.' },
  { id: 'done', label: 'Done', accent: 'bg-success', empty: 'Completed cards land here.' },
];

const PRIORITY_BADGES = {
  urgent: 'bg-danger-light text-danger',
  high: 'bg-warning-light text-warning',
  medium: 'bg-info-light text-info',
  low: 'bg-pending-light text-pending',
};

const PRIORITY_COVERS = {
  urgent: 'bg-danger',
  high: 'bg-warning',
  medium: 'bg-info',
  low: 'bg-pending',
};

function DroppableColumn({ column, tasks, onTaskClick, activeId }) {
  return (
    <KanbanColumn
      id={column.id}
      title={column.label}
      count={`${tasks.length} tasks`}
      accent={column.accent}
      empty={column.empty}
    >
      {tasks.map((task) => (
        <KanbanCard
          key={task.id}
          id={task.id}
          title={task.title}
          meta={[
            task.project?.name,
            task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          badges={[{ label: task.priority, className: PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium }]}
          labels={[
            { label: task.status, className: column.accent },
            task.project?.name ? { label: task.project.name, className: 'bg-brand' } : null,
          ].filter(Boolean)}
          coverClassName={PRIORITY_COVERS[task.priority] || PRIORITY_COVERS.medium}
          dueDate={task.dueDate}
          assignees={task.assigneeList || (task.assignee ? [task.assignee] : [])}
          checklist={{
            done: (task.subtasks || []).filter((s) => s.completed).length,
            total: (task.subtasks || []).length,
          }}
          commentCount={(task.comments || []).length}
          isDragging={activeId === task.id}
          onClick={() => onTaskClick(task)}
          footer={
            task.progress > 0 ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand" style={{ width: `${task.progress}%` }} />
              </div>
            ) : null
          }
        />
      ))}
    </KanbanColumn>
  );
}

export function TaskKanban({ columns, onStatusChange, onTaskClick }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const cols = COLUMNS.map((col) => ({
    ...col,
    tasks: columns?.[col.id] || [],
  }));

  const activeTask = cols.flatMap((c) => c.tasks).find((t) => t.id === activeId);

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const targetCol =
      COLUMNS.find((c) => c.id === over.id) ||
      cols.find((col) => col.tasks.some((task) => task.id === over.id));
    if (targetCol) onStatusChange(active.id, targetCol.id);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {cols.map((col) => (
          <DroppableColumn
            key={col.id}
            column={col}
            tasks={col.tasks}
            onTaskClick={onTaskClick}
            activeId={activeId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <KanbanCard
            id={activeTask.id}
            title={activeTask.title}
            isDragging
            badges={[{ label: activeTask.priority, className: PRIORITY_BADGES[activeTask.priority] }]}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
