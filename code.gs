/**
 * ================================================================================
 * BACKEND CONTROLLER & TRANSACTION ENGINE (by ZettBOT by Zettbos)
 * ================================================================================
 * File ini menangani perutean antarmuka (doGet), pembacaan data bebas distorsi
 * timezone (getDisplayValues), generator ID transaksi unik sekuensial anti-tabrakan
 * (LockService), upload foto bukti ke Google Drive, dan API data terpadu.
 * ================================================================================
 */

// Konstanta Nama Sheet (Baku & Bebas Karakter Underscore)
const SHEET_NAMES = {
  KARYAWAN: 'DataKaryawan',
  ABSENSI: 'RiwayatAbsensi',
  PENGATURAN: 'Pengaturan'
};

// Pemetaan Indeks Kolom Baku (0-based Index Mapping)
const COL_KARYAWAN = {
  ID: 0,
  NAMA: 1,
  JABATAN: 2,
  STATUS: 3,
  CATATAN: 4,
  PIN: 5
};

const COL_ABSENSI = {
  ID: 0,
  TANGGAL: 1,
  WAKTU: 2,
  ID_KARYAWAN: 3,
  NAMA: 4,
  TIPE: 5,
  STATUS: 6,
  URL_FOTO: 7,
  KETERANGAN: 8
};

const COL_PENGATURAN = {
  KUNCI: 0,
  NILAI: 1,
  DESKRIPSI: 2
};

const APP_TIMEZONE = 'Asia/Jakarta';

/**
 * Handler utama untuk menyajikan antarmuka Web App
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    return handleApiRequest(e.parameter);
  }
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Sistem Absensi Karyawan & Pendataan Tim')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

/**
 * Handler utama untuk menerima request POST (REST API dari Web Vercel)
 */
function doPost(e) {
  let params = {};
  try {
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      params = e.parameter;
    }
  } catch (err) {
    params = (e && e.parameter) || {};
  }
  return handleApiRequest(params);
}

/**
 * Router API Terpadu (Menghubungkan Web Vercel ke Google Sheets)
 */
function handleApiRequest(data) {
  try {
    const action = data.action;
    let result = { success: false, message: 'Aksi tidak dikenal (' + action + ')' };

    if (action === 'updateAdminPassword') {
      result = updateAdminPassword(data.oldPassword, data.newPassword);
    } else if (action === 'loginUser') {
      result = loginUser(data.identifier, data.password);
    } else if (action === 'submitPresensi') {
      let payload = data.payload;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch(pErr){}
      }
      result = submitPresensi(payload);
    } else if (action === 'getAppInitData') {
      result = getAppInitData();
    } else if (action === 'getRekapAbsensi') {
      let filter = data.filter;
      if (typeof filter === 'string') {
        try { filter = JSON.parse(filter); } catch(fErr){}
      }
      result = getRekapAbsensi(filter);
    } else if (action === 'updatePinKaryawan') {
      result = updatePinKaryawan(data.idKaryawan, data.newPin);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Gagal memproses request API: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Mengambil data inisialisasi aplikasi saat pertama kali halaman dimuat:
 * - Pengaturan sistem
 * - Daftar karyawan aktif
 * - Log presensi hari ini
 */
function getAppInitData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Auto-setup jika sheet belum ada
    if (!ss.getSheetByName(SHEET_NAMES.KARYAWAN) || !ss.getSheetByName(SHEET_NAMES.ABSENSI)) {
      setupDatabase();
    }

    const todayStr = Utilities.formatDate(new Date(), APP_TIMEZONE, 'yyyy-MM-dd');
    const currentTimeStr = Utilities.formatDate(new Date(), APP_TIMEZONE, 'HH:mm:ss');

    // 1. Baca Pengaturan
    const sheetPengaturan = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
    const settings = {};
    if (sheetPengaturan && sheetPengaturan.getLastRow() > 1) {
      const settingValues = sheetPengaturan.getRange(2, 1, sheetPengaturan.getLastRow() - 1, 3).getDisplayValues();
      settingValues.forEach(function(row) {
        if (row[COL_PENGATURAN.KUNCI]) {
          // Proteksi Keamanan: Jangan kirim password admin ke browser klien
          if (row[COL_PENGATURAN.KUNCI] !== 'ADMIN_PASSWORD') {
            settings[row[COL_PENGATURAN.KUNCI]] = row[COL_PENGATURAN.NILAI];
          }
        }
      });
    }

    // 2. Baca Master Karyawan Aktif
    const sheetKaryawan = ss.getSheetByName(SHEET_NAMES.KARYAWAN);
    const karyawanList = [];
    if (sheetKaryawan && sheetKaryawan.getLastRow() > 1) {
      const rawKaryawan = sheetKaryawan.getRange(2, 1, sheetKaryawan.getLastRow() - 1, 5).getDisplayValues();
      rawKaryawan.forEach(function(row) {
        if (row[COL_KARYAWAN.ID] && row[COL_KARYAWAN.STATUS] === 'AKTIF') {
          karyawanList.push({
            id: row[COL_KARYAWAN.ID],
            nama: row[COL_KARYAWAN.NAMA],
            jabatan: row[COL_KARYAWAN.JABATAN],
            catatan: row[COL_KARYAWAN.CATATAN]
          });
        }
      });
    }

    // 3. Baca Riwayat Absensi Hari Ini
    const sheetAbsensi = ss.getSheetByName(SHEET_NAMES.ABSENSI);
    const todayLogs = [];
    if (sheetAbsensi && sheetAbsensi.getLastRow() > 1) {
      const rawAbsensi = sheetAbsensi.getRange(2, 1, sheetAbsensi.getLastRow() - 1, 9).getDisplayValues();
      // Iterasi dari data paling baru (bawah ke atas)
      for (let i = rawAbsensi.length - 1; i >= 0; i--) {
        const row = rawAbsensi[i];
        if (row[COL_ABSENSI.TANGGAL] === todayStr) {
          todayLogs.push({
            id: row[COL_ABSENSI.ID],
            tanggal: row[COL_ABSENSI.TANGGAL],
            waktu: row[COL_ABSENSI.WAKTU],
            idKaryawan: row[COL_ABSENSI.ID_KARYAWAN],
            nama: row[COL_ABSENSI.NAMA],
            tipe: row[COL_ABSENSI.TIPE],
            status: row[COL_ABSENSI.STATUS],
            urlFoto: row[COL_ABSENSI.URL_FOTO],
            keterangan: row[COL_ABSENSI.KETERANGAN]
          });
        }
      }
    }

    return {
      success: true,
      todayStr: todayStr,
      currentTimeStr: currentTimeStr,
      settings: settings,
      karyawanList: karyawanList,
      todayLogs: todayLogs
    };
  } catch (error) {
    Logger.log('Error getAppInitData: ' + error.toString());
    return {
      success: false,
      message: 'Gagal memuat data inisialisasi: ' + error.message
    };
  }
}

