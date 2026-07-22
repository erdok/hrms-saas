# HRMS SaaS - Final README

Cok-sirketli (multi-tenant), tip-guvenli, scalable HRMS SaaS.

Bu depo **Asama 0 -> Asama 7** tamamlanmistir.

## Moduller

- **Personel & Departman**: CRUD + audit log + TC sifreleme (pgcrypto)
- **Izinler**: Talep -> onay workflow + cakisma kontrolu + aylik takvim + Excel export
- **Puantaj**: Aylik editable grid + ay ozeti (G/R/I/T/B): statutory/auto holidays
- **Sablonlar**: HTML sablon CRUD + ornek token listesi
- **Belgeler**: render_template RPC + print-ready HTML cikti
- **Billing**: Stripe checkout + webhook + portal + invoices cache
- **Audit**: KVKK Madde 12 audit log viewer + diff jsonb
- **KVKK**: veri ihraci/silme endpoint + aydinlatma metni
- **Auth**: email/password + RLS tenant isolation

## Gereksinimler

- Node.js >= 20
- pnpm >= 9 (corepack enable)
- Supabase CLI + Docker Desktop

## Yerel calistirma

```powershell
corepack enable
corepack prepare pnpm@9 --activate
scoop install supabase

cd "C:\Users\W11\Documents\Default Project"
pnpm install
pnpm db:local          # Docker ile local Supabase'i baslat
pnpm db:reset         # 0001-0006 migrasyonlari uygula
pnpm db:types         # TypeScript tipleri yeniden uretilir
pnpm dev              # Next.js baslar
```

## .env.local ornegi

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_test_xxx (opsiyonel)
STRIPE_WEBHOOK_SECRET=whsec_xxx (opsiyonel)
```

## Migrasyonlar

| #           | Icerik                                                |
|-------------|--------------------------------------------------------|
| 0001_init   | 11 tablo + RLS + sign_up_company RPC                  |
| 0002_phase2 | Audit triggerlari + TC sifreleme + list_employees RPC |
| 0003_phase3 | Izin overlap + balance + notify_user                   |
| 0004_phase4 | Puantaj upsert/summary + public_holidays              |
| 0005_phase5 | Sablon + render_template RPC + storage bucket         |
| 0006_phase6 | Stripe price cache + invoices                         |

## Routes

| Yol                                      | Aciklama                              |
|-------------------------------------------|----------------------------------------|
| /                                         | Landing                                |
| /signup, /login                           | Sirket kaydi / giris                   |
| /                                         | Dashboard (oturum sonrasi)            |
| /employees                                | Personeller + modal                    |
| /departments                              | Departman CRUD                         |
| /leaves                                   | Izinler + takvim + Excel              |
| /attendance                               | Puantaj grid                           |
| /templates                                | Sablonlar                              |
| /documents                                | Belge olusturucu                       |
| /settings/billing                         | Stripe                                 |
| /settings/audit                           | Audit log diff                         |
| /settings/kvkk                            | KVKK paneli                            |
| /api/stripe/webhook                       | Stripe webhook                         |
| /api/stripe/checkout                      | Checkout start                         |
| /api/stripe/portal                        | Stripe portal                          |
| /api/documents/generate                   | PDF/onizleme                           |
| /api/export/leaves                        | ExcelJS download                       |
| /api/kvkk/subject-access                  | Veri ihraci/silme                      |

## Roller

| Role           | Yetkiler                                                  |
|----------------|-----------------------------------------------------------|
| super_admin    | Tum yetkiler                                              |
| company_admin  | Sirketini yonet                                          |
| hr_manager     | Personel/izin/puantaj/belge CRUD                          |
| employee       | Kendi verisi (read), kendi izni create                    |

## CI

GitHub Actions her push/PR'da: typecheck + lint + build.

## Known limitations

- Stripe test mode'tur: production icin live keys + planfiyatlarini `billing_prices` tablosuna tek tek girin.
- ExcelJS paketi ~200KB bundle; sadece export route handler tarafinda calisir.
- PDF yerine print-on-preview kullaniyoruz (puppeteer gerektirmez) - Asama 8'de PDF.
- E-imza (UETS) entegrasyonu Asama 8'de.
- SSO/SAML ve public mobil app Asama 8'de.
