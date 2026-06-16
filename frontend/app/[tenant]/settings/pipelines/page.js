'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GitBranch, Plus } from 'lucide-react';
import { createDealPipeline, listDealPipelines, updateDealPipeline } from '../../../../lib/crm-api';
import { notifyError, notifySuccess } from '../../../../lib/notify';
import { SettingsButton, SettingsPageShell, SettingsPrimaryButton } from '../../../../components/settings/settings-layout';

const defaultStages = [
  { key: 'lead', label: 'Lead', probability: 10, order: 10, active: true },
  { key: 'qualified', label: 'Qualified', probability: 25, order: 20, active: true },
  { key: 'proposal', label: 'Proposal', probability: 50, order: 30, active: true },
  { key: 'negotiation', label: 'Negotiation', probability: 75, order: 40, active: true },
  { key: 'won', label: 'Won', probability: 100, order: 50, isWon: true, active: true },
  { key: 'lost', label: 'Lost', probability: 0, order: 60, isLost: true, active: true },
];

const initialForm = {
  name: 'Sales Pipeline',
  description: '',
  isDefault: true,
  active: true,
  stages: defaultStages,
};

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function pipelineToForm(pipeline) {
  return {
    name: pipeline.name || '',
    description: pipeline.description || '',
    isDefault: Boolean(pipeline.isDefault),
    active: pipeline.active !== false,
    stages: pipeline.stages?.length ? pipeline.stages : defaultStages,
  };
}

export default function PipelineSettingsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const { data: pipelines = [], isLoading, error } = useQuery({
    queryKey: ['deal-pipelines'],
    queryFn: listDealPipelines,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => editingId ? updateDealPipeline(editingId, payload) : createDealPipeline(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-pipelines'] });
      setEditingId(null);
      setForm(initialForm);
      notifySuccess(editingId ? 'Pipeline updated' : 'Pipeline created');
    },
    onError: notifyError,
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateStage(index, key, value) {
    setForm((current) => ({
      ...current,
      stages: current.stages.map((stage, i) => i === index ? { ...stage, [key]: value } : stage),
    }));
  }

  function addStage() {
    setForm((current) => ({
      ...current,
      stages: [...current.stages, { key: 'new_stage', label: 'New stage', probability: 0, order: (current.stages.length + 1) * 10, active: true }],
    }));
  }

  function removeStage(index) {
    setForm((current) => ({ ...current, stages: current.stages.filter((_, i) => i !== index) }));
  }

  function submit(event) {
    event.preventDefault();
    saveMutation.mutate({
      ...form,
      stages: form.stages.map((stage, index) => ({
        ...stage,
        key: normalizeKey(stage.key || stage.label),
        probability: Number(stage.probability) || 0,
        order: Number(stage.order ?? index * 10),
      })),
    });
  }

  function editPipeline(pipeline) {
    setEditingId(pipeline.id);
    setForm(pipelineToForm(pipeline));
  }

  return (
    <SettingsPageShell
      title="Pipelines"
      description="Configure opportunity pipeline stages, probabilities, exit criteria, and won/lost outcomes."
      actions={
        <SettingsPrimaryButton type="submit" form="pipeline-form" disabled={saveMutation.isPending}>
          <Plus className="h-4 w-4" />
          {editingId ? 'Save pipeline' : 'Add pipeline'}
        </SettingsPrimaryButton>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[480px_1fr]">
        <form id="pipeline-form" onSubmit={submit} className="border border-border bg-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-bold text-foreground">{editingId ? 'Edit pipeline' : 'New pipeline'}</h2>
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Name</span>
              <input className="input-base" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Description</span>
              <textarea className="input-base min-h-[72px]" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            </label>
            <div className="flex gap-4 text-sm font-semibold text-foreground">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => updateField('isDefault', e.target.checked)} />
                Default
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => updateField('active', e.target.checked)} />
                Active
              </label>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Stages</h3>
              <SettingsButton type="button" onClick={addStage}>Add stage</SettingsButton>
            </div>
            {form.stages.map((stage, index) => (
              <div key={`${stage.key}-${index}`} className="grid gap-2 border border-border bg-muted p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="input-base" value={stage.label} onChange={(e) => updateStage(index, 'label', e.target.value)} placeholder="Label" />
                  <input className="input-base" value={stage.key} onChange={(e) => updateStage(index, 'key', normalizeKey(e.target.value))} placeholder="API key" />
                  <input className="input-base" type="number" value={stage.probability} onChange={(e) => updateStage(index, 'probability', e.target.value)} placeholder="Probability" />
                  <input className="input-base" type="number" value={stage.order} onChange={(e) => updateStage(index, 'order', e.target.value)} placeholder="Order" />
                </div>
                <textarea className="input-base min-h-[56px]" value={stage.exitCriteria || ''} onChange={(e) => updateStage(index, 'exitCriteria', e.target.value)} placeholder="Exit criteria" />
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-foreground">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={stage.active !== false} onChange={(e) => updateStage(index, 'active', e.target.checked)} /> Active</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(stage.isWon)} onChange={(e) => updateStage(index, 'isWon', e.target.checked)} /> Won</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(stage.isLost)} onChange={(e) => updateStage(index, 'isLost', e.target.checked)} /> Lost</label>
                  <button type="button" className="ml-auto text-danger" onClick={() => removeStage(index)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <div className="border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-bold text-foreground">Configured pipelines</h2>
            <p className="text-xs text-muted-foreground">Stages power deal forms, Kanban movement, and forecast probability.</p>
          </div>
          {error ? (
            <p className="p-4 text-sm text-danger">{error.message}</p>
          ) : isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading pipelines...</p>
          ) : pipelines.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No pipelines configured yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {pipelines.map((pipeline) => (
                <div key={pipeline.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{pipeline.name}</p>
                      {pipeline.isDefault ? <span className="border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Default</span> : null}
                      <span className="border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{pipeline.stages?.length || 0} stages</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{pipeline.description || 'No description'}</p>
                  </div>
                  <SettingsButton type="button" onClick={() => editPipeline(pipeline)}>Edit</SettingsButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SettingsPageShell>
  );
}
