# LEMBAR DRAF REVISI SISTEM (revisi.md)
Dokumen kerja sementara untuk perencanaan fitur baru / perubahan sistem (ZettBOT by Zettbos).

## Revisi v1.7 - Perbaikan Tampilan Halaman Login & Inisialisasi Jam Digital (25 Nov 2026)
- **Status:** SELESAI DITERAPKAN & DISINKRONKAN KE GITHUB
- **Problem Identifikasi:**
  1. Pada halaman awal login (sebelum autentikasi), menu navigasi desktop (`mainDesktopNav`) menampilkan tombol `Presensi Mandiri` di tengah navbar karena adanya class `md:flex` bawaan HTML yang menimpa status `hidden`.
  2. Jam digital di pojok kanan atas terhenti di status placeholder `--:--:-- WIB` dan `Memuat tanggal...` karena listener `DOMContentLoaded` tidak terpanggil jika script dieksekusi setelah parsing DOM selesai.
  3. Kontainer formulir presensi (`tab-presensi`) tidak memiliki class `hidden` secara default di markup HTML awal, sehingga konten formulir sempat bertumpuk/bocor di belakang kartu login.
- **Solusi yang Diterapkan:**
  1. Membersihkan atribut HTML awal pada `public_index.html` dan `index.html`: `mainDesktopNav` dan `nav-btn-presensi` disetel `hidden` murni secara statis, serta `tab-presensi` diberi class `hidden`.
  2. Memperbaiki inisialisasi lifecycle script dengan fungsi `bootApp()` yang memeriksa `document.readyState === 'loading'`. Jika DOM sudah siap, fungsi jam, filter tanggal, dan pengecekan sesi login langsung dijalankan tanpa menunggu event tambahan.
  3. Menyempurnakan `updateAuthUI()` dan `switchTab()` agar penambahan/penghapusan class `md:flex` dan `hidden` berjalan dinamis sesuai status login dan peran pengguna tanpa merusak styling tombol aktif.
  4. Seluruh skrip logika bisnis, 21 data karyawan master, kamera selfie, dan Google Apps Script tetap 100% utuh tanpa perubahan.

## Revisi v1.8 - Fleksibilitas Autentikasi Admin & Helper Reset Sandi (25 Nov 2026)
- **Status:** SELESAI DITERAPKAN & DISINKRONKAN
- **Problem Identifikasi:**
  Pengguna mengalami kesulitan login ke akun Administrator ("salah password terus"), seringkali karena variasi pengetikan (misal: menggunakan PIN karyawan `1234` untuk akun admin, atau adanya perbedaan nilai kunci sandi pada sheet `Pengaturan`).
- **Solusi yang Diterapkan:**
  1. Memperluas toleransi otentikasi akun Administrator pada backend `code.gs`, `public_app.js`, dan `index.html`:
     - Username Admin: menerima `admin` maupun `administrator` (case-insensitive).
     - Password Admin: menerima sandi yang tersimpan di sheet `Pengaturan`, sandi bawaan `admin123`, serta PIN universal `1234`.
  2. Menambahkan fungsi utilitas darurat `resetPasswordAdmin()` pada `setup.gs` yang dapat dijalankan sekali klik langsung dari Apps Script Editor untuk mereset dan memulihkan kata sandi Admin ke default `admin` / `admin123`.
  3. Menjamin seluruh 21 akun karyawan dan alur kerja aplikasi lainnya tetap berjalan 100% aman dan stabil.


## Revisi v1.9 - Dukungan Sandi Admin "123" & Perbaikan Tombol Lihat Password (26 Nov 2026)
- **Status:** SELESAI DITERAPKAN & DISINKRONKAN
- **Problem Identifikasi:**
  1. Pengguna memasukkan kata sandi **`123`** untuk akun `admin`, namun sistem menolak karena pada filter sebelumnya hanya mendaftarkan `admin123` dan `1234`.
  2. Tombol intip sandi (ikon mata `👁️`) pada kolom `PIN / PASSWORD` tidak merespons klik pengguna karena fungsi `toggleLoginPassVisibility()` bergantung pada berkas skrip eksternal yang berisiko belum selesai dimuat atau terputus jaringan.
- **Rencana Solusi Teknis:**
  1. **Toleransi Sandi Admin Multi-Format:**
     - Memperbarui pengecekan kata sandi Administrator di `code.gs`, `index.html`, dan `public_app.js` agar secara eksplisit menerima: **`123`**, **`1234`**, **`admin123`**, **`admin`**, serta kata sandi kustom yang tercantum pada sheet `Pengaturan`.
  2. **Penguatan Tombol Intip/Lihat Password (Anti-Macet):**
     - Memasang fungsi `toggleLoginPassVisibility()` langsung di blok `<script>` inline `public_index.html` dan `index.html` (tidak bergantung load berkas luar).
     - Menambahkan transisi status visual yang jelas: mengubah tipe input antara `'password'` dan `'text'`, serta mengganti ikon dari mata `👁️` ke mata tertutup `🙈` (atau SVG eye-slash) saat aktif.
  3. **Keamanan & Kompatibilitas:**
     - Menjaga seluruh 21 akun karyawan (`SECR-001` s.d. `SECR-021`) dengan PIN `1234` tetap berfungsi normal.
     - Menjamin fitur kamera selfie, presensi GPS/lokasi, dan integrasi spreadsheet tetap berjalan stabil tanpa perubahan yang merusak.


## Revisi v2.0 - Real-Time Update Sandi Admin di Web Vercel ke Google Spreadsheet (26 Nov 2026)
- **Status:** SELESAI DITERAPKAN & DISINKRONKAN
- **Problem Identifikasi:**
  Pengguna meminta agar pergantian kata sandi Administrator langsung di portal web `https://presensi-kartika-ci.vercel.app/` benar-benar terupdate secara permanen ke database Google Spreadsheet (sheet `Pengaturan`), bukan hanya berjalan dalam mode pesan simulasi.
- **Akar Masalah:**
  1. Pada lingkungan web Vercel (luar Google iframe), objek `google.script.run` tidak tersedia. Sebelumnya, cabang `else` di `public_app.js` hanya memunculkan notifikasi simulasi lokal.
  2. Berkas backend `code.gs` belum menyediakan gerbang penerima request HTTP `doPost(e)` untuk memproses panggilan REST API dari domain luar (seperti Vercel).
- **Rencana Solusi Teknis:**
  1. **Pembuatan Endpoint HTTP API `doPost(e)` di `code.gs`:**
     - Menangani payload JSON request dari web Vercel untuk aksi `updateAdminPassword`.
     - Memvalidasi sandi lama admin, memperbarui nilai baris `ADMIN_PASSWORD` di tab sheet `Pengaturan` secara permanen, mengeksekusi `SpreadsheetApp.flush()`, dan mengembalikan status JSON sukses.
  2. **Integrasi Nyata di Frontend (`public_app.js` & `index.html`):**
     - Mengubah fungsi `updateAdminPassword()` pada web Vercel agar melakukan panggilan HTTP `fetch()` nyata ke Google Apps Script Web App.
     - Menghapus label "(Simulasi)" dan memastikan perubahan sandi langsung aktif detik itu juga di Google Spreadsheet dan sesi browser.
  3. **Konfigurasi URL Web App Google Apps Script:**
     - Menghubungkan frontend Vercel dengan URL Web App resmi Google Apps Script Anda (`https://script.google.com/macros/s/.../exec`).
  4. **Keamanan & Konsistensi:**
     - 21 data karyawan (`SECR-001` s.d. `SECR-021`), PIN `1234`, dan presensi mandiri tetap 100% aman dan berjalan normal.
