/**
 * ================================================================================
 * SETUP DATABASE & SAFE MIGRATION ENGINE (by ZettBOT by Zettbos)
 * ================================================================================
 * File ini menangani inisialisasi awal database Google Sheets, pembuatan header
 * baku, serta Safe Migration idempoten (aman dijalankan berulang kali tanpa 
 * menghapus atau merusak data pengguna yang sudah ada).
 *
 * ATURAN STANDAR:
 * 1. DILARANG menggunakan underscore (_) pada nama sheet.
 * 2. Cek keberadaan sheet: jika sheet sudah ada, JANGAN hapus/clear.
 * 3. Tambahkan kolom baru di posisi paling kanan jika ada perubahan skema.
 * 4. Data dummy HANYA diisikan jika lembar kerja baru dibuat dalam kondisi kosong.
 * ================================================================================
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timezone = 'Asia/Jakarta';
  const timestamp = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd HH:mm:ss');
  
  // 1. Skema Tab: DataKaryawan
  const sheetKaryawan = getOrCreateSheet(ss, 'DataKaryawan');
  const headersKaryawan = ['ID_KARYAWAN', 'NAMA', 'JABATAN', 'STATUS_AKTIF', 'CATATAN', 'PIN_PASSWORD'];
  syncHeaders(sheetKaryawan, headersKaryawan);
  
  // Data resmi karyawan tim Security (SECR-001 s/d SECR-021) — diisi jika sheet baru
  const dataMasterKaryawan = [
    ['SECR-001', 'Sri Subo Siti',              'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-002', 'Hari Yanto',                 'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-003', 'Adam Iskandar',              'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-004', 'Henra A. S',                 'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-005', 'Bambang. S',                 'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-006', 'Gemi I',                     'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-007', 'Eddy S',                     'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-008', 'Uyung K',                    'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-009', 'M. Qidam',                   'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-010', 'Pratama N',                  'Koordinator', 'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-011', 'Ahmad Nawari',               'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-012', 'S Widodo',                   'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-013', 'Herdiyanto',                 'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-014', 'Heru Iskandar',              'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-015', 'Nuryanto',                   'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-016', 'Sutris Purwoko',             'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-017', 'Abdul Azis',                 'Anggota',     'AKTIF', 'Home Dirut',     '1234'],
    ['SECR-018', 'Abdul Rahman Ash-Shiddiq',   'Anggota',     'AKTIF', 'Home Dirut',     '1234'],
    ['SECR-019', 'Nurdin',                     'Anggota',     'AKTIF', 'Home DirKeu',    '1234'],
    ['SECR-020', 'Adhek Kurnia I',             'Anggota',     'AKTIF', 'Home Dir Asset', '1234'],
    ['SECR-021', 'Eri Arman Zebua',            'Anggota',     'AKTIF', 'Home Dir PP',    '1234']
  ];

  if (sheetKaryawan.getLastRow() <= 1) {
    sheetKaryawan.getRange(2, 1, dataMasterKaryawan.length, headersKaryawan.length).setValues(dataMasterKaryawan);
    formatHeaderRow(sheetKaryawan, headersKaryawan.length);
  } else {
    // Safe Migration: Isi PIN default 1234 jika ada karyawan yang kolom PIN-nya masih kosong
    const totalRows = sheetKaryawan.getLastRow();
    const pinColIndex = headersKaryawan.indexOf('PIN_PASSWORD') + 1; // Kolom 6 (F)
    const currentPins = sheetKaryawan.getRange(2, pinColIndex, totalRows - 1, 1).getDisplayValues();
    for (let i = 0; i < currentPins.length; i++) {
      if (!currentPins[i][0]) {
        sheetKaryawan.getRange(i + 2, pinColIndex).setValue('1234');
      }
    }
  }

  // 2. Skema Tab: RiwayatAbsensi
  const sheetAbsensi = getOrCreateSheet(ss, 'RiwayatAbsensi');
  const headersAbsensi = ['ID_ABSEN', 'TANGGAL', 'WAKTU', 'ID_KARYAWAN', 'NAMA', 'TIPE_ABSEN', 'STATUS', 'URL_FOTO', 'KETERANGAN'];
  syncHeaders(sheetAbsensi, headersAbsensi);
  
  // Dummy data presensi contoh jika sheet baru
  if (sheetAbsensi.getLastRow() <= 1) {
    const todayStr = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');
    const dummyAbsensi = [
      ['ABS-' + todayStr.replace(/-/g, '') + '-001', todayStr, '07:45:12', 'SECR-001', 'Sri Subo Siti', 'MASUK', 'HADIR', '', 'Tepat waktu di lokasi'],
      ['ABS-' + todayStr.replace(/-/g, '') + '-002', todayStr, '07:55:08', 'SECR-002', 'Hari Yanto', 'MASUK', 'HADIR', '', 'Piket pagi'],
      ['ABS-' + todayStr.replace(/-/g, '') + '-003', todayStr, '08:15:30', 'SECR-003', 'Adam Iskandar', 'MASUK', 'IZIN', '', 'Izin terlambat 15 menit']
    ];
    sheetAbsensi.getRange(2, 1, dummyAbsensi.length, headersAbsensi.length).setValues(dummyAbsensi);
    formatHeaderRow(sheetAbsensi, headersAbsensi.length);
  }

  // 3. Skema Tab: Pengaturan
  const sheetPengaturan = getOrCreateSheet(ss, 'Pengaturan');
  const headersPengaturan = ['KUNCI', 'NILAI', 'DESKRIPSI'];
  syncHeaders(sheetPengaturan, headersPengaturan);
  
  const defaultSettings = [
    ['NAMA_INSTANSI', 'PT Berkah Sejahtera Mandiri', 'Nama instansi/perusahaan yang ditampilkan di header aplikasi'],
    ['NAMA_FOLDER_DRIVE', 'Absensi_Karyawan_Photos', 'Nama folder di Google Drive untuk menyimpan berkas foto bukti selfie'],
    ['JAM_MASUK_MAKSIMAL', '08:00', 'Batas toleransi jam masuk kerja tepat waktu (WIB)'],
    ['ADMIN_USERNAME', 'admin', 'Username resmi untuk login ke Dashboard Admin'],
    ['ADMIN_PASSWORD', 'admin123', 'Password resmi untuk login ke Dashboard Admin (dapat diubah)'],
    ['VERSI_SISTEM', 'v1.3-GAS', 'Versi database aktif']
  ];

  if (sheetPengaturan.getLastRow() <= 1) {
    sheetPengaturan.getRange(2, 1, defaultSettings.length, headersPengaturan.length).setValues(defaultSettings);
    formatHeaderRow(sheetPengaturan, headersPengaturan.length);
  } else {
    // Safe Migration: Cek jika ada kunci pengaturan baru yang belum ada, tambahkan ke bawah tanpa menimpa
    syncSettingEntries(sheetPengaturan, defaultSettings);
  }

  // Paksa sinkronisasi seketika ke Google Sheets
  SpreadsheetApp.flush();

  Logger.log('Inisialisasi & Safe Migration Database Sukses pada: ' + timestamp);
  return {
    status: 'success',
    message: 'Setup database berhasil dijalankan tanpa merusak data lama.',
    timestamp: timestamp
  };
}

/**
 * Mencari tab sheet berdasarkan nama. Jika belum ada, buat tab baru.
 * DILARANG menghapus tab yang sudah ada.
 */
