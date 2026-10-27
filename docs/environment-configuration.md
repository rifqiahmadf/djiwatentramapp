# Konfigurasi environment

URL deployment dibaca dari environment, bukan dari domain produksi cadangan di kode. Semua `VITE_*` bersifat publik dan masuk ke bundle browser. Jangan mengisinya dengan service-role key, password database, token bot, atau secret pembayaran.

## Frontend

Salin `apps/<app>/.env.example` menjadi `apps/<app>/.env.local`, lalu sesuaikan layanan yang digunakan. Bun/Vite membaca file lokal tersebut; skrip shell dan layanan produksi membutuhkan environment yang diekspor atau disediakan process manager. File contoh berisi alamat referensi deployment, bukan bukti bahwa layanan itu tersedia untuk development. Gunakan backend development/staging jika akan mengubah data.

| Variabel | Fungsi |
| --- | --- |
| `VITE_SUPABASE_URL` | URL Supabase publik; juga tujuan pemetaan ulang URL storage lama |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public client key proyek yang sama, bukan service-role key |
| `VITE_API_ORIGIN` | Origin API/auth; path `/v1/...` atau `/api/...` mengikuti kontrak aplikasi yang sudah ada |
| `VITE_CUSTOMER_ORIGIN` | Portal customer dan pengalihan login |
| `VITE_BOOKING_ORIGIN`, `VITE_B2B_ORIGIN`, `VITE_MERCHANDISE_ORIGIN`, `VITE_ORDERMIEYAMIN_ORIGIN` | Tautan antar-aplikasi |
| `VITE_PAY_ORIGIN`, `VITE_KOPITASIK_ORIGIN`, `VITE_KOL_ORIGIN`, `VITE_INVESTOR_ORIGIN` | Kanal pembayaran, coffee passport, KOL, investor |
| `VITE_POS_ORIGIN`, `VITE_ADMIN_ORIGIN`, `VITE_KARYAWAN_ORIGIN`, `VITE_REKRUTMEN_ORIGIN` | Portal operasional |
| `VITE_PAY_RETURN_ORIGINS`, `VITE_CUSTOMER_RETURN_ORIGINS`, `VITE_ADDITIONAL_RETURN_ORIGINS` | Daftar origin redirect yang diizinkan, dipisahkan koma; kosong berarti tidak ada izin tambahan |
| `VITE_ANALYZER_URL` | Opsional: notifikasi analyzer; tidak dikirim jika kosong |
| `VITE_REPORT_SERVICE_URL`, `VITE_AI_PARSER_URL` | Layanan laporan dan parsing AI untuk aksi POS/admin terkait |
| `VITE_CUSTOMER_COMMUNITY_API_URL` | Worker komunitas untuk halaman admin terkait |
| `VITE_GROUP_ORIGIN` | Metadata URL situs Yumme Group |

`VITE_SUPABASE_STORAGE_PUBLIC_URL` dan override yang sudah tersedia, misalnya `VITE_BOOKING_API_URL` atau `VITE_INVESTOR_API_URL`, tetap didukung. Origin tidak boleh berisi username/password. Daftar origin harus berisi origin lengkap tanpa path, query, atau slash penutup. Tambahkan localhost secara eksplisit hanya pada konfigurasi development yang membutuhkannya.

URL yang dibutuhkan akan menghasilkan pesan kesalahan bernama variabel jika belum diisi. Tidak ada pengalihan otomatis ke deployment produksi lama. Perubahan env frontend memerlukan restart Vite atau build ulang. Turbo meneruskan dan menghitung `VITE_*` dalam cache build agar konfigurasi lama tidak digunakan kembali.

Halaman diagnostik upload sekarang berada di `apps/admin/test-upload.html` dan `apps/pos/test-upload.html`. Buka melalui Vite development agar substitusi env HTML berjalan. Halaman tersebut tidak lagi otomatis disalin dari `public/` ke build produksi.

## Backend, Edge functions, dan Python

