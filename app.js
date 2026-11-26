// ================= JAVASCRIPT APPLICATION ENGINE =================
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbw7upwNlUHjXGQvdeLuUDgz_kq9f52-6jPH5nZgjGineyWKFfBSidoR6ZRZlIUPgd-3pg/exec';

const APP_STATE = {
  isGasEnv: typeof google !== 'undefined' && google.script && google.script.run,
  isLoggedIn: false,
  userRole: null, // 'ADMIN' or 'KARYAWAN'
  currentUser: null, // { id, nama, jabatan, role }
  settings: {},
  karyawanList: [],
  todayLogs: [],
  rekapLogs: [],
  todayStr: new Date().toISOString().split('T')[0],
  activeTab: 'login',
  currentPhotoBase64: '',
  formTipeAbsen: 'MASUK',
  formStatusAbsen: 'HADIR'
};

const MOCK_DATA = {
  settings: { 'NAMA_INSTANSI': 'PT Kartika Cipta Indonesia', 'JAM_MASUK_MAKSIMAL': '08:00' },
  karyawanList: [
    { id: 'SECR-001', nama: 'Sri Subo Siti',            jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-002', nama: 'Hari Yanto',               jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-003', nama: 'Adam Iskandar',            jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-004', nama: 'Henra A. S',               jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-005', nama: 'Bambang. S',               jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-006', nama: 'Gemi I',                   jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-007', nama: 'Eddy S',                   jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-008', nama: 'Uyung K',                  jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-009', nama: 'M. Qidam',                 jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-010', nama: 'Pratama N',                jabatan: 'Koordinator', status: 'AKTIF' },
    { id: 'SECR-011', nama: 'Ahmad Nawari',             jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-012', nama: 'S Widodo',                 jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-013', nama: 'Herdiyanto',               jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-014', nama: 'Heru Iskandar',            jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-015', nama: 'Nuryanto',                 jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-016', nama: 'Sutris Purwoko',           jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-017', nama: 'Abdul Azis',               jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-018', nama: 'Abdul Rahman Ash-Shiddiq', jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-019', nama: 'Nurdin',                   jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-020', nama: 'Adhek Kurnia I',           jabatan: 'Anggota',     status: 'AKTIF' },
    { id: 'SECR-021', nama: 'Eri Arman Zebua',          jabatan: 'Anggota',     status: 'AKTIF' }
  ],
  todayLogs: [
    { id: 'ABS-20261124-001', tanggal: '2026-11-24', waktu: '07:45:10', idKaryawan: 'SECR-001', nama: 'Sri Subo Siti', tipe: 'MASUK', status: 'HADIR', urlFoto: '', keterangan: 'Tepat waktu di lokasi' },
    { id: 'ABS-20261124-002', tanggal: '2026-11-24', waktu: '07:55:24', idKaryawan: 'SECR-002', nama: 'Hari Yanto',    tipe: 'MASUK', status: 'HADIR', urlFoto: '', keterangan: 'Piket pagi' }
  ]
};

function bootApp() {
  initClock();
  initDateFilters();
  loadInitialData();
  checkSavedAuth();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}

function initClock() {
  const update = () => {
    const now = new Date();
    document.getElementById('liveClockText').innerText = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0') + ' WIB';
    document.getElementById('liveDateText').innerText = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  };
  update();
  setInterval(update, 1000);
}

function initDateFilters() {
  const now = new Date();
  document.getElementById('filterStartDate').value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  document.getElementById('filterEndDate').value = now.toISOString().split('T')[0];
}

function loadInitialData() {
  if (APP_STATE.isGasEnv) {
    google.script.run
      .withSuccessHandler(res => { if (res && res.success) applyInitData(res); else applyInitData(MOCK_DATA); })
      .withFailureHandler(() => applyInitData(MOCK_DATA))
      .getAppInitData();
  } else {
    applyInitData(MOCK_DATA);
  }
}

function applyInitData(data) {
  APP_STATE.settings = data.settings || {};
  APP_STATE.karyawanList = data.karyawanList || [];
  APP_STATE.todayLogs = data.todayLogs || [];
  if (data.todayStr) APP_STATE.todayStr = data.todayStr;

  if (APP_STATE.settings['NAMA_INSTANSI']) document.getElementById('appInstansiName').innerText = APP_STATE.settings['NAMA_INSTANSI'];
  if (APP_STATE.settings['JAM_MASUK_MAKSIMAL']) document.getElementById('headerJamMaks').innerText = 'Jam Masuk: ' + APP_STATE.settings['JAM_MASUK_MAKSIMAL'];

  renderKaryawanDropdown();
  renderTodayFeed();
  renderTimTable();
  updateMetricCards();
  if (APP_STATE.isLoggedIn) setupPresensiIdentityView();
}

function renderKaryawanDropdown() {
  const sel = document.getElementById('selectKaryawan');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih Anggota Tim --</option>';
  APP_STATE.karyawanList.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.innerText = item.nama + ' (' + (item.jabatan || 'Staff') + ')';
    sel.appendChild(opt);
  });
}

