import { useState, type FormEvent } from 'react';
import { categoriesApi } from '../../api/endpoints';
import type { Category } from '../../api/types';
import { Dialog } from '../../components/Dialog';
import { Alert, AsyncView, Button, Empty, Field, Input, PageHeader } from '../../components/ui';
import { errorText, useAsync } from '../../lib/useAsync';

type Editing = Category | 'new' | null;

export function AdminCategories() {
  const { data, loading, error, reload } = useAsync(() => categoriesApi.list());
  const [editing, setEditing] = useState<Editing>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function remove(c: Category) {
    if (!confirm(`دسته‌بندی «${c.label}» حذف شود؟`)) return;
    setActionError(null);
    try {
      await categoriesApi.remove(c.id);
      await reload();
    } catch (e) {
      setActionError(errorText(e));
    }
  }

  return (
    <>
      <PageHeader
        title="مدیریت دسته‌بندی‌ها"
        subtitle="دسته‌بندی‌هایی که در صفحه اصلی و رزرو نمایش داده می‌شوند."
        actions={<Button onClick={() => setEditing('new')}>افزودن دسته‌بندی</Button>}
      />
      <Alert>{actionError}</Alert>

      <AsyncView loading={loading} error={error} onRetry={reload}>
        {data?.length ? (
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>آیکون</th>
                  <th>عنوان</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id}>
                    <td>{c.icon}</td>
                    <td>
                      <strong>{c.label}</strong>
                    </td>
                    <td>
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        <Button small variant="ghost" onClick={() => setEditing(c)}>
                          ویرایش
                        </Button>
                        <Button small variant="danger" onClick={() => remove(c)}>
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
          <Empty title="هنوز دسته‌بندی‌ای ثبت نشده">اولین دسته‌بندی را اضافه کن.</Empty>
        )}
      </AsyncView>

      {editing && (
        <CategoryForm
          category={editing === 'new' ? null : editing}
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

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(category?.label ?? '');
  const [icon, setIcon] = useState(category?.icon ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) return setError('عنوان لازم است');
    const dto = { label: label.trim(), icon: icon.trim() || null };
    setBusy(true);
    setError(null);
    try {
      if (category) await categoriesApi.update(category.id, dto);
      else await categoriesApi.create(dto);
      onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title={category ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'} onClose={onClose}>
      <Alert>{error}</Alert>
      <form className="form" onSubmit={onSubmit}>
        <Field label="عنوان">
          <Input required maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="آیکون (ایموجی، اختیاری)">
          <Input maxLength={16} value={icon} onChange={(e) => setIcon(e.target.value)} />
        </Field>
        <div className="row">
          <Button type="submit" loading={busy}>
            {category ? 'ذخیره' : 'افزودن'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
