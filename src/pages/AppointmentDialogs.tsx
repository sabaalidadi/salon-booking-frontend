import { useState } from 'react';
import { appointmentsApi, reviewsApi, specialistsApi } from '../api/endpoints';
import type { CustomerAppointment } from '../api/types';
import { Dialog } from '../components/Dialog';
import { Alert, Button, Field, Spinner, Stars, Textarea } from '../components/ui';
import { toFaDigits } from '../lib/format';
import { errorText, useAsync } from '../lib/useAsync';

const todayStr = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function CancelDialog({
  appt,
  onClose,
  onDone,
}: {
  appt: CustomerAppointment;
  onClose: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await appointmentsApi.cancel(appt.id);
      onDone();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="لغو نوبت" onClose={onClose}>
      <p>آیا از لغو نوبت «{appt.service?.title}» مطمئن هستید؟</p>
      <Alert>{error}</Alert>
      <div className="row">
        <Button variant="danger" loading={busy} onClick={submit}>
          بله، لغو شود
        </Button>
        <Button variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </Dialog>
  );
}

export function RescheduleDialog({
  appt,
  onClose,
  onDone,
}: {
  appt: CustomerAppointment;
  onClose: () => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState(todayStr());
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avail = useAsync(
    () => specialistsApi.availability(appt.specialistId, date, appt.serviceId),
    [date],
  );

  async function submit() {
    if (!slot) return;
    setBusy(true);
    setError(null);
    try {
      await appointmentsApi.reschedule(appt.id, slot);
      onDone();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="تغییر زمان نوبت" onClose={onClose}>
      <div className="form">
        <Field label="روز">
          <input
            className="input"
            type="date"
            min={todayStr()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSlot(null);
            }}
          />
        </Field>

        {avail.loading ? (
          <Spinner block />
        ) : avail.error ? (
          <Alert>{avail.error}</Alert>
        ) : avail.data?.slots.length ? (
          <div className="slot-grid">
            {avail.data.slots.map((s) => (
              <button
                key={s.startTime}
                type="button"
                className={`slot${slot === s.startTime ? ' selected' : ''}`}
                onClick={() => setSlot(s.startTime)}
              >
                {toFaDigits(s.label)}
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">در این روز زمان خالی وجود ندارد.</p>
        )}

        <Alert>{error}</Alert>
        <div className="row">
          <Button loading={busy} disabled={!slot} onClick={submit}>
            ثبت زمان جدید
          </Button>
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export function ReviewDialog({
  appt,
  onClose,
  onDone,
}: {
  appt: CustomerAppointment;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await reviewsApi.create({
        appointmentId: appt.id,
        rating,
        comment: comment.trim() || undefined,
      });
      onDone();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="ثبت نظر" onClose={onClose}>
      <div className="form">
        <p className="muted" style={{ margin: 0 }}>
          {appt.service?.title} · {appt.specialist?.user?.fullName}
        </p>
        <Stars value={rating} onChange={setRating} />
        <Field label="نظر شما (اختیاری)">
          <Textarea maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
        <Alert>{error}</Alert>
        <div className="row">
          <Button loading={busy} onClick={submit}>
            ثبت نظر
          </Button>
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
