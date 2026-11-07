import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { homeFor, useAuth } from '../auth/AuthContext';
import { Alert, Button, Field, Input } from '../components/ui';
import { errorText } from '../lib/useAsync';
import { safeNext } from './Login';

export function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next ?? homeFor(user)} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError('نام باید حداقل ۲ حرف باشد');
    if (password.length < 8) return setError('رمز عبور باید حداقل ۸ کاراکتر باشد');

    setBusy(true);
    try {
      const u = await register(fullName.trim(), email, password);
      navigate(next ?? homeFor(u), { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card auth-card">
      <h1>ثبت‌نام</h1>
      <p className="muted">یک حساب مشتری بسازید و نوبت بگیرید.</p>
      <Alert>{error}</Alert>
      <form className="form" onSubmit={onSubmit}>
        <Field label="نام و نام خانوادگی">
          <Input
            autoComplete="name"
            required
            maxLength={100}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>
        <Field label="ایمیل">
          <Input
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="رمز عبور" hint="حداقل ۸ کاراکتر">
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={busy} className="btn-block">
          ثبت‌نام
        </Button>
      </form>
      <p className="muted small" style={{ marginTop: 16, textAlign: 'center' }}>
        قبلاً ثبت‌نام کرده‌اید؟{' '}
        <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>وارد شوید</Link>
      </p>
    </div>
  );
}
