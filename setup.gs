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
  
  // Dummy data jika sheet baru dibuat (hanya ada baris header)
  if (sheetKaryawan.getLastRow() <= 1) {
    const dummyKaryawan = [
      ['EMP-001', 'Ahmad Fauzi', 'Supervisor Lapangan', 'AKTIF', 'Tim Operasional', '123456'],
      ['EMP-002', 'Budi Santoso', 'Staff Gudang', 'AKTIF', 'Tim Gudang', '123456'],
      ['EMP-003', 'Citra Lestari', 'Administrasi & Keuangan', 'AKTIF', 'Tim Kantor', '123456'],
      ['EMP-004', 'Dedi Kurniawan', 'Teknisi & Maintenance', 'AKTIF', 'Tim Operasional', '123456'],
      ['EMP-005', 'Eka Rahmawati', 'Customer Service', 'AKTIF', 'Tim Front Office', '123456']
    ];
    sheetKaryawan.getRange(2, 1, dummyKaryawan.length, headersKaryawan.length).setValues(dummyKaryawan);
    formatHeaderRow(sheetKaryawan, headersKaryawan.length);
  } else {
    // Safe Migration: Isi PIN default 123456 jika ada karyawan lama yang kolom PIN-nya masih kosong
    const totalRows = sheetKaryawan.getLastRow();
    const pinColIndex = headersKaryawan.indexOf('PIN_PASSWORD') + 1; // Kolom 6 (F)
    const currentPins = sheetKaryawan.getRange(2, pinColIndex, totalRows - 1, 1).getDisplayValues();
    for (let i = 0; i < currentPins.length; i++) {
      if (!currentPins[i][0]) {
        sheetKaryawan.getRange(i + 2, pinColIndex).setValue('123456');
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
      ['ABS-' + todayStr.replace(/-/g, '') + '-001', todayStr, '07:45:12', 'EMP-001', 'Ahmad Fauzi', 'MASUK', 'HADIR', '', 'Tepat waktu di lokasi proyek'],
      ['ABS-' + todayStr.replace(/-/g, '') + '-002', todayStr, '07:55:08', 'EMP-002', 'Budi Santoso', 'MASUK', 'HADIR', '', 'Piket pagi'],
      ['ABS-' + todayStr.replace(/-/g, '') + '-003', todayStr, '08:15:30', 'EMP-003', 'Citra Lestari', 'MASUK', 'IZIN', '', 'Izin terlambat 15 menit']
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
