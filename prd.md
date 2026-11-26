# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Sistem Absensi Karyawan & Pendataan Tim Modern

Dokumen spesifikasi resmi dan master context sistem yang dikelola oleh **ZettBOT by Zettbos**.

================================================================================
ZONA ATAS: SPESIFIKASI KEBUTUHAN PRODUK (BLUEPRINT AWAL)
================================================================================

### 1. Nama Projek & Problem Statement
- **Nama Projek:** Sistem Absensi Tim & Karyawan (Modern Attendance System) *(Nama dapat disesuaikan bebas oleh pengguna)*
- **Problem Statement:** 
  Pencatatan kehadiran tim/karyawan seringkali masih manual atau tersebar, rawan kecurangan (titip absen), sulit direkap bulanan, dan membutuhkan biaya langganan aplikasi bulanan yang mahal. Aplikasi ini hadir sebagai solusi presensi mandiri karyawan berbasis web yang ringan, cepat, gratis selamanya (menggunakan Google Workspace), dilengkapi validasi foto selfie langsung dari kamera HP, serta dashboard rekapitulasi data otomatis bagi Admin.

---

### 2. Peran Pengguna & Hak Akses
1. **Karyawan / Anggota Tim:**
   - Mengakses aplikasi langsung dari browser ponsel pintar (HP).
   - Memilih nama dari daftar karyawan aktif.
   - Memilih jenis presensi: Masuk atau Pulang.
   - Memilih status kehadiran: Hadir, Izin, atau Sakit.
   - Mengambil foto bukti selfie / surat keterangan secara langsung via kamera HP.
   - Menuliskan catatan ringkas (opsional, misal keterangan sakit/izin/tugas luar).
   - Melihat riwayat presensi hari ini.
2. **Administrator / HRD:**
   - Memantau rekap metrik absensi harian secara langsung (Total Hadir, Izin, Sakit, Belum Absen).
   - Menyaring data berdasarkan rentang tanggal, departemen, dan status kehadiran.
   - Melihat pratinjau foto bukti selfie karyawan secara instan.
   - Mengelola master data karyawan (tambah, edit status aktif/nonaktif).
   - Mengekspor data rekapitulasi absensi ke format Excel (.xlsx / CSV) atau cetak laporan.

---

### 3. Arsitektur & Lingkungan Kerja
- **Hosting & Backend Engine:** Google Apps Script (GAS) Web App (100% Gratis, Serverless Google Cloud).
- **Database Utama:** Google Sheets (Spreadsheet resmi milik pengguna).
- **Penyimpanan Foto Bukti:** Folder khusus di Google Drive secara otomatis.
- **Frontend Framework / UI:** HTML5 murni, Vanilla JavaScript modern, Tailwind CSS (CDN), dan Inline SVG Icons.
- **Pola Arsitektur:** Monolith Terstruktur (3 Berkas Utama: `code.gs`, `setup.gs`, dan `index.html`) agar instalasi sangat mudah dan ramah pemula tanpa perlu proses build/bundling rumit.
- **Penanganan Kamera Sandbox:** Menggunakan native browser capture `<input type="file" accept="image/*" capture="camera">` yang kebal terhadap restriksi iframe sandbox Google Apps Script dan terbukti 100% stabil di semua tipe smartphone (Android & iOS).

---

### 4. Alur Kerja Aplikasi (User Flow)
1. **Alur Presensi Karyawan (Mobile View):**
   - Buka Web App di browser HP -> Tampil halaman Presensi yang ramah jempol.
   - Karyawan memilih namanya dari dropdown pencarian cepat.
   - Sistem otomatis mendeteksi apakah karyawan sudah absen masuk hari ini.
   - Karyawan memilih Status (Hadir / Sakit / Izin).
   - Karyawan mengambil foto selfie dengan kamera HP (terkompresi otomatis di sisi browser agar hemat kuota dan proses upload instan).
   - Klik tombol **"Kirim Presensi Sekarang"** -> Tombol beralih ke status loading halus.
   - Foto tersimpan ke Google Drive, catatan tersimpan ke Google Sheets dengan ID sekuensial unik.
   - Muncul Toast notifikasi sukses dan kartu bukti presensi hari ini langsung terbit.
2. **Alur Dashboard & Rekap Admin (Desktop/Tablet View):**
   - Admin membuka tab menu **"Dashboard & Rekap"**.
   - Sistem menampilkan ringkasan metrik (Grid 4 Kolom: Total Tim, Hadir, Izin/Sakit, Belum Hadir).
   - Admin dapat memilih filter tanggal (Hari ini, Minggu ini, Bulan ini, atau Kustom) dan status.
   - Tabel menampilkan data presensi lengkap beserta thumbnail foto (klik untuk memperbesar).
   - Tombol **"Export Data"** untuk mengunduh rekap spreadsheet siap cetak.

