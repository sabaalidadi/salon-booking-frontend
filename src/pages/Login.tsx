import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { homeFor, useAuth } from '../auth/AuthContext';
import { Alert, Button, Field, Input } from '../components/ui';
import { errorText } from '../lib/useAsync';

/** Only allow same-app relative redirects. */
export function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next ?? homeFor(user)} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = await login(email, password);
      navigate(next ?? homeFor(u), { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card auth-card">
      <h1>ورود</h1>
      <p className="muted">برای رزرو و مدیریت نوبت‌ها وارد حساب خود شوید.</p>
      <Alert>{error}</Alert>
      <form className="form" onSubmit={onSubmit}>
        <Field label="ایمیل">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="رمز عبور">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={busy} className="btn-block">
          ورود
        </Button>
      </form>
      <p className="muted small" style={{ marginTop: 16, textAlign: 'center' }}>
        حساب ندارید؟{' '}
        <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}>
          ثبت‌نام کنید
        </Link>
      </p>
    </div>
  );
}