function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Memastikan header kolom baku terpasang dan mendukung Safe Migration.
 * Kolom baru yang belum ada akan otomatis disisipkan di sebelah paling kanan.
 */
function syncHeaders(sheet, expectedHeaders) {
  if (sheet.getLastRow() === 0) {
    // Sheet kosong, tulis semua header
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    formatHeaderRow(sheet, expectedHeaders.length);
    return;
  }

  // Baca header baris 1 yang sudah ada
  const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  
  expectedHeaders.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      // Header baru belum ada, tambahkan di kolom paling kanan (Safe Migration)
      const nextCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextCol).setValue(header);
      sheet.getRange(1, nextCol).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
    }
  });
}

/**
 * Format baris header agar rapi, berkelas (Slate Theme), dan freeze baris pertama.
 */
function formatHeaderRow(sheet, totalCols) {
  const headerRange = sheet.getRange(1, 1, 1, totalCols);
  headerRange.setBackground('#0f172a'); // Navy Slate
  headerRange.setFontColor('#f8fafc');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);
}

/**
 * Safe Migration untuk Pengaturan: memastikan key baru disisipkan tanpa mengubah nilai yang sudah ada.
 */
function syncSettingEntries(sheet, expectedEntries) {
  const currentKeys = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().map(function(r) { return r[0]; });
  expectedEntries.forEach(function(entry) {
    if (currentKeys.indexOf(entry[0]) === -1) {
      sheet.appendRow(entry);
    }
  });
}

/**
 * ================================================================================
 * RESET & GANTI DATA KARYAWAN RESMI (by ZettBOT by Zettbos)
 * ================================================================================
 * Fungsi ini MENGHAPUS semua data lama di sheet DataKaryawan (kecuali baris header)
 * dan mengisinya ulang dengan 21 anggota tim Security resmi (SECR-001 s/d SECR-021).
 *
 * CARA PAKAI: Jalankan fungsi ini SEKALI dari menu Apps Script Editor.
 * PERINGATAN: Data karyawan lama akan terhapus permanen. Backup terlebih dahulu jika perlu.
 * ================================================================================
 */
