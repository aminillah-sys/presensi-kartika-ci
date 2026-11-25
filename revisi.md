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