// ================= AUTENTIKASI MULTI-PERAN =================
function checkSavedAuth() {
  const saved = sessionStorage.getItem('absensi_auth_session');
  if (saved) {
    try {
      const p = JSON.parse(saved);
      if (p && p.isLoggedIn && p.currentUser) {
        APP_STATE.isLoggedIn = true;
        APP_STATE.userRole = p.userRole;
        APP_STATE.currentUser = p.currentUser;
      }
    } catch(e) { sessionStorage.removeItem('absensi_auth_session'); }
  }
  updateAuthUI();
  if (APP_STATE.isLoggedIn) {
    switchTab(APP_STATE.userRole === 'ADMIN' ? 'rekap' : 'presensi');
  } else {
    switchTab('login');
  }
}

function updateAuthUI() {
  const desktopNav = document.getElementById('mainDesktopNav');
  const mobileNav = document.getElementById('mainMobileNav');
  const navBtnPresensi = document.getElementById('nav-btn-presensi');
  const navBtnRekap = document.getElementById('nav-btn-rekap');
  const navBtnKaryawan = document.getElementById('nav-btn-karyawan');
  const mobBtnRekap = document.getElementById('mob-btn-rekap');
  const mobBtnKaryawan = document.getElementById('mob-btn-karyawan');
  const userBadge = document.getElementById('userProfileBadge');
  const labelName = document.getElementById('labelUserName');
  const labelRole = document.getElementById('labelUserRole');
  const btnChangePass = document.getElementById('btnChangePasswordNav');

  if (!APP_STATE.isLoggedIn) {
    desktopNav?.classList.add('hidden');
    desktopNav?.classList.remove('md:flex');
    navBtnPresensi?.classList.add('hidden');
    navBtnPresensi?.classList.remove('flex');
    mobileNav?.classList.add('hidden');
    userBadge?.classList.add('hidden');
    userBadge?.classList.remove('flex');
    btnChangePass?.classList.add('hidden');
    btnChangePass?.classList.remove('flex');
  } else if (APP_STATE.userRole === 'ADMIN') {
    desktopNav?.classList.remove('hidden');
    desktopNav?.classList.add('md:flex');
    navBtnPresensi?.classList.remove('hidden');
    navBtnPresensi?.classList.add('flex');
    mobileNav?.classList.remove('hidden');
    navBtnRekap?.classList.remove('hidden');
    navBtnRekap?.classList.add('flex');
    navBtnKaryawan?.classList.remove('hidden');
    navBtnKaryawan?.classList.add('flex');
    mobBtnRekap?.classList.remove('hidden');
    mobBtnKaryawan?.classList.remove('hidden');
    userBadge?.classList.remove('hidden');
    userBadge?.classList.add('flex');
    btnChangePass?.classList.remove('hidden');
    btnChangePass?.classList.add('flex');
    if (labelName) labelName.innerText = APP_STATE.currentUser.nama || 'Administrator';
    if (labelRole) {
      labelRole.innerText = 'Admin';
      labelRole.className = 'text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30';
    }
    setupPresensiIdentityView();
  } else {
    desktopNav?.classList.remove('hidden');
    desktopNav?.classList.add('md:flex');
    navBtnPresensi?.classList.remove('hidden');
    navBtnPresensi?.classList.add('flex');
    mobileNav?.classList.remove('hidden');
    navBtnRekap?.classList.add('hidden');
    navBtnRekap?.classList.remove('flex');
    navBtnKaryawan?.classList.add('hidden');
    navBtnKaryawan?.classList.remove('flex');
    mobBtnRekap?.classList.add('hidden');
    mobBtnKaryawan?.classList.add('hidden');
    userBadge?.classList.remove('hidden');
    userBadge?.classList.add('flex');
    btnChangePass?.classList.add('hidden');
    btnChangePass?.classList.remove('flex');
    if (labelName) labelName.innerText = APP_STATE.currentUser.nama || 'Karyawan';
    if (labelRole) {
      labelRole.innerText = 'Karyawan';
      labelRole.className = 'text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30';
    }
    setupPresensiIdentityView();
  }
}

