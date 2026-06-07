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
    load().catch((e) => setError(e.message));
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
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team management</h1>
          <p className="mt-1 text-sm text-muted">Invite, assign roles, and manage access.</p>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <form onSubmit={handleInvite} className="grid gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm sm:grid-cols-4">
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
          <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark sm:col-span-4 sm:w-fit">
            Send invite
          </button>
        </form>

        <div className="flex items-center gap-3">
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

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
                      className="rounded-lg border border-border px-2 py-1 text-sm"
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
                      className="rounded-lg border border-border px-2 py-1 text-sm"
                    >
                      <option value="">No department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'owner' && (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            await suspendMember(u.id);
                            await load(departmentFilter);
                          }}
                          className="text-sm font-medium text-warning hover:underline"
                        >
                          Suspend
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeMember(u.id);
                            await load(departmentFilter);
                          }}
                          className="text-sm font-medium text-danger hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}
