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
import { inputClass } from '../../../../components/ui/form-field';
import { SettingsPageShell, SettingsPrimaryButton, SettingsSection } from '../../../../components/settings/settings-layout';

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
    const timer = window.setTimeout(() => {
      load().catch((e) => setError(e.message));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Can action="manage" subject="Department" rules={profile?.rules} fallback={<p className="text-muted-foreground">Admin access required.</p>}>
      <SettingsPageShell
        title="Roles and departments"
        description="Organize teams, defaults, and permission presets."
      >
        {error && <p className="text-sm text-danger">{error}</p>}

        <SettingsSection title="Create department" description="Add a department and optionally attach a default role group.">
            <form
              className="grid gap-3 p-4 sm:grid-cols-3"
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
              <SettingsPrimaryButton type="submit" className="sm:col-span-3 sm:w-fit">Add department</SettingsPrimaryButton>
            </form>
        </SettingsSection>

        <SettingsSection title="Departments" description="Edit department labels and default role groups.">
          {departments.map((d) => (
              <div key={d._id} className="grid gap-3 px-4 py-3 sm:grid-cols-3">
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
              </div>
          ))}
        </SettingsSection>

        <SettingsSection title="Role permissions" description="Toggle role permission presets for workspace modules.">
          {groups.map((group) => (
            <div key={group._id} className="px-4 py-3">
              <div className="mb-3">
                <p className="text-sm font-semibold text-foreground">{group.name}</p>
                <p className="text-xs text-muted-foreground">Role: {group.role}</p>
              </div>
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
                        className={`border px-2 py-1 text-xs font-medium ${active ? 'border-brand bg-brand text-brand-foreground' : 'border-border bg-control text-muted-foreground hover:bg-control-hover'}`}
                      >
                        {perm}
                      </button>
                    );
                  })}
                </div>
            </div>
          ))}
        </SettingsSection>
      </SettingsPageShell>
    </Can>
  );
}
