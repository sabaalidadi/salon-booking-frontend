import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentsApi, servicesApi, specialistsApi } from '../api/endpoints';
import type { WorkingHour } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Alert, AsyncView, Button, Empty, PageHeader, Spinner } from '../components/ui';
import {
  JS_DAY_TO_ENUM,
  dayLabel,
  formatDate,
  formatDuration,
  formatPrice,
  formatShortDate,
  fromMinutes,
  toFaDigits,
  toMinutes,
} from '../lib/format';
import { errorText, useAsync } from '../lib/useAsync';

const DAYS_AHEAD = 14;
const SLOT_STEP_MINUTES = 30;

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** Start times (minutes from midnight) that fit fully inside the working hours. */
function buildSlots(day: Date, hours: WorkingHour | undefined, duration: number) {
  if (!hours || !hours.isWorking) return [];
  const start = toMinutes(hours.startTime);
  const end = toMinutes(hours.endTime);
  const now = new Date();
  const nowMinutes = sameDay(day, now) ? now.getHours() * 60 + now.getMinutes() : -1;

  const slots: number[] = [];
  for (let t = start; t + duration <= end; t += SLOT_STEP_MINUTES) {
    if (t > nowMinutes) slots.push(t);
  }
  return slots;
}

export function Book() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const serviceId = params.get('service');
  const specialistId = params.get('specialist');

  const services = useAsync(() => servicesApi.list());
  const specialists = useAsync(() => specialistsApi.list());
  const hours = useAsync(
    () => (specialistId ? specialistsApi.workingHours(specialistId) : Promise.resolve([])),
    [specialistId],
  );

  const [day, setDay] = useState<Date | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = services.data?.find((s) => s.id === serviceId) ?? null;
  const specialist = specialists.data?.find((s) => s.id === specialistId) ?? null;

  // Specialists who offer the chosen service (only those can be booked).
  const specialistOptions = useMemo(
    () =>
      (specialists.data ?? []).filter(
        (sp) => sp.services.length > 0 && (!serviceId || sp.services.some((s) => s.id === serviceId)),
      ),
    [specialists.data, serviceId],
  );

  // If a specialist was picked first, narrow services to theirs.
  const serviceOptions = useMemo(() => {
    const all = services.data ?? [];
    if (!specialist) return all;
    const ids = new Set(specialist.services.map((s) => s.id));
    return all.filter((s) => ids.has(s.id));
  }, [services.data, specialist]);

  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const hoursFor = (d: Date) => hours.data?.find((h) => h.dayOfWeek === JS_DAY_TO_ENUM[d.getDay()]);

  const slots = day && service ? buildSlots(day, hoursFor(day), service.durationMinutes) : [];

  function update(next: { service?: string | null; specialist?: string | null }) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p, { replace: true });
    setDay(null);
    setSlot(null);
    setError(null);
  }

  function chooseService(id: string) {
    const keepSpecialist = specialist?.services.some((s) => s.id === id);
    update({ service: id, specialist: keepSpecialist ? specialistId : null });
  }

  async function confirm() {
    if (!service || !specialist || !day || slot === null) return;
    const start = new Date(day);
    start.setHours(Math.floor(slot / 60), slot % 60, 0, 0);

    setSubmitting(true);
    setError(null);
    try {
      await appointmentsApi.create({
        specialistId: specialist.id,
        serviceId: service.id,
        startTime: start.toISOString(),
      });
      navigate('/my-appointments', { state: { booked: true } });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSubmitting(false);
    }
  }

  const step = !service ? 1 : !specialist ? 2 : slot === null ? 3 : 4;
  const loginLink = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;

  return (
    <>
      <PageHeader title="رزرو نوبت" subtitle="خدمت، متخصص و زمان دلخواهت را انتخاب کن." />

      <div className="steps">
        {['خدمت', 'متخصص', 'زمان', 'تأیید'].map((label, i) => (
          <div
            key={label}
            className={`step${step === i + 1 ? ' active' : ''}${step > i + 1 ? ' done' : ''}`}
          >
            <span className="step-num">{step > i + 1 ? '✓' : toFaDigits(i + 1)}</span>
            {label}
          </div>
        ))}
      </div>

      {user && user.role !== 'CUSTOMER' && (
        <Alert kind="info">رزرو نوبت فقط برای حساب‌های مشتری فعال است.</Alert>
      )}

      <AsyncView
        loading={services.loading || specialists.loading}
        error={services.error || specialists.error}
        onRetry={() => {
          void services.reload();
          void specialists.reload();
        }}
      >
        <div className="stack">
          {/* 1. Service */}
          <section className="card">
            <div className="spread" style={{ marginBottom: 12 }}>
              <h2>۱. انتخاب خدمت</h2>
              {specialist && (
                <span className="muted small">خدمات {specialist.specialist.fullName}</span>
              )}
            </div>
            {serviceOptions.length ? (
              <div className="option-grid">
                {serviceOptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`option${s.id === serviceId ? ' selected' : ''}`}
                    onClick={() => chooseService(s.id)}
                  >
                    <strong>{s.title}</strong>
                    <span className="muted small">{formatDuration(s.durationMinutes)}</span>
                    <span className="price small">{formatPrice(s.priceAmount)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <Empty title="خدمتی برای رزرو موجود نیست" />
            )}
          </section>

          {/* 2. Specialist */}
          {service && (
            <section className="card">
              <h2 style={{ marginBottom: 12 }}>۲. انتخاب متخصص</h2>
              {specialistOptions.length ? (
                <div className="option-grid">
                  {specialistOptions.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      className={`option${sp.id === specialistId ? ' selected' : ''}`}
                      onClick={() => update({ specialist: sp.id })}
                    >
                      <strong>{sp.specialist.fullName}</strong>
                      <span className="muted small">
                        {toFaDigits(sp.yearsExperience)} سال سابقه
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty title="فعلاً متخصصی این خدمت را ارائه نمی‌دهد" />
              )}
            </section>
          )}

          {/* 3. Day & time */}
          {service && specialist && (
            <section className="card">
              <h2 style={{ marginBottom: 12 }}>۳. انتخاب روز و ساعت</h2>
              {hours.loading ? (
                <Spinner block />
              ) : hours.error ? (
                <Alert>{hours.error}</Alert>
              ) : !hours.data?.some((h) => h.isWorking) ? (
                <Empty title="این متخصص هنوز ساعات کاری ثبت نکرده است" />
              ) : (
                <>
                  <div className="day-strip">
                    {days.map((d) => {
                      const h = hoursFor(d);
                      const available = buildSlots(d, h, service.durationMinutes).length > 0;
                      return (
                        <button
                          key={d.toISOString()}
                          type="button"
                          disabled={!available}
                          className={`day${day && sameDay(day, d) ? ' selected' : ''}`}
                          onClick={() => {
                            setDay(d);
                            setSlot(null);
                            setError(null);
                          }}
                        >
                          <small>{dayLabel(JS_DAY_TO_ENUM[d.getDay()])}</small>
                          {formatShortDate(d)}
                        </button>
                      );
                    })}
                  </div>

                  {day && (
                    <div style={{ marginTop: 16 }}>
                      <p className="muted small">
                        ساعات کاری: {toFaDigits(hoursFor(day)!.startTime)} تا{' '}
                        {toFaDigits(hoursFor(day)!.endTime)}
                      </p>
                      <div className="slot-grid">
                        {slots.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`slot${slot === t ? ' selected' : ''}`}
                            onClick={() => {
                              setSlot(t);
                              setError(null);
                            }}
                          >
                            {toFaDigits(fromMinutes(t))}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* 4. Confirm */}
          {service && specialist && day && slot !== null && (
            <section className="card">
              <h2 style={{ marginBottom: 12 }}>۴. تأیید نهایی</h2>
              <div className="summary">
                <div className="summary-row">
                  <span className="muted">خدمت</span>
                  <strong>{service.title}</strong>
                </div>
                <div className="summary-row">
                  <span className="muted">متخصص</span>
                  <strong>{specialist.specialist.fullName}</strong>
                </div>
                <div className="summary-row">
                  <span className="muted">زمان</span>
                  <strong>
                    {formatDate(day)} — ساعت {toFaDigits(fromMinutes(slot))} تا{' '}
                    {toFaDigits(fromMinutes(slot + service.durationMinutes))}
                  </strong>
                </div>
                <div className="summary-row">
                  <span className="muted">هزینه</span>
                  <strong className="price">{formatPrice(service.priceAmount)}</strong>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <Alert>{error}</Alert>
                {!user ? (
                  <Link to={loginLink} className="btn btn-primary">
                    برای ثبت نوبت وارد شوید
                  </Link>
                ) : (
                  <Button
                    onClick={confirm}
                    loading={submitting}
                    disabled={user.role !== 'CUSTOMER'}
                  >
                    ثبت نوبت
                  </Button>
                )}
              </div>
            </section>
          )}
        </div>
      </AsyncView>
    </>
  );
}
