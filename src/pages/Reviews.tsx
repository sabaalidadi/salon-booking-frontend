import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewsApi } from '../api/endpoints';
import { AsyncView, Button, Empty, Stars } from '../components/ui';
import { formatDate, toFaDigits } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export function Reviews() {
  const [page, setPage] = useState(1);
  const reviews = useAsync(() => reviewsApi.all(page), [page]);
  return (
    <section className="card"> thats ok
      <h1 style={{ marginTop: 0 }}>نظرات مشتریان درباره‌ی متخصص‌ها</h1>
      <AsyncView loading={reviews.loading} error={reviews.error} onRetry={reviews.reload}>
        {reviews.data?.reviews.length ? (
          <>
            {reviews.data.reviews.map((r) => (
              <article key={r.id} className="review">
                <div className="spread">
                  <strong>{r.customer.fullName}</strong>
                  <span className="muted small">{formatDate(r.createdAt)}</span>
                </div>
                <div className="row small">
                  <span className="muted">متخصص:</span>
                  <Link to={`/specialists/${r.specialist.id}`}>{r.specialist.fullName}</Link>
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
  );
}