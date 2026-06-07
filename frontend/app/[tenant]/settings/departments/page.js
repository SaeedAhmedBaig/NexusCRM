'use client';

import { useEffect, useState } from 'react';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  listGroups,
  updateGroup,
} from '../../../../lib/api';
import { useSession } from '../../../../components/providers/session-context';
import { Can } from '../../../../components/can';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { inputClass } from '../../../../components/ui/form-field';

const PERMISSION_PRESETS = [
  'read:Deal', 'manage:Deal', 'read:Contact', 'manage:Contact',
  'read:Company', 'manage:Company', 'read:Lead', 'manage:Lead',
  'read:Task', 'manage:Task', 'read:Analytics', 'manage:Analytics',
  'read:User', 'manage:User', 'manage:Department', 'manage:Group',
  'manage:Settings', 'read:Massmail', 'manage:Massmail',
];

export default function DepartmentsSettingsPage() {
  const { profile } = useSession();
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newDept, setNewDept] = useState({ name: '', description: '', groupId: '' });
  const [error, setError] = useState('');

  async function load() {
    const [depts, grps] = await Promise.all([listDepartments(), listGroups()]);
    setDepartments(depts);
    setGroups(grps);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  return (
    <Can action="manage" subject="Department" rules={profile?.rules} fallback={<p className="text-muted-foreground">Admin access required.</p>}>
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
        <div>
          <h1 className="text-h1 text-foreground">Roles & departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize teams and configure role permissions.</p>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}

        <Card>
          <CardHeader><CardTitle>Create department</CardTitle></CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await createDepartment({
                  name: newDept.name,
                  description: newDept.description,
                  groupId: newDept.groupId || undefined,
                });
                setNewDept({ name: '', description: '', groupId: '' });
                await load();
              }}
            >
              <input required className={inputClass} placeholder="Department name" value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} />
              <input className={inputClass} placeholder="Description" value={newDept.description} onChange={(e) => setNewDept({ ...newDept, description: e.target.value })} />
              <select className={inputClass} value={newDept.groupId} onChange={(e) => setNewDept({ ...newDept, groupId: e.target.value })}>
                <option value="">Default role group</option>
                {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
              </select>
              <Button type="submit" className="sm:col-span-3 sm:w-fit">Add department</Button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Departments</h2>
          {departments.map((d) => (
            <Card key={d._id}>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
                <input
                  className={inputClass}
                  defaultValue={d.name}
                  onBlur={async (e) => {
                    if (e.target.value !== d.name) {
                      await updateDepartment(d._id, { name: e.target.value });
                      await load();
                    }
                  }}
                />
                <input
                  className={inputClass}
                  defaultValue={d.description || ''}
                  placeholder="Description"
                  onBlur={async (e) => {
                    await updateDepartment(d._id, { description: e.target.value });
                    await load();
                  }}
                />
                <select
                  className={inputClass}
                  defaultValue={d.groupId || ''}
                  onChange={async (e) => {
                    await updateDepartment(d._id, { groupId: e.target.value || null });
                    await load();
                  }}
                >
                  <option value="">No default group</option>
                  {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                </select>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Role permissions</h2>
          {groups.map((group) => (
            <Card key={group._id}>
              <CardHeader>
                <CardTitle className="text-base">{group.name}</CardTitle>
                <p className="text-xs text-muted">Role: {group.role}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-2">
                  {PERMISSION_PRESETS.map((perm) => {
                    const active = (group.permissions || []).includes(perm);
                    return (
                      <button
                        key={perm}
                        type="button"
                        disabled={group.role === 'owner'}
                        onClick={async () => {
                          const perms = new Set(group.permissions || []);
                          if (active) perms.delete(perm);
                          else perms.add(perm);
                          await updateGroup(group._id, [...perms]);
                          await load();
                        }}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${active ? 'bg-brand text-brand-foreground' : 'border border-border bg-surface text-muted'}`}
                      >
                        {perm}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </Can>
  );
}
