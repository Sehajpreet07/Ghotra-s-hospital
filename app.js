'use strict';

/* ═══════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════ */
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function toast(msg, type = 'success') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  qs('#toast-container').appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 3200);
}

function confirmDialog(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal-box confirm-box">
        <div class="confirm-icon">⚠️</div>
        <h3>Confirm Action</h3>
        <p>${msg}</p>
        <div class="modal-actions">
          <button class="btn btn-outline" id="conf-no">Cancel</button>
          <button class="btn btn-danger"  id="conf-yes">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    qs('#conf-no',  overlay).onclick = () => { overlay.remove(); resolve(false); };
    qs('#conf-yes', overlay).onclick = () => { overlay.remove(); resolve(true);  };
  });
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getAge(dob) {
  if (!dob) return '—';
  const ms = Date.now() - new Date(dob).getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000)) + ' yrs';
}

function statusBadge(status) {
  const map = {
    Scheduled: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red',
    Paid: 'badge-green', Pending: 'badge-yellow', Active: 'badge-green', Inactive: 'badge-gray'
  };
  return `<span class="badge ${map[status] || 'badge-gray'}">${status}</span>`;
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

/* ═══════════════════════════════════════════════
   ROUTER
═══════════════════════════════════════════════ */
const Router = {
  current: { page: '', params: {} },

  navigate(page, params = {}) {
    this.current = { page, params };
    const contentEl = qs('#content');
    contentEl.classList.remove('fade-in');
    void contentEl.offsetWidth;
    contentEl.classList.add('fade-in');

    // Update sidebar active link
    qsa('.nav-link').forEach(l => l.classList.remove('active'));
    const link = qs(`[data-page="${page}"]`);
    if (link) link.classList.add('active');

    // Render page
    const renders = {
      // Admin
      'admin-dashboard'    : () => { contentEl.innerHTML = Views.adminDashboard();    Views.adminDashboardInit(); },
      'admin-patients'     : () => { contentEl.innerHTML = Views.adminPatients();     Views.adminPatientsInit(); },
      'admin-doctors'      : () => { contentEl.innerHTML = Views.adminDoctors();      Views.adminDoctorsInit(); },
      'admin-appointments' : () => { contentEl.innerHTML = Views.adminAppointments(); Views.adminAppointmentsInit(); },
      'admin-billing'      : () => { contentEl.innerHTML = Views.adminBilling();      Views.adminBillingInit(); },
      // Doctor
      'doctor-dashboard'   : () => { contentEl.innerHTML = Views.doctorDashboard();   Views.doctorDashboardInit(); },
      'doctor-patients'    : () => { contentEl.innerHTML = Views.doctorPatients();    Views.doctorPatientsInit(); },
      'doctor-records'     : () => { contentEl.innerHTML = Views.doctorRecords(params); Views.doctorRecordsInit(params); },
      // Receptionist
      'recep-dashboard'    : () => { contentEl.innerHTML = Views.recepDashboard();    Views.recepDashboardInit(); },
      'recep-register'     : () => { contentEl.innerHTML = Views.recepRegister();     Views.recepRegisterInit(); },
      'recep-appointments' : () => { contentEl.innerHTML = Views.recepAppointments(); Views.recepAppointmentsInit(); },
      // Patient
      'patient-dashboard'  : () => { contentEl.innerHTML = Views.patientDashboard(); Views.patientDashboardInit(); },
      'patient-records'    : () => { contentEl.innerHTML = Views.patientRecords();   Views.patientRecordsInit(); },
      'patient-bills'      : () => { contentEl.innerHTML = Views.patientBills();     Views.patientBillsInit(); },
    };

    if (renders[page]) renders[page]();
    else contentEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🚧</div><h3>Page not found</h3></div>`;
  }
};

/* ═══════════════════════════════════════════════
   SIDEBAR BUILDER
═══════════════════════════════════════════════ */
function buildSidebar(session) {
  const navs = {
    admin: [
      { icon: '🏠', label: 'Dashboard',    page: 'admin-dashboard' },
      { icon: '👥', label: 'Patients',     page: 'admin-patients' },
      { icon: '🩺', label: 'Doctors',      page: 'admin-doctors' },
      { icon: '📅', label: 'Appointments', page: 'admin-appointments' },
      { icon: '💳', label: 'Billing',      page: 'admin-billing' },
    ],
    doctor: [
      { icon: '🏠', label: 'Dashboard',    page: 'doctor-dashboard' },
      { icon: '👥', label: 'My Patients',  page: 'doctor-patients' },
    ],
    receptionist: [
      { icon: '🏠', label: 'Dashboard',    page: 'recep-dashboard' },
      { icon: '➕', label: 'Register Patient', page: 'recep-register' },
      { icon: '📅', label: 'Appointments', page: 'recep-appointments' },
    ],
    patient: [
      { icon: '🏠', label: 'Dashboard',    page: 'patient-dashboard' },
      { icon: '📋', label: 'My Records',   page: 'patient-records' },
      { icon: '💳', label: 'My Bills',     page: 'patient-bills' },
    ],
  };

  const links = (navs[session.role] || []).map(n => `
    <button class="nav-link" data-page="${n.page}">
      <span class="nav-icon">${n.icon}</span>${n.label}
    </button>`).join('');

  const initials = session.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  qs('#sidebar').innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">🏥</div>
      <div><h2>Ghotra's Hospital</h2><span>Management System</span></div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-section-label">Navigation</div>
      ${links}
    </div>
    <div class="sidebar-bottom">
      <div class="user-card">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${session.name}</div>
          <div class="user-role">${session.role}</div>
        </div>
      </div>
      <button class="btn btn-outline btn-sm" id="logout-btn" style="width:100%;margin-top:10px;justify-content:center;">
        🚪 Logout
      </button>
    </div>`;

  // Attach nav events
  qsa('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => Router.navigate(btn.dataset.page));
  });

  qs('#logout-btn').addEventListener('click', () => {
    Auth.logout();
    showLogin();
  });
}

/* ═══════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════ */
function showLogin() {
  qs('#login-screen').style.display = 'flex';
  qs('#main-app').style.display = 'none';
  qs('#login-error').textContent = '';
  qs('#login-username').value = '';
  qs('#login-password').value = '';
}

function showApp(session) {
  qs('#login-screen').style.display = 'none';
  qs('#main-app').style.display = 'flex';
  buildSidebar(session);
  qs('#topbar-user').textContent = session.name;

  const defaults = {
    admin: 'admin-dashboard',
    doctor: 'doctor-dashboard',
    receptionist: 'recep-dashboard',
    patient: 'patient-dashboard',
  };
  Router.navigate(defaults[session.role] || 'admin-dashboard');
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  DB.init();

  // Login form
  qs('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    const username = qs('#login-username').value.trim();
    const password = qs('#login-password').value.trim();
    const result = Auth.login(username, password);
    if (result.success) {
      showApp(result.session);
    } else {
      qs('#login-error').textContent = '⚠ Invalid username or password.';
    }
  });

  // Demo credential buttons
  qsa('.demo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qs('#login-username').value = btn.dataset.user;
      qs('#login-password').value = btn.dataset.pass;
    });
  });

  // Mobile sidebar toggle
  const menuBtn = qs('#menu-toggle');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => qs('#sidebar').classList.toggle('open'));
  }

  // Self Registration
  const btnOpenReg = qs('#open-patient-register');
  const modalReg   = qs('#self-register-modal');
  if (btnOpenReg && modalReg) {
    btnOpenReg.addEventListener('click', () => {
      qs('#self-register-form').reset();
      qs('#self-register-error').textContent = '';
      modalReg.classList.add('active');
    });
    qs('#close-self-register').addEventListener('click', () => modalReg.classList.remove('active'));
    qs('#cancel-self-register').addEventListener('click', () => modalReg.classList.remove('active'));

    qs('#self-register-form').addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      const errEl = qs('#self-register-error');
      
      // Check for duplicates
      if (DB.getAll('patients').find(p => p.aadhaar === data.aadhaar)) {
        errEl.textContent = '⚠ A patient with this Aadhaar already exists.';
        return;
      }
      if (DB.getAll('users').find(u => u.username === data.username)) {
        errEl.textContent = '⚠ Username already taken. Please choose another.';
        return;
      }

      // Generate IDs
      const patientId = DB.genPatientId();
      const userId = DB.genId('u');

      // Add to patients
      DB.add('patients', {
        id: patientId,
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        aadhaar: data.aadhaar,
        address: data.address,
        contact: data.contact,
        email: data.email,
        registeredOn: todayStr()
      });

      // Add to users
      DB.add('users', {
        id: userId,
        username: data.username,
        password: data.password,
        role: 'patient',
        name: data.name,
        email: data.email,
        patientId: patientId
      });

      modalReg.classList.remove('active');
      toast('Registration successful! You can now log in.');
      qs('#login-username').value = data.username;
      qs('#login-password').value = data.password;
    });
  }

  // Resume session if exists
  const session = Auth.getSession();
  if (session) showApp(session);
  else showLogin();
});
