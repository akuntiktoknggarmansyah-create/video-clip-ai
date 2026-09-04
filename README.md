# ClipAI — Tutorial Lengkap (Buat Pemula, Semua Lewat HP)

Web ini otomatis nge-clip video YouTube panjang jadi klip pendek siap viral pakai AI (Gemini). Panduan di bawah ditulis buat kamu yang **belum pernah coding sama sekali** — semua langkah bisa dikerjakan dari browser HP.

---

## 🗺️ Peta Besarnya (biar gak bingung)

1. Kamu bikin **API Key Gemini** (gratis) — ini "kunci" biar AI-nya bisa jalan.
2. Kode web ini kamu **upload ke GitHub** (tempat nyimpen kode, gratis, via browser).
3. Kamu sambungkan GitHub itu ke **Railway** (tempat "menghidupkan" website-nya, ada versi gratisnya).
4. Railway kasih kamu **link website** yang bisa dibuka siapa aja, termasuk dari HP kamu.
5. Buka link itu → pakai webnya sesuai 7 tahap yang tadi kamu desain.

Kamu **tidak perlu install Node.js, Python, atau apa pun di HP/laptop kamu**. Semua "kerja berat"-nya dilakukan di server Railway.

---

## Bagian 1 — Bikin API Key Gemini

1. Buka browser HP, kunjungi: `https://aistudio.google.com/apikey`
2. Login pakai akun Google kamu.
3. Klik tombol **"Create API Key"**.
4. Kalau diminta pilih project, pilih **"Create API key in new project"**.
5. API key kamu akan muncul, formatnya diawali `AIza...`. **Salin (copy) dan simpan** di tempat aman (misal Notes HP) — jangan disebar ke orang lain, ini kayak password.
6. Pemakaian Gemini API ada kuota gratis harian yang cukup besar untuk pemakaian personal. Kalau nanti kepakai, tinggal cek billing di halaman yang sama.

---

## Bagian 2 — Upload Kode ke GitHub (lewat browser, tanpa install apa pun)

1. Buka `https://github.com` di browser HP, buat akun kalau belum punya (gratis).
2. Setelah login, klik ikon **"+"** di pojok atas → **"New repository"**.
3. Kasih nama, misal `clip-ai-web`. Pilih **Public** atau **Private** (bebas). Klik **"Create repository"**.
4. Di halaman repo kosong itu, cari tulisan **"uploading an existing file"** (link biru) → klik.
5. Kamu akan diminta upload file. Karena semua kode ada dalam 1 folder, cara termudah:
   - Di HP, buka file manager, cari folder project ini (`video-clip-ai`), lalu **kompres jadi .zip**.
   - Tapi GitHub web upload tidak otomatis mengekstrak .zip — jadi cara paling gampang untuk pemula:
   - **Gunakan aplikasi GitHub resmi** (tersedia di Play Store/App Store, gratis) → lebih gampang upload folder lengkap dibanding lewat browser. Buka app-nya, login, pilih repo yang tadi dibuat, lalu upload semua file/folder dari project ini satu-satu mengikuti struktur foldernya (app/, lib/, package.json, dst — jangan sampai ada folder yang "gepeng"/tercampur).
   - Alternatif paling gampang: minta bantuan teman yang punya laptop untuk sekali proses ini (cukup 5 menit, hanya perlu drag & drop folder ke github.com/new lewat browser desktop). Setelah ter-upload sekali, ke depannya semua pengaturan (langkah 3 dst) bisa 100% dari HP kamu.
6. Pastikan struktur di GitHub persis seperti ini (folder `app` dan `lib` harus tetap jadi folder, bukan file lepas):
   ```
   video-clip-ai/
     app/
       api/...
       page.js
       layout.js
       globals.css
     lib/
       gemini.js
       ffmpegProcessor.js
       captionStyles.js
       jobStore.js
     package.json
     Dockerfile
     next.config.js
     .gitignore
   ```

> 💡 Kalau kamu stuck di bagian upload folder ini, bilang aja ke gua — gua bisa siapin file **.zip yang bisa langsung kamu download** dari chat ini, tinggal kamu upload isinya ke GitHub.

---

## Bagian 3 — Deploy ke Railway (server buat "menghidupkan" web, via browser HP)

