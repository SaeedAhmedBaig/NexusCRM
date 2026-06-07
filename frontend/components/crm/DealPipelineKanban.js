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
import { getTenantUrl } from '../../lib/tenant';

const STAGES = [
  { id: 'lead', label: 'Lead', accent: 'border-t-muted-foreground' },
  { id: 'qualified', label: 'Qualified', accent: 'border-t-foreground/20' },
  { id: 'proposal', label: 'Proposal', accent: 'border-t-warning' },
  { id: 'negotiation', label: 'Negotiation', accent: 'border-t-foreground/40' },
  { id: 'won', label: 'Won', accent: 'border-t-success' },
  { id: 'lost', label: 'Lost', accent: 'border-t-danger' },
];

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
}

function StageColumn({ stage, deals, subdomain, activeId }) {
  const total = deals.reduce((s, d) => s + (d.amount ?? d.value ?? 0), 0);

  return (
    <KanbanColumn
      id={stage.id}
      title={stage.label}
      count={`${deals.length}`}
      summary={formatCurrency(total)}
      accent={stage.accent}
    >
      {deals.map((deal) => (
        <KanbanCard
          key={deal.id}
          id={deal.id}
          title={deal.name || deal.title}
          subtitle={formatCurrency(deal.amount ?? deal.value)}
          meta={deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : 'No close date'}
          href={getTenantUrl(subdomain, `/crm/deals/${deal.id}`)}
          isDragging={activeId === deal.id}
        />
      ))}
    </KanbanColumn>
  );
}

export function DealPipelineKanban({ deals = [], subdomain, onStageChange }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const columns = STAGES.map((stage) => ({
    ...stage,
    deals: deals.filter((d) => {
      if (stage.id === 'lost') return d.status === 'lost';
      if (stage.id === 'won') return d.status === 'won';
      return d.status === 'open' && (d.stage || 'lead') === stage.id;
    }),
  }));

  const activeDeal = deals.find((d) => d.id === activeId);

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const target = STAGES.find((s) => s.id === over.id);
    if (target) onStageChange?.(active.id, target.id);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => (
          <StageColumn
            key={col.id}
            stage={col}
            deals={col.deals}
            subdomain={subdomain}
            activeId={activeId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? (
          <KanbanCard
            id={activeDeal.id}
            title={activeDeal.name || activeDeal.title}
            subtitle={formatCurrency(activeDeal.amount ?? activeDeal.value)}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
