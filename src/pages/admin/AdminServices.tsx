import { useState, type FormEvent } from 'react';
import { servicesApi } from '../../api/endpoints';
import type { SalonService } from '../../api/types';
import { Dialog } from '../../components/Dialog';
import {
  Alert,
  AsyncView,
  Button,
  Empty,
  Field,
  Input,
  PageHeader,
  Textarea,
} from '../../components/ui';
import { formatDuration, formatPrice } from '../../lib/format';
import { errorText, useAsync } from '../../lib/useAsync';

type Editing = SalonService | 'new' | null;

export function AdminServices() {
  const { data, loading, error, reload } = useAsync(() => servicesApi.list());
  const [editing, setEditing] = useState<Editing>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function remove(s: SalonService) {
    if (!confirm(`خدمت «${s.title}» حذف شود؟`)) return;
    setActionError(null);
    try {
      await servicesApi.remove(s.id);
      await reload();
    } catch (e) {
      setActionError(errorText(e));
    }
  }

  return (
    <>
      <PageHeader
        title="مدیریت خدمات"
        subtitle="خدماتی که مشتری‌ها می‌توانند رزرو کنند."
        actions={<Button onClick={() => setEditing('new')}>افزودن خدمت</Button>}
      />
      <Alert>{actionError}</Alert>

      <AsyncView loading={loading} error={error} onRetry={reload}>
        {data?.length ? (
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>مدت</th>
                  <th>قیمت</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.title}</strong>
                      {s.description && <div className="muted small">{s.description}</div>}
                    </td>
                    <td>{formatDuration(s.durationMinutes)}</td>
                    <td className="price">{formatPrice(s.priceAmount)}</td>
                    <td>
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        <Button small variant="ghost" onClick={() => setEditing(s)}>
                          ویرایش
                        </Button>
                        <Button small variant="danger" onClick={() => remove(s)}>
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="هنوز خدمتی ثبت نشده">اولین خدمت سالن را اضافه کن.</Empty>
        )}
      </AsyncView>

      {editing && (
        <ServiceForm
          service={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
    </>
  );
}

function ServiceForm({
  service,
  onClose,
  onSaved,
}: {
  service: SalonService | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(service?.title ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [duration, setDuration] = useState(String(service?.durationMinutes ?? 60));
  const [price, setPrice] = useState(String(service?.priceAmount ?? ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const durationMinutes = Number(duration);
    const priceAmount = Number(price);
    if (!title.trim()) return setError('عنوان لازم است');
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440)
      return setError('مدت باید عددی بین ۱ تا ۱۴۴۰ دقیقه باشد');
    if (!Number.isInteger(priceAmount) || priceAmount < 0) return setError('قیمت نامعتبر است');

    const dto = {
      title: title.trim(),
      description: description.trim() || null,
      durationMinutes,
      priceAmount,
    };

    setBusy(true);
    setError(null);
    try {
      if (service) await servicesApi.update(service.id, dto);
      else await servicesApi.create(dto);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title={service ? 'ویرایش خدمت' : 'خدمت جدید'} onClose={onClose}>
      <Alert>{error}</Alert>
      <form className="form" onSubmit={onSubmit}>
        <Field label="عنوان">
          <Input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="توضیحات (اختیاری)">
          <Textarea
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="form-grid">
          <Field label="مدت (دقیقه)">
            <Input
              type="number"
              min={1}
              max={1440}
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </Field>
          <Field label="قیمت (تومان)">
            <Input
              type="number"
              min={0}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
        </div>
        <div className="row">
          <Button type="submit" loading={busy}>
            {service ? 'ذخیره' : 'افزودن'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
