# RENCANA IMPLEMENTASI REVISI: Pembaruan Total Data Master Karyawan (SECR-001 s/d SECR-021)
Dokumen perancangan perubahan resmi (ZettBOT by Zettbos)

================================================================================
1. DESKRIPSI PERMINTAAN & TUJUAN
================================================================================
Pengguna meminta untuk menghapus seluruh data karyawan lama (sampel EMP-001 s/d EMP-005) dan menggantinya secara total dengan daftar 21 anggota tim resmi:
- **Rentang ID Baru**: `SECR-001` sampai `SECR-021`
- **Format Data**:
  1. `SECR-001` | Sri Subo Siti | Anggota | AKTIF | Agro Plaza | 1234
  2. `SECR-002` | Hari Yanto | Anggota | AKTIF | Agro Plaza | 1234
  3. `SECR-003` | Adam Iskandar | Anggota | AKTIF | Agro Plaza | 1234
  4. `SECR-004` | Henra A. S | Anggota | AKTIF | Agro Plaza | 1234
  5. `SECR-005` | Bambang. S | Anggota | AKTIF | Agro Plaza | 1234
  6. `SECR-006` | Gemi I | Anggota | AKTIF | Agro Plaza | 1234
  7. `SECR-007` | Eddy S | Anggota | AKTIF | Agro Plaza | 1234
  8. `SECR-008` | Uyung K | Anggota | AKTIF | Agro Plaza | 1234
  9. `SECR-009` | M. Qidam | Anggota | AKTIF | Agro Plaza | 1234
  10. `SECR-010` | Pratama N | Koordinator | AKTIF | Agro Plaza | 1234
  11. `SECR-011` | Ahmad Nawari | Anggota | AKTIF | Graha Nusa 3 | 1234
  12. `SECR-012` | S Widodo | Anggota | AKTIF | Graha Nusa 3 | 1234
  13. `SECR-013` | Herdiyanto | Anggota | AKTIF | Graha Nusa 3 | 1234
  14. `SECR-014` | Heru Iskandar | Anggota | AKTIF | Graha Nusa 3 | 1234
  15. `SECR-015` | Nuryanto | Anggota | AKTIF | Graha Nusa 3 | 1234
  16. `SECR-016` | Sutris Purwoko | Anggota | AKTIF | Graha Nusa 3 | 1234
  17. `SECR-017` | Abdul Azis | Anggota | AKTIF | Home Dirut | 1234
  18. `SECR-018` | Abdul Rahman Ash-Shiddiq | Anggota | AKTIF | Home Dirut | 1234
  19. `SECR-019` | Nurdin | Anggota | AKTIF | Home DirKeu | 1234
  20. `SECR-020` | Adhek Kurnia I | Anggota | AKTIF | Home Dir Asset | 1234
  21. `SECR-021` | Eri Arman Zebua | Anggota | AKTIF | Home Dir PP | 1234
- **PIN/Password Default Baru**: `1234` (menggantikan PIN lama 123456)

================================================================================
2. ANALISIS DAMPAK SISTEM
================================================================================
1. **Database Google Sheets**:
   - Tab `DataKaryawan` perlu dibersihkan dari baris karyawan contoh lama (`EMP-001` s/d `EMP-005`).
   - Baris diisi dengan 21 record baru lengkap dengan penempatan lokasi di kolom `CATATAN` dan PIN `1234` di kolom `PIN_PASSWORD`.
   - Data presensi lama di tab `RiwayatAbsensi` tetap aman dan tidak dirusak.
2. **Backend API (`code.gs`)**:
   - Logika generator ID unik untuk penambahan karyawan baru diubah agar mendeteksi prefix `SECR-` dan melanjutkan ke `SECR-022`, `SECR-023`, dst.
   - Default PIN pada fungsi `tambahKaryawan` disesuaikan menjadi `1234`.
3. **Frontend Vercel Cloud (`public_app.js` & `public_index.html`)**:
   - `MOCK_DATA.karyawanList` diperbarui dengan 21 nama karyawan baru dan PIN `1234`.
   - Petunjuk login diperbarui: `Contoh: SECR-001 & PIN: 1234`.
4. **Google Apps Script Monolith (`index.html`)**:
   - Petunjuk login diperbarui ke format `SECR-001` & PIN `1234`.

================================================================================
3. LANGKAH-LANGKAH TEKNIS IMPLEMENTASI
================================================================================
1. **Update `setup.gs`**:
   - Memasukkan array 21 data karyawan baru ke dalam data inisialisasi default `setupDatabase()`.
   - Menambahkan fungsi eksekusi mandiri satu-klik: `resetDanGantiDataKaryawanBaru()` yang dapat langsung dijalankan dari editor Google Apps Script untuk mereplace tab `DataKaryawan` dengan 21 data baru secara instan dan rapi.
2. **Update `code.gs`**:
   - Menyesuaikan regex ID generator: `/SECR-(\d+)/i` dan penomoran `SECR-` pada fungsi `tambahKaryawan`.
   - Menyesuaikan default fallback PIN menjadi `'1234'`.
3. **Update `public_app.js`**:
   - Memperbarui dataset `MOCK_DATA.karyawanList` menjadi 21 karyawan lengkap dengan penempatan lokasi dan PIN `1234`.
   - Memperbarui generator penomoran karyawan baru lokal.
4. **Update `public_index.html` dan `index.html`**:
   - Memperbarui teks petunjuk pada card login di bawah formulir:
     `Gunakan ID Karyawan (SECR-001) & PIN (1234)`.
5. **Deployment & Git Sync**:
   - Deploy versi baru ke Vercel production (`presensi-kartika-ci.vercel.app`).
   - Push pembaruan kode ke repositori GitHub (`aminillah-sys/presensi-kartika-ci`).
   - Sinkronisasi master context ke `prd.md`.

================================================================================
4. STATUS PERSETUJUAN
================================================================================
Menunggu konfirmasi pengguna.
Ketik: "OKE TERAPKAN" untuk mengeksekusi seluruh pembaruan di atas.
