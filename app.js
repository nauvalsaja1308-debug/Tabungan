/* ============================================================
   TabunganKu — app.js  (CLEAN REBUILD)
   ============================================================ */

/* ============================================================
   1. PARTICLES
   ============================================================ */
(function () {
  var cv = document.getElementById('particles');
  if (!cv) return;
  var cx = cv.getContext('2d');
  var W, H, pts = [];

  function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
  window.addEventListener('resize', function () { resize(); build(); });
  resize();

  function build() {
    pts = [];
    var n = Math.floor((W * H) / 20000);
    for (var i = 0; i < n; i++) {
      pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, r: Math.random() * 1.4 + .3, a: Math.random() * .4 + .07 });
    }
  }
  build();

  function draw() {
    cx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      cx.fillStyle = 'rgba(0,245,160,' + p.a + ')'; cx.fill();
    }
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          cx.beginPath(); cx.moveTo(pts[i].x, pts[i].y); cx.lineTo(pts[j].x, pts[j].y);
          cx.strokeStyle = 'rgba(0,245,160,' + (.05 * (1 - d / 120)) + ')';
          cx.lineWidth = .5; cx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ============================================================
   2. STORAGE HELPERS
   ============================================================ */
function getUsers()        { return JSON.parse(localStorage.getItem('tbk_users') || '[]'); }
function saveUsers(u)      { localStorage.setItem('tbk_users', JSON.stringify(u)); }
function getUserData(e)    { return JSON.parse(localStorage.getItem('tbk_d_' + e) || '{"transaksi":[],"target":0}'); }
function saveUserData(e,d) { localStorage.setItem('tbk_d_' + e, JSON.stringify(d)); }

/* ============================================================
   3. APP STATE
   ============================================================ */
var S = { user: null, trx: [], target: 0, filter: 'semua' };

var KAT = { Gaji:'💼', Bonus:'🎁', Investasi:'📈', Makanan:'🍜', Transportasi:'🚗', Belanja:'🛒', Hiburan:'🎮', Lainnya:'📦' };

/* ============================================================
   4. NUMBER FORMAT — titik ribuan: 250.000.000
   ============================================================ */
