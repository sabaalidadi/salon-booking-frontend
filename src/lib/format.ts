import type { AppointmentStatus, DayOfWeek, UserRole } from '../api/types';

const faNumber = new Intl.NumberFormat('fa-IR');

export const toFaDigits = (value: number | string) =>
  String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export const formatNumber = (n: number) => faNumber.format(n);

export const formatPrice = (amount: number) => `${faNumber.format(amount)} تومان`;

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${toFaDigits(h)} ساعت و ${toFaDigits(m)} دقیقه`;
  if (h) return `${toFaDigits(h)} ساعت`;
  return `${toFaDigits(m)} دقیقه`;
}

// fa-IR uses the Persian (Solar Hijri) calendar by default.
const dateFmt = new Intl.DateTimeFormat('fa-IR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFmt = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long',
});
const timeFmt = new Intl.DateTimeFormat('fa-IR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatDate = (d: Date | string) => dateFmt.format(new Date(d));
export const formatShortDate = (d: Date | string) =>
  shortDateFmt.format(new Date(d));
export const formatTime = (d: Date | string) => timeFmt.format(new Date(d));

/** Index matches JS Date#getDay() (0 = Sunday), same as the backend's mapping. */
export const JS_DAY_TO_ENUM: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

/** Iranian week order: Saturday first. */
export const WEEK_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'SATURDAY', label: 'شنبه' },
  { key: 'SUNDAY', label: 'یکشنبه' },
  { key: 'MONDAY', label: 'دوشنبه' },
  { key: 'TUESDAY', label: 'سه‌شنبه' },
  { key: 'WEDNESDAY', label: 'چهارشنبه' },
  { key: 'THURSDAY', label: 'پنجشنبه' },
  { key: 'FRIDAY', label: 'جمعه' },
];

export const dayLabel = (day: DayOfWeek) =>
  WEEK_DAYS.find((d) => d.key === day)?.label ?? day;

export const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: 'مشتری',
  SPECIALIST: 'متخصص',
  ADMIN: 'مدیر',
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'در انتظار تأیید',
  CONFIRMED: 'تأیید شده',
  CANCELLED: 'لغو شده',
  COMPLETED: 'انجام شده',
};

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
