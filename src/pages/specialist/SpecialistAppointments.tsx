import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { appointmentsApi } from '../../api/endpoints';
import type { AppointmentStatus, SpecialistAppointment } from '../../api/types';
import { Alert, Button, Empty, PageHeader, Spinner, StatusBadge } from '../../components/ui';
import { formatDate, formatShortDate, formatTime, formatPrice, toFaDigits } from '../../lib/format';
import { errorText, useAsync } from '../../lib/useAsync';

type Filter = 'pending' | 'upcoming' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'در انتظار تأیید' },
  { key: 'upcoming', label: 'پیش‌رو' },
  { key: 'all', label: 'همه' },
];

export function SpecialistAppointments() {
  const { data, setData, loading, error, reload } = useAsync(async () => {
    try {
      return await appointmentsApi.forSpecialist();
    } catch (e) {
      // 404 = no specialist profile yet
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  });
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function changeStatus(a: SpecialistAppointment, status: AppointmentStatus) {
    if (status === 'CANCELLED' && !confirm('این نوبت لغو شود؟')) return;
    setBusyId(a.id);
    setActionError(null);
    try {
      const updated = await appointmentsApi.setStatus(a.id, status);
      setData((list) => list?.map((x) => (x.id === a.id ? { ...x, status: updated.status } : x)) ?? null);
    } catch (e) {
      setActionError(errorText(e));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Spinner block />;
  if (error) return <Alert>{error}</Alert>;
  if (data === null) {
    return (
      <Empty title="پروفایل متخصص ساخته نشده">
        <Link to="/specialist/profile">ساخت پروفایل متخصص</Link>
      </Empty>
    );
  }

  const now = Date.now();
  const pendingCount = data.filter((a) => a.status === 'PENDING').length;
  const list = data
    .filter((a) => {
      if (filter === 'pending') return a.status === 'PENDING';
      if (filter === 'upcoming')
        return a.status === 'CONFIRMED' && new Date(a.endTime).getTime() >= now;
      return true;
    })
    .sort((a, b) =>
      filter === 'all' ? b.startTime.localeCompare(a.startTime) : a.startTime.localeCompare(b.startTime),
    );

  return (
    <>
      <PageHeader
        title="نوبت‌های من"
        subtitle="نوبت‌های جدید را تأیید یا لغو کن."
        actions={
          <Button variant="ghost" small onClick={reload}>
            به‌روزرسانی
          </Button>
        }
      />

      <div className="tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`tab${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'pending' && pendingCount > 0 && ` (${toFaDigits(pendingCount)})`}
          </button>
        ))}
      </div>

      <Alert>{actionError}</Alert>

      {list.length ? (
        <div className="stack">
          {list.map((a) => (
            <article key={a.id} className="card appt">
              <div className="appt-date">
                <strong>{formatTime(a.startTime)}</strong>
                <small>{formatShortDate(a.startTime)}</small>
              </div>
              <div>
                <div className="row">
                  <h3 style={{ margin: 0 }}>{a.service?.title}</h3>
                  <StatusBadge status={a.status} />
                </div>
                <div className="muted small">
                  {a.customer?.fullName} · {formatDate(a.startTime)} · تا {formatTime(a.endTime)}
                </div>
                {a.service && <div className="price small">{formatPrice(a.service.priceAmount)}</div>}
              </div>
              <div className="appt-actions">
                {a.status === 'PENDING' && (
                  <Button small loading={busyId === a.id} onClick={() => changeStatus(a, 'CONFIRMED')}>
                    تأیید
                  </Button>
                )}
                {a.status === 'CONFIRMED' && (
                  <Button
                    small
                    variant="secondary"
                    loading={busyId === a.id}
                    onClick={() => changeStatus(a, 'COMPLETED')}
                  >
                    انجام شد
                  </Button>
                )}
                {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                  <Button
                    small
                    variant="danger"
                    disabled={busyId === a.id}
                    onClick={() => changeStatus(a, 'CANCELLED')}
                  >
                    لغو
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="نوبتی در این بخش نیست" />
      )}
    </>
  );
}
