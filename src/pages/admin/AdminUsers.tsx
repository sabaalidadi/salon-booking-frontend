import { useState } from 'react';
import { usersApi } from '../../api/endpoints';
import type { User, UserRole } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Alert, AsyncView, Empty, Input, PageHeader, Select } from '../../components/ui';
import { ROLE_LABELS } from '../../lib/format';
import { errorText, useAsync } from '../../lib/useAsync';

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export function AdminUsers() {
  const { user: me } = useAuth();
  const { data, setData, loading, error, reload } = useAsync(() => usersApi.list());
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  async function changeRole(u: User, role: UserRole) {
    if (role === u.role) return;
    if (!confirm(`نقش «${u.fullName}» به «${ROLE_LABELS[role]}» تغییر کند؟`)) return;
    setBusyId(u.id);
    setMessage(null);
    try {
      const updated = await usersApi.changeRole(u.id, role);
      setData((list) => list?.map((x) => (x.id === u.id ? updated : x)) ?? null);
      setMessage({ kind: 'success', text: `نقش ${updated.fullName} به‌روز شد` });
    } catch (e) {
      setMessage({ kind: 'error', text: errorText(e) });
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const list = (data ?? []).filter(
    (u) => !q || u.fullName.toLowerCase().includes(q) || u.email.includes(q),
  );

  return (
    <>
      <PageHeader title="کاربران" subtitle="مشاهده کاربران و تغییر نقش آن‌ها." />
      {message && <Alert kind={message.kind}>{message.text}</Alert>}

      <AsyncView loading={loading} error={error} onRetry={reload}>
        <div className="card">
          <div style={{ maxWidth: 320, marginBottom: 12 }}>
            <Input
              placeholder="جستجو بر اساس نام یا ایمیل"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {list.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>ایمیل</th>
                    <th>وضعیت</th>
                    <th>نقش</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.fullName}</strong>
                        {u.id === me?.id && <span className="muted small"> (شما)</span>}
                      </td>
                      <td className="ltr">{u.email}</td>
                      <td>{u.isActive ? 'فعال' : <span className="muted">غیرفعال</span>}</td>
                      <td style={{ minWidth: 140 }}>
                        <Select
                          value={u.role}
                          disabled={u.id === me?.id || busyId === u.id}
                          onChange={(e) => changeRole(u, e.target.value as UserRole)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="کاربری پیدا نشد" />
          )}
        </div>
      </AsyncView>
    </>
  );
}