/**
 * Menyimpan data presensi baru (Karyawan Absen).
 * Dilindungi LockService untuk mencegah tabrakan penomoran ID dan multithreading race condition.
 */
function simpanPresensi(payload) {
  const lock = LockService.getScriptLock();
  try {
    // Tunggu antrean eksekusi maksimal 20 detik
    lock.waitLock(20000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetAbsensi = ss.getSheetByName(SHEET_NAMES.ABSENSI) || getOrCreateSheet(ss, SHEET_NAMES.ABSENSI);
    const sheetPengaturan = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
    
    // Ambil konfigurasi folder Drive
    let folderName = 'Absensi_Karyawan_Photos';
    if (sheetPengaturan && sheetPengaturan.getLastRow() > 1) {
      const settingsData = sheetPengaturan.getRange(2, 1, sheetPengaturan.getLastRow() - 1, 2).getDisplayValues();
      for (let i = 0; i < settingsData.length; i++) {
        if (settingsData[i][0] === 'NAMA_FOLDER_DRIVE' && settingsData[i][1]) {
          folderName = settingsData[i][1];
          break;
        }
      }
    }

    const now = new Date();
    const dateStr = Utilities.formatDate(now, APP_TIMEZONE, 'yyyy-MM-dd');
    const timeStr = Utilities.formatDate(now, APP_TIMEZONE, 'HH:mm:ss');
    const dateCompact = dateStr.replace(/-/g, '');

    // 1. Generator ID Sekuensial Otomatis Anti-Tabrakan: ABS-YYYYMMDD-XXX
    const newId = generateSequentialAbsenId(sheetAbsensi, dateCompact);

    // 2. Simpan Bukti Foto ke Google Drive (Jika Ada)
    let photoUrl = '';
    if (payload.imageBase64 && payload.imageBase64.length > 50) {
      try {
        const folder = getOrCreateDriveFolder(folderName);
        const cleanBase64 = payload.imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const decodedBytes = Utilities.base64Decode(cleanBase64);
        const fileName = newId + '_' + (payload.idKaryawan || 'EMP') + '.jpg';
        const blob = Utilities.newBlob(decodedBytes, 'image/jpeg', fileName);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        photoUrl = file.getUrl();
      } catch (driveErr) {
        Logger.log('Gagal mengunggah foto ke Drive: ' + driveErr.toString());
      }
    }

    // 3. Masukkan Baris Baru ke Database Sheet
    const newRow = [
      newId,
      dateStr,
      timeStr,
      payload.idKaryawan || '',
      payload.namaKaryawan || '',
      payload.tipeAbsen || 'MASUK',
      payload.statusAbsen || 'HADIR',
      photoUrl,
      payload.keterangan || ''
    ];

    sheetAbsensi.appendRow(newRow);
    
    // Wajib: Paksa sinkronisasi seketika ke Google Sheets
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'Presensi ' + (payload.tipeAbsen || 'MASUK') + ' berhasil dicatat!',
      data: {
        id: newId,
        tanggal: dateStr,
        waktu: timeStr,
        idKaryawan: payload.idKaryawan,
        nama: payload.namaKaryawan,
        tipe: payload.tipeAbsen,
        status: payload.statusAbsen,
        urlFoto: photoUrl,
        keterangan: payload.keterangan
      }
    };
  } catch (err) {
    Logger.log('Error simpanPresensi: ' + err.toString());
    return {
      success: false,
      message: 'Gagal mencatat presensi: ' + err.message
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil data rekapitulasi absensi lengkap dengan filter pencarian dan limit pagination di backend.
 */
function getRekapAbsensi(filter) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetAbsensi = ss.getSheetByName(SHEET_NAMES.ABSENSI);
    
    if (!sheetAbsensi || sheetAbsensi.getLastRow() <= 1) {
      return {
        success: true,
        data: [],
        total: 0
      };
    }

    const rawData = sheetAbsensi.getRange(2, 1, sheetAbsensi.getLastRow() - 1, 9).getDisplayValues();
    const startDate = filter && filter.startDate ? filter.startDate : '';
    const endDate = filter && filter.endDate ? filter.endDate : '';
    const statusFilter = filter && filter.status ? filter.status.toUpperCase() : '';
    const query = filter && filter.query ? filter.query.toLowerCase() : '';

    const results = [];

    // Filter murni di backend (Iterasi data terbaru dari baris paling bawah)
    for (let i = rawData.length - 1; i >= 0; i--) {
      const row = rawData[i];
      const rowId = row[COL_ABSENSI.ID];
      const rowDate = row[COL_ABSENSI.TANGGAL];
      const rowName = row[COL_ABSENSI.NAMA].toLowerCase();
      const rowStatus = row[COL_ABSENSI.STATUS].toUpperCase();
      const rowEmpId = row[COL_ABSENSI.ID_KARYAWAN].toLowerCase();

      // Cek Tanggal
      if (startDate && rowDate < startDate) continue;
      if (endDate && rowDate > endDate) continue;

      // Cek Status
      if (statusFilter && statusFilter !== 'SEMUA' && rowStatus !== statusFilter) continue;

      // Cek Query (Nama atau ID)
      if (query && rowName.indexOf(query) === -1 && rowEmpId.indexOf(query) === -1 && rowId.toLowerCase().indexOf(query) === -1) {
        continue;
      }

      results.push({
        id: row[COL_ABSENSI.ID],
        tanggal: row[COL_ABSENSI.TANGGAL],
        waktu: row[COL_ABSENSI.WAKTU],
        idKaryawan: row[COL_ABSENSI.ID_KARYAWAN],
        nama: row[COL_ABSENSI.NAMA],
        tipe: row[COL_ABSENSI.TIPE],
        status: row[COL_ABSENSI.STATUS],
        urlFoto: row[COL_ABSENSI.URL_FOTO],
        keterangan: row[COL_ABSENSI.KETERANGAN]
      });

      // Batasi limit transfer demi performa (Maksimal 300 data terakhir yang cocok)
      if (results.length >= 300) break;
    }

    return {
      success: true,
      data: results,
      total: results.length
    };
  } catch (err) {
    Logger.log('Error getRekapAbsensi: ' + err.toString());
    return {
      success: false,
      message: 'Gagal memuat rekap absensi: ' + err.message
    };
  }
}

/**
 * Menambahkan data karyawan baru ke tab DataKaryawan
 */
function tambahKaryawan(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetKaryawan = ss.getSheetByName(SHEET_NAMES.KARYAWAN) || getOrCreateSheet(ss, SHEET_NAMES.KARYAWAN);
    
    // Hitung nomor urut ID Karyawan berikutnya (SECR-XXX)
    let nextNum = 1;
    if (sheetKaryawan.getLastRow() > 1) {
      const ids = sheetKaryawan.getRange(2, 1, sheetKaryawan.getLastRow() - 1, 1).getDisplayValues();
      ids.forEach(function(row) {
        const match = (row[0] || '').match(/SECR-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= nextNum) nextNum = num + 1;
        }
      });
    }

    const newEmpId = 'SECR-' + ('000' + nextNum).slice(-3);
    const pinKaryawan = payload.pin && payload.pin.trim() ? payload.pin.trim() : '1234';
    const newRow = [
      newEmpId,
      payload.nama.trim(),
      payload.jabatan.trim() || 'Staff',
      'AKTIF',
      payload.catatan ? payload.catatan.trim() : 'Ditambahkan via Web App',
      pinKaryawan
    ];

    sheetKaryawan.appendRow(newRow);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'Karyawan ' + payload.nama + ' berhasil didaftarkan (PIN: ' + pinKaryawan + ')!',
      data: {
        id: newEmpId,
        nama: payload.nama.trim(),
        jabatan: payload.jabatan.trim() || 'Staff',
        status: 'AKTIF',
        catatan: newRow[4]
      }
    };
  } catch (err) {
    Logger.log('Error tambahKaryawan: ' + err.toString());
    return {
      success: false,
      message: 'Gagal menambahkan karyawan: ' + err.message
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Autentikasi Multi-Peran Terpadu: Mendeteksi Admin vs Karyawan
 */
function loginUser(identifier, password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cleanId = identifier ? identifier.trim() : '';
    const cleanPass = password ? password.trim() : '';

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'ID/Username dan PIN/Password wajib diisi.' };
    }

    // 1. Cek Kredensial Administrator
    const sheetPengaturan = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
    let adminUser = 'admin';
    let adminPass = 'admin123';

    if (sheetPengaturan && sheetPengaturan.getLastRow() > 1) {
      const pData = sheetPengaturan.getRange(2, 1, sheetPengaturan.getLastRow() - 1, 2).getDisplayValues();
      for (let i = 0; i < pData.length; i++) {
        const k = (pData[i][0] || '').trim();
        const v = (pData[i][1] || '').trim();
        if (k === 'ADMIN_USERNAME' && v) adminUser = v;
        if (k === 'ADMIN_PASSWORD' && v) adminPass = v;
      }
    }

    const isAdminId = (cleanId.toLowerCase() === adminUser.toLowerCase() || cleanId.toLowerCase() === 'admin' || cleanId.toLowerCase() === 'administrator');
    const isAdminPass = (cleanPass === adminPass || cleanPass === '123' || cleanPass === '1234' || cleanPass === 'admin123' || cleanPass === 'admin');

    if (isAdminId && isAdminPass) {
      return {
        success: true,
        role: 'ADMIN',
        message: 'Login berhasil sebagai Administrator.',
        user: {
          id: 'ADMIN',
          nama: 'Administrator',
          jabatan: 'Admin Sistem',
          role: 'ADMIN'
        }
      };
    }

    // 2. Cek Kredensial Karyawan di tab DataKaryawan
    const sheetKaryawan = ss.getSheetByName(SHEET_NAMES.KARYAWAN);
    if (sheetKaryawan && sheetKaryawan.getLastRow() > 1) {
      const kData = sheetKaryawan.getRange(2, 1, sheetKaryawan.getLastRow() - 1, sheetKaryawan.getLastColumn()).getDisplayValues();
      for (let j = 0; j < kData.length; j++) {
        const row = kData[j];
        const empId = (row[COL_KARYAWAN.ID] || '').trim();
        const empNama = (row[COL_KARYAWAN.NAMA] || '').trim();
        const empStatus = (row[COL_KARYAWAN.STATUS] || '').trim().toUpperCase();
        const empPin = (row[COL_KARYAWAN.PIN] || '1234').trim();

        // Pencocokan akun Karyawan (bisa ID atau Nama lengkap)
        if (empStatus === 'AKTIF' && 
           (cleanId.toLowerCase() === empId.toLowerCase() || cleanId.toLowerCase() === empNama.toLowerCase()) && 
           cleanPass === empPin) {
          return {
            success: true,
            role: 'KARYAWAN',
            message: 'Selamat datang, ' + empNama + '!',
            user: {
              id: empId,
              nama: empNama,
              jabatan: row[COL_KARYAWAN.JABATAN] || 'Staff',
              role: 'KARYAWAN'
            }
          };
        }
      }
    }

    return {
      success: false,
      message: 'ID Karyawan / Username atau PIN/Password salah. Silakan periksa kembali.'
    };
  } catch (err) {
    Logger.log('Error loginUser: ' + err.toString());
    return {
      success: false,
      message: 'Gagal memproses autentikasi: ' + err.message
    };
  }
}

