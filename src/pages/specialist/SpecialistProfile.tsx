import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { specialistsApi } from '../../api/endpoints';
import { Alert, AsyncView, Button, Field, Input, PageHeader, PersonAvatar, Textarea } from '../../components/ui';
import { errorText } from '../../lib/useAsync';
import { useMyProfile } from './useMyProfile';

export function SpecialistProfilePage() {
  const { profile, setProfile, missing, setMissing, loading, error, reload } = useMyProfile();
  const [bio, setBio] = useState('');
  const [years, setYears] = useState('0');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio);
      setYears(String(profile.yearsExperience));
    }
  }, [profile]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const yearsExperience = Number(years);
    if (bio.trim().length < 10) {
      return setMessage({ kind: 'error', text: 'معرفی باید حداقل ۱۰ کاراکتر باشد' });
    }
    if (!Number.isInteger(yearsExperience) || yearsExperience < 0 || yearsExperience > 60) {
      return setMessage({ kind: 'error', text: 'سابقه باید عددی بین ۰ تا ۶۰ باشد' });
    }

    setBusy(true);
    try {
      const dto = { bio: bio.trim(), yearsExperience };
      const saved = missing
        ? await specialistsApi.createMine(dto)
        : await specialistsApi.updateMine(dto);
      setProfile(saved);
      setMissing(false);
      setMessage({
        kind: 'success',
        text: missing ? 'پروفایل ساخته شد. حالا ساعات کاری‌ات را تنظیم کن.' : 'تغییرات ذخیره شد',
      });
    } catch (err) {
      setMessage({ kind: 'error', text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="پروفایل متخصص"
        subtitle="این اطلاعات به مشتری‌ها در صفحه اصلی نمایش داده می‌شود."
      />
      <AsyncView loading={loading} error={error} onRetry={reload}>
        <div className="card" style={{ maxWidth: 640 }}>
          {missing && (
            <Alert kind="info">
              هنوز پروفایل متخصص نساخته‌ای. برای اینکه مشتری‌ها بتوانند با تو نوبت بگیرند، اول
              پروفایلت را بساز.
            </Alert>
          )}
          {message && <Alert kind={message.kind}>{message.text}</Alert>}

          <form className="form" onSubmit={onSubmit}>
            <Field label="معرفی کوتاه" hint="بین ۱۰ تا ۱۰۰۰ کاراکتر">
              <Textarea
                required
                minLength={10}
                maxLength={1000}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </Field>
            <Field label="سال‌های سابقه">
              <Input
                type="number"
                min={0}
                max={60}
                required
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            </Field>
            <div>
              <Button type="submit" loading={busy}>
                {missing ? 'ساخت پروفایل' : 'ذخیره تغییرات'}
              </Button>
            </div>
          </form>
        </div>

        {profile && (
          <div className="card" style={{ maxWidth: 640 }}>
            <h2>عکس پروفایل</h2>
            <div className="row">
              <PersonAvatar name={profile.specialist.fullName} url={profile.avatarUrl} size={72} />
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setBusy(true);
                  setMessage(null);
                  try {
                    setProfile(await specialistsApi.uploadAvatar(file));
                    setMessage({ kind: 'success', text: 'عکس پروفایل ذخیره شد' });
                  } catch (err) {
                    setMessage({ kind: 'error', text: errorText(err) });
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              {profile.avatarUrl && (
                <Button
                  small
                  variant="danger"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      setProfile(await specialistsApi.removeAvatar());
                    } catch (err) {
                      setMessage({ kind: 'error', text: errorText(err) });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  حذف عکس
                </Button>
              )}
            </div>
          </div>
        )}

        {profile && (
          <div className="card" style={{ maxWidth: 640 }}>
            <h2>خدمات من</h2>
            {profile.services.length ? (
              <div className="chips">
                {profile.services.map((s) => (
                  <span key={s.id} className="chip">
                    {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted">
                هنوز خدمتی به تو اختصاص داده نشده است. خدمات توسط مدیر سالن تعیین می‌شوند.
              </p>
            )}
            <p className="muted small" style={{ marginTop: 12 }}>
              <Link to="/specialist/hours">تنظیم ساعات کاری ←</Link>
            </p>
          </div>
        )}
      </AsyncView>
    </>
  );
}