function setupPresensiIdentityView() {
  const cardName = document.getElementById('karyawanLockedName');
  const cardJabatan = document.getElementById('karyawanLockedJabatan');
  const cardAvatar = document.getElementById('karyawanLockedAvatar');
  const adminSelectorBox = document.getElementById('adminKaryawanSelectorBox');

  if (APP_STATE.userRole === 'KARYAWAN' && APP_STATE.currentUser) {
    if (cardName) cardName.innerText = APP_STATE.currentUser.nama;
    if (cardJabatan) cardJabatan.innerText = APP_STATE.currentUser.id + ' • ' + (APP_STATE.currentUser.jabatan || 'Staff');
    if (cardAvatar) cardAvatar.innerText = getInitials(APP_STATE.currentUser.nama);
    adminSelectorBox?.classList.add('hidden');
    checkEmployeeTodayStatus(APP_STATE.currentUser.id);
  } else if (APP_STATE.userRole === 'ADMIN') {
    if (cardName) cardName.innerText = 'Mode Administrator';
    if (cardJabatan) cardJabatan.innerText = 'Pilih karyawan di bawah jika mencatat presensi tim';
    if (cardAvatar) cardAvatar.innerText = 'AD';
    adminSelectorBox?.classList.remove('hidden');
    const currentSel = document.getElementById('selectKaryawan');
    if (currentSel && currentSel.value) checkEmployeeTodayStatus(currentSel.value);
    else {
      const dot = document.getElementById('statusPillDot');
      const text = document.getElementById('statusPillText');
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-slate-400';
      if (text) text.innerText = 'Pilih karyawan di bawah untuk melihat status';
    }
  }
}

function onAdminSelectKaryawanChange() {
  const selVal = document.getElementById('selectKaryawan').value;
  if (selVal) checkEmployeeTodayStatus(selVal);
}

function checkEmployeeTodayStatus(empId) {
  const dot = document.getElementById('statusPillDot');
  const text = document.getElementById('statusPillText');
  if (!empId || !dot || !text) return;

  const logMasuk = APP_STATE.todayLogs.find(l => l.idKaryawan === empId && l.tipe === 'MASUK');
  const logPulang = APP_STATE.todayLogs.find(l => l.idKaryawan === empId && l.tipe === 'PULANG');

  if (logPulang) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    text.innerText = 'Sudah absen Pulang pukul ' + logPulang.waktu + ' (' + logPulang.status + ')';
    setTipeAbsen('PULANG');
  } else if (logMasuk) {
    dot.className = 'w-2 h-2 rounded-full bg-sky-500';
    text.innerText = 'Sudah Masuk pukul ' + logMasuk.waktu + ' — Siap untuk presensi Pulang';
    setTipeAbsen('PULANG');
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-amber-500';
    text.innerText = 'Belum ada catatan presensi hari ini (Silakan absen Masuk)';
    setTipeAbsen('MASUK');
  }
}

function toggleLoginPassVisibility() {
  const p = document.getElementById('inputLoginPass');
  if (!p) return;
  const isPass = (p.type === 'password');
  p.type = isPass ? 'text' : 'password';
  const btn = document.getElementById('btnTogglePass');
  if (btn) {
    btn.innerHTML = isPass ? '🙈' : '👁️';
    btn.setAttribute('aria-label', isPass ? 'Sembunyikan password' : 'Lihat password');
    btn.title = isPass ? 'Sembunyikan password' : 'Lihat password';
  }
}

function handleUnifiedLoginSubmit(event) {
  event.preventDefault();
  const user = document.getElementById('inputLoginUser').value.trim();
  const pass = document.getElementById('inputLoginPass').value.trim();
  if (!user || !pass) { showToast('error', 'ID/Username dan PIN/Password wajib diisi'); return; }

  const btn = document.getElementById('btnSubmitLogin');
  const txt = document.getElementById('textSubmitLogin');
  btn.disabled = true;
  txt.innerText = 'Memverifikasi...';

  const resetBtn = () => { btn.disabled = false; txt.innerText = 'Masuk ke Sistem'; };

  if (APP_STATE.isGasEnv) {
    google.script.run
      .withSuccessHandler(res => {
        resetBtn();
        if (res && res.success) onLoginSuccess(res.role, res.user, res.message);
        else showToast('error', res ? res.message : 'Akun atau PIN salah');
      })
      .withFailureHandler(err => { resetBtn(); showToast('error', 'Gagal: ' + err.message); })
      .loginUser(user, pass);
  } else {
    setTimeout(() => {
      resetBtn();
      const isAdmUser = (user.toLowerCase() === 'admin' || user.toLowerCase() === 'administrator');
      const isAdmPass = (pass === '123' || pass === '1234' || pass === 'admin123' || pass === 'admin');
      if (isAdmUser && isAdmPass) {
        onLoginSuccess('ADMIN', { id: 'ADMIN', nama: 'Administrator', jabatan: 'Admin Sistem', role: 'ADMIN' }, 'Login Admin berhasil!');
      } else {
        const found = MOCK_DATA.karyawanList.find(k => (k.id.toLowerCase() === user.toLowerCase() || k.nama.toLowerCase() === user.toLowerCase()) && pass === '1234');
        if (found) {
          onLoginSuccess('KARYAWAN', { id: found.id, nama: found.nama, jabatan: found.jabatan, role: 'KARYAWAN' }, 'Selamat datang, ' + found.nama + '!');
        } else {
          showToast('error', 'Akun atau PIN salah. Contoh: SECR-001 / 1234 atau admin / admin123');
        }
      }
    }, 400);
  }
}