- Auth server: lihat `apps/auth-server/.env.example`. Isi `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, `DB_PASSWORD`, `AUTH_BASE_URL`, secret Better Auth/Google yang diperlukan, dan daftar origin per layanan. `AUTH_COOKIE_DOMAIN` kosong menggunakan cookie khusus host; isi hanya domain induk yang memang dikelola. Origin CORS dan trusted origins diatur terpisah.
- Edge functions: lihat `supabase/functions/.env.example`. URL internal `SUPABASE_URL`/`GOTRUE_INTERNAL_URL` berbeda dari URL publik `YUMI_PUBLIC_SUPABASE_URL`. Konfigurasikan env pada runtime Edge, bukan pada browser. Secret yang sudah dipakai function tetap harus diatur melalui konfigurasi runtime/secret Supabase.
- Python: lihat `.env.example` di direktori agen dan `scripts/`. `SUPABASE_URL`, `NINEROUTER_BASE_URL`, `SUMOPOD_BASE_URL`, serta origin portal mengikuti layanan yang dipakai. `LEGACY_SUPABASE_URL` hanya diperlukan oleh utilitas migrasi gambar.
- Skrip server: ekspor `APP_ROOT`, `SUPABASE_SELFHOST_DIR`, dan path/origin lain yang tercantum pada contoh. `APP_ROOT` dibutuhkan sebelum skrip yang memuat env dari direktori agen dijalankan. Tidak ada perubahan pada konvensi path sistem seperti `/etc`, `/var`, atau bind address `0.0.0.0`.
- Scheduler: isi `RUNTIME_ENV_FILE` dengan path absolut file konfigurasi scheduler. Installer cron memuat file ini dengan `set -a` agar `APP_ROOT`, `SUPABASE_SELFHOST_DIR`, `SUPABASE_URL`, dan konfigurasi scheduler tersedia di proses baru. Jangan mengandalkan environment terminal installer bertahan pada cron. Installer menerima path tanpa spasi/metakarakter shell. Skrip deployment dan scheduler tidak dijalankan selama perubahan ini.
- Cloudflare Worker sudah membaca binding env. Bagian `[vars]` pada `wrangler.toml` adalah konfigurasi deployment, bukan konstanta aplikasi. Gunakan konfigurasi Wrangler per environment dan simpan secret dengan mekanisme secret Worker. Binding bucket/KV tetap merupakan identitas resource deployment.

## Template deployment

Konfigurasi nginx dan systemd sekarang berupa `.template`; jangan memasangnya langsung. Ekspor variabel dari contoh auth server, lalu render ke file lokal:

```sh
node scripts/render-deployment-template.mjs apps/auth-server/nginx-customer.conf.template /tmp/nginx-customer.conf
node scripts/render-deployment-template.mjs apps/auth-server/better-auth.service.template /tmp/better-auth.service
node scripts/render-deployment-template.mjs apps/investor/deployment/investor-auth-proxy.conf.template /tmp/investor-auth-proxy.conf
```

Renderer mempertahankan variabel nginx seperti `$host` dan menolak variabel template yang kosong. Periksa hasil, jalankan `nginx -t`/validasi systemd pada host tujuan, lalu pasang melalui workflow deployment yang sesuai. Tidak ada deployment yang dilakukan. Target kanonis sekarang Dokploy `https://dokploy.byrifqi.com` dengan domain `*.byrifqi.com`; ikuti `deploy/dokploy/README.md`. Template VPS lama hanya referensi legacy.

## Pemeriksaan

Dengan Bun 1.3.4 pada `PATH`:

```sh
node scripts/audit-env-config.mjs
node scripts/test-with-env.mjs
node scripts/test-with-env.mjs apps/admin apps/pos apps/b2b apps/merchandise apps/djiwapay packages/yumipos-web-shared
bun run check-types
node scripts/check-web-builds.mjs
/workspace/.tools/python-env-audit/bin/python scripts/run-purchasing-tests.py
```

Runner tes menggunakan URL contoh dan kredensial dummy khusus tes untuk suite unit/mock. Jangan menggunakannya untuk menjalankan layanan nyata atau deployment. Semua 14 build web dan 17 type check lulus pada pemeriksaan terakhir; detail suite dan batas pemeriksaan produksi tercatat di `environment-audit.md`. Warning tidak dinonaktifkan. Untuk regresi bundle face-api/TensorFlow di Chromium, jalankan `scripts/check-face-bundle.mjs` dengan `PLAYWRIGHT_MODULE_PATH` menunjuk instalasi playwright-core dan `CHROMIUM_BINARY` menunjuk binary Chromium. Uji ini tidak memerlukan database/model wajah.

## Batas keamanan yang masih ada

File `.env`, backup env, dan sesi lokal yang sebelumnya dilacak telah dikeluarkan dari indeks Git; salinan lokal tetap ada. Langkah ini tidak menghapus riwayat Git. Rotasi credential yang memang pernah tersimpan dan masih aktif perlu dilakukan melalui pengelola layanan terkait.

Kode lama masih menggunakan `VITE_ADMIN_SECRET` untuk beberapa endpoint admin. Ini sudah merupakan env, tetapi nilai `VITE_*` tidak dapat dirahasiakan dari pengguna browser. Contoh nilainya sekarang kosong. Memindahkan otorisasi tersebut ke sesi admin/backend merupakan perubahan arsitektur terpisah; perubahan konfigurasi ini tidak mengklaim menyelesaikannya. Password awal bersama di konfigurasi onboarding frontend juga sudah dikosongkan, bukan dipindahkan ke env browser.