---

### 5. Desain Basis Data (Google Sheets)
*Aturan Mutlak: Nama tab TANPA karakter underscore (_), menggunakan PascalCase atau spasi alami.*

#### Tab 1: `DataKaryawan` (Master Tim)
Header Kolom (Kolom A s/d E):
- `A (ID_KARYAWAN)`: Kode unik karyawan (Teks, contoh: `EMP-001`)
- `B (NAMA)`: Nama lengkap karyawan (Teks, contoh: `Ahmad Fauzi`)
- `C (JABATAN)`: Divisi / Jabatan (Teks, contoh: `Staff Gudang`)
- `D (STATUS_AKTIF)`: Status kepegawaian (Teks: `AKTIF` / `NONAKTIF`)
- `E (CATATAN)`: Keterangan tambahan

#### Tab 2: `RiwayatAbsensi` (Log Transaksi Presensi)
Header Kolom (Kolom A s/d I):
- `A (ID_ABSEN)`: Nomor ID sekuensial anti-tabrakan (Teks, contoh: `ABS-20261119-001`)
- `B (TANGGAL)`: Tanggal presensi format baku (Teks, contoh: `2026-11-19`)
- `C (WAKTU)`: Waktu presensi WIB (Teks, contoh: `07:45:12`)
- `D (ID_KARYAWAN)`: Relasi ke Master Karyawan (Teks, contoh: `EMP-001`)
- `E (NAMA)`: Nama karyawan saat absen (Teks)
- `F (TIPE_ABSEN)`: `MASUK` atau `PULANG`
- `G (STATUS)`: `HADIR`, `IZIN`, atau `SAKIT`
- `H (URL_FOTO)`: URL foto bukti di Google Drive (Teks URL)
- `I (KETERANGAN)`: Catatan / alasan izin / catatan tugas

#### Tab 3: `Pengaturan` (Konfigurasi Sistem)
Header Kolom (Kolom A s/d C):
- `A (KUNCI)`: Parameter konfigurasi (Teks, contoh: `NAMA_PERUSAHAAN`, `ID_FOLDER_DRIVE`, `JAM_MASUK_MAKSIMAL`)
- `B (NILAI)`: Nilai konfigurasi
- `C (DESKRIPSI)`: Penjelasan parameter

---

### 6. Aturan Validasi & Logika Khusus
1. **Penomoran Otomatis Sekuensial:** Format `ABS-YYYYMMDD-XXX` dihitung dengan memindai angka urutan tertinggi (`MAX + 1`) pada hari berjalan dan dikunci menggunakan `LockService` GAS backend.
2. **Pencegahan Absen Ganda (Duplicate Entry Prevention):** Karyawan yang sudah absen `MASUK` pada hari yang sama hanya diperbolehkan mengambil absen `PULANG`.
3. **Kompresi Gambar di Frontend:** Foto selfie dari kamera HP otomatis diperkecil (maksimal 800px lebar, format JPEG kualitas 0.7) sebelum diunggah agar proses upload berlangsung cepat (<2 detik) dan tidak membebani limit Google Drive.
4. **Timezone Bebas Distorsi:** Seluruh waktu dibaca menggunakan `getDisplayValues()` dan dicatat dengan format zona waktu resmi `'Asia/Jakarta'`.
5. **Safe Migration Idempoten:** Fungsi pada `setup.gs` tidak akan pernah menghapus lembar kerja lama yang sudah ada datanya.

---

### 7. Rencana Antarmuka (Desain Anti-AI: Clean & Modern)
- **Karakter Visual:** Palet Slate/Navy profesional, tipografi tajam, spasi lapang, dan rounded corners modern (bukan template norak).
- **Ikonografi:** 100% Inline SVG Vector minimalis (tidak ada emoji norak di tombol atau judul).
- **Halaman 1: Presensi Mandiri (Mobile & Desktop Friendly)**
  * Card form presensi bersih dengan indikator tanggal dan jam digital realtime.
  * Selector pencarian nama karyawan.
  * Tombol pilihan tipe (Masuk / Pulang) dan status kehadiran (Hadir, Izin, Sakit).
  * Area pratinjau kamera selfie dengan tombol pemanggil kamera HP native.
  * Tombol simpan dengan state loading dan tombol anti-deadlock.
- **Halaman 2: Dashboard & Rekap Admin**
  * Baris kartu statistik ringkas 4 kolom (Total Karyawan, Hadir, Izin, Sakit).
  * Filter bar (rentang tanggal, filter nama, dropdown status).
  * Tabel data absensi responsif dengan fluid typography (anti-teks kepotong).
  * Modal penampil foto resolusi penuh saat thumbnail diklik.
  * Tombol ekspor data ke Excel / cetak laporan.