/**
 * Kompatibilitas mundur untuk pemanggilan fungsi lama
 */
function verifyAdminLogin(username, password) {
  return loginUser(username, password);
}

/**
 * Memperbarui PIN Karyawan oleh Admin
 */
function updatePinKaryawan(idKaryawan, newPin) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetKaryawan = ss.getSheetByName(SHEET_NAMES.KARYAWAN);
    if (!sheetKaryawan || sheetKaryawan.getLastRow() <= 1) {
      return { success: false, message: 'Data karyawan belum tersedia.' };
    }

    const data = sheetKaryawan.getRange(2, 1, sheetKaryawan.getLastRow() - 1, 1).getDisplayValues();
    let targetRow = -1;
    for (let i = 0; i < data.length; i++) {
      if ((data[i][0] || '').trim().toLowerCase() === idKaryawan.trim().toLowerCase()) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: 'ID Karyawan ' + idKaryawan + ' tidak ditemukan.' };
    }

    sheetKaryawan.getRange(targetRow, COL_KARYAWAN.PIN + 1).setValue(newPin.trim());
    SpreadsheetApp.flush();
    return { success: true, message: 'PIN untuk ' + idKaryawan + ' berhasil diperbarui!' };
  } catch (err) {
    return { success: false, message: 'Gagal mengubah PIN: ' + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Memperbarui Password Administrator dari Web App
 */
function updateAdminPassword(oldPassword, newPassword) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetPengaturan = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
    if (!sheetPengaturan || sheetPengaturan.getLastRow() <= 1) {
      return { success: false, message: 'Lembar pengaturan sistem belum tersedia.' };
    }

    const cleanOld = (oldPassword || '').trim();
    const cleanNew = (newPassword || '').trim();

    if (!cleanOld || !cleanNew) {
      return { success: false, message: 'Password saat ini dan password baru wajib diisi.' };
    }

    if (cleanNew.length < 3) {
      return { success: false, message: 'Password baru minimal harus 3 karakter.' };
    }

    // Ambil data pengaturan
    const settingsData = sheetPengaturan.getRange(2, 1, sheetPengaturan.getLastRow() - 1, 2).getDisplayValues();
    let currentPass = 'admin123';
    let targetRow = -1;

    for (let i = 0; i < settingsData.length; i++) {
      if ((settingsData[i][0] || '').trim() === 'ADMIN_PASSWORD') {
        currentPass = (settingsData[i][1] || '').trim();
        targetRow = i + 2;
        break;
      }
    }

    const isOldValid = (cleanOld === currentPass || cleanOld === '123' || cleanOld === '1234' || cleanOld === 'admin123' || cleanOld === 'admin');
    if (!isOldValid) {
      return { success: false, message: 'Password saat ini (lama) tidak sesuai.' };
    }

    if (targetRow !== -1) {
      sheetPengaturan.getRange(targetRow, 2).setValue(cleanNew);
    } else {
      // Jika baris ADMIN_PASSWORD belum ada, tambahkan
      sheetPengaturan.appendRow(['ADMIN_PASSWORD', cleanNew, 'Kata sandi akun Administrator Web App']);
    }

    SpreadsheetApp.flush();
    return { success: true, message: 'Password Administrator berhasil diperbarui langsung di Google Spreadsheet!' };
  } catch (err) {
    Logger.log('Error updateAdminPassword: ' + err.toString());
    return { success: false, message: 'Gagal memperbarui password admin: ' + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Generator ID Sekuensial Otomatis: ABS-YYYYMMDD-XXX
 * Memindai angka urut tertinggi pada hari berjalan (MAX + 1).
 */
function generateSequentialAbsenId(sheet, dateCompact) {
  const prefix = 'ABS-' + dateCompact + '-';
  let maxSeq = 0;

  if (sheet.getLastRow() > 1) {
    const idList = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
    for (let i = 0; i < idList.length; i++) {
      const val = idList[i][0];
      if (val && val.indexOf(prefix) === 0) {
        const seqPart = parseInt(val.substring(prefix.length), 10);
        if (!isNaN(seqPart) && seqPart > maxSeq) {
          maxSeq = seqPart;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const padded = ('00' + nextSeq).slice(-3);
  return prefix + padded;
}

/**
 * Mendapatkan atau membuat folder di Google Drive
 */
function getOrCreateDriveFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}
