# salon-booking-web

فرانت‌اند سامانه رزرو نوبت سالن زیبایی؛ کلاینت [`salon-booking-api`](../salon-booking-api) (NestJS).

**React 19 + Vite + TypeScript + React Router** — رابط فارسی و راست‌به‌چپ، تقویم شمسی، پشتیبانی از حالت تاریک.

## اجرا

```bash
npm install
npm run dev        # http://localhost:5173
```

بک‌اند باید روی `http://localhost:3000` در حال اجرا باشد. برای آدرس دیگر، فایل `.env` بسازید:

```bash
cp .env.example .env
# VITE_API_PROXY_TARGET=http://localhost:4000
```

| دستور | کار |
| --- | --- |
| `npm run dev` | سرور توسعه |
| `npm run build` | بررسی تایپ و ساخت نسخه production در `dist/` |
| `npm run preview` | پیش‌نمایش build |
| `npm run typecheck` | فقط بررسی تایپ |

## نحوه اتصال به API

- تمام درخواست‌ها به `/api/...` فرستاده می‌شوند و Vite آن‌ها را به بک‌اند proxy می‌کند.
  به همین دلیل فرانت و بک‌اند از دید مرورگر **هم‌مبدأ** هستند و کوکی‌های `httpOnly`
  (`accessToken` و `refreshToken`) بدون تنظیم CORS کار می‌کنند.
- پاسخ‌ها با فرمت `{ success, statusCode, message, data }` از `TransformInterceptor` می‌آیند
  و کلاینت فقط `data` را برمی‌گرداند (`src/api/client.ts`).
- با خطای `401`، کلاینت یک بار `POST /api/auth/refresh` را صدا می‌زند و درخواست را تکرار می‌کند.

> **Production:** فرانت را پشت همان دامنه‌ی API سرو کنید (مثلاً Nginx: `/` → `dist/` و `/api` → بک‌اند).
> اگر روی دامنه جدا باشند، باید CORS با `credentials: true` در بک‌اند فعال و تنظیمات `sameSite` کوکی‌ها بازبینی شود.

## نقش‌ها و صفحات

| نقش | صفحات |
| --- | --- |
| مهمان | خانه (خدمات و متخصص‌ها)، رزرو (تا مرحله تأیید)، ورود، ثبت‌نام |
| مشتری | رزرو نوبت، نوبت‌های من، حساب کاربری |
| متخصص | نوبت‌ها (تأیید / لغو / انجام شد)، ساعات کاری هفتگی، پروفایل متخصص |
| مدیر | مدیریت خدمات، تعیین خدمات متخصص‌ها، کاربران و تغییر نقش |

### راه‌اندازی اولیه

1. **اولین مدیر:** ثبت‌نام همیشه با نقش `CUSTOMER` است. یک کاربر را مستقیم در دیتابیس مدیر کنید:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
   ```
2. مدیر در «خدمات» خدمات سالن را اضافه می‌کند.
3. متخصص ثبت‌نام می‌کند ← مدیر در «کاربران» نقش او را «متخصص» می‌کند.
4. متخصص وارد می‌شود، **پروفایل متخصص** و **ساعات کاری** را ثبت می‌کند.
5. مدیر در «متخصص‌ها» خدمات آن متخصص را تعیین می‌کند.
6. حالا مشتری‌ها می‌توانند نوبت بگیرند.

## ساختار

```
src/
  api/          client.ts (fetch + refresh)، endpoints.ts، types.ts
  auth/         AuthContext، RequireRole (گارد مسیر)
  components/   Layout، Dialog، اجزای UI
  lib/          فرمت‌دهی (اعداد/تاریخ فارسی)، useAsync
  pages/        صفحات عمومی و مشتری
    specialist/ صفحات متخصص
    admin/      صفحات مدیر
```
