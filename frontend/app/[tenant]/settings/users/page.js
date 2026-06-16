'use client';

import { useEffect, useState } from 'react';
import {
  getMe,
  listTenantUsers,
  inviteUser,
  updateMember,
  removeMember,
  suspendMember,
  listDepartments,
} from '../../../../lib/api';
import { useSession } from '../../../../components/providers/session-context';
import { inputClass } from '../../../../components/ui/form-field';
import { SettingsButton, SettingsPageShell, SettingsPrimaryButton, SettingsSection } from '../../../../components/settings/settings-layout';

const INVITE_ROLES = [
  'admin',
  'chief',
  'manager',
  'operator',
  'co-worker',
  'accountant',
  'task_operator',
];

export default function UsersSettingsPage() {
  const { subdomain } = useSession();
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [invite, setInvite] = useState({ email: '', role: 'co-worker', departmentId: '' });
  const [error, setError] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  async function load(deptId) {
    const [me, team, depts] = await Promise.all([
      getMe(),
      listTenantUsers(deptId || undefined),
      listDepartments(),
    ]);
    setProfile(me);
    setUsers(team);
    setDepartments(depts);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch((e) => setError(e.message));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleInvite(e) {
    e.preventDefault();
    setError('');
    try {
      await inviteUser({
        email: invite.email,
        role: invite.role,
        departmentId: invite.departmentId || undefined,
      });
      setInvite({ email: '', role: 'co-worker', departmentId: '' });
      await load(departmentFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <SettingsPageShell
      title="Team management"
      description="Invite users, assign roles, and manage workspace access."
    >

        {error && <p className="text-sm text-danger">{error}</p>}

        <form onSubmit={handleInvite} className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-4">
          <input
            required
            type="email"
            placeholder="Email to invite"
            value={invite.email}
            onChange={(e) => setInvite({ ...invite, email: e.target.value })}
            className={`${inputClass} sm:col-span-2`}
          />
          <select
            value={invite.role}
            onChange={(e) => setInvite({ ...invite, role: e.target.value })}
            className={inputClass}
          >
            {INVITE_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={invite.departmentId}
            onChange={(e) => setInvite({ ...invite, departmentId: e.target.value })}
            className={inputClass}
          >
            <option value="">No department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
          <SettingsPrimaryButton type="submit" className="sm:col-span-4 sm:w-fit">
            Send invite
          </SettingsPrimaryButton>
        </form>

        <div className="flex items-center gap-3 border border-border bg-card px-4 py-3">
          <label className="text-sm text-muted">Filter by department</label>
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              load(e.target.value).catch((err) => setError(err.message));
            }}
            className={inputClass}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>

        <SettingsSection title="Members" description="Current users and their assigned access.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={async (e) => {
                        await updateMember(u.id, { role: e.target.value });
                        await load(departmentFilter);
                      }}
                      className="border border-border bg-control px-2 py-1 text-sm text-foreground"
                    >
                      {INVITE_ROLES.concat(['owner']).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.department?._id || u.department?.id || ''}
                      onChange={async (e) => {
                        await updateMember(u.id, { departmentId: e.target.value || null });
                        await load(departmentFilter);
                      }}
                      className="border border-border bg-control px-2 py-1 text-sm text-foreground"
                    >
                      <option value="">No department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'owner' && (
                      <div className="flex gap-2">
                        <SettingsButton
                          type="button"
                          onClick={async () => {
                            await suspendMember(u.id);
                            await load(departmentFilter);
                          }}
                          className="text-warning"
                        >
                          Suspend
                        </SettingsButton>
                        <SettingsButton
                          type="button"
                          onClick={async () => {
                            await removeMember(u.id);
                            await load(departmentFilter);
                          }}
                          className="border-danger/30 text-danger hover:bg-danger-light"
                        >
                          Remove
                        </SettingsButton>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </SettingsSection>
    </SettingsPageShell>
  );
}
