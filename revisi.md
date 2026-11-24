# RENCANA IMPLEMENTASI REVISI: Presensi Otomatis Bebas Dropdown & Fitur Ganti Password
Dokumen perancangan perubahan resmi (ZettBOT by Zettbos)

================================================================================
1. DESKRIPSI PERMINTAAN & TUJUAN
================================================================================
Pengguna meminta:
1. **Presensi Mandiri Tanpa Dropdown Nama Karyawan**:
   - Karena setiap karyawan sudah memiliki akun dan login mandiri, saat masuk ke menu **Presensi Mandiri**, karyawan **TIDAK PERLU LAGI** dan **TIDAK BOLEH** memilih nama dari dropdown.
   - Sistem wajib secara otomatis 100% mendeteksi dan mengikat data presensi langsung ke akun karyawan yang sedang login (`currentUser`).
   - Menghilangkan bug validasi form yang sebelumnya masih menuntut `selectKaryawan`.
2. **Fitur Ganti Password Administrator di Web App**:
   - Memungkinkan Admin memperbarui kata sandi akun Admin langsung dari antarmuka Web App (via Modal Dialog modern).

================================================================================
2. ANALISIS DESAIN ARSITEKTUR & ALUR KERJA (USER FLOW)
================================================================================

### A. Alur Kerja Presensi Mandiri (Karyawan):
1. Karyawan login menggunakan ID (misal `EMP-001`) dan PIN (`123456`).
2. Masuk ke tab **Presensi Mandiri**:
   - Dropdown pilihan nama **DITIADAKAN SEPENUHNYA** bagi karyawan.
   - Ditampilkan kartu identitas resmi terkunci: Foto inisial, Nama Karyawan, ID & Jabatan, serta lencana *Akun Terverifikasi*.
   - Indikator status kehadiran hari ini langsung mendeteksi riwayat karyawan tersebut (misal: *Belum Absen / Sudah Masuk pukul 07:45*).
   - Tipe presensi otomatis terpasang (*MASUK* atau *PULANG* jika sudah absen masuk).
3. Karyawan cukup:
   - Ambil foto selfie bukti kehadiran.
   - Pilih status (Hadir/Izin/Sakit).
   - Klik **"Kirim Presensi Sekarang"**.
4. Sistem memproses presensi menggunakan `APP_STATE.currentUser.id` & `APP_STATE.currentUser.nama` tanpa ada validasi dropdown sama sekali.
5. Feed aktivitas di sisi kanan hanya menampilkan riwayat presensi karyawan itu sendiri hari ini (privasi terjaga).

### B. Alur Presensi untuk Administrator:
- Jika Admin membuka tab Presensi, disediakan selector opsional jika Admin ingin mencatatkan kehadiran anggota tim tertentu, atau absen atas nama Admin.

### C. Alur Ganti Password Admin:
- Tombol **"Ganti Password"** di navbar khusus Admin.
- Modal dialog dengan validasi: Password Lama, Password Baru (min 5 karakter), Konfirmasi Password Baru.
- Disimpan aman ke Google Sheets tab `Pengaturan` melalui fungsi backend `updateAdminPassword(oldPass, newPass)`.

================================================================================
3. PERUBAHAN TEKNIS BERKAS & LOGIKA
================================================================================

### 1. `index.html` (Frontend Controller & Form):
- **Perbaikan Form Presensi (`#presensiForm`)**:
  - Hapus ketergantungan `selectKaryawan` pada saat role adalah `KARYAWAN`.
  - Pada `handlePresensiSubmit(event)`:
    * Jika `userRole === 'KARYAWAN'`, ambil `idKaryawan` & `namaKaryawan` langsung dari `APP_STATE.currentUser`.
    * Validasi dropdown `selectKaryawan` hanya berlaku jika role adalah `ADMIN`.
- **Perbaikan `clearPresensiForm()` & `onKaryawanSelected()`**:
  - Sinkronkan langsung dengan `checkEmployeeTodayStatus(APP_STATE.currentUser.id)`.
- **Feed Hari Ini (`renderTodayFeed()`)**:
  - Jika yang login adalah Karyawan, filter feed hanya menampilkan riwayat presensi milik dirinya sendiri.
  - Jika Admin, tampilkan log seluruh tim.
- **Fitur Ganti Password Admin**:
  - Tambahkan tombol "Ganti Password" di Navbar Admin.
  - Tambahkan modal `#changePasswordModal` dengan toggle intip kata sandi.
  - Tambahkan fungsi JavaScript `handleUpdatePasswordSubmit(event)`.

### 2. `code.gs` (Backend Transaction):
- Menambahkan fungsi `updateAdminPassword(oldPassword, newPassword)`:
  * Dilindungi `LockService`.
  * Verifikasi password lama dari tab `Pengaturan`.
  * Update baris `ADMIN_PASSWORD` di tab `Pengaturan`.

### 3. `prd.md` (Living Context):
- Update spesifikasi v1.4: Zero-Dropdown Self Attendance & In-App Admin Password Manager.

================================================================================
4. STATUS PENERAPAN (STATUS IMPLEMENTASI: SELESAI)
================================================================================
- [x] Langkah 1: Tambahkan API backend `updateAdminPassword` di `code.gs`.
- [x] Langkah 2: Perbaiki `handlePresensiSubmit`, `clearPresensiForm`, dan `renderTodayFeed` di `index.html` agar 100% otomatis mengikat akun login tanpa dropdown.
- [x] Langkah 3: Tambahkan tombol & modal Ganti Password Admin di `index.html`.
- [x] Langkah 4: Sinkronkan Master Context di zona bawah `prd.md`.
