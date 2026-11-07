import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { specialistsApi } from '../../api/endpoints';
import type { WorkingHourInput } from '../../api/types';
import { Alert, AsyncView, Button, Empty, Input, PageHeader, Spinner } from '../../components/ui';
import { WEEK_DAYS, dayLabel, toMinutes } from '../../lib/format';
import { errorText } from '../../lib/useAsync';
import { useMyProfile } from './useMyProfile';

const defaultSchedule = (): WorkingHourInput[] =>
  WEEK_DAYS.map(({ key }) => ({
    dayOfWeek: key,
    startTime: '09:00',
    endTime: '18:00',
    isWorking: key !== 'FRIDAY',
  }));

export function WorkingHours() {
  const { profile, missing, loading, error, reload } = useMyProfile();
  const [schedule, setSchedule] = useState<WorkingHourInput[]>(defaultSchedule);
  const [loadingHours, setLoadingHours] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setLoadingHours(true);
    specialistsApi
      .workingHours(profile.id)
      .then((saved) => {
        if (!saved.length) return;
        // Merge saved rows onto the full week so every day is editable.
        setSchedule(
          defaultSchedule().map((d) => {
            const s = saved.find((x) => x.dayOfWeek === d.dayOfWeek);
            return s
              ? { dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isWorking: s.isWorking }
              : { ...d, isWorking: false };
          }),
        );
      })
      .catch((e) => setMessage({ kind: 'error', text: errorText(e) }))
      .finally(() => setLoadingHours(false));
  }, [profile]);

  function patch(i: number, change: Partial<WorkingHourInput>) {
    setSchedule((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...change } : r)));
    setMessage(null);
  }

  async function save() {
    const invalid = schedule.find((r) => r.isWorking && toMinutes(r.startTime) >= toMinutes(r.endTime));
    if (invalid) {
      return setMessage({
        kind: 'error',
        text: `در روز ${dayLabel(invalid.dayOfWeek)} ساعت پایان باید بعد از ساعت شروع باشد`,
      });
    }

    setBusy(true);
    setMessage(null);
    try {
      await specialistsApi.setMyWorkingHours(schedule);
      setMessage({ kind: 'success', text: 'ساعات کاری ذخیره شد' });
    } catch (e) {
      setMessage({ kind: 'error', text: errorText(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="ساعات کاری هفتگی"
        subtitle="مشتری‌ها فقط در این بازه‌ها می‌توانند با تو نوبت بگیرند."
      />
      <AsyncView loading={loading} error={error} onRetry={reload}>
        {missing ? (
          <Empty title="اول پروفایل متخصص را بساز">
            <Link to="/specialist/profile">ساخت پروفایل</Link>
          </Empty>
        ) : loadingHours ? (
          <Spinner block />
        ) : (
          <div className="card" style={{ maxWidth: 720 }}>
            {message && <Alert kind={message.kind}>{message.text}</Alert>}
            {schedule.map((row, i) => (
              <div key={row.dayOfWeek} className="hours-row">
                <strong>{dayLabel(row.dayOfWeek)}</strong>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={row.isWorking}
                    onChange={(e) => patch(i, { isWorking: e.target.checked })}
                  />
                  {row.isWorking ? 'باز' : 'تعطیل'}
                </label>
                <div className="hours-times">
                  <Input
                    type="time"
                    aria-label={`شروع ${dayLabel(row.dayOfWeek)}`}
                    value={row.startTime}
                    disabled={!row.isWorking}
                    onChange={(e) => patch(i, { startTime: e.target.value })}
                  />
                  <span className="muted">تا</span>
                  <Input
                    type="time"
                    aria-label={`پایان ${dayLabel(row.dayOfWeek)}`}
                    value={row.endTime}
                    disabled={!row.isWorking}
                    onChange={(e) => patch(i, { endTime: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <Button onClick={save} loading={busy}>
                ذخیره ساعات کاری
              </Button>
            </div>
          </div>
        )}
      </AsyncView>
    </>
  );
}