function fmtRp(n) {
  var num = Math.round(Number(n) || 0);
  return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function fmtAngka(n) {
  if (n === 'Error' || n === '') return n || '0';
  var x = parseFloat(n);
  if (isNaN(x)) return '0';
  if (Math.abs(x) >= 1e15) return x.toExponential(4);
  var parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.length > 1 ? parts[0] + ',' + parts[1] : parts[0];
}
function fmtDate(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
       + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function fmtInput(el) {
  var raw = el.value.replace(/\D/g, '');
  if (!raw) { el.value = ''; el.dataset.raw = ''; return; }
  el.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  el.dataset.raw = raw;
}
function getRaw(id) {
  var el = document.getElementById(id);
  if (!el) return 0;
  if (el.dataset && el.dataset.raw) return parseFloat(el.dataset.raw) || 0;
  return parseFloat(el.value.replace(/\./g, '')) || 0;
}

/* ============================================================
   5. UI HELPERS
   ============================================================ */
function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3200);
}
function showMsg(id, msg, type) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = (type === 'err' ? '⚠️  ' : '✅  ') + msg;
  el.style.display = 'block';
  if (type === 'ok') setTimeout(function () { el.style.display = 'none'; }, 3500);
}
function hideMsg(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
function isEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function saveData() {
  if (!S.user) return;
  saveUserData(S.user.email, { transaksi: S.trx, target: S.target });
}

/* ============================================================
   6. PAGE SHOW/HIDE  ← ROOT FIX
   ============================================================ */
function showAuthPage() {
  document.getElementById('auth-page').style.display = 'flex';
  document.getElementById('app').style.display       = 'none';
}
function showAppPage() {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app').style.display       = 'block';
}

/* ============================================================
   7. AUTH SWITCH (LOGIN / DAFTAR)
   ============================================================ */
function switchAuth(mode) {
  var lf = document.getElementById('form-login');
  var df = document.getElementById('form-daftar');
  var lb = document.getElementById('btn-login');
  var db = document.getElementById('btn-daftar');
  var sl = document.getElementById('atab-slider');

  hideMsg('login-err'); hideMsg('login-ok');
  hideMsg('daftar-err'); hideMsg('daftar-ok');

  if (mode === 'login') {
    lf.style.display = 'block';
    df.style.display = 'none';
    lb.classList.add('active');
    db.classList.remove('active');
    if (sl) sl.classList.remove('right');
  } else {
    lf.style.display = 'none';
    df.style.display = 'block';
    db.classList.add('active');
    lb.classList.remove('active');
    if (sl) sl.classList.add('right');
  }
}

function togglePw(id) {
  var el = document.getElementById(id);
  if (el) el.type = (el.type === 'password') ? 'text' : 'password';
}

/* ============================================================
   8. DAFTAR AKUN
   ============================================================ */
function doDaftar() {
  var nama  = document.getElementById('daftar-nama').value.trim();
  var email = document.getElementById('daftar-email').value.trim().toLowerCase();
  var pw    = document.getElementById('daftar-pw').value;
  var pw2   = document.getElementById('daftar-pw2').value;

  hideMsg('daftar-err'); hideMsg('daftar-ok');

  if (!nama)           return showMsg('daftar-err', 'Nama tidak boleh kosong.', 'err');
  if (!isEmail(email)) return showMsg('daftar-err', 'Format email tidak valid.', 'err');
  if (pw.length < 6)   return showMsg('daftar-err', 'Password minimal 6 karakter.', 'err');
  if (pw !== pw2)      return showMsg('daftar-err', 'Konfirmasi password tidak cocok.', 'err');

  var users = getUsers();
  if (users.find(function (u) { return u.email === email; })) {
    return showMsg('daftar-err', 'Email sudah terdaftar. Silakan masuk.', 'err');
  }

  users.push({ email: email, password: pw, nama: nama });
  saveUsers(users);

  document.getElementById('daftar-nama').value  = '';
  document.getElementById('daftar-email').value = '';
  document.getElementById('daftar-pw').value    = '';
  document.getElementById('daftar-pw2').value   = '';

  showMsg('daftar-ok', 'Akun berhasil dibuat! Silakan masuk.', 'ok');
  setTimeout(function () { switchAuth('login'); }, 1800);
}

/* ============================================================
   9. LOGIN
   ============================================================ */
function doLogin() {
  var email = document.getElementById('login-email').value.trim().toLowerCase();
  var pw    = document.getElementById('login-pw').value;

  hideMsg('login-err'); hideMsg('login-ok');

  if (!isEmail(email)) return showMsg('login-err', 'Masukkan email yang valid.', 'err');
  if (!pw)             return showMsg('login-err', 'Password tidak boleh kosong.', 'err');

  var users = getUsers();
  var user  = users.find(function (u) { return u.email === email && u.password === pw; });

  if (!user) return showMsg('login-err', 'Email atau password salah.', 'err');

  /* Load data user */
  var ud    = getUserData(email);
  S.user    = user;
  S.trx     = ud.transaksi || [];
  S.target  = ud.target    || 0;

  /* Update UI */
  var name = user.nama;
  document.getElementById('nav-name').textContent   = name;
  document.getElementById('greet-name').textContent = name;
  document.getElementById('nav-av').textContent     = name.charAt(0).toUpperCase();
  document.getElementById('today-date').textContent =
    new Date().toLocaleDateString('id-ID', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

  /* Tampilkan app */
  showAppPage();

  /* Render dashboard */
  setTimeout(function () { moveSlider('dashboard'); }, 60);
  renderDash();
  renderTrx();

  toast('👋  Halo, ' + name + '! Selamat datang.');
}

/* Enter key shortcut */
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter') return;
  var auth = document.getElementById('auth-page');
  if (!auth || auth.style.display === 'none') return;
  var lf = document.getElementById('form-login');
  if (!lf) return;
  if (lf.style.display !== 'none') {
    doLogin();
  } else {
    doDaftar();
  }
});