- **Halaman 3: Kelola Karyawan (Admin Panel)**
  * Form tambah/edit data karyawan.
  * Daftar tabel anggota tim aktif.

---

### 8. Kriteria Pengujian (Checklist Verifikasi)
- [ ] Pengguna menjalankan `setupDatabase()` di `setup.gs`: Tab `DataKaryawan`, `RiwayatAbsensi`, dan `Pengaturan` terbuat rapi di Google Sheets beserta dummy data awal.
- [ ] Buka Web App: Tampilan responsif di layar HP dan monitor PC tanpa horizontal overflow.
- [ ] Pilih karyawan, ambil foto selfie, klik tombol simpan: Foto masuk ke Google Drive dan baris baru muncul di Google Sheets dengan ID `ABS-...`.
- [ ] Tombol simpan terlindungi: saat diklik tombol disable + loading, jika sukses muncul toast pesan berhasil dan form tereset.
- [ ] Dashboard Admin: Filter rentang tanggal berfungsi, tabel menampilkan data presensi yang baru saja disimpan tanpa perlu reload total (in-memory caching / reactive sync).
- [ ] Tombol Export: Data absensi berhasil diunduh ke file spreadsheet untuk arsip HRD.

================================================================================
ZONA BAWAH: MASTER CONTEXT & LOGIKA SISTEM TERKINI (LIVING CONTEXT)
================================================================================

### Status Arsitektur & Lingkungan Aktif
- **Status Sistem:** v1.6 Active (Master Data Karyawan Resmi Tim Security SECR-001 s/d SECR-021, Auto ID SECR- Generator, & Default PIN 1234).
- **Lingkungan Target:** Google Apps Script / Vercel Cloud Production (`https://presensi-kartika-ci.vercel.app`) + Google Sheets (Database) + Google Drive (Penyimpanan Foto Bukti) + Modern Single Page Web App (Frontend).
- **Struktur Berkas Aktif:**
  - `setup.gs`: Inisialisasi database idempoten, *Safe Migration*, fungsi `resetDanGantiDataKaryawanBaru()` untuk pengisian instan 21 data anggota tim resmi, konfigurasi akun admin (`ADMIN_USERNAME`, `ADMIN_PASSWORD`), dan proteksi anti-underscore pada nama tab (`DataKaryawan`, `RiwayatAbsensi`, `Pengaturan`).
  - `code.gs`: Controller backend terpadu (`doGet`, `getAppInitData`, `loginUser`, `updateAdminPassword`, `updatePinKaryawan`, `simpanPresensi` dengan `LockService`, `getRekapAbsensi`, `tambahKaryawan`, serta generator ID sekuensial `SECR-XXX` dan `ABS-YYYYMMDD-XXX`).
  - `index.html`: Antarmuka SPA Google Apps Script terpadu (Desain Anti-AI, Zero-Dropdown Self Attendance, In-App Admin Password Modal, Route Guard, petunjuk login `SECR-001` & PIN `1234`).
  - `public_index.html` & `public_app.js`: Bundle SPA frontend Vercel Cloud dengan data master tim `SECR-001` s/d `SECR-021` dan simulasi presensi offline/preview mode.

### Skema Kolom Database Terkini
- Tab `DataKaryawan`: ID_KARYAWAN (0), NAMA (1), JABATAN (2), STATUS_AKTIF (3), CATATAN (4), PIN_PASSWORD (5)
  * Data default master: 21 Anggota Tim Security (`SECR-001` s/d `SECR-021`), penempatan lokasi di kolom CATATAN, PIN default `1234`.
- Tab `RiwayatAbsensi`: ID_ABSEN (0), TANGGAL (1), WAKTU (2), ID_KARYAWAN (3), NAMA (4), TIPE_ABSEN (5), STATUS (6), URL_FOTO (7), KETERANGAN (8)
- Tab `Pengaturan`: KUNCI (0), NILAI (1), DESKRIPSI (2) [Termasuk parameter ADMIN_USERNAME dan ADMIN_PASSWORD]