function resetDanGantiDataKaryawanBaru() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetKaryawan = ss.getSheetByName('DataKaryawan');
  if (!sheetKaryawan) {
    Logger.log('ERROR: Sheet DataKaryawan tidak ditemukan!');
    return;
  }

  // Hapus semua baris data (mulai baris 2, biarkan header baris 1)
  const lastRow = sheetKaryawan.getLastRow();
  if (lastRow > 1) {
    sheetKaryawan.deleteRows(2, lastRow - 1);
    Logger.log('Data lama berhasil dihapus: ' + (lastRow - 1) + ' baris.');
  }

  // Data resmi 21 anggota tim Security
  const dataBaru = [
    ['SECR-001', 'Sri Subo Siti',              'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-002', 'Hari Yanto',                 'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-003', 'Adam Iskandar',              'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-004', 'Henra A. S',                 'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-005', 'Bambang. S',                 'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-006', 'Gemi I',                     'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-007', 'Eddy S',                     'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-008', 'Uyung K',                    'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-009', 'M. Qidam',                   'Anggota',     'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-010', 'Pratama N',                  'Koordinator', 'AKTIF', 'Agro Plaza',     '1234'],
    ['SECR-011', 'Ahmad Nawari',               'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-012', 'S Widodo',                   'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-013', 'Herdiyanto',                 'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-014', 'Heru Iskandar',              'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-015', 'Nuryanto',                   'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-016', 'Sutris Purwoko',             'Anggota',     'AKTIF', 'Graha Nusa 3',   '1234'],
    ['SECR-017', 'Abdul Azis',                 'Anggota',     'AKTIF', 'Home Dirut',     '1234'],
    ['SECR-018', 'Abdul Rahman Ash-Shiddiq',   'Anggota',     'AKTIF', 'Home Dirut',     '1234'],
    ['SECR-019', 'Nurdin',                     'Anggota',     'AKTIF', 'Home DirKeu',    '1234'],
    ['SECR-020', 'Adhek Kurnia I',             'Anggota',     'AKTIF', 'Home Dir Asset', '1234'],
    ['SECR-021', 'Eri Arman Zebua',            'Anggota',     'AKTIF', 'Home Dir PP',    '1234']
  ];

  sheetKaryawan.getRange(2, 1, dataBaru.length, 6).setValues(dataBaru);
  SpreadsheetApp.flush();

  Logger.log('SUCCESS: ' + dataBaru.length + ' karyawan resmi berhasil dimasukkan ke DataKaryawan.');
  SpreadsheetApp.getUi().alert('Reset Sukses!\n\n' + dataBaru.length + ' anggota tim Security (SECR-001 s/d SECR-021) berhasil dimuat ke sheet DataKaryawan.');
}

/**
 * ================================================================================
 * RESET PASSWORD & USERNAME ADMINISTRATOR (by ZettBOT by Zettbos)
 * ================================================================================
 * Fungsi ini mereset kredensial Administrator di sheet Pengaturan menjadi:
 * Username : admin
 * Password : admin123 (juga menerima 1234 sebagai fallback)
 *
 * CARA PAKAI: Jalankan fungsi ini dari Apps Script Editor jika lupa password.
 * ================================================================================
 */
function resetPasswordAdmin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Pengaturan');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Tab Pengaturan tidak ditemukan.');
    return;
  }
  const lastRow = sheet.getLastRow();
  let foundUser = false;
  let foundPass = false;
  if (lastRow > 1) {
    const data = sheet.getRange(2, 1, lastRow - 1, 2).getDisplayValues();
    for (let i = 0; i < data.length; i++) {
      const k = (data[i][0] || '').trim();
      if (k === 'ADMIN_USERNAME') {
        sheet.getRange(i + 2, 2).setValue('admin');
        foundUser = true;
      }
      if (k === 'ADMIN_PASSWORD') {
        sheet.getRange(i + 2, 2).setValue('admin123');
        foundPass = true;
      }
    }
  }
  if (!foundUser) {
    sheet.appendRow(['ADMIN_USERNAME', 'admin', 'Username resmi untuk login ke Dashboard Admin']);
  }
  if (!foundPass) {
    sheet.appendRow(['ADMIN_PASSWORD', 'admin123', 'Password resmi untuk login ke Dashboard Admin (dapat diubah)']);
  }
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('BERHASIL DI-RESET!\n\nUsername Admin: admin\nPassword Admin: admin123\n(Atau gunakan PIN 1234)\n\nSilakan coba login kembali di Web App.');
}