function onLoginSuccess(role, userObj, message) {
  APP_STATE.isLoggedIn = true;
  APP_STATE.userRole = role;
  APP_STATE.currentUser = userObj;

  sessionStorage.setItem('absensi_auth_session', JSON.stringify({ isLoggedIn: true, userRole: role, currentUser: userObj }));
  updateAuthUI();
  showToast('success', message || 'Login berhasil!');
  document.getElementById('inputLoginUser').value = '';
  document.getElementById('inputLoginPass').value = '';
  switchTab(role === 'ADMIN' ? 'rekap' : 'presensi');
}

function logoutUser() {
  APP_STATE.isLoggedIn = false;
  APP_STATE.userRole = null;
  APP_STATE.currentUser = null;
  sessionStorage.removeItem('absensi_auth_session');
  updateAuthUI();
  showToast('info', 'Anda telah keluar dari akun');
  switchTab('login');
}

function openChangePasswordModal() {
  document.getElementById('inputOldAdminPass').value = '';
  document.getElementById('inputNewAdminPass').value = '';
  document.getElementById('inputConfirmAdminPass').value = '';
  document.getElementById('changePasswordModal').classList.remove('hidden');
}

function closeChangePasswordModal() {
  document.getElementById('changePasswordModal').classList.add('hidden');
}