/* ============================================================
   10. LOGOUT
   ============================================================ */
function doLogout() {
  S.user = null; S.trx = []; S.target = 0;
  document.getElementById('login-email').value = '';
  document.getElementById('login-pw').value    = '';
  switchAuth('login');
  showTab('dashboard');
  showAuthPage();
  toast('Berhasil keluar 👋');
}

/* ============================================================
   11. NAV SLIDER
   ============================================================ */
function moveSlider(tab) {
  var btn  = document.querySelector('.npill[data-tab="' + tab + '"]');
  var sl   = document.getElementById('pill-slider');
  var wrap = document.querySelector('.nav-pills');
  if (!btn || !sl || !wrap) return;
  var wr = wrap.getBoundingClientRect();
  var br = btn.getBoundingClientRect();
  sl.style.left  = (br.left - wr.left + 4) + 'px';
  sl.style.width = br.width + 'px';
}

function showTab(tab) {
  document.querySelectorAll('.tpage').forEach(function (el) { el.classList.remove('active'); });
  document.querySelectorAll('.npill').forEach(function (el) { el.classList.remove('active'); });
  var page = document.getElementById('tab-' + tab);
  if (page) page.classList.add('active');
  var btn  = document.querySelector('.npill[data-tab="' + tab + '"]');
  if (btn)  btn.classList.add('active');
  moveSlider(tab);
  if (tab === 'riwayat')   renderTrx();
  if (tab === 'dashboard') renderDash();
}

/* ============================================================
   12. DASHBOARD RENDER
   ============================================================ */
