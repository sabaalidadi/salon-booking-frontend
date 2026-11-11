import { Link } from 'react-router-dom';
import { categoriesApi, servicesApi, specialistsApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { AsyncView, Empty, PersonAvatar } from '../components/ui';
import { formatDuration, formatPrice, toFaDigits } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export function Home() {
  const { user } = useAuth();
  const categories = useAsync(() => categoriesApi.list());
  const services = useAsync(() => servicesApi.list());
  const specialists = useAsync(() => specialistsApi.list());

  return (
    <>
      <section className="hero">
        <span className="eyebrow">پلتفرم هوشمند رزرو زیبایی</span>
        <h1>رزرو آنلاین سالن زیبایی</h1>
        <p>
          خدمات آرایشی و زیبایی را ببین، متخصص دلخواهت را انتخاب کن و در چند ثانیه
          نوبتت را رزرو کن.
        </p>
        <div className="row" style={{ marginTop: 20 }}>
          <Link to="/book" className="btn btn-primary">
            رزرو نوبت
          </Link>
          {!user && (
            <Link to="/register" className="btn btn-ghost">
              ساخت حساب کاربری
            </Link>
          )}
        </div>
        <div className="hero-chips">
          {(categories.data ?? []).map((c) => (
            <Link key={c.id} to={`/book?category=${c.id}`}>
              {c.icon} {c.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>دسته‌بندی خدمات</h2>
        </div>
        <div className="cat-grid">
          {(categories.data ?? []).map((c) => (
            <Link key={c.id} to={`/book?category=${c.id}`} className="cat">
              <span className="cat-icon">{c.icon}</span>
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>رزرو در ۳ مرحله</h2>
        </div>
        <div className="how-grid">
          {STEPS.map((s, i) => (
            <div key={s} className="card how-step">
              <div className="how-num">{toFaDigits(i + 1)}</div>
              <h3>{s}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>خدمات سالن</h2>
        </div>
        <AsyncView loading={services.loading} error={services.error} onRetry={services.reload}>
          {services.data?.length ? (
            <div className="grid">
              {services.data.map((s) => (
                <article key={s.id} className="card service-card">
                  <h3>{s.title}</h3>
                  {s.description && <p className="muted small">{s.description}</p>}
                  <div className="service-meta">
                    <span>⏱ {formatDuration(s.durationMinutes)}</span>
                    <span className="price">{formatPrice(s.priceAmount)}</span>
                  </div>
                  <Link to={`/book?service=${s.id}`} className="btn btn-secondary btn-sm">
                    رزرو این خدمت
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <Empty title="هنوز خدمتی ثبت نشده" />
          )}
        </AsyncView>
      </section>

      <section className="section">
        <h2 style={{ marginBottom: 16 }}>متخصص‌های ما</h2>
        <AsyncView
          loading={specialists.loading}
          error={specialists.error}
          onRetry={specialists.reload}
        >
          {specialists.data?.length ? (
            <div className="grid">
              {specialists.data.map((sp) => (
                <article key={sp.id} className="card service-card">
                  <div className="row">
                    <PersonAvatar name={sp.specialist.fullName} url={sp.avatarUrl} size={48} />
                    <div>
                      <h3>
                        <Link to={`/specialists/${sp.id}`}>{sp.specialist.fullName}</Link>
                      </h3>
                      <span className="muted small">
                        {toFaDigits(sp.yearsExperience)} سال سابقه
                      </span>
                    </div>
                  </div>
                  <p className="muted small">{sp.bio}</p>
                  {sp.services.length > 0 && (
                    <div className="chips">
                      {sp.services.map((s) => (
                        <span key={s.id} className="chip">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {sp.services.length > 0 && (
                    <Link to={`/book?specialist=${sp.id}`} className="btn btn-secondary btn-sm">
                      رزرو با این متخصص
                    </Link>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty title="هنوز متخصصی ثبت نشده" />
          )}
        </AsyncView>
      </section>

      <section className="section trust-grid">
        {TRUST.map((t) => (
          <div key={t.label} className="card trust">
            <span className="trust-icon">{t.icon}</span>
            <strong>{t.label}</strong>
          </div>
        ))}
      </section>
    </>
  );
}

const STEPS = ['انتخاب خدمت و متخصص', 'انتخاب روز و ساعت', 'ثبت و تأیید نوبت'];

const TRUST = [
  { icon: '🔒', label: 'پرداخت امن' },
  { icon: '🎧', label: 'پشتیبانی ۲۴ ساعته' },
  { icon: '✅', label: 'رزرو تضمینی' },
];
