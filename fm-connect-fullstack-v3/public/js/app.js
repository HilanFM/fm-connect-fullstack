const app = document.getElementById('app');
let currentToken = localStorage.getItem('fm_token_v2') || '';
let currentUser = null;
const state = { query: '', category: 'All', tab: 'overview' };

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function nav(path) { location.hash = path; }
function route() { return (location.hash || '#home').slice(1).split('/'); }
function money(value, currency = 'LKR') { return Number(value || 0) === 0 ? 'Free' : `${currency} ${Number(value).toLocaleString()}`; }
function statusPill(status) {
  const tone = status === 'ACTIVE' || status === 'PUBLISHED' ? 'green' : status === 'BLOCKED' || status === 'REJECTED' ? 'red' : 'amber';
  return `<span class="pill ${tone}">${esc(status)}</span>`;
}
function pill(label, tone = 'blue') { return `<span class="pill ${tone}">${esc(label)}</span>`; }
function img(src, alt, cls = 'card-image') { return `<img class="${cls}" src="${esc(src || '/assets/gallery-1.svg')}" alt="${esc(alt || '')}" />`; }
function toast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = message;
  container.appendChild(item);
  setTimeout(() => item.remove(), 3200);
}
async function loadUser() {
  if (!currentToken) { currentUser = null; return; }
  try { currentUser = await api('/api/me'); }
  catch { currentToken = ''; currentUser = null; localStorage.removeItem('fm_token_v2'); }
}
function header() {
  const top = route()[0] || 'home';
  return `
    <header class="header">
      <div class="container header-inner">
        <a href="#home" class="brand">
          <img src="/assets/logo.svg" class="brand-logo" alt="FM Connect" />
          <div><div class="brand-name">FM Connect</div><div class="brand-tag">Where futures take shape</div></div>
        </a>
        <nav class="nav">
          ${navLink('home','Home',top)}
          ${navLink('explore','Explore',top)}
          ${navLink('institutes','Institutes',top)}
          ${navLink('counseling','Counseling',top)}
          ${navLink('articles','Articles',top)}
          ${currentUser ? navLink('dashboard',`${roleName(currentUser.role)} Dashboard`,top) : ''}
        </nav>
        <div class="header-actions">
          ${currentUser ? `<a class="btn btn-outline btn-small" href="#notifications">🔔</a><a class="btn btn-outline btn-small" href="#profile">${esc(currentUser.name)}</a><button class="btn btn-dark btn-small" id="logoutBtn">Logout</button>` : `<a class="btn btn-outline btn-small" href="#login">Login</a><a class="btn btn-primary btn-small" href="#signup">Join Free</a>`}
        </div>
      </div>
    </header>`;
}
function navLink(key, label, active) { return `<a class="nav-link ${active === key ? 'active' : ''}" href="#${key}">${esc(label)}</a>`; }
function roleName(role) { return ({ STUDENT:'Student', INSTITUTE_OWNER:'Institute', COUNSELOR:'Counselor', ADMIN:'Admin' })[role] || 'User'; }
function footer() {
  return `<footer class="footer"><div class="container footer-grid"><div><h4>FM Connect</h4><p class="muted">Education marketplace, career guidance, institute management, and admin operations demo.</p></div><div><h4>Explore</h4><a href="#explore">Courses</a><a href="#institutes">Institutes</a><a href="#counseling">Counseling</a></div><div><h4>Roles</h4><a href="#login">Student</a><a href="#login">Institute</a><a href="#login">Admin</a></div><div><h4>Demo</h4><p class="muted">Full-stack starter with JSON database.</p></div></div><div class="footer-bottom">© 2026 FM Connect</div></footer>`;
}
function layout(content) {
  app.innerHTML = `${header()}<main>${content}</main>${footer()}`;
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
}
function stat(label, value, note = '') { return `<div class="card stat-card"><div class="stat-icon">•</div><div><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(value)}</div><div class="muted">${esc(note)}</div></div></div>`; }
function courseCard(c) {
  return `<article class="card course-card">${img(c.image, c.title)}<div class="card-body"><div class="card-tags">${c.sponsored ? pill('Sponsored','amber') : ''}${c.isFree ? pill('Free Course','green') : pill(c.type,'blue')}</div><h3>${esc(c.title)}</h3><p class="muted">${esc(c.institute)} • ${esc(c.category)}</p><p>${esc(c.description)}</p><div class="meta-grid"><div><span class="meta-label">Duration</span><strong>${esc(c.duration)}</strong></div><div><span class="meta-label">Fee</span><strong>${esc(money(c.price,c.currency))}</strong></div></div><div class="card-footer"><a class="btn btn-outline" href="#course/${esc(c.slug)}">View Details</a><button class="btn btn-primary" data-lead="INTERESTED" data-course="${esc(c.id)}">Interested</button></div></div></article>`;
}
function instituteCard(i) {
  return `<article class="card institute-card">${img(i.image, i.name)}<div class="card-body"><div class="card-tags">${i.accountType === 'SPONSORED' ? pill(i.plan,'amber') : pill(i.plan || 'Standard','blue')}${pill(`${i.freeCoursesCount || 0} free courses`,'green')}</div><h3>${esc(i.name)}</h3><p class="muted">${esc(i.category)}</p><p>${esc(i.description)}</p><div class="card-footer"><a class="btn btn-outline" href="#institute/${esc(i.slug)}">View Institute</a><a class="btn btn-primary" href="#explore">Courses</a></div></div></article>`;
}
async function homePage() {
  const data = await api('/api/public/home');
  const topCourses = data.courses.slice(0, 3);
  const topInstitutes = data.institutes.slice(0, 4);
  const banner = data.banners?.[0] || { image:'/assets/hero-banner.svg' };
  return `<section class="hero-section"><div class="container hero-grid"><div>${pill('Full-stack v2 demo','blue')}<h1>Build the skills for the future, today.</h1><p>Explore institutes, degrees, certificates, free courses, counseling, and admin-managed platform content.</p><div class="hero-actions"><a class="btn btn-primary" href="#explore">Explore Courses</a><a class="btn btn-outline" href="#institute-register">Register Institute</a></div></div><div class="hero-visual">${img(banner.image, 'Future Minds banner', '')}</div></div></section><section class="section"><div class="container grid grid-3">${stat('Courses', String(data.courses.length), 'Published courses')}${stat('Institutes', String(data.institutes.length), 'Active institutes')}${stat('Counselors', String(data.counselors.length), 'Available counselors')}</div></section><section class="section section-soft"><div class="container"><div class="section-head"><div><h2>Featured courses</h2><p class="muted">Sponsored and high engagement courses appear first.</p></div><a href="#explore" class="text-link">View all</a></div><div class="grid grid-3">${topCourses.map(courseCard).join('')}</div></div></section><section class="section"><div class="container"><div class="section-head"><div><h2>Partner institutes</h2><p class="muted">Institutes can be created by admin and managed by institute owners.</p></div></div><div class="grid grid-2">${topInstitutes.map(instituteCard).join('')}</div></div></section>`;
}
async function explorePage() {
  const all = await api('/api/public/courses');
  const categories = ['All', ...new Set(all.map(c => c.category))];
  const courses = await api(`/api/public/courses?q=${encodeURIComponent(state.query)}&category=${encodeURIComponent(state.category)}`);
  return `<section class="page-hero small"><div class="container"><h1>Explore courses</h1><p class="muted">Search by course, institute, category, or keyword.</p><form id="searchForm" class="filter-bar"><input name="q" value="${esc(state.query)}" placeholder="Search courses"/><select name="category">${categories.map(c => `<option ${state.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select><button class="btn btn-primary">Search</button></form></div></section><section class="section"><div class="container"><div class="grid grid-3">${courses.map(courseCard).join('') || '<p>No courses found.</p>'}</div></div></section>`;
}
async function institutesPage() {
  const items = await api('/api/public/institutes');
  return `<section class="page-hero small"><div class="container"><h1>Institutes</h1><p class="muted">Browse active institutes.</p></div></section><section class="section"><div class="container grid grid-2">${items.map(instituteCard).join('')}</div></section>`;
}
async function institutePage(slug) {
  const i = await api(`/api/public/institutes/${encodeURIComponent(slug)}`);
  return `<section class="detail-hero">${img(i.image, i.name, 'detail-cover')}<div class="container detail-copy"><div class="card surface-overlay"><div class="card-tags">${statusPill(i.status)}${pill(i.accountType,'amber')}</div><h1>${esc(i.name)}</h1><p>${esc(i.longDescription || i.description)}</p><div class="button-row"><a class="btn btn-primary" href="#explore">Explore Courses</a><a class="btn btn-outline" href="${esc(i.website)}" target="_blank">Website</a></div></div></div></section><section class="section"><div class="container detail-grid"><div><div class="card form-card"><h3>About</h3><p>${esc(i.description)}</p><div class="chips">${(i.facilities || []).map(f => `<span class="chip">${esc(f)}</span>`).join('')}</div></div><div class="card form-card mt-2"><h3>Featured free courses</h3>${(i.featuredFreeCourses || []).map(c => `<p>✓ ${esc(c)}</p>`).join('') || '<p>No free courses listed.</p>'}</div></div><div class="card form-card"><h3>Contact</h3><p><b>Email:</b> ${esc(i.email)}</p><p><b>Phone:</b> ${esc(i.phone)}</p><p><b>WhatsApp:</b> ${esc(i.whatsapp)}</p></div></div></section><section class="section section-soft"><div class="container"><h2>Courses from ${esc(i.shortName)}</h2><div class="grid grid-3">${(i.courses || []).map(courseCard).join('') || '<p>No published courses yet.</p>'}</div></div></section>`;
}
async function coursePage(slug) {
  const c = await api(`/api/public/courses/${encodeURIComponent(slug)}`);
  return `<section class="detail-hero">${img(c.image, c.title, 'detail-cover')}<div class="container detail-copy"><div class="card surface-overlay"><div class="card-tags">${c.sponsored ? pill('Sponsored','amber') : ''}${statusPill(c.status)}${c.isFree ? pill('Free Course','green') : pill(c.type,'blue')}</div><h1>${esc(c.title)}</h1><p>${esc(c.overview || c.description)}</p><div class="meta-grid meta-grid-4"><div><span class="meta-label">Institute</span><strong>${esc(c.institute)}</strong></div><div><span class="meta-label">Duration</span><strong>${esc(c.duration)}</strong></div><div><span class="meta-label">Mode</span><strong>${esc(c.studyMode)}</strong></div><div><span class="meta-label">Fee</span><strong>${esc(money(c.price,c.currency))}</strong></div></div><div class="button-row"><button class="btn btn-primary" data-lead="ENROLLMENT_REQUEST" data-course="${esc(c.id)}">Enroll Now</button><button class="btn btn-outline" data-lead="INTERESTED" data-course="${esc(c.id)}">Interested</button></div></div></div></section><section class="section"><div class="container detail-grid"><div><div class="card form-card"><h3>Course description</h3><p>${esc(c.description)}</p></div><div class="card form-card mt-2"><h3>Modules</h3>${(c.modules || []).map(m => `<p>✓ ${esc(m)}</p>`).join('')}</div></div><div><div class="card form-card"><h3>Details</h3><p><b>Award:</b> ${esc(c.award)}</p><p><b>Start:</b> ${esc(c.startDate)}</p><p><b>Discount:</b> ${esc(c.discount)}</p><p><b>Entry:</b> ${esc(c.entryRequirements)}</p></div><div class="card form-card mt-2"><h3>Skills</h3><div class="chips">${(c.skills || []).map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div></div></div></div></section>`;
}
async function counselingPage() {
  const items = await api('/api/public/counselors');
  return `<section class="page-hero small"><div class="container"><h1>Career counseling</h1><p class="muted">Book online or physical sessions.</p></div></section><section class="section"><div class="container grid grid-3">${items.map(c => `<div class="card">${img(c.image,c.name)}<div class="card-body"><h3>${esc(c.name)}</h3><p class="muted">${esc(c.focus)} • ${esc(c.qualification)}</p><p>${esc(c.bio)}</p>${(c.slots || []).filter(s => s.status === 'AVAILABLE').map(s => `<div class="slot-item"><div><b>${esc(s.date)} ${esc(s.time)}</b><div class="muted">${esc(s.mode)}</div></div><button class="btn btn-primary btn-small" data-book="${esc(c.id)}" data-slot="${esc(s.id)}">Book</button></div>`).join('')}</div></div>`).join('')}</div></section>`;
}
async function articlesPage() {
  const items = await api('/api/public/articles');
  return `<section class="page-hero small"><div class="container"><h1>Articles</h1><p class="muted">Published community and expert content.</p></div></section><section class="section"><div class="container grid grid-3">${items.map(a => `<div class="card">${img(a.image,a.title)}<div class="card-body"><h3>${esc(a.title)}</h3><p class="muted">${esc(a.author)} • ${esc(a.category)}</p><p>${esc(a.summary)}</p></div></div>`).join('')}</div></section>`;
}
function loginPage() {
  return `<section class="section narrow-section"><div class="container narrow"><div class="card form-card"><h1>Login</h1><p class="muted">Demo password is <b>demo123</b>.</p><form id="loginForm" class="form-grid"><label>Email<input name="email" type="email" required placeholder="admin@fmconnect.lk"/></label><label>Password<input name="password" type="password" required placeholder="demo123"/></label><button class="btn btn-primary">Login</button></form><div class="card form-card mt-2"><p><b>Student:</b> student@fmconnect.lk</p><p><b>Institute:</b> institute@fmconnect.lk</p><p><b>Counselor:</b> counselor@fmconnect.lk</p><p><b>Admin:</b> admin@fmconnect.lk</p></div></div></div></section>`;
}
function signupPage() {
  return `<section class="section narrow-section"><div class="container narrow"><div class="card form-card"><h1>Student signup</h1><form id="signupForm" class="form-grid two-col"><label>Name<input name="name" required/></label><label>Email<input name="email" type="email" required/></label><label>Phone<input name="phone"/></label><label>Password<input name="password" type="password" required/></label><label>District<input name="district"/></label><label>Education<input name="educationLevel"/></label><label class="full">Career goal<textarea name="careerGoal"></textarea></label><button class="btn btn-primary">Create account</button></form></div></div></section>`;
}
function instituteRegisterPage() {
  return `<section class="section narrow-section"><div class="container narrow"><div class="card form-card"><h1>Register your institute</h1><form id="instReqForm" class="form-grid two-col"><label>Institute name<input name="instituteName" required/></label><label>Category<input name="category" required/></label><label>Contact name<input name="contactName"/></label><label>Email<input name="email" type="email" required/></label><label>Phone<input name="phone"/></label><label class="full">Notes<textarea name="notes"></textarea></label><button class="btn btn-primary">Submit request</button></form></div></div></section>`;
}
async function notificationsPage() {
  if (!currentUser) return loginPage();
  const items = await api('/api/me/notifications');
  return `<section class="section narrow-section"><div class="container narrow"><div class="section-head"><h1>Notifications</h1><button class="btn btn-outline" id="markRead">Mark all read</button></div><div class="stack">${items.map(n => `<div class="card form-card ${n.read ? '' : 'unread'}"><h3>${esc(n.title)}</h3><p>${esc(n.message)}</p></div>`).join('') || '<p>No notifications.</p>'}</div></div></section>`;
}
async function profilePage() {
  if (!currentUser) return loginPage();
  if (currentUser.role !== 'STUDENT') return `<section class="section"><div class="container narrow"><div class="card form-card"><h1>${esc(currentUser.name)}</h1><p>${esc(currentUser.email)}</p><p class="muted">Use your role dashboard to manage your data.</p></div></div></section>`;
  return `<section class="section"><div class="container narrow"><div class="card form-card"><h1>My profile</h1><form id="studentProfileForm" class="form-grid two-col"><label>Name<input name="name" value="${esc(currentUser.name)}"/></label><label>Phone<input name="phone" value="${esc(currentUser.phone || '')}"/></label><label>District<input name="district" value="${esc(currentUser.profile?.district || '')}"/></label><label>Education<input name="educationLevel" value="${esc(currentUser.profile?.educationLevel || '')}"/></label><label class="full">Career goal<textarea name="careerGoal">${esc(currentUser.profile?.careerGoal || '')}</textarea></label><button class="btn btn-primary">Save profile</button></form></div></div></section>`;
}
function dashTabs(tabs) { return `<div class="tabs">${tabs.map(t => `<button class="tab ${state.tab === t.key ? 'active' : ''}" data-tab="${esc(t.key)}">${esc(t.label)}</button>`).join('')}</div>`; }
async function dashboardPage() {
  if (!currentUser) return loginPage();
  const d = await api('/api/dashboard');
  if (currentUser.role === 'STUDENT') return studentDash(d);
  if (currentUser.role === 'INSTITUTE_OWNER') return instituteDash(d);
  if (currentUser.role === 'COUNSELOR') return counselorDash(d);
  if (currentUser.role === 'ADMIN') return adminDash(d);
  return '<section class="section"><div class="container"><h1>No dashboard</h1></div></section>';
}
function studentDash(d) {
  return `<section class="section"><div class="container"><h1>Student dashboard</h1><div class="grid grid-3">${stat('Profile', `${d.user.profile?.completion || 0}%`, 'Completed')}${stat('Requests', String(d.leads.length), 'Course leads')}${stat('Bookings', String(d.bookings.length), 'Counseling sessions')}</div><div class="grid grid-2 mt-2"><div class="card form-card"><h3>My requests</h3>${d.leads.map(l => `<p><b>${esc(l.courseTitle)}</b> • ${esc(l.type)} • ${esc(l.status)}</p>`).join('') || '<p>No requests yet.</p>'}</div><div class="card form-card"><h3>My bookings</h3>${d.bookings.map(b => `<p><b>${esc(b.counselorName)}</b> • ${esc(b.date)} ${esc(b.time)} • ${esc(b.status)}</p>`).join('') || '<p>No bookings yet.</p>'}</div></div></div></section>`;
}
function instituteDash(d) {
  const tabs = [{key:'overview',label:'Overview'}, {key:'profile',label:'Institute Profile'}, {key:'courses',label:'Courses / Degrees'}, {key:'leads',label:'Leads'}];
  let body = '';
  if (state.tab === 'profile') body = instituteProfileForm(d.institute);
  else if (state.tab === 'courses') body = instituteCoursesPanel(d.courses);
  else if (state.tab === 'leads') body = `<div class="card form-card"><h3>Student leads</h3>${d.leads.map(l => `<p><b>${esc(l.studentName)}</b> • ${esc(l.courseTitle)} • ${esc(l.type)} • ${esc(l.status)}</p>`).join('') || '<p>No leads yet.</p>'}</div>`;
  else body = `<div class="grid grid-3">${stat('Courses', String(d.courses.length), 'Created courses')}${stat('Published', String(d.courses.filter(c => c.status === 'PUBLISHED').length), 'Visible courses')}${stat('Leads', String(d.leads.length), 'Student requests')}</div><div class="card form-card mt-2"><h3>What you can manage now</h3><p>Edit existing courses/degrees, change status, update images, delete records, and update institute profile details.</p></div>`;
  return `<section class="section"><div class="container"><h1>Institute owner dashboard</h1>${dashTabs(tabs)}${body}</div></section>`;
}
function instituteProfileForm(i) {
  return `<div class="card form-card"><h3>Edit institute profile</h3><form id="instProfileForm" class="form-grid two-col"><label>Name<input name="name" value="${esc(i.name)}"/></label><label>Short name<input name="shortName" value="${esc(i.shortName || '')}"/></label><label>Email<input name="email" value="${esc(i.email || '')}"/></label><label>Phone<input name="phone" value="${esc(i.phone || '')}"/></label><label>Website<input name="website" value="${esc(i.website || '')}"/></label><label>Category<input name="category" value="${esc(i.category || '')}"/></label><label>Image URL<input name="image" value="${esc(i.image || '')}"/></label><label>Upload image<input name="imageFile" type="file" accept="image/*"/></label><label class="full">Short description<textarea name="description">${esc(i.description || '')}</textarea></label><label class="full">Long description<textarea name="longDescription">${esc(i.longDescription || '')}</textarea></label><label class="full">Featured free courses, comma separated<input name="featuredFreeCourses" value="${esc((i.featuredFreeCourses || []).join(', '))}"/></label><label class="full">Facilities, comma separated<input name="facilities" value="${esc((i.facilities || []).join(', '))}"/></label><button class="btn btn-primary">Save institute profile</button></form></div>`;
}
function courseFields(c = {}, prefix = '') {
  return `<label>Title<input name="title" value="${esc(c.title || '')}" required/></label><label>Category<input name="category" value="${esc(c.category || '')}" required/></label><label>Type<select name="type">${['Degree','Diploma','Certificate','Short Course'].map(x => `<option ${c.type === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>Status<select name="status">${['DRAFT','PENDING_APPROVAL','PUBLISHED','DISABLED'].map(x => `<option ${c.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>Duration<input name="duration" value="${esc(c.duration || '')}"/></label><label>Study mode<input name="studyMode" value="${esc(c.studyMode || '')}"/></label><label>Price<input name="price" type="number" value="${esc(c.price || 0)}"/></label><label>Discount<input name="discount" value="${esc(c.discount || '')}"/></label><label>Start date<input name="startDate" type="date" value="${esc(c.startDate || '')}"/></label><label>Sequence<input name="sequence" type="number" value="${esc(c.sequence || 999)}"/></label><label>Image URL<input name="image" value="${esc(c.image || '/assets/gallery-1.svg')}"/></label><label>Upload image<input name="imageFile" type="file" accept="image/*"/></label><label class="full">Description<textarea name="description">${esc(c.description || '')}</textarea></label><label class="full">Modules, one per line<textarea name="modules">${esc((c.modules || []).join('\n'))}</textarea></label><label class="full">Skills, comma separated<input name="skills" value="${esc((c.skills || []).join(', '))}"/></label><label class="full">Related jobs, comma separated<input name="relatedJobs" value="${esc((c.relatedJobs || []).join(', '))}"/></label><label class="checkbox-label"><input name="sponsored" type="checkbox" ${c.sponsored ? 'checked' : ''}/> Sponsored</label>`;
}
function instituteCoursesPanel(courses) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Add new course / degree</h3><form id="courseCreateForm" class="form-grid">${courseFields({ status:'PUBLISHED', type:'Degree', image:'/assets/gallery-1.svg' })}<button class="btn btn-primary">Create course</button></form></div><div class="stack">${courses.map(c => `<details class="card form-card"><summary><b>${esc(c.title)}</b> ${statusPill(c.status)} <span class="muted">${esc(c.category)} • ${money(c.price)}</span></summary><form class="courseEditForm form-grid two-col mt-2" data-id="${esc(c.id)}">${courseFields(c)}<button class="btn btn-primary">Save changes</button><button type="button" class="btn btn-outline" data-delete-course="${esc(c.id)}">Delete course</button></form></details>`).join('') || '<p>No courses yet.</p>'}</div></div>`;
}
function counselorDash(d) {
  return `<section class="section"><div class="container"><h1>Counselor dashboard</h1><div class="grid grid-3">${stat('Bookings', String(d.bookings.length), 'Student sessions')}${stat('Open slots', String((d.counselor?.slots || []).filter(s => s.status === 'AVAILABLE').length), 'Available')}${stat('Focus', d.counselor?.focus || 'Career Guidance', 'Specialization')}</div><div class="card form-card mt-2"><h3>Bookings</h3>${d.bookings.map(b => `<p><b>${esc(b.studentName)}</b> • ${esc(b.date)} ${esc(b.time)} • ${esc(b.mode)} • ${esc(b.status)}</p>`).join('') || '<p>No bookings yet.</p>'}</div></div></section>`;
}
function adminDash(d) {
  const tabs = [{key:'overview',label:'Overview'}, {key:'institutes',label:'Institutes'}, {key:'users',label:'Users'}, {key:'courses',label:'Courses'}, {key:'requests',label:'Institute Requests'}, {key:'content',label:'Content'}];
  let body = '';
  if (state.tab === 'institutes') body = adminInstitutesPanel(d);
  else if (state.tab === 'users') body = adminUsersPanel(d);
  else if (state.tab === 'courses') body = adminCoursesPanel(d);
  else if (state.tab === 'requests') body = adminRequestsPanel(d);
  else if (state.tab === 'content') body = adminContentPanel(d);
  else body = `<div class="grid grid-3">${stat('Users', String(d.users.length), 'All role users')}${stat('Institutes', String(d.institutes.length), 'Active and blocked')}${stat('Courses', String(d.courses.length), 'All statuses')}</div><div class="grid grid-3 mt-2">${stat('Pending Requests', String(d.instituteRequests.filter(r => r.status === 'NEW').length), 'Institute requests')}${stat('Pending Articles', String(d.pendingArticles.length), 'Need approval')}${stat('Leads', String(d.leads.length), 'Student interest/enrollment')}</div><div class="card form-card mt-2"><h3>Admin improvements in this version</h3><p>Admin can now create institutes, create users, assign institute owners, create/edit/delete courses, convert institute requests, and block/activate records.</p></div>`;
  return `<section class="section"><div class="container"><h1>Admin dashboard</h1>${dashTabs(tabs)}${body}</div></section>`;
}
function instituteOptions(institutes, selected = '') { return institutes.map(i => `<option value="${esc(i.id)}" ${selected === i.id ? 'selected' : ''}>${esc(i.name)}</option>`).join(''); }
function adminInstitutesPanel(d) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Add institute + owner</h3><form id="adminInstituteCreateForm" class="form-grid"><label>Institute name<input name="name" required/></label><label>Short name<input name="shortName"/></label><label>Category<input name="category" value="University"/></label><label>Email<input name="email" type="email" required/></label><label>Phone<input name="phone"/></label><label>Website<input name="website"/></label><label>Plan<select name="plan"><option>Startup</option><option>Gold</option><option>Platinum</option></select></label><label>Account type<select name="accountType"><option>STANDARD</option><option>SPONSORED</option></select></label><label>Owner name<input name="ownerName"/></label><label>Owner email<input name="ownerEmail" type="email"/></label><label>Password<input name="password" value="demo123"/></label><label>Image URL<input name="image" value="/assets/gallery-1.svg"/></label><label>Upload image<input name="imageFile" type="file" accept="image/*"/></label><label class="full">Description<textarea name="description"></textarea></label><button class="btn btn-primary">Create institute</button></form></div><div class="stack">${d.institutes.map(i => `<details class="card form-card"><summary><b>${esc(i.name)}</b> ${statusPill(i.status)} <span class="muted">${esc(i.accountType)} • ${esc(i.plan)}</span></summary><form class="adminInstituteEditForm form-grid two-col mt-2" data-id="${esc(i.id)}"><label>Name<input name="name" value="${esc(i.name)}"/></label><label>Short name<input name="shortName" value="${esc(i.shortName || '')}"/></label><label>Email<input name="email" value="${esc(i.email || '')}"/></label><label>Phone<input name="phone" value="${esc(i.phone || '')}"/></label><label>Category<input name="category" value="${esc(i.category || '')}"/></label><label>Plan<input name="plan" value="${esc(i.plan || '')}"/></label><label>Account type<select name="accountType"><option ${i.accountType==='STANDARD'?'selected':''}>STANDARD</option><option ${i.accountType==='SPONSORED'?'selected':''}>SPONSORED</option></select></label><label>Status<select name="status"><option ${i.status==='ACTIVE'?'selected':''}>ACTIVE</option><option ${i.status==='PENDING'?'selected':''}>PENDING</option><option ${i.status==='BLOCKED'?'selected':''}>BLOCKED</option></select></label><label class="full">Description<textarea name="description">${esc(i.description || '')}</textarea></label><button class="btn btn-primary">Save institute</button><button type="button" class="btn btn-outline" data-toggle-institute="${esc(i.id)}">Activate / Block</button></form></details>`).join('')}</div></div>`;
}
function adminUsersPanel(d) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Add user</h3><form id="adminUserCreateForm" class="form-grid"><label>Name<input name="name" required/></label><label>Email<input name="email" type="email" required/></label><label>Phone<input name="phone"/></label><label>Role<select name="role"><option>STUDENT</option><option>INSTITUTE_OWNER</option><option>COUNSELOR</option><option>ADMIN</option></select></label><label>Institute for owner<select name="instituteId"><option value="">None</option>${instituteOptions(d.institutes)}</select></label><label>Password<input name="password" value="demo123"/></label><button class="btn btn-primary">Create user</button></form></div><div class="stack">${d.users.map(u => `<details class="card form-card"><summary><b>${esc(u.name)}</b> ${statusPill(u.status)} <span class="muted">${esc(u.role)} • ${esc(u.email)}</span></summary><form class="adminUserEditForm form-grid two-col mt-2" data-id="${esc(u.id)}"><label>Name<input name="name" value="${esc(u.name)}"/></label><label>Email<input name="email" value="${esc(u.email)}"/></label><label>Phone<input name="phone" value="${esc(u.phone || '')}"/></label><label>Role<select name="role">${['STUDENT','INSTITUTE_OWNER','COUNSELOR','ADMIN'].map(r => `<option ${u.role===r?'selected':''}>${r}</option>`).join('')}</select></label><label>Status<select name="status"><option ${u.status==='ACTIVE'?'selected':''}>ACTIVE</option><option ${u.status==='BLOCKED'?'selected':''}>BLOCKED</option></select></label><label>Institute<select name="instituteId"><option value="">None</option>${instituteOptions(d.institutes, u.instituteId || '')}</select></label><label>Password reset<input name="password" placeholder="Leave blank to keep current"/></label><button class="btn btn-primary">Save user</button><button type="button" class="btn btn-outline" data-toggle-user="${esc(u.id)}">Activate / Block</button></form></details>`).join('')}</div></div>`;
}
function adminCoursesPanel(d) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Add course for any institute</h3><form id="adminCourseCreateForm" class="form-grid"><label>Institute<select name="instituteId" required>${instituteOptions(d.institutes)}</select></label>${courseFields({ status:'PUBLISHED', type:'Degree', image:'/assets/gallery-1.svg' })}<button class="btn btn-primary">Create course</button></form></div><div class="stack">${d.courses.map(c => `<details class="card form-card"><summary><b>${esc(c.title)}</b> ${statusPill(c.status)} <span class="muted">${esc(c.institute)} • ${money(c.price)}</span></summary><form class="adminCourseEditForm form-grid two-col mt-2" data-id="${esc(c.id)}"><label>Institute<select name="instituteId">${instituteOptions(d.institutes, c.instituteId)}</select></label>${courseFields(c)}<button class="btn btn-primary">Save course</button><button type="button" class="btn btn-outline" data-admin-delete-course="${esc(c.id)}">Delete course</button></form></details>`).join('')}</div></div>`;
}
function adminRequestsPanel(d) {
  return `<div class="card form-card"><h3>Institute registration requests</h3><div class="stack">${d.instituteRequests.map(r => `<div class="card form-card"><h3>${esc(r.instituteName)}</h3><p>${esc(r.contactName)} • ${esc(r.email)} • ${esc(r.phone)}</p><p class="muted">${esc(r.category)} • ${esc(r.status)}</p><p>${esc(r.notes || '')}</p>${r.status === 'NEW' ? `<button class="btn btn-outline btn-small" data-approve-req="${esc(r.id)}">Approve</button> <button class="btn btn-primary btn-small" data-convert-req="${esc(r.id)}">Convert to institute + owner</button>` : ''}</div>`).join('') || '<p>No requests.</p>'}</div></div>`;
}
function adminContentPanel(d) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Pending articles</h3>${d.pendingArticles.map(a => `<p><b>${esc(a.title)}</b> • ${esc(a.author)} <button class="btn btn-primary btn-small" data-approve-article="${esc(a.id)}">Approve</button></p>`).join('') || '<p>No pending articles.</p>'}</div><div class="card form-card"><h3>Pending feedback</h3>${d.pendingFeedback.map(f => `<p><b>${esc(f.user)}</b> • ${esc(f.target)} <button class="btn btn-primary btn-small" data-approve-feedback="${esc(f.id)}">Approve</button></p>`).join('') || '<p>No pending feedback.</p>'}</div></div>`;
}
function formToObject(form) {
  const fd = new FormData(form);
  const obj = Object.fromEntries(fd.entries());
  obj.sponsored = fd.get('sponsored') === 'on';
  return obj;
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.name) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function uploadFromForm(form) {
  const file = new FormData(form).get('imageFile');
  if (!file || !file.name) return '';
  const dataUrl = await fileToDataUrl(file);
  const result = await api('/api/shared/image', { method:'POST', body: JSON.stringify({ filename: file.name, dataUrl }) });
  return result.url;
}
async function submitLead(courseId, type) {
  try { await api('/api/student/leads', { method:'POST', body: JSON.stringify({ courseId, type }) }); toast('Request submitted'); nav('dashboard'); }
  catch (e) { toast(e.message); if (e.message.includes('Authentication')) nav('login'); }
}
async function bookSlot(counselorId, slotId) {
  try { await api('/api/counseling/bookings', { method:'POST', body: JSON.stringify({ counselorId, slotId }) }); toast('Booking confirmed'); nav('dashboard'); }
  catch (e) { toast(e.message); if (e.message.includes('Authentication')) nav('login'); }
}
async function bindForms() {
  document.getElementById('searchForm')?.addEventListener('submit', e => { e.preventDefault(); const f = new FormData(e.target); state.query = f.get('q') || ''; state.category = f.get('category') || 'All'; render(); });
  document.getElementById('loginForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const f = new FormData(e.target); const r = await api('/api/auth/login', { method:'POST', body: JSON.stringify({ email:f.get('email'), password:f.get('password') }) }); currentToken = r.token; currentUser = r.user; localStorage.setItem('fm_token_v2', currentToken); state.tab = 'overview'; toast('Login successful'); nav('dashboard'); } catch(err) { toast(err.message); } });
  document.getElementById('signupForm')?.addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/student/signup', { method:'POST', body: JSON.stringify(formToObject(e.target)) }); toast('Account created. Please login.'); nav('login'); } catch(err) { toast(err.message); } });
  document.getElementById('instReqForm')?.addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/admin/institute-requests', { method:'POST', body: JSON.stringify(formToObject(e.target)) }); toast('Institute request submitted'); e.target.reset(); } catch(err) { toast(err.message); } });
  document.getElementById('studentProfileForm')?.addEventListener('submit', async e => { e.preventDefault(); const f = new FormData(e.target); const profile = { district:f.get('district'), educationLevel:f.get('educationLevel'), careerGoal:f.get('careerGoal'), completion:85 }; const u = await api('/api/student/profile', { method:'PUT', body: JSON.stringify({ name:f.get('name'), phone:f.get('phone'), profile }) }); currentUser = u; toast('Profile saved'); render(); });
  document.getElementById('markRead')?.addEventListener('click', async () => { await api('/api/me/notifications/read', { method:'POST' }); toast('Marked as read'); render(); });
  document.getElementById('instProfileForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(e.target); const img = await uploadFromForm(e.target); if (img) obj.image = img; obj.featuredFreeCourses = String(obj.featuredFreeCourses || '').split(',').map(x => x.trim()).filter(Boolean); obj.facilities = String(obj.facilities || '').split(',').map(x => x.trim()).filter(Boolean); await api('/api/institute/profile', { method:'PUT', body: JSON.stringify(obj) }); toast('Institute profile saved'); render(); } catch(err) { toast(err.message); } });
  document.getElementById('courseCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(e.target); const img = await uploadFromForm(e.target); if (img) obj.image = img; await api('/api/institute/courses', { method:'POST', body: JSON.stringify(obj) }); toast('Course created'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.courseEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(form); const img = await uploadFromForm(form); if (img) obj.image = img; await api(`/api/institute/courses/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(obj) }); toast('Course updated'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('adminInstituteCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(e.target); const img = await uploadFromForm(e.target); if (img) obj.image = img; await api('/api/admin/institutes', { method:'POST', body: JSON.stringify(obj) }); toast('Institute created'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.adminInstituteEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { await api(`/api/admin/institutes/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(formToObject(form)) }); toast('Institute updated'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('adminUserCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/admin/users', { method:'POST', body: JSON.stringify(formToObject(e.target)) }); toast('User created'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.adminUserEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(form); if (!obj.password) delete obj.password; await api(`/api/admin/users/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(obj) }); toast('User updated'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('adminCourseCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(e.target); const img = await uploadFromForm(e.target); if (img) obj.image = img; await api('/api/admin/courses', { method:'POST', body: JSON.stringify(obj) }); toast('Course created by admin'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.adminCourseEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(form); const img = await uploadFromForm(form); if (img) obj.image = img; await api(`/api/admin/courses/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(obj) }); toast('Course updated by admin'); render(); } catch(err) { toast(err.message); } }));
}
function bindActions() {
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { state.tab = b.dataset.tab; render(); }));
  document.querySelectorAll('[data-lead]').forEach(b => b.addEventListener('click', () => submitLead(b.dataset.course, b.dataset.lead)));
  document.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', () => bookSlot(b.dataset.book, b.dataset.slot)));
  document.querySelectorAll('[data-delete-course]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Delete this course?')) return; await api(`/api/institute/courses/${b.dataset.deleteCourse}`, { method:'DELETE' }); toast('Course deleted'); render(); }));
  document.querySelectorAll('[data-admin-delete-course]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Delete this course?')) return; await api(`/api/admin/courses/${b.dataset.adminDeleteCourse}`, { method:'DELETE' }); toast('Course deleted'); render(); }));
  document.querySelectorAll('[data-toggle-institute]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/institutes/${b.dataset.toggleInstitute}/toggle-status`, { method:'POST' }); toast('Institute status changed'); render(); }));
  document.querySelectorAll('[data-toggle-user]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/users/${b.dataset.toggleUser}/toggle-status`, { method:'POST' }); toast('User status changed'); render(); }));
  document.querySelectorAll('[data-approve-req]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/institute-requests/${b.dataset.approveReq}/approve`, { method:'POST' }); toast('Request approved'); render(); }));
  document.querySelectorAll('[data-convert-req]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/institute-requests/${b.dataset.convertReq}/convert`, { method:'POST', body: JSON.stringify({ password:'demo123' }) }); toast('Request converted to institute + owner'); render(); }));
  document.querySelectorAll('[data-approve-article]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/articles/${b.dataset.approveArticle}/approve`, { method:'POST' }); toast('Article approved'); render(); }));
  document.querySelectorAll('[data-approve-feedback]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/feedback/${b.dataset.approveFeedback}/approve`, { method:'POST' }); toast('Feedback approved'); render(); }));
}
async function logout() {
  try { await api('/api/auth/logout', { method:'POST' }); } catch {}
  currentToken = ''; currentUser = null; localStorage.removeItem('fm_token_v2'); state.tab = 'overview'; toast('Logged out'); nav('home');
}
async function render() {
  await loadUser();
  const [key, param] = route();
  let content = '';
  try {
    if (!key || key === 'home') content = await homePage();
    else if (key === 'explore') content = await explorePage();
    else if (key === 'institutes') content = await institutesPage();
    else if (key === 'institute') content = await institutePage(param);
    else if (key === 'course') content = await coursePage(param);
    else if (key === 'counseling') content = await counselingPage();
    else if (key === 'articles') content = await articlesPage();
    else if (key === 'login') content = loginPage();
    else if (key === 'signup') content = signupPage();
    else if (key === 'institute-register') content = instituteRegisterPage();
    else if (key === 'notifications') content = await notificationsPage();
    else if (key === 'profile') content = await profilePage();
    else if (key === 'dashboard') content = await dashboardPage();
    else content = `<section class="section"><div class="container"><h1>Page not found</h1></div></section>`;
  } catch (e) {
    content = `<section class="section"><div class="container"><div class="card form-card"><h1>Error</h1><p>${esc(e.message)}</p></div></div></section>`;
  }
  layout(content);
  await bindForms();
  bindActions();
}
window.addEventListener('hashchange', () => { if (route()[0] !== 'dashboard') state.tab = 'overview'; render(); });
render();