function renderDash() {
  var masuk  = S.trx.filter(function (t) { return t.jenis === 'masuk';  }).reduce(function (s, t) { return s + t.jumlah; }, 0);
  var keluar = S.trx.filter(function (t) { return t.jenis === 'keluar'; }).reduce(function (s, t) { return s + t.jumlah; }, 0);
  var saldo  = Math.max(0, masuk - keluar);
  var now    = new Date();
  var bulan  = S.trx.filter(function (t) {
    var d = new Date(t.tanggal);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  animCount('total-saldo',  saldo);
  animCount('total-masuk',  masuk);
  animCount('total-keluar', keluar);
  document.getElementById('total-trx').textContent = bulan;

  var mx = Math.max(masuk, 1);
  setTimeout(function () {
    setBar('bar-saldo',  (saldo  / mx) * 100);
    setBar('bar-masuk',  100);
    setBar('bar-keluar', (keluar / mx) * 100);
    setBar('bar-trx',    Math.min(100, (bulan / 30) * 100));
  }, 200);

  if (S.target > 0) {
    var pct = Math.min(100, Math.round((saldo / S.target) * 100));
    document.getElementById('progress-box').style.display = 'block';
    setTimeout(function () {
      document.getElementById('prog-bar').style.width = pct + '%';
    }, 100);
    document.getElementById('prog-pct').textContent    = pct + '%';
    document.getElementById('prog-detail').textContent = fmtRp(saldo) + ' / ' + fmtRp(S.target);
    var tv = document.getElementById('target-val');
    tv.value = S.target.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    tv.dataset.raw = S.target;
  } else {
    document.getElementById('progress-box').style.display = 'none';
  }
}

function setBar(id, pct) {
  var el = document.getElementById(id);
  if (el) el.style.width = Math.min(100, Math.max(0, pct)) + '%';
}

function animCount(id, target) {
  var el = document.getElementById(id);
  if (!el) return;
  var dur = 900, t0 = performance.now();
  function step(now) {
    var p = Math.min((now - t0) / dur, 1);
    var ease = 1 - Math.pow(1 - p, 3);
    el.textContent = fmtRp(Math.round(ease * target));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   13. TAMBAH TRANSAKSI
   ============================================================ */
function tambahTransaksi() {
  var jenis  = document.getElementById('trx-jenis').value;
  var kat    = document.getElementById('trx-kat').value;
  var jumlah = getRaw('trx-jumlah');
  var ket    = document.getElementById('trx-ket').value.trim();

  if (!jumlah || jumlah <= 0) { toast('⚠️  Masukkan jumlah yang valid!'); return; }

  S.trx.unshift({ id: Date.now(), jenis: jenis, kategori: kat, jumlah: jumlah, keterangan: ket || kat, tanggal: new Date().toISOString() });
  saveData();
  renderDash();

  var jEl = document.getElementById('trx-jumlah');
  jEl.value = ''; jEl.dataset.raw = '';
  document.getElementById('trx-ket').value = '';

  toast(jenis === 'masuk' ? '💚  Pemasukan ' + fmtRp(jumlah) + ' dicatat!' : '❤️  Pengeluaran ' + fmtRp(jumlah) + ' dicatat!');
}

/* ============================================================
   14. TARGET
   ============================================================ */
function setTarget() {
  var val = getRaw('target-val');
  if (!val || val <= 0) { toast('⚠️  Masukkan target yang valid!'); return; }
  S.target = val;
  saveData();
  renderDash();
  toast('🎯  Target diset ke ' + fmtRp(val));
}

/* ============================================================
   15. RIWAYAT
   ============================================================ */
function renderTrx(f) {
  if (f) S.filter = f;
  var list = document.getElementById('trx-list');
  if (!list) return;
  var data = S.trx.slice();
  if (S.filter === 'masuk')  data = data.filter(function (t) { return t.jenis === 'masuk'; });
  if (S.filter === 'keluar') data = data.filter(function (t) { return t.jenis === 'keluar'; });

  if (!data.length) {
    list.innerHTML = '<div class="empty"><span>💸</span><p>Belum ada transaksi.<br/>Tambahkan dari Dashboard!</p></div>';
    return;
  }

  list.innerHTML = data.map(function (t, i) {
    return '<div class="trx-row" style="animation-delay:' + (i * .04) + 's">' +
      '<div class="trx-l">' +
        '<div class="trx-badge ' + t.jenis + '">' + (KAT[t.kategori] || '📦') + '</div>' +
        '<div><div class="trx-name">' + t.keterangan + '</div><div class="trx-meta">' + t.kategori + ' · ' + (t.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran') + '</div></div>' +
      '</div>' +
      '<div class="trx-r">' +
        '<div class="trx-amt ' + t.jenis + '">' + (t.jenis === 'masuk' ? '+' : '-') + fmtRp(t.jumlah) + '</div>' +
        '<div class="trx-time">' + fmtDate(t.tanggal) + '</div>' +
      '</div>' +
      '<button type="button" class="btn-del" onclick="hapusTrx(' + t.id + ')">✕</button>' +
    '</div>';
  }).join('');
}

function filterTrx(type, btn) {
  document.querySelectorAll('.chip').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderTrx(type);
}
function hapusTrx(id) {
  S.trx = S.trx.filter(function (t) { return t.id !== id; });
  saveData(); renderTrx(); renderDash();
  toast('🗑  Transaksi dihapus');
}
function hapusSemua() {
  if (!confirm('Hapus semua transaksi? Tidak bisa dibatalkan.')) return;
  S.trx = []; saveData(); renderTrx(); renderDash();
  toast('🗑  Semua transaksi dihapus');
}

/* ============================================================
   16. KALKULATOR
   ============================================================ */
var cExpr = '', cRes = '0', cDone = false;

function ci(val) {
  var eEl = document.getElementById('calc-expr');
  var rEl = document.getElementById('calc-res');
  if (!eEl || !rEl) return;

  if (val === 'C')   { cExpr = ''; cRes = '0'; cDone = false; eEl.textContent = ''; rEl.textContent = '0'; return; }
  if (val === 'DEL') {
    if (cDone) { cExpr = ''; cDone = false; }
    cExpr = cExpr.slice(0, -1);
    eEl.textContent = fmtExpr(cExpr);
    try { if (cExpr) cRes = String(eval(cExpr)); } catch (e) {}
    rEl.textContent = fmtAngka(cRes); return;
  }
  if (val === '=') {
    if (!cExpr) return;
    try {
      var r = eval(cExpr.replace(/÷/g, '/').replace(/×/g, '*'));
      cRes = isFinite(r) ? String(r) : 'Error';
    } catch (e) { cRes = 'Error'; }
    eEl.textContent = fmtExpr(cExpr) + ' =';
    rEl.textContent = fmtAngka(cRes);
    cExpr = (cRes === 'Error') ? '' : cRes;
    cDone = true; return;
  }

  var isOp = ['+','-','*','/','%'].indexOf(val) !== -1;
  if (cDone && !isOp) { cExpr = ''; cDone = false; }
  if (cDone && isOp)  cDone = false;
  if (isOp && ['+','-','*','/','%'].indexOf(cExpr.slice(-1)) !== -1) cExpr = cExpr.slice(0, -1);

  cExpr += val;
  eEl.textContent = fmtExpr(cExpr);
  try {
    var safe = cExpr.replace(/[^0-9+\-*/.%()]/g, '');
    if (safe && !/[+\-*/.%]$/.test(safe)) cRes = String(eval(safe));
  } catch (e) {}
  rEl.textContent = fmtAngka(cRes);
}

function fmtExpr(e) { return e.replace(/\*/g, '×').replace(/\//g, '÷'); }

document.addEventListener('keydown', function (e) {
  var tab = document.getElementById('tab-kalkulator');
  if (!tab || !tab.classList.contains('active')) return;
  var m = { 'Enter':'=', 'Backspace':'DEL', 'Escape':'C', '+':'+', '-':'-', '*':'*', '/':'/', '.':'.', '%':'%' };
  if (m[e.key]) { ci(m[e.key]); return; }
  if (/^[0-9]$/.test(e.key)) ci(e.key);
});

/* ============================================================
   17. SIMULASI BUNGA
   ============================================================ */
function hitungBunga() {
  var modal  = getRaw('sim-modal');
  var rutin  = getRaw('sim-rutin');
  var bunga  = parseFloat(document.getElementById('sim-bunga').value)  || 0;
  var durasi = parseInt(document.getElementById('sim-durasi').value)   || 0;

  if (durasi <= 0) { toast('⚠️  Masukkan durasi yang valid!'); return; }

  var r      = (bunga / 100) / 12;
  var total  = (r === 0) ? modal + rutin * durasi : modal * Math.pow(1 + r, durasi) + rutin * ((Math.pow(1 + r, durasi) - 1) / r);
  var totTab = modal + rutin * durasi;
  var totBng = total - totTab;

  var sr = document.getElementById('sim-result');
  sr.style.display = 'block';
  document.getElementById('res-tab').textContent   = fmtRp(Math.round(totTab));
  document.getElementById('res-bunga').textContent = fmtRp(Math.round(totBng));
  document.getElementById('res-total').textContent = fmtRp(Math.round(total));
  toast('📊  Total akhir: ' + fmtRp(Math.round(total)));
}

/* ============================================================
   18. INIT — jalankan saat halaman siap
   ============================================================ */
function seedDemo() {
  var users = getUsers();
  var demo  = 'demo@tabunganku.id';
  if (!users.find(function (u) { return u.email === demo; })) {
    users.push({ email: demo, password: '123456', nama: 'Demo User' });
    saveUsers(users);
  }
}

function initApp() {
  seedDemo();
  showAuthPage();            /* auth muncul, app sembunyi */
  switchAuth('login');       /* tampilkan form login */
}

/* Jalankan sesegera mungkin */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
