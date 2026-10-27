# Deployment Dokploy

Target yang diminta pengguna: Dokploy `https://dokploy.byrifqi.com`, repository `rifqiahmadf/djiwatentramapp`, branch `main`, domain `*.byrifqi.com`. Perintah commit/push dan rollout baru dijalankan setelah env yang diperlukan dan kesiapan backend terverifikasi. Target VPS lama tidak digunakan.

## Artefak yang disiapkan

- `Dockerfile.web`: build Vite dengan Bun 1.3.4/Node 24, validasi env sebelum/sesudah build, lalu nginx. `APP_NAME` memilih aplikasi web. Konteks build tidak memasukkan env lokal, backup, sesi, cache, virtualenv, atau kredensial.
- `Dockerfile.api`: server Hono/Better Auth pada port 3001, berjalan sebagai user non-root, mendukung koneksi hosted PostgreSQL melalui `DATABASE_URL`.
- `compose.yaml`: layanan utama `customer` + `api`, proxy same-origin `/api/`, health check, dan network Dokploy. Ini baseline customer/API; layanan bisnis lain (worker, OCR, agen bot, rekrutmen) memerlukan konfigurasi dan deployment tersendiri.
- `web.conf.template`: SPA fallback dan proxy API; mempertahankan protokol HTTPS dari reverse proxy Dokploy.
- `scripts/prepare-deployment-env.mjs`: membentuk origin kanal dari satu `DEPLOYMENT_DOMAIN`, tanpa memakai fallback domain lama. Secret key Supabase ditolak untuk build browser.
- `scripts/dokploy-preflight.mjs`: inspeksi read-only melalui paket MCP resmi `@dokploy/mcp`. Tidak mencetak env atau credential remote.

## Domain

| Aplikasi | Domain | APP_NAME / port |
| --- | --- | --- |
| Customer | `app.byrifqi.com` | `customer`, 80 |
| API/auth | `api.byrifqi.com` | `api`, 3001 |
| Admin | `admin.byrifqi.com` | `admin`, 80 |
| POS | `pos.byrifqi.com` | `pos`, 80 |
| Karyawan | `karyawan.byrifqi.com` | `karyawan`, 80 |
| Booking | `booking.byrifqi.com` | `booking`, 80 |
| B2B | `b2b.byrifqi.com` | `b2b`, 80 |
| Merchandise | `merchandise.byrifqi.com` | `merchandise`, 80 |
| Order Mie Yamin | `ordermieyamin.byrifqi.com` | `ordermieyamin`, 80 |
| Djiwa Pay | `pay.byrifqi.com` | `djiwapay`, 80 |
| Coffee passport | `kopitasik.byrifqi.com` | `500kopitasik`, 80 |
| Investor | `investor.byrifqi.com` | `investor`, 80 |
| KOL | `kol.byrifqi.com` | `kol`, 80 |
| Linkbio | `links.byrifqi.com` | `linkbio`, 80 |
| Group | `group.byrifqi.com` | `yumme`, 80 |

Layanan selain customer/API belum otomatis ditambahkan oleh file Compose baseline. Gunakan Dockerfile web yang sama dan isi `APP_NAME`, atau tambahkan service ke Compose, bila kanal tersebut akan diaktifkan. Jangan menganggap link kanal sudah tersedia hanya karena URL-nya telah dikonfigurasi. Pastikan DNS setiap host yang diaktifkan mengarah ke server Dokploy sebelum menerbitkan TLS Let's Encrypt.

## Env yang diperlukan

Salin nama variabel dari `.env.example` direktori ini ke Environment Dokploy. Nilai rahasia harus dimasukkan melalui pengaturan aman, bukan source atau chat.

- `DEPLOYMENT_DOMAIN=byrifqi.com`.
- URL Supabase dan publishable key proyek yang sama. Keduanya konfigurasi browser publik. Secret Supabase tidak pernah menjadi build arg browser.
- `DATABASE_URL`: connection string PostgreSQL yang sebenarnya dari Supabase/penyedia database, termasuk parameter TLS yang disarankan penyedia. API key Supabase bukan password/koneksi PostgreSQL. Jangan menonaktifkan verifikasi TLS.
- `BETTER_AUTH_SECRET`: secret acak yang kuat, minimal 32 karakter, khusus backend.
- Google `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`, dengan callback `https://api.byrifqi.com/api/auth/callback/google` serta callback staff bila diaktifkan.
- Allowlist CORS/trusted origins yang spesifik; contoh tersedia. Cookie lintas kanal memakai `.byrifqi.com`.
- Provider gambar/AI, push, payment, HRD bridge, worker komunitas, dan layanan lain tetap membutuhkan credential masing-masing bila fiturnya diaktifkan. Nilai kosong tidak berarti fitur tersebut sudah siap.

Proyek Supabase yang diberikan belum menampilkan view `public.pos_users_public` pada pemeriksaan limit nol. Cocokkan schema, migration history, tabel Better Auth, dan views dengan source sebelum rollout. SQL kanonis berada di `packages/backend/supabase/migrations` dan runner di paket backend. Jangan mengeksekusi seluruh kumpulan migrasi secara membabi buta atau menganggap service-role API key memberi koneksi SQL.

## Akses Dokploy melalui MCP

Paket MCP resmi dipasang di `/workspace/.tools/dokploy-mcp` (versi 0.30.7). Instruksi refresh:

```sh
npm install --prefix /workspace/.tools/dokploy-mcp @dokploy/mcp@0.30.7 --ignore-scripts --no-audit --no-fund
```

