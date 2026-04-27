'use strict';
const AdminViews = {

  dashboard() {
    const patients = DB.getAll('patients');
    const doctors  = DB.getAll('doctors');
    const appts    = DB.getAll('appointments');
    const bills    = DB.getAll('bills');
    const todayAppts = appts.filter(a => a.date === todayStr());
    const revenue  = bills.filter(b => b.status === 'Paid').reduce((s,b) => s + b.total, 0);
    const recentPatients = [...patients].reverse().slice(0,5);
    const recentAppts    = [...appts].reverse().slice(0,5);
    return `
    <div class="page-header">
      <h1>Admin Dashboard</h1>
      <p>Welcome back! Here's what's happening today.</p>
    </div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div><div class="stat-val">${patients.length}</div><div class="stat-label">Total Patients</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">🩺</div>
        <div><div class="stat-val">${doctors.length}</div><div class="stat-label">Doctors</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">📅</div>
        <div><div class="stat-val">${todayAppts.length}</div><div class="stat-label">Today's Appointments</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">💰</div>
        <div><div class="stat-val">₹${revenue.toLocaleString()}</div><div class="stat-label">Total Revenue</div></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">Recent Patients</span></div>
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Name</th><th>Gender</th><th>Registered</th></tr></thead>
          <tbody>${recentPatients.map(p=>`
            <tr>
              <td><span class="badge badge-blue">${p.id}</span></td>
              <td>${p.name}</td>
              <td>${p.gender}</td>
              <td>${formatDate(p.registeredOn)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Recent Appointments</span></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>${recentAppts.map(a=>`
            <tr>
              <td>${a.patientName}</td>
              <td>${a.doctorName}</td>
              <td>${formatDate(a.date)}</td>
              <td>${statusBadge(a.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>`;
  },

  patients() {
    const patients = DB.getAll('patients');
    return `
    <div class="page-header">
      <h1>Patient Management</h1>
      <p>Register and manage all patient records.</p>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">All Patients (${patients.length})</span>
        <button class="btn btn-primary btn-sm" id="add-patient-btn">➕ Add Patient</button>
      </div>
      <div class="search-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="patient-search" placeholder="Search patients...">
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Blood</th><th>Contact</th><th>Registered</th><th>Actions</th></tr></thead>
        <tbody id="patient-table-body">
          ${AdminViews._patientRows(patients)}
        </tbody>
      </table></div>
    </div>
    ${AdminViews._patientModal()}`;
  },

  _patientRows(patients) {
    if (!patients.length) return `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">No patients found.</td></tr>`;
    return patients.map(p => `
      <tr>
        <td><span class="badge badge-blue">${p.id}</span></td>
        <td><strong>${p.name}</strong></td>
        <td>${getAge(p.dob)}</td>
        <td>${p.gender}</td>
        <td><span class="badge badge-red">${p.bloodGroup || '—'}</span></td>
        <td>${p.contact}</td>
        <td>${formatDate(p.registeredOn)}</td>
        <td>
          <button class="btn btn-outline btn-sm view-patient-btn" data-id="${p.id}">👁 View</button>
          <button class="btn btn-danger btn-sm del-patient-btn" data-id="${p.id}" style="margin-left:4px">🗑</button>
        </td>
      </tr>`).join('');
  },

  _patientModal() {
    return `
    <div class="modal-overlay" id="patient-modal">
      <div class="modal-box wide">
        <div class="modal-header">
          <h3 id="patient-modal-title">Add Patient</h3>
          <button class="modal-close" id="close-patient-modal">✕</button>
        </div>
        <div id="patient-modal-body"></div>
      </div>
    </div>`;
  },

  patientForm(p = {}) {
    return `
    <form id="patient-form">
      <div class="form-row">
        <div class="form-group"><label>Full Name *</label><input class="form-control" name="name" value="${p.name||''}" required></div>
        <div class="form-group"><label>Date of Birth *</label><input type="date" class="form-control" name="dob" value="${p.dob||''}" required></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Gender *</label>
          <select class="form-control" name="gender" required>
            <option value="">Select</option>
            ${['Male','Female','Other'].map(g=>`<option ${p.gender===g?'selected':''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Blood Group</label>
          <select class="form-control" name="bloodGroup">
            <option value="">Select</option>
            ${['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=>`<option ${p.bloodGroup===g?'selected':''}>${g}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group"><label>Address *</label><input class="form-control" name="address" value="${p.address||''}" required></div>
      <div class="form-row">
        <div class="form-group"><label>Contact Number *</label><input class="form-control" name="contact" value="${p.contact||''}" required></div>
        <div class="form-group"><label>Email</label><input type="email" class="form-control" name="email" value="${p.email||''}"></div>
      </div>
      <div class="form-group"><label>Aadhaar Number *</label><input class="form-control" name="aadhaar" value="${p.aadhaar||''}" maxlength="12" required></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" id="close-patient-modal2">Cancel</button>
        <button type="submit" class="btn btn-primary">💾 Save Patient</button>
      </div>
    </form>`;
  },

  patientDetail(p) {
    const records = DB.getAll('records').filter(r => r.patientId === p.id);
    const appts   = DB.getAll('appointments').filter(a => a.patientId === p.id);
    return `
    <div class="detail-grid">
      <div class="detail-item"><label>Patient ID</label><span><span class="badge badge-blue">${p.id}</span></span></div>
      <div class="detail-item"><label>Full Name</label><span>${p.name}</span></div>
      <div class="detail-item"><label>Date of Birth</label><span>${formatDate(p.dob)} (${getAge(p.dob)})</span></div>
      <div class="detail-item"><label>Gender</label><span>${p.gender}</span></div>
      <div class="detail-item"><label>Blood Group</label><span>${p.bloodGroup || '—'}</span></div>
      <div class="detail-item"><label>Contact</label><span>${p.contact}</span></div>
      <div class="detail-item"><label>Email</label><span>${p.email || '—'}</span></div>
      <div class="detail-item"><label>Aadhaar</label><span>${p.aadhaar}</span></div>
      <hr class="detail-divider">
      <div class="detail-item" style="grid-column:1/-1"><label>Address</label><span>${p.address}</span></div>
      <div class="detail-item"><label>Registered On</label><span>${formatDate(p.registeredOn)}</span></div>
    </div>
    <h4 style="margin:20px 0 10px;font-size:14px;">Appointments (${appts.length})</h4>
    ${appts.length ? appts.map(a=>`
      <div class="record-card">
        <div class="record-card-header">
          <span>${a.doctorName}</span>${statusBadge(a.status)}
        </div>
        <span style="color:var(--muted);font-size:13px">${formatDate(a.date)} at ${a.time} — ${a.reason}</span>
      </div>`).join('') : '<p style="color:var(--muted);font-size:13px">No appointments.</p>'}
    <h4 style="margin:20px 0 10px;font-size:14px;">Medical Records (${records.length})</h4>
    ${records.length ? records.map(r=>`
      <div class="record-card">
        <div class="record-card-header"><span>${r.doctorName}</span><span style="color:var(--muted);font-size:12px">${formatDate(r.date)}</span></div>
        <p style="font-size:13px;margin-bottom:4px"><strong>Diagnosis:</strong> ${r.diagnosis}</p>
        <p style="font-size:13px;color:var(--muted)"><strong>Prescription:</strong> ${r.prescription}</p>
      </div>`).join('') : '<p style="color:var(--muted);font-size:13px">No records.</p>'}`;
  },

  doctors() {
    const doctors = DB.getAll('doctors');
    return `
    <div class="page-header">
      <h1>Doctor Management</h1>
      <p>Add and manage hospital doctors.</p>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">All Doctors (${doctors.length})</span>
        <button class="btn btn-primary btn-sm" id="add-doctor-btn">➕ Add Doctor</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Specialization</th><th>Contact</th><th>Fee</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="doctor-table-body">${AdminViews._doctorRows(doctors)}</tbody>
      </table></div>
    </div>
    <div class="modal-overlay" id="doctor-modal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="doctor-modal-title">Add Doctor</h3>
          <button class="modal-close" id="close-doctor-modal">✕</button>
        </div>
        <div id="doctor-modal-body"></div>
      </div>
    </div>`;
  },

  _doctorRows(doctors) {
    if (!doctors.length) return `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px">No doctors found.</td></tr>`;
    return doctors.map(d => `
      <tr>
        <td><span class="badge badge-purple">${d.id}</span></td>
        <td><strong>${d.name}</strong></td>
        <td>${d.specialization}</td>
        <td>${d.contact}</td>
        <td>₹${d.fee}</td>
        <td>${statusBadge(d.status)}</td>
        <td>
          <button class="btn btn-outline btn-sm edit-doctor-btn" data-id="${d.id}">✏️ Edit</button>
          <button class="btn btn-danger btn-sm del-doctor-btn" data-id="${d.id}" style="margin-left:4px">🗑</button>
        </td>
      </tr>`).join('');
  },

  doctorForm(d = {}) {
    return `
    <form id="doctor-form">
      <div class="form-row">
        <div class="form-group"><label>Full Name *</label><input class="form-control" name="name" value="${d.name||''}" required></div>
        <div class="form-group"><label>Specialization *</label><input class="form-control" name="specialization" value="${d.specialization||''}" required></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Contact *</label><input class="form-control" name="contact" value="${d.contact||''}" required></div>
        <div class="form-group"><label>Email *</label><input type="email" class="form-control" name="email" value="${d.email||''}" required></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Consultation Fee (₹) *</label><input type="number" class="form-control" name="fee" value="${d.fee||''}" required></div>
        <div class="form-group"><label>Status</label>
          <select class="form-control" name="status">
            ${['Active','Inactive'].map(s=>`<option ${(d.status||'Active')===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" id="close-doctor-modal2">Cancel</button>
        <button type="submit" class="btn btn-primary">💾 Save Doctor</button>
      </div>
    </form>`;
  },

  appointments() {
    const appts = DB.getAll('appointments');
    return `
    <div class="page-header">
      <h1>Appointment Management</h1>
      <p>View and manage all appointments.</p>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">All Appointments (${appts.length})</span>
        <div style="display:flex;gap:8px">
          <select class="form-control" id="appt-filter" style="width:auto;padding:8px 12px">
            <option value="">All Status</option>
            <option>Scheduled</option><option>Completed</option><option>Cancelled</option>
          </select>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="appt-table-body">${AdminViews._apptRows(appts)}</tbody>
      </table></div>
    </div>`;
  },

  _apptRows(appts) {
    if (!appts.length) return `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">No appointments found.</td></tr>`;
    return appts.map(a => `
      <tr>
        <td><span class="badge badge-gray">${a.id}</span></td>
        <td>${a.patientName}</td>
        <td>${a.doctorName}</td>
        <td>${formatDate(a.date)}</td>
        <td>${a.time}</td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${a.reason}">${a.reason}</td>
        <td>${statusBadge(a.status)}</td>
        <td>
          <select class="form-control btn-sm status-change" data-id="${a.id}" style="padding:5px 8px;width:auto">
            ${['Scheduled','Completed','Cancelled'].map(s=>`<option ${a.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>`).join('');
  },

  billing() {
    const bills = DB.getAll('bills');
    const total = bills.reduce((s,b) => s + b.total, 0);
    const paid  = bills.filter(b => b.status === 'Paid').reduce((s,b) => s + b.total, 0);
    return `
    <div class="page-header">
      <h1>Billing Management</h1>
      <p>Manage patient bills and payments.</p>
    </div>
    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card"><div class="stat-icon blue">📄</div><div><div class="stat-val">${bills.length}</div><div class="stat-label">Total Bills</div></div></div>
      <div class="stat-card"><div class="stat-icon green">✅</div><div><div class="stat-val">₹${paid.toLocaleString()}</div><div class="stat-label">Collected</div></div></div>
      <div class="stat-card"><div class="stat-icon yellow">⏳</div><div><div class="stat-val">₹${(total-paid).toLocaleString()}</div><div class="stat-label">Pending</div></div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">All Bills</span>
        <button class="btn btn-primary btn-sm" id="gen-bill-btn">➕ Generate Bill</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Bill ID</th><th>Patient</th><th>Date</th><th>Consult</th><th>Medicine</th><th>Other</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
        <tbody id="bill-table-body">${AdminViews._billRows(bills)}</tbody>
      </table></div>
    </div>
    <div class="modal-overlay" id="bill-modal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Generate Bill</h3>
          <button class="modal-close" id="close-bill-modal">✕</button>
        </div>
        <div id="bill-modal-body">${AdminViews._billForm()}</div>
      </div>
    </div>`;
  },

  _billRows(bills) {
    if (!bills.length) return `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">No bills found.</td></tr>`;
    return bills.map(b => `
      <tr>
        <td><span class="badge badge-gray">${b.id}</span></td>
        <td>${b.patientName}</td>
        <td>${formatDate(b.date)}</td>
        <td>₹${b.consultationFee}</td>
        <td>₹${b.medicationCharges}</td>
        <td>₹${b.otherCharges}</td>
        <td><strong>₹${b.total}</strong></td>
        <td>${statusBadge(b.status)}</td>
        <td>${b.status==='Pending' ? `<button class="btn btn-success btn-sm mark-paid-btn" data-id="${b.id}">✓ Paid</button>` : '—'}</td>
      </tr>`).join('');
  },

  _billForm() {
    const patients = DB.getAll('patients');
    const appts    = DB.getAll('appointments');
    return `
    <form id="bill-form">
      <div class="form-group"><label>Patient *</label>
        <select class="form-control" name="patientId" required>
          <option value="">Select Patient</option>
          ${patients.map(p=>`<option value="${p.id}">${p.name} (${p.id})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Appointment ID (optional)</label>
        <select class="form-control" name="appointmentId">
          <option value="">None</option>
          ${appts.map(a=>`<option value="${a.id}">${a.id} — ${a.patientName} — ${a.date}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Consultation Fee (₹) *</label><input type="number" class="form-control" name="consultationFee" value="0" required></div>
        <div class="form-group"><label>Medication Charges (₹)</label><input type="number" class="form-control" name="medicationCharges" value="0"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Other Charges (₹)</label><input type="number" class="form-control" name="otherCharges" value="0"></div>
        <div class="form-group"><label>Total (₹)</label><input type="number" class="form-control" name="total" id="bill-total" readonly style="background:rgba(56,189,248,0.07)"></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" id="close-bill-modal2">Cancel</button>
        <button type="submit" class="btn btn-primary">💾 Generate Bill</button>
      </div>
    </form>`;
  }
};
