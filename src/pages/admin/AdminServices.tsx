import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { categoriesApi, servicesApi } from '../../api/endpoints';
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
  Select,
  Textarea,
} from '../../components/ui';
import { formatDuration, formatPrice } from '../../lib/format';
import { errorText, useAsync } from '../../lib/useAsync';

type Editing = SalonService | 'new' | null;

export function AdminServices() {
  const { data, loading, error, reload } = useAsync(() => servicesApi.list());
  const cats = useAsync(() => categoriesApi.list());
  const catLabel = (id: string | null) => cats.data?.find((c) => c.id === id)?.label ?? '—';
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
                  <th>دسته‌بندی</th>
                  <th>مدت</th>
                  <th>قیمت</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="row">
                        {s.imageUrl && (
                          <img
                            src={s.imageUrl}
                            alt=""
                            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }}
                          />
                        )}
                        <div>
                          <strong>{s.title}</strong>
                          {s.description && <div className="muted small">{s.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{catLabel(s.categoryId)}</td>
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
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? '');
  const categories = useAsync(() => categoriesApi.list());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const shownImage = preview ?? (removeImage ? null : service?.imageUrl ?? null);

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
      categoryId: categoryId || null,
    };

    setBusy(true);
    setError(null);
    try {
      const saved = service
        ? await servicesApi.update(service.id, dto)
        : await servicesApi.create(dto);
      if (removeImage && service?.imageUrl && !file) await servicesApi.removeImage(saved.id);
      if (file) await servicesApi.uploadImage(saved.id, file);
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
        <Field label="دسته‌بندی">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">بدون دسته‌بندی</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="توضیحات (اختیاری)">
          <Textarea
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="عکس (اختیاری، حداکثر ۲ مگابایت)">
          <div className="row">
            {shownImage && (
              <img
                src={shownImage}
                alt=""
                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }}
              />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f && f.size > 2 * 1024 * 1024) {
                  e.target.value = '';
                  return setError('حجم عکس باید کمتر از ۲ مگابایت باشد');
                }
                setError(null);
                setFile(f);
              }}
            />
            {shownImage && (
              <Button
                type="button"
                small
                variant="danger"
                onClick={() => {
                  setFile(null);
                  setRemoveImage(true);
                }}
              >
                حذف عکس
              </Button>
            )}
          </div>
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
