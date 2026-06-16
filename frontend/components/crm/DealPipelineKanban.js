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

const FALLBACK_STAGES = [
  { id: 'lead', label: 'Lead', accent: 'border-t-muted-foreground' },
  { id: 'qualified', label: 'Qualified', accent: 'border-t-foreground/20' },
  { id: 'proposal', label: 'Proposal', accent: 'border-t-warning' },
  { id: 'negotiation', label: 'Negotiation', accent: 'border-t-foreground/40' },
  { id: 'won', label: 'Won', accent: 'border-t-success' },
  { id: 'lost', label: 'Lost', accent: 'border-t-danger' },
];

const ACCENTS = ['border-t-muted-foreground', 'border-t-foreground/20', 'border-t-warning', 'border-t-foreground/40', 'border-t-success', 'border-t-danger'];

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

export function DealPipelineKanban({ deals = [], stages = FALLBACK_STAGES, subdomain, onStageChange }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const normalizedStages = (stages?.length ? stages : FALLBACK_STAGES).map((stage, index) => ({
    ...stage,
    id: stage.id || stage.key,
    key: stage.key || stage.id,
    accent: stage.accent || ACCENTS[index % ACCENTS.length],
  }));

  const columns = normalizedStages.map((stage) => ({
    ...stage,
    deals: deals.filter((d) => {
      if (stage.isLost) return d.status === 'lost' || (d.stageKey || d.stage) === stage.key;
      if (stage.isWon) return d.status === 'won' || (d.stageKey || d.stage) === stage.key;
      return d.status === 'open' && (d.stageKey || d.stage || 'lead') === stage.key;
    }),
  }));

  const activeDeal = deals.find((d) => d.id === activeId);

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const target = normalizedStages.find((s) => s.id === over.id);
    if (target) onStageChange?.(active.id, target.key, target);
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
