# Generator Link Masking

Tool buat generate link masking: upload gambar thumbnail + link target (Shopee affiliate),
dapet 1 link (`/tools-linkmasking/nama-slug`) yang:
- Waktu di-share ke Facebook, muncul preview gambar thumbnail-nya (via Open Graph tag).
- Waktu diklik oleh orang lain, langsung redirect ke link Shopee asli.

## Cara Kerja

1. Kamu isi form di halaman utama (target link, slug, upload gambar) + password.
2. Server nyimpen data (link + gambar) di **Netlify Blobs** (storage bawaan Netlify, gratis, gak perlu setup database sendiri).
3. Link hasil generate (`https://situskamu.com/tools-linkmasking/slug-kamu`) itu yang kamu paste ke post FB.
4. Facebook "crawler" baca meta tag `og:image` dari link itu buat nampilin gambar di preview post — makanya walau linknya dihapus dari caption, gambar tetap nempel di post (ini emang cara kerja FB link preview).
5. Kalau ada orang beneran klik link/gambar itu, function `view` langsung redirect ke link Shopee kamu.

## Deploy ke Netlify

### 1. Push ke GitHub (atau drag & drop)
Paling gampang: push folder ini ke repo GitHub, terus di Netlify pilih **Add new site > Import an existing project** dan connect repo-nya. Netlify otomatis detect `netlify.toml`.

Kalau males pakai GitHub, bisa juga drag-drop folder ini langsung ke Netlify dashboard (opsi "Deploy manually"), tapi functions tetap perlu build — cara GitHub lebih aman.

### 2. Set Environment Variable
Di Netlify dashboard: **Site settings > Environment variables**, tambahin:
```
ADMIN_PASSWORD = password_rahasia_kamu
```
Ini password yang dipakai buat login di form generator (ganti sesuai keinginan, jangan pakai contoh di atas).

### 3. Install dependency
Netlify otomatis `npm install` pas build karena ada `package.json` (isinya cuma `@netlify/blobs`).

### 4. Deploy
Klik deploy. Setelah selesai, buka `https://nama-site-kamu.netlify.app` — itu halaman admin/generator-nya.

## Custom Domain
Kalau mau pakai domain sendiri (misal `lihatini.my.id`), tinggal set di **Domain settings** Netlify seperti biasa, nanti link masking-nya jadi `https://lihatini.my.id/tools-linkmasking/slug-kamu`.

## Struktur File

```
netlify.toml               -> konfigurasi build & functions
package.json                -> dependency @netlify/blobs
public/index.html           -> halaman admin (form generator)
netlify/functions/
  create-link.mjs            -> proses submit form, simpan ke Blobs
  view.mjs                   -> serve halaman /tools-linkmasking/:slug (OG tags + redirect)
  image.mjs                  -> serve gambar thumbnail dari Blobs (/img/:slug)
```

## Catatan / Batasan versi ini

- **Resize gambar sudah otomatis** — apapun ukuran/rasio gambar yang diupload, server otomatis resize + center-crop jadi persis 1080x1080 (pakai library `sharp`) sebelum disimpan. >>> part ini masih gagal karena tampilan nya jadi 1:1.9, dan ini bawaan OG di Facebook
- **Video-card trick (eksperimental):** halaman masking sekarang juga ngirim tag `og:video` yang nunjuk ke halaman `/embed/:slug` (isinya gambar full-screen yang bisa diklik). Ini supaya Facebook render preview-nya pakai renderer video (rasio fleksibel/bisa kotak) alih-alih renderer gambar (yang dipaksa landscape 1.91:1). Ini niru cara kerja beberapa tool cloaking affiliate lain.
  - Kotak/gaknya hasil preview di FB **tergantung sepenuhnya sama Facebook**, bukan hal yang bisa kita jamin 100% — kalau Facebook ubah cara parsing-nya, ini bisa berhenti kerja kapan aja.
  - Klik gambar di dalam "video player" itu mencoba redirect via `target="_top"` (buka di tab utama) — tapi ini juga tergantung izin sandbox iframe dari Facebook, jadi ada kemungkinan kecil di device/browser tertentu klik-nya gak langsung nge-redirect. Selalu tes real di HP sebelum dipakai buat campaign beneran.
  - Ini teknik "mengakali" cara Facebook mem-parsing link, bukan pelanggaran hukum, tapi kalau dipakai berlebihan berpotensi kena flag/pembatasan dari sistem Facebook sendiri kalau mereka anggap manipulatif. Pemakaian risiko ditanggung sendiri.
- Login masih simple (1 password global via env var), bukan sistem user/email beneran — cukup buat pemakaian sendiri/tim kecil.
- Slug otomatis di-lowercase dan karakter aneh dibuang, jadi kalau ketik "Berita Viral!!" jadi "berita-viral".
- Kalau slug udah kepake, sistem nolak (biar link lama gak ketimpa).

## Testing Lokal (opsional)

Kalau mau coba dulu sebelum deploy, install Netlify CLI:
```
npm install -g netlify-cli
netlify login
netlify link   # hubungkan ke site Netlify yang udah dibuat
netlify dev
```
`netlify dev` bisa emulate Blobs secara lokal, tapi paling akurat kalau udah linked ke site asli.
