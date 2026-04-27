'use strict';

const Auth = {
  KEY: 'hms_session',

  login(username, password) {
    const user = DB.getAll('users').find(u => u.username === username && u.password === password);
    if (user) {
      const session = { userId: user.id, role: user.role, name: user.name, username: user.username, doctorId: user.doctorId || null, patientId: user.patientId || null };
      sessionStorage.setItem(this.KEY, JSON.stringify(session));
      return { success: true, session };
    }
    return { success: false };
  },

  logout() { sessionStorage.removeItem(this.KEY); },
  getSession() { const s = sessionStorage.getItem(this.KEY); return s ? JSON.parse(s) : null; },
  isLoggedIn() { return !!this.getSession(); },
  getRole() { return this.getSession()?.role || null; },
};