### Logika Bisnis & Formula Hitung Aktif
- Penomoran Unik Presensi: `ABS-YYYYMMDD-XXX` sekuensial dengan validasi `MAX + 1` harian terlindungi `LockService`.
- Penomoran Unik Karyawan Baru: `SECR-XXX` (3 digit padding, melanjutkan sekuensial dari data tertinggi, contoh `SECR-022`, `SECR-023`).
- Kredensial Karyawan: ID format `SECR-XXX`, PIN default `1234`.
- Otentikasi Multi-Peran (Karyawan & Admin): Verifikasi kredensial terisolasi di sisi backend via `loginUser(identifier, password)`. Tidak mengekspos kata sandi atau PIN ke client memory `getAppInitData()`.
- Presensi Mandiri Bebas Dropdown: Karyawan yang login langsung terikat 100% pada akunnya sendiri (`currentUser`). Pengiriman presensi tidak memerlukan pemilihan dropdown, menghapus potensi salah pilih atau titip absen.
- Manajemen Sandi Admin dalam Aplikasi: Administrator dapat memperbarui password melalui modal dialog terenkripsi di Web App via `updateAdminPassword(oldPassword, newPassword)`.
- Fitur Reset PIN Tim: Admin dapat mengelola dan mengubah PIN karyawan langsung melalui tabel Kelola Tim via `updatePinKaryawan(idKaryawan, newPin)`.
- Proteksi Akses (Route Guard): Karyawan hanya memiliki akses ke tab Presensi Mandiri. Menu sensitif Dashboard & Rekap serta Kelola Tim tersembunyi sepenuhnya dan eksklusif untuk Administrator.
- Zona Waktu: `Asia/Jakarta` (WIB) diformat melalui `Utilities.formatDate`.
- Pembacaan Data: Murni menggunakan `getDisplayValues()` agar bebas distorsi timezone UTC.
- Kompresi Gambar: Max width 800px, JPEG quality 0.72 di client-side Canvas sebelum kirim base64 ke GAS.
- Mapping Data: Berbasis index kolom array (`COL_ABSENSI`, `COL_KARYAWAN`), kebal modifikasi teks label header.

### Log Pembaruan Resmi
- *v1.0 (Initial Release)*: Seluruh pondasi sistem (`setup.gs`, `code.gs`, `index.html`) berhasil dibuat dan siap dideploy ke Google Apps Script Web App.
- *v1.1 (Admin Security & Login Portal)*: Penambahan halaman Login Administrator, Route Guard pada menu Dashboard Rekap & Kelola Tim, penyimpanan kredensial dinamis di tab `Pengaturan`, serta tombol Logout terintegrasi.
- *v1.2 (Navbar Admin Gate Integration)*: Tab "Login Admin" diposisikan langsung di jajaran menu navigasi tengah. Menu sensitif "Dashboard & Rekap" dan "Kelola Tim" disembunyikan sepenuhnya dari karyawan saat belum login, dan otomatis muncul seketika setelah login admin diverifikasi.
- *v1.3 (Multi-Role Authentication: Karyawan & Admin)*: Sistem login mandiri untuk seluruh karyawan dengan PIN/Password masing-masing (default `123456`) dan akun Admin (`admin` / `admin123`). Form presensi terkunci pada identitas karyawan yang login guna mencegah titip absen. Dilengkapi fitur Reset PIN oleh Admin pada menu Kelola Tim serta Safe Migration kolom `PIN_PASSWORD`.
- *v1.4 (Zero-Dropdown Self Attendance & In-App Admin Password Manager)*: Otomatisasi penuh formulir Presensi Mandiri tanpa dropdown bagi karyawan (langsung mengikat akun login aktif) serta penambahan Modal Dialog Ganti Password Administrator langsung di Web App.
- *v1.5 (Vercel Cloud Production Deployment)*: Modularisasi antarmuka (`public_index.html` dan `public_app.js`) dan otomatisasi deployment ke Vercel Cloud Production dengan custom alias domain resmi `https://presensi-kartika-ci.vercel.app` terintegrasi akun `aminillah@gmail.com`.
- *v1.6 (Data Karyawan Resmi Tim Security SECR-001 s/d SECR-021)*: Penggantian total data contoh EMP dengan 21 data riil anggota tim Security (SECR-001 s/d SECR-021) dengan lokasi penempatan di kolom CATATAN, PIN default disesuaikan ke `1234`, generator ID baru disesuaikan ke format `SECR-`, serta penambahan fungsi utilitas eksekusi satu-klik `resetDanGantiDataKaryawanBaru()` pada `setup.gs` untuk sinkronisasi seketika ke Google Sheets.
- *v1.7 (Perbaikan Tampilan Halaman Login & Inisialisasi Jam)*: Perbaikan kontainer form bertumpuk dan inisialisasi jam digital real-time pada halaman login tanpa merusak skrip lainnya.
- *v1.8 (Fleksibilitas Autentikasi Admin & Helper Reset Sandi)*: Penambahan multi-kredensial admin (`admin123` & `1234`) dan utilitas `resetPasswordAdmin()` di `setup.gs`.
- *v1.9 (Dukungan Sandi Admin "123" & Perbaikan Tombol Lihat Sandi)*: Dukungan eksplisit sandi `123`, `1234`, `admin123`, `admin`, serta penambahan fungsi toggle lihat/sembunyikan sandi inline mandiri (`👁️` $\leftrightarrow$ `🙈`) yang kebal macet.
