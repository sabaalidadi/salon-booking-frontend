import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { appointmentsApi } from '../api/endpoints';
import { Alert, AsyncView, Empty, PageHeader, StatusBadge } from '../components/ui';
import { formatDate, formatPrice, formatShortDate, formatTime } from '../lib/format';
import { useAsync } from '../lib/useAsync';

type Filter = 'upcoming' | 'past';

export function MyAppointments() {
  const location = useLocation();
  const justBooked = (location.state as { booked?: boolean } | null)?.booked;
  const { data, loading, error, reload } = useAsync(() => appointmentsApi.mine());
  const [filter, setFilter] = useState<Filter>('upcoming');

  const now = Date.now();
  const list = (data ?? [])
    .filter((a) =>
      filter === 'upcoming'
        ? new Date(a.endTime).getTime() >= now && a.status !== 'CANCELLED'
        : new Date(a.endTime).getTime() < now || a.status === 'CANCELLED',
    )
    .sort((a, b) =>
      filter === 'upcoming'
        ? a.startTime.localeCompare(b.startTime)
        : b.startTime.localeCompare(a.startTime),
    );

  return (
    <>
      <PageHeader
        title="نوبت‌های من"
        actions={
          <Link to="/book" className="btn btn-primary">
            رزرو نوبت جدید
          </Link>
        }
      />

      {justBooked && (
        <Alert kind="success">
          نوبت شما ثبت شد و پس از تأیید متخصص قطعی می‌شود.
        </Alert>
      )}

      <div className="tabs">
        <button
          className={`tab${filter === 'upcoming' ? ' active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          پیش‌رو
        </button>
        <button
          className={`tab${filter === 'past' ? ' active' : ''}`}
          onClick={() => setFilter('past')}
        >
          گذشته و لغو شده
        </button>
      </div>

      <AsyncView loading={loading} error={error} onRetry={reload}>
        {list.length ? (
          <div className="stack">
            {list.map((a) => (
              <article key={a.id} className="card appt">
                <div className="appt-date">
                  <strong>{formatTime(a.startTime)}</strong>
                  <small>{formatShortDate(a.startTime)}</small>
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{a.service?.title}</h3>
                  <div className="muted small">
                    با {a.specialist?.user?.fullName} · {formatDate(a.startTime)} · تا{' '}
                    {formatTime(a.endTime)}
                  </div>
                  {a.service && (
                    <div className="price small">{formatPrice(a.service.priceAmount)}</div>
                  )}
                </div>
                <div className="appt-actions">
                  <StatusBadge status={a.status} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title={filter === 'upcoming' ? 'نوبت پیش‌رویی ندارید' : 'موردی نیست'}>
            {filter === 'upcoming' && <Link to="/book">همین حالا نوبت بگیرید</Link>}
          </Empty>
        )}
      </AsyncView>
    </>
  );
}
