import { Link } from 'react-router-dom';
import { servicesApi, specialistsApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { AsyncView, Empty } from '../components/ui';
import { formatDuration, formatPrice, toFaDigits } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export function Home() {
  const { user } = useAuth();
  const services = useAsync(() => servicesApi.list());
  const specialists = useAsync(() => specialistsApi.list());

  return (
    <>
      <section className="hero">
        <h1>زیبایی‌ات را به ما بسپار</h1>
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
      </section>

      <section className="section">
        <div className="spread" style={{ marginBottom: 16 }}>
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
                    <span className="avatar">{sp.specialist.fullName.charAt(0)}</span>
                    <div>
                      <h3>{sp.specialist.fullName}</h3>
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
    </>
  );
}