Isi binding `DOKPLOY_API_KEY` melalui Environment Settings dengan tujuan HTTPS `dokploy.byrifqi.com`; set `DOKPLOY_URL=https://dokploy.byrifqi.com`. Kemudian:

```sh
node scripts/dokploy-preflight.mjs
```

Perintah ini hanya membaca daftar project. Setelah akses tersedia, periksa project/environment, repository connection, env yang sudah tersimpan, domain, dan server yang benar sebelum membuat resource baru. Reuse konfigurasi yang sudah ada; jangan menggandakan secret atau project. Jangan menonaktifkan redaksi env MCP.

Urutan rollout yang telah diotorisasi setelah semua prasyarat lengkap:

1. Verifikasi backend/schema dan env sebenarnya; jalankan pemeriksaan aplikasi.
2. Review diff agar tidak memuat env lokal/credential/data sesi; periksa lagi remote `main`.
3. Commit perubahan, lalu push `HEAD:main` tanpa force. Tangani perubahan remote bila main sudah bergerak; jangan menimpa commit pengguna.
4. Melalui MCP, buat/pilih Compose dengan repository dan `composePath=deploy/dokploy/compose.yaml`, branch `main`, serta isi env secara aman. Dokploy harus menjalankan Compose dari path yang benar agar konteks `../..` menunjuk root checkout.
5. Konfigurasikan domain Compose: `app.byrifqi.com` ke service `customer` port 80, `api.byrifqi.com` ke service `api` port 3001, HTTPS/Let's Encrypt. Aktifkan kanal lain hanya setelah service-nya disiapkan.
6. Deploy melalui tool `compose-deploy`; inspect status/log dengan redaksi credential, dan cocokkan checkout/commit deployment dengan push yang baru.
7. Verifikasi TLS, health checks, `/v1` alias, sesi/login, dan permintaan katalog read-only pada domain sebenarnya. Sebuah container healthy saja tidak membuktikan schema/auth/payment berfungsi.

## Pemeriksaan lokal dan status

Ulangi uji lokal setelah kedua image tersedia dengan `python deploy/dokploy/smoke-images.test.py`. Runner membuat network/container sementara, memakai env khusus tes, dan membersihkannya setelah selesai. Tidak memakai database produksi.

Image customer dan API dibuild lokal dengan proxy/CA platform tanpa menonaktifkan TLS. `proxy_ca` merupakan BuildKit secret opsional yang hanya diperlukan pada managed environment ini; pada server Dokploy normal gunakan trust store sistem. Tidak ada CA sesi atau secret backend yang disalin ke image.

Tiga blocker build lama diperbaiki: dependensi PWA booking, sisa handler keyboard POS yang tidak valid, serta ekspor wallet Djiwa Pay yang hilang. Build booking/POS/Djiwa Pay kini lulus. Customer dan Djiwa Pay juga lulus type check setelah perbaikan. Hasil lama di laporan audit tetap merupakan catatan sebelum tahap persiapan deployment ini.

Kredensial Dokploy belum tersedia sebagai binding pada mesin saat persiapan. Karena itu daftar resource/config remote, domain/TLS aktual, env database/OAuth remote, push main, dan rollout produksi belum diverifikasi. Secret Supabase yang pernah dibagikan tidak digunakan; rotasi sebelum pemakaian backend.

### Hasil preflight terakhir

- Semua 14 build web lulus tanpa warning build; seluruh 17 type check workspace lulus. Tes Bun aplikasi/paket/worker 375 lulus, ditambah 3 tes konfigurasi build/deployment. Finance pytest 4 dan purchasing 62 pemeriksaan lulus.
- Vendor chunk menjaga siklus dependensi dan helper CommonJS dalam graph. Route staf dipecah otomatis; TensorFlow memakai entry modular versi yang sama. Uji Chromium memverifikasi perhitungan serta engine bersama face-api tanpa console warning/error aplikasi. Tidak ada kenaikan ambang warning atau penonaktifan warning.
- CI Node 24/Bun 1.3.4 memakai frozen lockfile, audit, suite aplikasi, type check, dan seluruh build web dengan fixture yang tidak dipublikasikan.
- Image API dan customer berhasil dibuild; smoke test gabungan lulus untuk startup API non-root, frontend, proxy API, alias `/v1`, konfigurasi origin dan pengecualian env lokal. Database/OAuth adalah fixture; readiness produksi tetap terpisah. Unduhan nginx yang sebelumnya gagal HTTP 503 sudah berhasil pada percobaan terakhir.
- Publishable key browser disuplai lewat `build.secrets` Compose/BuildKit (sumber environment `VITE_SUPABASE_PUBLISHABLE_KEY`), bukan Docker ARG. Nilai tetap publik dalam hasil browser build. `proxy_ca` hanya untuk trust platform saat build lokal.
- Cache preflight milik tugas dibersihkan setelah verifikasi untuk membatasi penggunaan disk driver Docker vfs.
- `DOKPLOY_API_KEY` masih belum tersedia sebagai binding runtime. Resource, env database/OAuth, DNS/TLS dan rollout remote belum diperiksa. Tidak ada commit, push main, atau deployment produksi. Lengkapi binding aman melalui Environment Settings, Save/Publish, lalu jalankan preflight untuk melanjutkan.

Laporan rinci: `docs/environment-audit.md`. Seluruh hasil lokal ini tidak menggantikan pengujian database, autentikasi, kamera/model wajah, payment, atau worker produksi.
