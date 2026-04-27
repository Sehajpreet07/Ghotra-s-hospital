'use strict';
const PatientViews = {

  dashboard() {
    const session = Auth.getSession();
    const patientId = session.patientId;
    const patient = DB.getById('patients', patientId);
    const appts   = DB.getAll('appointments').filter(a => a.patientId === patientId);
    const records = DB.getAll('records').filter(r => r.patientId === patientId);
    const bills   = DB.getAll('bills').filter(b => b.patientId === patientId);
    const upcoming = appts.filter(a => a.status === 'Scheduled' && a.date >= todayStr());
    return `
    <div class="page-header">
      <h1>Welcome, ${session.name}</h1>
      <p>Your health dashboard — everything in one place.</p>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon blue">📅</div><div><div class="stat-val">${upcoming.length}</div><div class="stat-label">Upcoming Appointments</div></div></div>
      <div class="stat-card"><div class="stat-icon purple">📋</div><div><div class="stat-val">${records.length}</div><div class="stat-label">Medical Records</div></div></div>
      <div class="stat-card"><div class="stat-icon yellow">💳</div><div><div class="stat-val">₹${bills.filter(b=>b.status==='Pending').reduce((s,b)=>s+b.total,0).toLocaleString()}</div><div class="stat-label">Pending Bills</div></div></div>
    </div>
    ${patient ? `
    <div class="card">
      <div class="card-header"><span class="card-title">My Profile</span></div>
      <div class="detail-grid">
        <div class="detail-item"><label>Patient ID</label><span><span class="badge badge-blue">${patient.id}</span></span></div>
        <div class="detail-item"><label>Name</label><span>${patient.name}</span></div>
        <div class="detail-item"><label>Date of Birth</label><span>${formatDate(patient.dob)} (${getAge(patient.dob)})</span></div>
        <div class="detail-item"><label>Gender</label><span>${patient.gender}</span></div>
        <div class="detail-item"><label>Blood Group</label><span>${patient.bloodGroup || '—'}</span></div>
        <div class="detail-item"><label>Contact</label><span>${patient.contact}</span></div>
        <div class="detail-item"><label>Email</label><span>${patient.email || '—'}</span></div>
        <div class="detail-item"><label>Aadhaar</label><span>${patient.aadhaar}</span></div>
        <hr class="detail-divider">
        <div class="detail-item" style="grid-column:1/-1"><label>Address</label><span>${patient.address}</span></div>
      </div>
    </div>` : ''}
    <div class="card">
      <div class="card-header"><span class="card-title">Upcoming Appointments</span></div>
      ${upcoming.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Reason</th><th>Status</th></tr></thead>
        <tbody>${upcoming.map(a=>`
          <tr>
            <td>${formatDate(a.date)}</td>
            <td>${a.time}</td>
            <td>${a.doctorName}</td>
            <td>${a.reason}</td>
            <td>${statusBadge(a.status)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-state"><div class="empty-icon">📅</div><h3>No upcoming appointments</h3><p>Contact the reception to book one.</p></div>`}
    </div>`;
  },

  records() {
    const session = Auth.getSession();
    const records = DB.getAll('records').filter(r => r.patientId === session.patientId);
    return `
    <div class="page-header">
      <h1>My Medical Records</h1>
      <p>Your complete medical history.</p>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Records (${records.length})</span></div>
      ${records.length ? records.map(r=>`
        <div class="record-card">
          <div class="record-card-header">
            <strong>${r.diagnosis}</strong>
            <span style="color:var(--muted);font-size:12px">${formatDate(r.date)}</span>
          </div>
          <p style="font-size:13px;color:var(--muted);margin-bottom:8px">By ${r.doctorName}</p>
          <p style="font-size:13px;margin-bottom:4px"><strong>Prescription:</strong></p>
          <pre style="font-size:12.5px;white-space:pre-wrap;color:var(--text);background:var(--bg);border-radius:8px;padding:10px">${r.prescription}</pre>
          ${r.notes ? `<p style="font-size:13px;margin-top:8px;color:var(--muted)"><strong>Notes:</strong> ${r.notes}</p>` : ''}
        </div>`).join('')
      : `<div class="empty-state"><div class="empty-icon">📋</div><h3>No records yet</h3><p>Your doctor will add records after your visit.</p></div>`}
    </div>`;
  },

  bills() {
    const session = Auth.getSession();
    const bills = DB.getAll('bills').filter(b => b.patientId === session.patientId);
    const totalPending = bills.filter(b=>b.status==='Pending').reduce((s,b)=>s+b.total,0);
    return `
    <div class="page-header">
      <h1>My Bills</h1>
      <p>View all your billing details.</p>
    </div>
    ${totalPending > 0 ? `<div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">⚠️</span>
      <span style="font-size:14px">You have <strong>₹${totalPending.toLocaleString()}</strong> in pending bills. Please visit the reception to pay.</span>
    </div>` : ''}
    <div class="card">
      <div class="card-header"><span class="card-title">Bills (${bills.length})</span></div>
      ${bills.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Bill ID</th><th>Date</th><th>Consult</th><th>Medicine</th><th>Other</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${bills.map(b=>`
          <tr>
            <td><span class="badge badge-gray">${b.id}</span></td>
            <td>${formatDate(b.date)}</td>
            <td>₹${b.consultationFee}</td>
            <td>₹${b.medicationCharges}</td>
            <td>₹${b.otherCharges}</td>
            <td><strong>₹${b.total}</strong></td>
            <td>${statusBadge(b.status)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>`
      : `<div class="empty-state"><div class="empty-icon">💳</div><h3>No bills found</h3></div>`}
    </div>`;
  }
};

/* ════════════════════════════════════════════════
   VIEWS BRIDGE — maps Router calls to role views
════════════════════════════════════════════════ */
const Views = {
  // Admin
  adminDashboard()    { return AdminViews.dashboard(); },
  adminDashboardInit(){ /* static */ },
  adminPatients()     { return AdminViews.patients(); },
  adminPatientsInit() {
    const search = qs('#patient-search');
    if (search) search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      const filtered = DB.getAll('patients').filter(p =>
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.contact.includes(q)
      );
      qs('#patient-table-body').innerHTML = AdminViews._patientRows(filtered);
      attachPatientActions();
    });
    qs('#add-patient-btn').addEventListener('click', () => {
      qs('#patient-modal-title').textContent = 'Add Patient';
      qs('#patient-modal-body').innerHTML = AdminViews.patientForm();
      qs('#patient-modal').classList.add('active');
      qs('#close-patient-modal2').onclick = () => qs('#patient-modal').classList.remove('active');
      qs('#patient-form').onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        const existing = DB.getAll('patients').find(p => p.aadhaar === data.aadhaar);
        if (existing) { toast('Patient with this Aadhaar already exists!','error'); return; }
        DB.add('patients', { ...data, id: DB.genPatientId(), registeredOn: todayStr() });
        qs('#patient-modal').classList.remove('active');
        toast('Patient registered successfully!');
        Router.navigate('admin-patients');
      };
    });
    qs('#close-patient-modal').onclick = () => qs('#patient-modal').classList.remove('active');
    attachPatientActions();
  },
  adminDoctors()      { return AdminViews.doctors(); },
  adminDoctorsInit()  {
    qs('#add-doctor-btn').addEventListener('click', () => {
      qs('#doctor-modal-title').textContent = 'Add Doctor';
      qs('#doctor-modal-body').innerHTML = AdminViews.doctorForm();
      qs('#doctor-modal').classList.add('active');
      qs('#close-doctor-modal2').onclick = () => qs('#doctor-modal').classList.remove('active');
      qs('#doctor-form').onsubmit = e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.fee = parseInt(data.fee);
        data.id  = DB.genId('d');
        data.joinDate = todayStr();
        DB.add('doctors', data);
        qs('#doctor-modal').classList.remove('active');
        toast('Doctor added!');
        Router.navigate('admin-doctors');
      };
    });
    qs('#close-doctor-modal').onclick = () => qs('#doctor-modal').classList.remove('active');
    attachDoctorActions();
  },
  adminAppointments()     { return AdminViews.appointments(); },
  adminAppointmentsInit() {
    qs('#appt-filter').addEventListener('change', e => {
      const val = e.target.value;
      const all = DB.getAll('appointments');
      const filtered = val ? all.filter(a => a.status === val) : all;
      qs('#appt-table-body').innerHTML = AdminViews._apptRows(filtered);
      attachApptActions();
    });
    attachApptActions();
  },
  adminBilling()     { return AdminViews.billing(); },
  adminBillingInit() {
    qs('#gen-bill-btn').addEventListener('click', () => qs('#bill-modal').classList.add('active'));
    qs('#close-bill-modal').onclick  = () => qs('#bill-modal').classList.remove('active');
    qs('#close-bill-modal2').onclick = () => qs('#bill-modal').classList.remove('active');
    // Auto-calculate total
    ['consultationFee','medicationCharges','otherCharges'].forEach(name => {
      const el = qs(`[name="${name}"]`);
      if (el) el.addEventListener('input', calcTotal);
    });
    qs('#bill-form').onsubmit = e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      ['consultationFee','medicationCharges','otherCharges','total'].forEach(k => data[k] = parseInt(data[k]) || 0);
      const patient = DB.getById('patients', data.patientId);
      DB.add('bills', { ...data, id: DB.genId('B'), patientName: patient.name, status:'Pending', date: todayStr() });
      qs('#bill-modal').classList.remove('active');
      toast('Bill generated!');
      Router.navigate('admin-billing');
    };
    attachBillActions();
  },

  // Doctor
  doctorDashboard()    { return DoctorViews.dashboard(); },
  doctorDashboardInit(){ attachDoctorRecordBtns(); },
  doctorPatients()     { return DoctorViews.patients(); },
  doctorPatientsInit() { attachDoctorRecordBtns(); },
  doctorRecords(p)     { return DoctorViews.records(p); },
  doctorRecordsInit(p) {
    qs('#add-record-btn').addEventListener('click', () => {
      qs('#record-modal-body').innerHTML = DoctorViews.recordForm(p.patientId);
      qs('#record-modal').classList.add('active');
      qs('#close-record-modal2').onclick = () => qs('#record-modal').classList.remove('active');
      qs('#record-form').onsubmit = e => {
        e.preventDefault();
        const session = Auth.getSession();
        const data    = Object.fromEntries(new FormData(e.target));
        DB.add('records', { ...data, id: DB.genId('MR'), patientId: p.patientId, doctorId: session.doctorId, doctorName: session.name, date: todayStr() });
        qs('#record-modal').classList.remove('active');
        toast('Record added!');
        Router.navigate('doctor-records', p);
      };
    });
    qs('#close-record-modal').onclick = () => qs('#record-modal').classList.remove('active');
  },

  // Receptionist
  recepDashboard()    { return RecepViews.dashboard(); },
  recepDashboardInit(){ },
  recepRegister()     { return RecepViews.register(); },
  recepRegisterInit() {
    qs('#register-form').onsubmit = e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      const dup  = DB.getAll('patients').find(p => p.aadhaar === data.aadhaar);
      if (dup) { qs('#register-error').textContent = '⚠ Patient with this Aadhaar already exists.'; return; }
      const id = DB.genPatientId();
      DB.add('patients', { ...data, id, registeredOn: todayStr() });
      qs('#success-msg').textContent = `Patient registered with ID: ${id}`;
      qs('#success-modal').classList.add('active');
      qs('#register-form').reset();
      qs('#register-error').textContent = '';
    };
    qs('#close-success-modal').onclick = () => qs('#success-modal').classList.remove('active');
  },
  recepAppointments()     { return RecepViews.appointments(); },
  recepAppointmentsInit() {
    qs('#book-appt-form').onsubmit = e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      const clash = DB.getAll('appointments').find(a => a.doctorId===data.doctorId && a.date===data.date && a.time===data.time && a.status!=='Cancelled');
      if (clash) { qs('#appt-error').textContent = '⚠ Doctor already has an appointment at this time.'; return; }
      const patient = DB.getById('patients', data.patientId);
      const doctor  = DB.getById('doctors',  data.doctorId);
      DB.add('appointments', { ...data, id: DB.genId('A'), patientName: patient.name, doctorName: doctor.name, status:'Scheduled' });
      toast('Appointment booked!');
      Router.navigate('recep-appointments');
    };
  },

  // Patient
  patientDashboard()    { return PatientViews.dashboard(); },
  patientDashboardInit(){ },
  patientRecords()      { return PatientViews.records(); },
  patientRecordsInit()  { },
  patientBills()        { return PatientViews.bills(); },
  patientBillsInit()    { },
};

/* ════════════════════════════════════════════════
   SHARED ACTION ATTACHERS
════════════════════════════════════════════════ */
function attachPatientActions() {
  qsa('.view-patient-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = DB.getById('patients', btn.dataset.id);
      qs('#patient-modal-title').textContent = `Patient: ${p.name}`;
      qs('#patient-modal-body').innerHTML = AdminViews.patientDetail(p);
      qs('#patient-modal').classList.add('active');
    });
  });
  qsa('.del-patient-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await confirmDialog('Delete this patient? This cannot be undone.')) {
        DB.delete('patients', btn.dataset.id);
        toast('Patient deleted.', 'info');
        Router.navigate('admin-patients');
      }
    });
  });
}

function attachDoctorActions() {
  qsa('.edit-doctor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = DB.getById('doctors', btn.dataset.id);
      qs('#doctor-modal-title').textContent = 'Edit Doctor';
      qs('#doctor-modal-body').innerHTML = AdminViews.doctorForm(d);
      qs('#doctor-modal').classList.add('active');
      qs('#close-doctor-modal2').onclick = () => qs('#doctor-modal').classList.remove('active');
      qs('#doctor-form').onsubmit = e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.fee = parseInt(data.fee);
        DB.update('doctors', d.id, data);
        qs('#doctor-modal').classList.remove('active');
        toast('Doctor updated!');
        Router.navigate('admin-doctors');
      };
    });
  });
  qsa('.del-doctor-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await confirmDialog('Delete this doctor record?')) {
        DB.delete('doctors', btn.dataset.id);
        toast('Doctor removed.', 'info');
        Router.navigate('admin-doctors');
      }
    });
  });
}

function attachApptActions() {
  qsa('.status-change').forEach(sel => {
    sel.addEventListener('change', () => {
      DB.update('appointments', sel.dataset.id, { status: sel.value });
      toast('Status updated!');
    });
  });
}

function attachBillActions() {
  qsa('.mark-paid-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      DB.update('bills', btn.dataset.id, { status: 'Paid' });
      toast('Bill marked as paid!');
      Router.navigate('admin-billing');
    });
  });
}

function attachDoctorRecordBtns() {
  qsa('.doctor-view-records').forEach(btn => {
    btn.addEventListener('click', () => {
      Router.navigate('doctor-records', { patientId: btn.dataset.pid, patientName: btn.dataset.pname });
    });
  });
}

function calcTotal() {
  const get = name => parseInt(qs(`[name="${name}"]`)?.value) || 0;
  const total = get('consultationFee') + get('medicationCharges') + get('otherCharges');
  const el = qs('#bill-total');
  if (el) el.value = total;
}
