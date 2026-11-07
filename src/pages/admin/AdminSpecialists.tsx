import { useState } from 'react';
import { Link } from 'react-router-dom';
import { servicesApi, specialistsApi } from '../../api/endpoints';
import type { AdminSpecialist, SalonService } from '../../api/types';
import { Dialog } from '../../components/Dialog';
import { Alert, AsyncView, Button, Empty, PageHeader } from '../../components/ui';
import { formatPrice, toFaDigits } from '../../lib/format';
import { errorText, useAsync } from '../../lib/useAsync';

export function AdminSpecialists() {
  const specialists = useAsync(() => specialistsApi.adminList());
  const services = useAsync(() => servicesApi.list());
  const [editing, setEditing] = useState<AdminSpecialist | null>(null);

  return (
    <>
      <PageHeader
        title="متخصص‌ها"
        subtitle="خدماتی که هر متخصص ارائه می‌دهد را تعیین کن."
      />
      <Alert kind="info">
        برای افزودن متخصص جدید: کاربر ثبت‌نام کند، در صفحه{' '}
        <Link to="/admin/users">کاربران</Link> نقشش را «متخصص» کن، سپس خودش با ورود به حسابش
        پروفایل متخصص را بسازد تا اینجا نمایش داده شود.
      </Alert>

      <AsyncView
        loading={specialists.loading}
        error={specialists.error}
        onRetry={specialists.reload}
      >
        {specialists.data?.length ? (
          <div className="grid">
            {specialists.data.map((sp) => (
              <article key={sp.id} className="card service-card">
                <div className="spread">
                  <div className="row">
                    <span className="avatar">{sp.specialist.fullName.charAt(0)}</span>
                    <div>
                      <h3>{sp.specialist.fullName}</h3>
                      <div className="muted small ltr">{sp.specialist.email}</div>
                    </div>
                  </div>
                </div>
                <div className="muted small">
                  {toFaDigits(sp.yearsExperience)} سال سابقه
                  {!sp.specialist.isActive && ' · غیرفعال'}
                  {sp.specialist.role !== 'SPECIALIST' && ' · نقش متخصص ندارد'}
                </div>
                {sp.services.length ? (
                  <div className="chips">
                    {sp.services.map((s) => (
                      <span key={s.id} className="chip">
                        {s.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="muted small">هنوز خدمتی ندارد</span>
                )}
                <Button small variant="secondary" onClick={() => setEditing(sp)}>
                  تعیین خدمات
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="هنوز پروفایل متخصصی ساخته نشده" />
        )}
      </AsyncView>

      {editing && (
        <AssignServices
          specialist={editing}
          services={services.data ?? []}
          loadingServices={services.loading}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void specialists.reload();
          }}
        />
      )}
    </>
  );
}

function AssignServices({
  specialist,
  services,
  loadingServices,
  onClose,
  onSaved,
}: {
  specialist: AdminSpecialist;
  services: SalonService[];
  loadingServices: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState(() => new Set(specialist.services.map((s) => s.id)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await specialistsApi.setServices(specialist.id, [...selected]);
      onSaved();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title={`خدمات ${specialist.specialist.fullName}`} onClose={onClose}>
      <Alert>{error}</Alert>
      {loadingServices ? (
        <p className="muted">در حال بارگذاری…</p>
      ) : services.length ? (
        <div className="stack" style={{ gap: 10 }}>
          {services.map((s) => (
            <label key={s.id} className="checkbox spread" style={{ display: 'flex' }}>
              <span className="row">
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                {s.title}
              </span>
              <span className="muted small">{formatPrice(s.priceAmount)}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="muted">
          هنوز خدمتی تعریف نشده. <Link to="/admin/services">افزودن خدمت</Link>
        </p>
      )}
      <div className="row" style={{ marginTop: 20 }}>
        <Button onClick={save} loading={busy} disabled={loadingServices}>
          ذخیره
        </Button>
        <Button variant="ghost" onClick={onClose}>
          انصراف
        </Button>
      </div>
    </Dialog>
  );
}
