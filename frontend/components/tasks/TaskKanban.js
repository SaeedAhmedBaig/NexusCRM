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
  { id: 'todo', label: 'Pending', accent: 'border-t-warning' },
  { id: 'in_progress', label: 'In Progress', accent: 'border-t-foreground/30' },
  { id: 'done', label: 'Completed', accent: 'border-t-success' },
];

const PRIORITY_BADGES = {
  urgent: 'bg-danger-light text-danger',
  high: 'bg-warning-light text-warning',
  medium: 'bg-muted text-muted-foreground',
  low: 'bg-muted text-muted-foreground',
};

function DroppableColumn({ column, tasks, onTaskClick, activeId }) {
  return (
    <KanbanColumn
      id={column.id}
      title={column.label}
      count={`${tasks.length} tasks`}
      accent={column.accent}
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
          isDragging={activeId === task.id}
          onClick={() => onTaskClick(task)}
          footer={
            task.progress > 0 ? (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground/70" style={{ width: `${task.progress}%` }} />
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
    const targetCol = COLUMNS.find((c) => c.id === over.id);
    if (targetCol) onStatusChange(active.id, targetCol.id);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
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
