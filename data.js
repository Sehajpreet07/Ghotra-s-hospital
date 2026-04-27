'use strict';

const DB = {
  init() {
    if (!localStorage.getItem('hms_seeded')) {
      this._seed();
      localStorage.setItem('hms_seeded', '1');
    }
  },

  reset() {
    ['users','doctors','patients','appointments','records','bills'].forEach(k => localStorage.removeItem(`hms_${k}`));
    localStorage.removeItem('hms_seeded');
    this.init();
  },

  _seed() {
    this.save('users', [
      { id:'u001', username:'admin',     password:'admin123',     role:'admin',        name:'System Administrator', email:'admin@hms.com' },
      { id:'u002', username:'dr.sharma', password:'doctor123',    role:'doctor',       name:'Dr. Rajesh Sharma',    email:'dr.sharma@hms.com',  doctorId:'d001' },
      { id:'u003', username:'dr.gupta',  password:'doctor123',    role:'doctor',       name:'Dr. Priya Gupta',      email:'dr.gupta@hms.com',   doctorId:'d002' },
      { id:'u004', username:'reception', password:'reception123', role:'receptionist', name:'Anita Singh',          email:'reception@hms.com' },
      { id:'u005', username:'patient1',  password:'patient123',   role:'patient',      name:'Rahul Kumar',          email:'rahul@email.com',    patientId:'P001' },
      { id:'u006', username:'patient2',  password:'patient123',   role:'patient',      name:'Sneha Patel',          email:'sneha@email.com',    patientId:'P002' },
    ]);
    this.save('doctors', [
      { id:'d001', name:'Dr. Rajesh Sharma', specialization:'Cardiology',  contact:'9876543210', email:'dr.sharma@hms.com', fee:500, status:'Active', joinDate:'2020-01-15' },
      { id:'d002', name:'Dr. Priya Gupta',   specialization:'Neurology',   contact:'9876543211', email:'dr.gupta@hms.com',  fee:600, status:'Active', joinDate:'2019-06-10' },
      { id:'d003', name:'Dr. Amit Verma',    specialization:'Orthopedics', contact:'9876543212', email:'dr.verma@hms.com',  fee:450, status:'Active', joinDate:'2021-03-20' },
      { id:'d004', name:'Dr. Sonal Mehta',   specialization:'Pediatrics',  contact:'9876543213', email:'dr.mehta@hms.com',  fee:400, status:'Active', joinDate:'2022-07-05' },
    ]);
    this.save('patients', [
      { id:'P001', name:'Rahul Kumar', address:'123 MG Road, Delhi',      contact:'9876500001', email:'rahul@email.com',  aadhaar:'123456789012', dob:'1990-05-15', gender:'Male',   bloodGroup:'O+', registeredOn:'2024-01-10' },
      { id:'P002', name:'Sneha Patel', address:'456 Park Street, Mumbai', contact:'9876500002', email:'sneha@email.com',  aadhaar:'987654321098', dob:'1985-08-22', gender:'Female', bloodGroup:'B+', registeredOn:'2024-02-15' },
      { id:'P003', name:'Arun Sharma', address:'789 Anna Nagar, Chennai', contact:'9876500003', email:'arun@email.com',   aadhaar:'567812345678', dob:'1978-12-03', gender:'Male',   bloodGroup:'A+', registeredOn:'2024-03-20' },
    ]);
    this.save('appointments', [
      { id:'A001', patientId:'P001', patientName:'Rahul Kumar', doctorId:'d001', doctorName:'Dr. Rajesh Sharma', date:'2026-04-28', time:'10:00', status:'Scheduled', reason:'Chest pain checkup' },
      { id:'A002', patientId:'P002', patientName:'Sneha Patel', doctorId:'d002', doctorName:'Dr. Priya Gupta',   date:'2026-04-28', time:'11:30', status:'Scheduled', reason:'Migraine headache' },
      { id:'A003', patientId:'P003', patientName:'Arun Sharma', doctorId:'d001', doctorName:'Dr. Rajesh Sharma', date:'2026-04-27', time:'09:00', status:'Completed', reason:'Follow-up visit' },
    ]);
    this.save('records', [
      { id:'MR001', patientId:'P001', doctorId:'d001', doctorName:'Dr. Rajesh Sharma', date:'2024-03-10', diagnosis:'Mild hypertension', prescription:'Amlodipine 5mg once daily\nLifestyle modifications', notes:'Follow up after 2 weeks.' },
      { id:'MR002', patientId:'P002', doctorId:'d002', doctorName:'Dr. Priya Gupta',   date:'2024-04-05', diagnosis:'Tension headache',  prescription:'Paracetamol 500mg as needed\nRest and hydration',    notes:'Reduce screen time.' },
    ]);
    this.save('bills', [
      { id:'B001', patientId:'P001', patientName:'Rahul Kumar', appointmentId:'A001', consultationFee:500, medicationCharges:200, otherCharges:100, total:800, status:'Pending', date:'2026-04-28' },
      { id:'B002', patientId:'P003', patientName:'Arun Sharma',  appointmentId:'A003', consultationFee:500, medicationCharges:150, otherCharges:50,  total:700, status:'Paid',    date:'2026-04-27' },
    ]);
  },

  getAll(key)      { return JSON.parse(localStorage.getItem(`hms_${key}`) || '[]'); },
  save(key, data)  { localStorage.setItem(`hms_${key}`, JSON.stringify(data)); },
  getById(key, id) { return this.getAll(key).find(i => i.id === id) || null; },

  add(key, item) {
    const arr = this.getAll(key);
    arr.push(item);
    this.save(key, arr);
    return item;
  },
  update(key, id, updates) {
    const arr = this.getAll(key);
    const idx = arr.findIndex(i => i.id === id);
    if (idx !== -1) { arr[idx] = { ...arr[idx], ...updates }; this.save(key, arr); return arr[idx]; }
    return null;
  },
  delete(key, id) { this.save(key, this.getAll(key).filter(i => i.id !== id)); },

  genId(prefix) { return prefix + Date.now().toString(36).toUpperCase().slice(-6); },
  genPatientId() {
    const pts = this.getAll('patients');
    const nums = pts.map(p => parseInt(p.id.slice(1))).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return 'P' + String(next).padStart(3, '0');
  }
};
