import { useState, type FormEvent } from 'react';
import { usersApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { Alert, Button, Field, Input, PageHeader } from '../components/ui';
import { ROLE_LABELS } from '../lib/format';
import { errorText } from '../lib/useAsync';

export function Profile() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  if (!user) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      setUser(await usersApi.updateMe(fullName.trim()));
      setMessage({ kind: 'success', text: 'اطلاعات ذخیره شد' });
    } catch (err) {
      setMessage({ kind: 'error', text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="حساب کاربری" />
      <div className="card" style={{ maxWidth: 520 }}>
        {message && <Alert kind={message.kind}>{message.text}</Alert>}
        <form className="form" onSubmit={onSubmit}>
          <Field label="نام و نام خانوادگی">
            <Input
              required
              minLength={2}
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field label="ایمیل">
            <Input type="email" value={user.email} disabled />
          </Field>
          <div className="row">
            <span className="muted small">نقش:</span>
            <span className="badge badge-role">{ROLE_LABELS[user.role]}</span>
          </div>
          <div>
            <Button type="submit" loading={busy} disabled={fullName.trim() === user.fullName}>
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