1. Buka `https://railway.app` di browser HP.
2. Klik **"Login"** → pilih **"Login with GitHub"** → izinkan akses.
3. Di dashboard, klik **"New Project"** → **"Deploy from GitHub repo"**.
4. Pilih repo `clip-ai-web` yang tadi kamu buat.
5. Railway otomatis mendeteksi `Dockerfile` di project ini dan akan build otomatis (install ffmpeg dkk otomatis, kamu gak perlu ngapa-ngapain).
6. Tunggu proses **"Building..."** selesai (biasanya 2-5 menit). Kamu bisa lihat log-nya real-time.
7. Setelah selesai (status jadi **"Success"/"Active"**), klik tab **"Settings"** → cari bagian **"Networking"** → klik **"Generate Domain"**.
8. Railway akan kasih kamu link, misal `clip-ai-web-production.up.railway.app`. **Itu link web kamu, buka di HP, siap dipakai!**

> 💰 Catatan biaya: Railway ada paket gratis terbatas (biasanya berupa trial credit), setelah itu berbayar sesuai pemakaian (mulai sekitar $5/bulan tergantung pemakaian CPU/storage, karena proses render video lumayan berat). Ini wajar untuk kelas "web app pemroses video" — kalau mau yang benar-benar gratis selamanya, opsinya jadi terbatas karena rendering video butuh komputasi.

---

## Bagian 4 — Cara Pakai Webnya

1. Buka link Railway kamu di HP.
2. **Tahap 1:** Tempel API Key Gemini → klik "Cek API Key" → lanjut.
3. **Tahap 2:** Tempel link video YouTube → klik "Cek Video" → pastikan thumbnail & judul yang muncul benar → lanjut.
4. **Tahap 3:** (Opsional) Tempel link brief campaign.
5. **Tahap 4:** Pilih style clip (baru ada 1 style: Blur Background + Auto Split Screen).
6. **Tahap 5:** Aktifkan/nonaktifkan auto caption, pilih salah satu dari 5 gaya subtitle.
7. **Tahap 6:** Geser slider jumlah klip (1-15).
8. **Tahap 7:** Cek ringkasan → klik "Proses Sekarang".
9. Tunggu di halaman proses (jangan tutup tab) — ini bisa makan waktu beberapa menit tergantung durasi video & jumlah klip, karena AI harus nonton video + render tiap klip.
10. Setelah selesai, kamu akan lihat daftar klip terurut dari paling berpotensi viral, lengkap dengan caption + hashtag. Tinggal klik **"Download Klip"** di tiap klip.

---

## ⚠️ Batasan Versi Saat Ini (jujur, biar gak kaget)

- **Video privat** belum didukung penuh — versi ini fokus ke video publik/unlisted dulu. Video privat butuh proses login OAuth ke akun pemilik video, itu fitur lanjutan yang bisa kita tambah setelah versi dasar ini jalan lancar.
- **Split screen** versi awal ini membagi 1 frame video jadi kiri-kanan (cocok kalau sumbernya podcast yang kameranya sudah menampilkan 2 orang dalam 1 frame). Kalau butuh split screen dari 2 kamera terpisah yang dideteksi otomatis pakai AI wajah, itu upgrade lanjutan.
- **Karaoke caption** (gaya Hormozi) posisi kata per kata mengikuti perkiraan waktu dari Gemini — cukup akurat, tapi kalau mau presisi seakurat CapCut/aplikasi khusus caption, langkah selanjutnya adalah menambah proses "transkripsi kata-per-kata" terpisah.
- Proses render **bisa lambat** untuk video panjang (1 jam+) karena harus download dulu lalu proses tiap klip. Ini bisa dipercepat di iterasi berikutnya (proses klip secara paralel, dsb).

Semua di atas **sengaja disederhanakan dulu supaya versi pertamanya bisa langsung jalan**. Begitu ini kepasang & lu coba, kabarin gua bagian mana yang mau ditajemin duluan.

---

## 🔧 Kalau Ada Error

- **"Build failed" di Railway:** biasanya karena struktur folder GitHub gak sesuai (lihat Bagian 2 langkah 6). Cek lagi susunan foldernya.
- **"API key tidak valid":** pastikan gak ada spasi nyangkut waktu copy-paste, dan API key belum kehapus/dinonaktifkan di aistudio.google.com.
- **"Video tidak ditemukan lewat oEmbed":** video kemungkinan privat, atau link-nya salah format.
- **Proses lama banget / macet:** wajar untuk video panjang + banyak klip, apalagi di paket Railway gratis (CPU terbatas). Kalau lebih dari 15 menit gak gerak progress-nya, kemungkinan error — cek log di dashboard Railway.
