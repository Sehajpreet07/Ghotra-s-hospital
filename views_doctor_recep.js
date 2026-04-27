'use strict';
const DoctorViews = {

  dashboard() {
    const session = Auth.getSession();
    const appts = DB.getAll('appointments').filter(a => a.doctorId === session.doctorId);
    const todayAppts = appts.filter(a => a.date === todayStr());
    const patients = [...new Set(appts.map(a => a.patientId))];
    return `
    <div class="page-header">
      <h1>Welcome, ${session.name}</h1>
      <p>Here's your schedule and patient summary.</p>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon blue">📅</div><div><div class="stat-val">${todayAppts.length}</div><div class="stat-label">Today's Appointments</div></div></div>
      <div class="stat-card"><div class="stat-icon green">👥</div><div><div class="stat-val">${patients.length}</div><div class="stat-label">My Patients</div></div></div>
      <div class="stat-card"><div class="stat-icon yellow">📋</div><div><div class="stat-val">${appts.filter(a=>a.status==='Completed').length}</div><div class="stat-label">Completed</div></div></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Today's Schedule (${formatDate(todayStr())})</span></div>
      ${todayAppts.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${todayAppts.map(a=>`
          <tr>
            <td><strong>${a.time}</strong></td>
            <td>${a.patientName}</td>
            <td>${a.reason}</td>
            <td>${statusBadge(a.status)}</td>
            <td><button class="btn btn-outline btn-sm doctor-view-records" data-pid="${a.patientId}" data-pname="${a.patientName}">📋 Records</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-state"><div class="empty-icon">✅</div><h3>No appointments today</h3></div>`}
    </div>`;
  },

  patients() {
    const session = Auth.getSession();
    const appts   = DB.getAll('appointments').filter(a => a.doctorId === session.doctorId);
    const pidSet  = [...new Set(appts.map(a => a.patientId))];
    const patients = pidSet.map(id => DB.getById('patients', id)).filter(Boolean);
    return `
    <div class="page-header">
      <h1>My Patients</h1>
      <p>Patients assigned to you via appointments.</p>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Patients (${patients.length})</span></div>
      ${patients.length ? `<div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Contact</th><th>Actions</th></tr></thead>
        <tbody>${patients.map(p=>`
          <tr>
            <td><span class="badge badge-blue">${p.id}</span></td>
            <td><strong>${p.name}</strong></td>
            <td>${getAge(p.dob)}</td>
            <td>${p.gender}</td>
            <td>${p.contact}</td>
            <td><button class="btn btn-primary btn-sm doctor-view-records" data-pid="${p.id}" data-pname="${p.name}">📋 View Records</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-state"><div class="empty-icon">👥</div><h3>No patients yet</h3></div>`}
    </div>`;
  },

  records(params) {
    const { patientId, patientName } = params;
    const records = DB.getAll('records').filter(r => r.patientId === patientId);
    const patient = DB.getById('patients', patientId);
    return `
    <div class="page-header">
      <h1>Medical Records</h1>
      <p>Patient: <strong>${patientName || patientId}</strong></p>
    </div>
    ${patient ? `<div class="card" style="margin-bottom:16px">
      <div class="detail-grid">
        <div class="detail-item"><label>Patient ID</label><span><span class="badge badge-blue">${patient.id}</span></span></div>
        <div class="detail-item"><label>Name</label><span>${patient.name}</span></div>
        <div class="detail-item"><label>Age / Gender</label><span>${getAge(patient.dob)} / ${patient.gender}</span></div>
        <div class="detail-item"><label>Blood Group</label><span>${patient.bloodGroup || '—'}</span></div>
        <div class="detail-item"><label>Contact</label><span>${patient.contact}</span></div>
        <div class="detail-item"><label>Address</label><span>${patient.address}</span></div>
      </div>
    </div>` : ''}
    <div class="card">
      <div class="card-header">
        <span class="card-title">Medical Records (${records.length})</span>
        <button class="btn btn-primary btn-sm" id="add-record-btn" data-pid="${patientId}">➕ Add Record</button>
      </div>
      <div id="records-list">${DoctorViews._recordsList(records)}</div>
    </div>
    <div class="modal-overlay" id="record-modal">
      <div class="modal-box">
        <div class="modal-header"><h3>Add Medical Record</h3><button class="modal-close" id="close-record-modal">✕</button></div>
        <div id="record-modal-body"></div>
      </div>
    </div>`;
  },

  _recordsList(records) {
    if (!records.length) return `<div class="empty-state"><div class="empty-icon">📋</div><h3>No records yet</h3><p>Add a new medical record above.</p></div>`;
    return records.map(r => `
      <div class="record-card">
        <div class="record-card-header">
          <strong>${r.diagnosis}</strong>
          <span style="color:var(--muted);font-size:12px">${formatDate(r.date)}</span>
        </div>
        <p style="font-size:13px;margin-bottom:6px;color:var(--muted)">By ${r.doctorName}</p>
        <p style="font-size:13px;margin-bottom:4px"><strong>Prescription:</strong></p>
        <pre style="font-size:12.5px;white-space:pre-wrap;color:var(--text);background:var(--bg);border-radius:8px;padding:10px">${r.prescription}</pre>
        ${r.notes ? `<p style="font-size:13px;margin-top:6px;color:var(--muted)"><strong>Notes:</strong> ${r.notes}</p>` : ''}
      </div>`).join('');
  },

  recordForm(patientId) {
    return `
    <form id="record-form" data-pid="${patientId}">
      <div class="form-group"><label>Diagnosis *</label><input class="form-control" name="diagnosis" placeholder="e.g. Hypertension" required></div>
      <div class="form-group"><label>Prescription *</label><textarea class="form-control" name="prescription" rows="4" placeholder="Enter medicines, dosage..." required style="resize:vertical"></textarea></div>
      <div class="form-group"><label>Notes</label><textarea class="form-control" name="notes" rows="3" placeholder="Additional notes..." style="resize:vertical"></textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" id="close-record-modal2">Cancel</button>
        <button type="submit" class="btn btn-primary">💾 Save Record</button>
      </div>
    </form>`;
  }
};

/* ════════════════════════════════════════════════
   RECEPTIONIST VIEWS
════════════════════════════════════════════════ */
const RecepViews = {

  dashboard() {
    const appts    = DB.getAll('appointments');
    const patients = DB.getAll('patients');
    const todayAppts = appts.filter(a => a.date === todayStr());
    return `
    <div class="page-header">
      <h1>Receptionist Dashboard</h1>
      <p>Manage patient registrations and appointments.</p>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon blue">👥</div><div><div class="stat-val">${patients.length}</div><div class="stat-label">Total Patients</div></div></div>
      <div class="stat-card"><div class="stat-icon yellow">📅</div><div><div class="stat-val">${todayAppts.length}</div><div class="stat-label">Today's Appointments</div></div></div>
      <div class="stat-card"><div class="stat-icon green">✅</div><div><div class="stat-val">${todayAppts.filter(a=>a.status==='Completed').length}</div><div class="stat-label">Completed Today</div></div></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Today's Appointments</span></div>
      ${todayAppts.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Status</th></tr></thead>
        <tbody>${todayAppts.map(a=>`
          <tr>
            <td><strong>${a.time}</strong></td>
            <td>${a.patientName}</td>
            <td>${a.doctorName}</td>
            <td>${a.reason}</td>
            <td>${statusBadge(a.status)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-state"><div class="empty-icon">📅</div><h3>No appointments today</h3></div>`}
    </div>`;
  },

  register() {
    return `
    <div class="page-header">
      <h1>Register Patient</h1>
      <p>Fill in the details to register a new patient.</p>
    </div>
    <div class="card" style="max-width:680px">
      <div class="card-header"><span class="card-title">Patient Registration Form</span></div>
      <form id="register-form">
        <div class="form-row">
          <div class="form-group"><label>Full Name *</label><input class="form-control" name="name" required></div>
          <div class="form-group"><label>Date of Birth *</label><input type="date" class="form-control" name="dob" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Gender *</label>
            <select class="form-control" name="gender" required>
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div class="form-group"><label>Blood Group</label>
            <select class="form-control" name="bloodGroup">
              <option value="">Select</option>
              ${['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=>`<option>${g}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group"><label>Address *</label><input class="form-control" name="address" required></div>
        <div class="form-row">
          <div class="form-group"><label>Contact Number *</label><input class="form-control" name="contact" maxlength="10" required></div>
          <div class="form-group"><label>Email</label><input type="email" class="form-control" name="email"></div>
        </div>
        <div class="form-group"><label>Aadhaar Number * (12 digits)</label><input class="form-control" name="aadhaar" maxlength="12" minlength="12" required></div>
        <div id="register-error" style="color:var(--danger);font-size:13px;margin-bottom:8px"></div>
        <button type="submit" class="btn btn-primary">✅ Register Patient</button>
      </form>
    </div>
    <div class="modal-overlay" id="success-modal">
      <div class="modal-box confirm-box">
        <div class="confirm-icon">🎉</div>
        <h3>Patient Registered!</h3>
        <p id="success-msg"></p>
        <div class="modal-actions" style="justify-content:center">
          <button class="btn btn-primary" id="close-success-modal">Done</button>
        </div>
      </div>
    </div>`;
  },

  appointments() {
    const appts   = DB.getAll('appointments');
    const patients = DB.getAll('patients');
    const doctors  = DB.getAll('doctors');
    return `
    <div class="page-header">
      <h1>Book Appointment</h1>
      <p>Schedule appointments for patients.</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">Book New Appointment</span></div>
        <form id="book-appt-form">
          <div class="form-group"><label>Patient *</label>
            <select class="form-control" name="patientId" required>
              <option value="">Select Patient</option>
              ${patients.map(p=>`<option value="${p.id}">${p.name} (${p.id})</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Doctor *</label>
            <select class="form-control" name="doctorId" required>
              <option value="">Select Doctor</option>
              ${doctors.filter(d=>d.status==='Active').map(d=>`<option value="${d.id}">${d.name} — ${d.specialization}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Date *</label><input type="date" class="form-control" name="date" min="${todayStr()}" required></div>
            <div class="form-group"><label>Time *</label><input type="time" class="form-control" name="time" required></div>
          </div>
          <div class="form-group"><label>Reason *</label><input class="form-control" name="reason" placeholder="Reason for visit" required></div>
          <div id="appt-error" style="color:var(--danger);font-size:13px;margin-bottom:8px"></div>
          <button type="submit" class="btn btn-primary btn-full">📅 Book Appointment</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">All Appointments</span></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>${appts.map(a=>`
            <tr>
              <td>${a.patientName}</td>
              <td>${a.doctorName}</td>
              <td>${formatDate(a.date)}</td>
              <td>${a.time}</td>
              <td>${statusBadge(a.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>`;
  }
};
