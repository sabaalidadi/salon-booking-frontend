import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { appointmentsApi } from '../api/endpoints';
import type { CustomerAppointment } from '../api/types';
import { Alert, AsyncView, Button, Empty, PageHeader, StatusBadge } from '../components/ui';
import { CancelDialog, RescheduleDialog, ReviewDialog } from './AppointmentDialogs';
import { formatDate, formatPrice, formatShortDate, formatTime } from '../lib/format';
import { useAsync } from '../lib/useAsync';

type Filter = 'upcoming' | 'past';

export function MyAppointments() {
  const location = useLocation();
  const justBooked = (location.state as { booked?: boolean } | null)?.booked;
  const { data, loading, error, reload } = useAsync(() => appointmentsApi.mine());
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [dialog, setDialog] = useState<
    { kind: 'cancel' | 'reschedule' | 'review'; appt: CustomerAppointment } | null
  >(null);
  const [notice, setNotice] = useState<string | null>(null);

  const done = (text: string) => () => {
    setDialog(null);
    setNotice(text);
    void reload();
  };

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

      {notice && <Alert kind="success">{notice}</Alert>}

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
                  {(a.status === 'PENDING' || a.status === 'CONFIRMED') &&
                    new Date(a.startTime).getTime() > now && (
                      <>
                        <Button small variant="secondary" onClick={() => setDialog({ kind: 'reschedule', appt: a })}>
                          تغییر زمان
                        </Button>
                        <Button small variant="danger" onClick={() => setDialog({ kind: 'cancel', appt: a })}>
                          لغو
                        </Button>
                      </>
                    )}
                  {a.status === 'COMPLETED' && (
                    <Button small variant="secondary" onClick={() => setDialog({ kind: 'review', appt: a })}>
                      ثبت نظر
                    </Button>
                  )}
                  <Link to={`/specialists/${a.specialistId}`} className="btn btn-ghost btn-sm">
                    متخصص
                  </Link>
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

      {dialog && (
        <>
          {dialog.kind === 'cancel' && (
            <CancelDialog appt={dialog.appt} onClose={() => setDialog(null)} onDone={done('نوبت لغو شد.')} />
          )}
          {dialog.kind === 'reschedule' && (
            <RescheduleDialog appt={dialog.appt} onClose={() => setDialog(null)} onDone={done('زمان نوبت تغییر کرد.')} />
          )}
          {dialog.kind === 'review' && (
            <ReviewDialog appt={dialog.appt} onClose={() => setDialog(null)} onDone={done('نظر شما ثبت شد.')} />
          )}
        </>
      )}
    </>
  );
}
