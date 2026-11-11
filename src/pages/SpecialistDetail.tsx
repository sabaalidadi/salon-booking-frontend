import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { reviewsApi, specialistsApi } from '../api/endpoints';
import { AsyncView, Button, Empty, PersonAvatar, Stars } from '../components/ui';
import { formatDate, toFaDigits } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export function SpecialistDetail() {
  const { id = '' } = useParams();
  const [page, setPage] = useState(1);
  const profile = useAsync(() => specialistsApi.get(id), [id]);
  const reviews = useAsync(() => reviewsApi.forSpecialist(id, page), [id, page]);

  return (
    <AsyncView loading={profile.loading} error={profile.error} onRetry={profile.reload}>
      {profile.data && (
        <div className="stack">
          <section className="card profile-head">
            <PersonAvatar name={profile.data.specialist.fullName} url={profile.data.avatarUrl} size={88} />
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0 }}>{profile.data.specialist.fullName}</h1>
              <div className="muted small">{toFaDigits(profile.data.yearsExperience)} سال سابقه</div>
              {reviews.data && (
                <div className="row" style={{ marginTop: 6 }}>
                  <Stars value={reviews.data.averageRating ?? 0} />
                  <span className="small muted">
                    {reviews.data.averageRating != null ? toFaDigits(reviews.data.averageRating) : 'بدون امتیاز'} (
                    {toFaDigits(reviews.data.totalReviews)} نظر)
                  </span>
                </div>
              )}
            </div>
            {profile.data.services.length > 0 && (
              <Link to={`/book?specialist=${profile.data.id}`} className="btn btn-primary">
                رزرو نوبت
              </Link>
            )}
          </section>

          <section className="card">
            <h2>درباره</h2>
            <p>{profile.data.bio}</p>
            <div className="chips">
              {profile.data.services.map((s) => (
                <span key={s.id} className="chip">
                  {s.name}
                </span>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>نظرات مشتریان</h2>
            <AsyncView loading={reviews.loading} error={reviews.error} onRetry={reviews.reload}>
              {reviews.data?.reviews.length ? (
                <>
                  {reviews.data.reviews.map((r) => (
                    <article key={r.id} className="review">
                      <div className="spread">
                        <strong>{r.customer.fullName}</strong>
                        <span className="muted small">{formatDate(r.createdAt)}</span>
                      </div>
                      <Stars value={r.rating} />
                      {r.comment && <p style={{ margin: '6px 0 0' }}>{r.comment}</p>}
                    </article>
                  ))}
                  {reviews.data.totalPages > 1 && (
                    <div className="row" style={{ marginTop: 12 }}>
                      <Button small variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        قبلی
                      </Button>
                      <span className="small muted">
                        {toFaDigits(page)} از {toFaDigits(reviews.data.totalPages)}
                      </span>
                      <Button
                        small
                        variant="ghost"
                        disabled={page >= reviews.data.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        بعدی
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Empty title="هنوز نظری ثبت نشده" />
              )}
            </AsyncView>
          </section>
        </div>
      )}
    </AsyncView>
  );
}
