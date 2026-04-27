import os

base = r"c:\Users\ASUS S15\OneDrive\Documents\Desktop\college hms"

def read(path):
    with open(os.path.join(base, path), encoding='utf-8') as f:
        return f.read()

css = read('css/style.css')
js  = '\n'.join([
    read('js/data.js'),
    read('js/auth.js'),
    read('js/views_admin.js'),
    read('js/views_doctor_recep.js'),
    read('js/views_patient_bridge.js'),
    read('js/app.js'),
])

html_parts = [
"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ghotra's Hospital - HMS</title>
  <meta name="description" content="Ghotra's Hospital Management System">
<style>
""",
css,
"""
</style>
</head>
<body>

<div id="login-screen">
  <div class="login-card">
    <div class="login-logo">
      <div class="logo-icon">&#x1F3E5;</div>
      <div><h1>Ghotra's Hospital</h1><span>Hospital Management System v1.0</span></div>
    </div>
    <h2>Sign In</h2>
    <p>Enter your credentials to access the system</p>
    <div class="demo-creds">
      <strong>Demo Credentials &mdash; click to fill</strong>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
        <button class="btn btn-outline btn-sm demo-btn" data-user="admin"     data-pass="admin123">Admin</button>
        <button class="btn btn-outline btn-sm demo-btn" data-user="dr.sharma" data-pass="doctor123">Doctor</button>
        <button class="btn btn-outline btn-sm demo-btn" data-user="reception" data-pass="reception123">Reception</button>
        <button class="btn btn-outline btn-sm demo-btn" data-user="patient1"  data-pass="patient123">Patient</button>
      </div>
    </div>
    <form id="login-form">
      <div class="form-group">
        <label for="login-username">Username</label>
        <input id="login-username" class="form-control" type="text" placeholder="Enter username" autocomplete="off">
      </div>
      <div class="form-group">
        <label for="login-password">Password</label>
        <input id="login-password" class="form-control" type="password" placeholder="Enter password" autocomplete="off">
      </div>
      <div id="login-error" style="color:var(--danger);font-size:13px;margin-bottom:10px;min-height:18px"></div>
      <button type="submit" class="btn btn-primary btn-full">Sign In</button>
    </form>
  </div>
</div>

<div id="main-app" style="display:none">
  <nav id="sidebar"></nav>
  <header id="topbar">
    <button id="menu-toggle" class="btn btn-outline btn-sm" style="display:none" aria-label="Menu">Menu</button>
    <span class="topbar-title">Ghotra's Hospital</span>
    <div class="topbar-actions">
      <span style="font-size:13px;color:var(--muted)">Logged in as:</span>
      <span id="topbar-user" style="font-size:13px;font-weight:600;color:var(--primary)"></span>
    </div>
  </header>
  <main id="content"></main>
</div>

<div id="toast-container"></div>

<script>
""",
js,
"""
</script>
</body>
</html>"""
]

output = ''.join(html_parts)
out_path = os.path.join(base, 'index.html')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(output)

size_kb = os.path.getsize(out_path) / 1024
print(f"SUCCESS! index.html = {size_kb:.1f} KB")
print(f"Template literals preserved: {'${' in output}")