function handleUpdatePasswordSubmit(event) {
  event.preventDefault();
  const oldPass = document.getElementById('inputOldAdminPass').value.trim();
  const newPass = document.getElementById('inputNewAdminPass').value.trim();
  const confirmPass = document.getElementById('inputConfirmAdminPass').value.trim();

  if (!oldPass || !newPass) { showToast('error', 'Semua kolom wajib diisi'); return; }
  if (newPass.length < 3) { showToast('error', 'Password baru minimal 3 karakter'); return; }
  if (newPass !== confirmPass) { showToast('error', 'Konfirmasi password tidak cocok'); return; }

  const btn = document.getElementById('btnSubmitChangePass');
  const txt = document.getElementById('textSubmitChangePass');
  btn.disabled = true;
  txt.innerText = 'Menyimpan ke Database...';

  const resetBtn = () => { btn.disabled = false; txt.innerText = 'Simpan Password Baru'; };

  if (APP_STATE.isGasEnv) {
    google.script.run
      .withSuccessHandler(res => {
        resetBtn();
        if (res && res.success) { showToast('success', res.message); closeChangePasswordModal(); }
        else showToast('error', res ? res.message : 'Gagal memperbarui password');
      })
      .withFailureHandler(err => { resetBtn(); showToast('error', 'Gagal: ' + err.message); })
      .updateAdminPassword(oldPass, newPass);
  } else {
    // Panggilan API Nyata ke Google Apps Script / Google Spreadsheet dari Web Vercel
    const payload = {
      action: 'updateAdminPassword',
      oldPassword: oldPass,
      newPassword: newPass
    };

    fetch(GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
    .then(r => r.text())
    .then(text => {
      resetBtn();
      try {
        const res = JSON.parse(text);
        if (res && res.success) {
          showToast('success', res.message || 'Password Admin berhasil diperbarui langsung di database Google Sheets!');
          closeChangePasswordModal();
        } else {
          showToast('error', (res && res.message) ? res.message : 'Password lama tidak sesuai');
        }
      } catch (jsonErr) {
        if (text.indexOf('Fungsi skrip tidak ditemukan: doPost') !== -1 || text.indexOf('Script function not found: doPost') !== -1) {
          showToast('error', 'Backend belum diperbarui: Buka Apps Script, paste code.gs terbaru lalu Deploy Versi Baru.');
        } else {
          showToast('error', 'Respon server Google: ' + text.substring(0, 100));
        }
      }
    })
    .catch(err => {
      resetBtn();
      showToast('error', 'Koneksi ke Google Sheets gagal: ' + err.message);
    });
  }
}

function switchTab(tabName) {
  if (!APP_STATE.isLoggedIn && tabName !== 'login') tabName = 'login';
  if (APP_STATE.isLoggedIn && APP_STATE.userRole === 'KARYAWAN' && (tabName === 'rekap' || tabName === 'karyawan')) {
    showToast('warning', 'Menu ini hanya dapat diakses oleh Administrator');
    tabName = 'presensi';
  }
  APP_STATE.activeTab = tabName;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('tab-' + tabName)?.classList.remove('hidden');

  ['presensi', 'rekap', 'karyawan'].forEach(t => {
    const dBtn = document.getElementById('nav-btn-' + t);
    const mBtn = document.getElementById('mob-btn-' + t);
    const isCurrent = (t === tabName);
    if (dBtn) {
      if (isCurrent) {
        dBtn.classList.add('bg-slate-800', 'text-white', 'border', 'border-slate-700', 'shadow-sm');
        dBtn.classList.remove('text-slate-300', 'hover:text-white', 'hover:bg-slate-800');
      } else {
        dBtn.classList.remove('bg-slate-800', 'text-white', 'border', 'border-slate-700', 'shadow-sm');
        dBtn.classList.add('text-slate-300', 'hover:text-white', 'hover:bg-slate-800');
      }
    }
    if (mBtn) {
      if (isCurrent) {
        mBtn.classList.add('bg-slate-800', 'text-white');
        mBtn.classList.remove('text-slate-400', 'hover:text-white');
      } else {
        mBtn.classList.remove('bg-slate-800', 'text-white');
        mBtn.classList.add('text-slate-400', 'hover:text-white');
      }
    }
  });

  if (tabName === 'rekap' && APP_STATE.rekapLogs.length === 0) fetchRekapData();
}

// ================= PRESENSI FORM & LOGIKA =================
function setTipeAbsen(tipe) {
  APP_STATE.formTipeAbsen = tipe;
  const btnMasuk = document.getElementById('btnTipeMasuk');
  const btnPulang = document.getElementById('btnTipePulang');
  if (tipe === 'MASUK') {
    btnMasuk.className = 'tipe-btn py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-slate-900 text-white border-slate-900 shadow-sm';
    btnPulang.className = 'tipe-btn py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
  } else {
    btnPulang.className = 'tipe-btn py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-slate-900 text-white border-slate-900 shadow-sm';
    btnMasuk.className = 'tipe-btn py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
  }
}

function setStatusAbsen(status) {
  APP_STATE.formStatusAbsen = status;
  ['btnStatusHadir', 'btnStatusIzin', 'btnStatusSakit'].forEach(id => {
    document.getElementById(id).className = 'status-btn py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
  });
  if (status === 'HADIR') document.getElementById('btnStatusHadir').className = 'status-btn py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/20';
  else if (status === 'IZIN') document.getElementById('btnStatusIzin').className = 'status-btn py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all bg-amber-50 text-amber-800 border-amber-500 ring-2 ring-amber-500/20';
  else if (status === 'SAKIT') document.getElementById('btnStatusSakit').className = 'status-btn py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all bg-rose-50 text-rose-800 border-rose-500 ring-2 ring-rose-500/20';
}

function handlePhotoCapture(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById('compressCanvas');
      const maxW = 800;
      let w = img.width, h = img.height;
      if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
      APP_STATE.currentPhotoBase64 = compressedDataUrl;
      const sizeInKb = Math.round((compressedDataUrl.length * 3 / 4) / 1024);
      document.getElementById('photoSizeLabel').innerText = sizeInKb + ' KB';
      document.getElementById('previewImg').src = compressedDataUrl;
      document.getElementById('emptyPhotoBox').classList.add('hidden');
      document.getElementById('loadedPhotoBox').classList.remove('hidden');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearPhoto() {
  APP_STATE.currentPhotoBase64 = '';
  document.getElementById('cameraInput').value = '';
  document.getElementById('previewImg').src = '';
  document.getElementById('loadedPhotoBox').classList.add('hidden');
  document.getElementById('emptyPhotoBox').classList.remove('hidden');
}

function handlePresensiSubmit(event) {
  event.preventDefault();
  let empId = '', empNama = '';

  if (APP_STATE.userRole === 'KARYAWAN') {
    if (!APP_STATE.currentUser || !APP_STATE.currentUser.id) {
      showToast('error', 'Sesi tidak valid. Silakan login kembali');
      switchTab('login');
      return;
    }
    empId = APP_STATE.currentUser.id;
    empNama = APP_STATE.currentUser.nama;
  } else if (APP_STATE.userRole === 'ADMIN') {
    const sel = document.getElementById('selectKaryawan');
    empId = sel ? sel.value : '';
    if (!empId) { showToast('error', 'Pilih anggota tim yang akan diabsenkan'); return; }
    const k = APP_STATE.karyawanList.find(x => x.id === empId);
    empNama = k ? k.nama : '';
  } else {
    showToast('error', 'Silakan login terlebih dahulu');
    switchTab('login');
    return;
  }

  if (APP_STATE.formStatusAbsen === 'HADIR' && !APP_STATE.currentPhotoBase64) {
    showToast('warning', 'Harap ambil foto selfie bukti kehadiran');
    return;
  }

  const payload = {
    idKaryawan: empId,
    namaKaryawan: empNama,
    tipeAbsen: APP_STATE.formTipeAbsen,
    statusAbsen: APP_STATE.formStatusAbsen,
    imageBase64: APP_STATE.currentPhotoBase64,
    keterangan: document.getElementById('inputKeterangan').value.trim()
  };

  const btn = document.getElementById('btnSubmitPresensi');
  const txt = document.getElementById('submitText');
  btn.disabled = true;
  txt.innerText = 'Menyimpan Presensi...';

  const resetBtn = () => { btn.disabled = false; txt.innerText = '🚀 Kirim Presensi Sekarang'; };

  if (APP_STATE.isGasEnv) {
    google.script.run
      .withSuccessHandler(res => {
        resetBtn();
        if (res && res.success) {
          showToast('success', res.message || 'Presensi berhasil dicatat!');
          APP_STATE.todayLogs.unshift(res.data);
          renderTodayFeed();
          updateMetricCards();
          clearPresensiForm();
        } else {
          showToast('error', res ? res.message : 'Gagal menyimpan');
        }
      })
      .withFailureHandler(err => { resetBtn(); showToast('error', 'Gagal: ' + err.message); })
      .simpanPresensi(payload);
  } else {
    setTimeout(() => {
      resetBtn();
      const mockLog = {
        id: 'ABS-' + APP_STATE.todayStr.replace(/-/g, '') + '-00' + (APP_STATE.todayLogs.length + 1),
        tanggal: APP_STATE.todayStr,
        waktu: new Date().toTimeString().split(' ')[0],
        idKaryawan: payload.idKaryawan,
        nama: payload.namaKaryawan,
        tipe: payload.tipeAbsen,
        status: payload.statusAbsen,
        urlFoto: payload.imageBase64,
        keterangan: payload.keterangan
      };
      APP_STATE.todayLogs.unshift(mockLog);
      showToast('success', 'Presensi ' + payload.tipeAbsen + ' berhasil dicatat (Mode Preview)!');
      renderTodayFeed();
      updateMetricCards();
      clearPresensiForm();
    }, 600);
  }
}

function clearPresensiForm() {
  document.getElementById('inputKeterangan').value = '';
  clearPhoto();
  if (APP_STATE.userRole === 'KARYAWAN' && APP_STATE.currentUser) {
    checkEmployeeTodayStatus(APP_STATE.currentUser.id);
  } else if (APP_STATE.userRole === 'ADMIN') {
    const sel = document.getElementById('selectKaryawan');
    if (sel && sel.value) checkEmployeeTodayStatus(sel.value);
  }
}

function renderTodayFeed() {
  const container = document.getElementById('todayFeedList');
  const badge = document.getElementById('todayCountBadge');
  const sub = document.getElementById('todayFeedSubtitle');

  let logs = APP_STATE.todayLogs;
  if (APP_STATE.userRole === 'KARYAWAN' && APP_STATE.currentUser) {
    logs = APP_STATE.todayLogs.filter(l => l.idKaryawan === APP_STATE.currentUser.id);
    badge.innerText = logs.length + ' Data';
    sub.innerText = 'Riwayat presensi Anda hari ini';
  } else {
    badge.innerText = APP_STATE.todayLogs.length + ' Data';
    sub.innerText = 'Total ' + APP_STATE.todayLogs.length + ' presensi masuk/pulang hari ini';
  }

  if (logs.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs">Belum ada presensi yang tercatat hari ini.</div>';
    return;
  }

  let html = '';
  logs.forEach(item => {
    const isHadir = item.status === 'HADIR';
    const isMasuk = item.tipe === 'MASUK';
    const statusBadge = isHadir ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (item.status === 'IZIN' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200');
    const tipeBadge = isMasuk ? 'text-sky-700 bg-sky-50' : 'text-slate-700 bg-slate-100';

    html += '<div class="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start justify-between gap-3">';
    html += '  <div class="flex items-start gap-3 min-w-0">';
    html += '    <div class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-700 shadow-xs">' + getInitials(item.nama) + '</div>';
    html += '    <div class="min-w-0">';
    html += '      <div class="flex items-center gap-1.5"><h5 class="font-semibold text-slate-900 text-sm truncate">' + escapeHtml(item.nama) + '</h5><span class="text-[10px] font-bold px-2 py-0.5 rounded-md ' + tipeBadge + '">' + item.tipe + '</span></div>';
    html += '      <div class="text-xs text-slate-500 mt-0.5">' + item.waktu + ' WIB ' + (item.keterangan ? '• <span class="italic">' + escapeHtml(item.keterangan) + '</span>' : '') + '</div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ' + statusBadge + '">' + item.status + '</span>';
    html += '</div>';
  });
  container.innerHTML = html;
}

// ================= DASHBOARD & REKAP ADMIN =================
function fetchRekapData() {
  const filter = {
    startDate: document.getElementById('filterStartDate').value,
    endDate: document.getElementById('filterEndDate').value,
    status: document.getElementById('filterStatus').value,
    query: document.getElementById('filterQuery').value.trim()
  };

  if (APP_STATE.isGasEnv) {
    google.script.run
      .withSuccessHandler(res => { if (res && res.success) { APP_STATE.rekapLogs = res.data || []; renderRekapTable(); } })
      .withFailureHandler(err => showToast('error', 'Gagal memuat rekap: ' + err.message))
      .getRekapAbsensi(filter);
  } else {
    APP_STATE.rekapLogs = APP_STATE.todayLogs;
    renderRekapTable();
  }
}

function renderRekapTable() {
  const tbody = document.getElementById('rekapTableBody');
  document.getElementById('rekapCountBadge').innerText = APP_STATE.rekapLogs.length + ' Data';

  if (APP_STATE.rekapLogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10 text-slate-400">Tidak ada data presensi yang sesuai filter.</td></tr>';
    return;
  }

  let html = '';
  APP_STATE.rekapLogs.forEach((item, idx) => {
    const isHadir = item.status === 'HADIR';
    const statusBadge = isHadir ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : (item.status === 'IZIN' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-800 border-rose-200');
    const tipeBadge = item.tipe === 'MASUK' ? 'bg-sky-50 text-sky-800' : 'bg-slate-100 text-slate-700';

    html += '<tr class="hover:bg-slate-50 transition-colors">';
    html += '  <td class="py-3 px-4 text-center font-mono text-xs text-slate-400">' + (idx + 1) + '</td>';
    html += '  <td class="py-3 px-4 font-mono font-medium text-slate-800">' + item.id + '</td>';
    html += '  <td class="py-3 px-4 whitespace-nowrap"><div class="font-medium text-slate-900">' + item.tanggal + '</div><div class="text-[11px] text-slate-500">' + item.waktu + ' WIB</div></td>';
    html += '  <td class="py-3 px-4"><div class="font-semibold text-slate-900">' + escapeHtml(item.nama) + '</div><div class="text-[11px] text-slate-500 font-mono">' + item.idKaryawan + '</div></td>';
    html += '  <td class="py-3 px-4 text-center"><span class="px-2 py-0.5 rounded text-[11px] font-bold ' + tipeBadge + '">' + item.tipe + '</span></td>';
    html += '  <td class="py-3 px-4 text-center"><span class="px-2.5 py-1 rounded-full text-xs font-semibold border ' + statusBadge + '">' + item.status + '</span></td>';
    html += '  <td class="py-3 px-4 text-center">' + (item.urlFoto ? '<button onclick="openPhotoModal(\'' + escapeHtml(item.nama) + '\',\'' + item.tanggal + ' ' + item.waktu + '\',\'' + item.urlFoto + '\')" class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs">📷 Foto</button>' : '-') + '</td>';
    html += '  <td class="py-3 px-4 text-slate-600 italic">' + (item.keterangan ? escapeHtml(item.keterangan) : '-') + '</td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
}

function exportToExcelCsv() {
  if (APP_STATE.rekapLogs.length === 0) { showToast('warning', 'Tidak ada data untuk diekspor'); return; }
  let csv = 'data:text/csv;charset=utf-8,NO,ID,TANGGAL,WAKTU,ID_KARYAWAN,NAMA,TIPE,STATUS,FOTO,KETERANGAN\r\n';
  APP_STATE.rekapLogs.forEach((r, i) => {
    csv += [i + 1, `"${r.id}"`, `"${r.tanggal}"`, `"${r.waktu}"`, `"${r.idKaryawan}"`, `"${r.nama}"`, `"${r.tipe}"`, `"${r.status}"`, `"${r.urlFoto}"`, `"${(r.keterangan || '').replace(/"/g, '""')}"`].join(',') + '\r\n';
  });
  const link = document.createElement('a');
  link.href = encodeURI(csv);
  link.download = 'Rekap_Presensi_' + APP_STATE.todayStr + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('success', 'File CSV berhasil diunduh!');
}

// ================= KELOLA TIM =================
function renderTimTable() {
  const tbody = document.getElementById('timTableBody');
  document.getElementById('timCountBadge').innerText = APP_STATE.karyawanList.length + ' Anggota';

  if (APP_STATE.karyawanList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400">Belum ada data anggota tim.</td></tr>';
    return;
  }

  let html = '';
  APP_STATE.karyawanList.forEach(k => {
    html += '<tr class="hover:bg-slate-50 transition-colors">';
    html += '  <td class="py-3 px-3 font-mono font-medium text-slate-800">' + k.id + '</td>';
    html += '  <td class="py-3 px-3 font-semibold text-slate-900">' + escapeHtml(k.nama) + '</td>';
    html += '  <td class="py-3 px-3 text-slate-600">' + escapeHtml(k.jabatan || '-') + '</td>';
    html += '  <td class="py-3 px-3 text-center"><span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">AKTIF</span></td>';
    html += '  <td class="py-3 px-3 text-center"><button onclick="promptResetPin(\'' + k.id + '\',\'' + escapeHtml(k.nama) + '\')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium">🔑 Reset PIN</button></td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
}

function promptResetPin(empId, empNama) {
  const newPin = prompt('Masukkan PIN baru untuk ' + empNama + ' (' + empId + '):', '1234');
  if (!newPin || !newPin.trim()) return;

  if (APP_STATE.isGasEnv) {
    showToast('info', 'Memperbarui PIN ' + empNama + '...');
    google.script.run
      .withSuccessHandler(res => { if (res && res.success) showToast('success', res.message); else showToast('error', res?.message || 'Gagal'); })
      .withFailureHandler(err => showToast('error', 'Gagal: ' + err.message))
      .updatePinKaryawan(empId, newPin.trim());
  } else {
    showToast('success', 'PIN untuk ' + empNama + ' berhasil diubah menjadi ' + newPin.trim() + ' (Simulasi)!');
  }
}

function handleTambahKaryawanSubmit(event) {
  event.preventDefault();
  const nama = document.getElementById('inputNamaKaryawan').value.trim();
  const jabatan = document.getElementById('inputJabatanKaryawan').value.trim();
  const catatan = document.getElementById('inputCatatanKaryawan').value.trim();
  const pin = document.getElementById('inputPinKaryawan').value.trim();

  if (!nama) { showToast('error', 'Nama karyawan wajib diisi'); return; }

  const payload = { nama, jabatan, catatan, pin };
  const btn = document.getElementById('btnTambahKaryawan');
  btn.disabled = true;

  const resetBtn = () => { btn.disabled = false; };

  if (APP_STATE.isGasEnv) {
    google.script.run
      .withSuccessHandler(res => {
        resetBtn();
        if (res && res.success) {
          showToast('success', res.message);
          APP_STATE.karyawanList.push(res.data);
          renderKaryawanDropdown();
          renderTimTable();
          updateMetricCards();
          document.getElementById('inputNamaKaryawan').value = '';
          document.getElementById('inputJabatanKaryawan').value = '';
          document.getElementById('inputCatatanKaryawan').value = '';
          document.getElementById('inputPinKaryawan').value = '';
        } else showToast('error', res?.message || 'Gagal menambah karyawan');
      })
      .withFailureHandler(err => { resetBtn(); showToast('error', 'Gagal: ' + err.message); })
      .tambahKaryawan(payload);
  } else {
    setTimeout(() => {
      resetBtn();
      const newEmp = { id: 'SECR-' + String(APP_STATE.karyawanList.length + 1).padStart(3, '0'), nama, jabatan: jabatan || 'Anggota', status: 'AKTIF' };
      APP_STATE.karyawanList.push(newEmp);
      renderKaryawanDropdown();
      renderTimTable();
      updateMetricCards();
      document.getElementById('inputNamaKaryawan').value = '';
      document.getElementById('inputJabatanKaryawan').value = '';
      document.getElementById('inputCatatanKaryawan').value = '';
      document.getElementById('inputPinKaryawan').value = '';
      showToast('success', 'Karyawan ' + nama + ' berhasil didaftarkan (PIN: ' + (pin || '1234') + ') [Simulasi]!');
    }, 400);
  }
}

function updateMetricCards() {
  const total = APP_STATE.karyawanList.length;
  document.getElementById('metricTotalKaryawan').innerText = total;

  const hadirIds = new Set();
  const izinIds = new Set();
  APP_STATE.todayLogs.forEach(l => {
    if (l.status === 'HADIR') hadirIds.add(l.idKaryawan);
    else if (l.status === 'IZIN' || l.status === 'SAKIT') izinIds.add(l.idKaryawan);
  });

  document.getElementById('metricHadirHariIni').innerText = hadirIds.size;
  document.getElementById('metricIzinSakitHariIni').innerText = izinIds.size;
  document.getElementById('metricBelumAbsen').innerText = Math.max(0, total - (hadirIds.size + izinIds.size));
}

function forceRefreshAll() {
  const icon = document.getElementById('refreshIcon');
  icon.classList.add('animate-spin');
  loadInitialData();
  if (APP_STATE.activeTab === 'rekap') fetchRekapData();
  setTimeout(() => {
    icon.classList.remove('animate-spin');
    showToast('info', 'Data berhasil diperbarui');
  }, 800);
}

function openPhotoModal(nama, waktu, urlFoto) {
  document.getElementById('modalPhotoTitle').innerText = 'Foto Bukti: ' + nama;
  document.getElementById('modalPhotoSubtitle').innerText = waktu + ' WIB';
  document.getElementById('modalPhotoImg').src = urlFoto;
  document.getElementById('modalPhotoDownloadLink').href = urlFoto;
  document.getElementById('photoModal').classList.remove('hidden');
}

function closePhotoModal() {
  document.getElementById('photoModal').classList.add('hidden');
  document.getElementById('modalPhotoImg').src = '';
}

function showToast(type, message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  let bg = 'bg-slate-900 text-white';
  let icon = 'ℹ️';
  if (type === 'error') { bg = 'bg-rose-900 text-white'; icon = '❌'; }
  else if (type === 'warning') { bg = 'bg-amber-900 text-white'; icon = '⚠️'; }
  else if (type === 'success') { bg = 'bg-emerald-900 text-white'; icon = '✅'; }

  toast.className = 'pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs sm:text-sm font-medium transition-all transform translate-y-2 opacity-0 ' + bg;
  toast.innerHTML = '<span>' + icon + '</span> <span>' + escapeHtml(message) + '</span>';
  container.appendChild(toast);

  setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].substring(0, 2)).toUpperCase();
}
