const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_PATH = path.join(ROOT, 'data', 'db.json');

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
function slugify(text) {
  return String(text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}
function safeUser(user) {
  if (!user) return null;
  const clone = { ...user };
  delete clone.password;
  delete clone.passwordHash;
  return clone;
}
function send(res, status, payload, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(payload));
}
function bad(res, message, status = 400) {
  send(res, status, { error: message });
}
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 120 * 1024 * 1024) reject(new Error('Request body too large')); // demo upload limit for small images/videos
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
  });
}
function getToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}
function auth(req, db) {
  const token = getToken(req);
  if (!token) return null;
  db.sessions = db.sessions || [];
  const session = db.sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
  if (!session) return null;
  return db.users.find(u => u.id === session.userId) || null;
}
function requireUser(req, res, db, roles = []) {
  const user = auth(req, db);
  if (!user) { bad(res, 'Authentication required', 401); return null; }
  if (roles.length && !roles.includes(user.role)) { bad(res, 'Permission denied', 403); return null; }
  return user;
}
function addNotification(db, userId, title, message) {
  db.notifications = db.notifications || [];
  db.notifications.unshift({ id: uid('not'), userId, title, message, read: false, createdAt: new Date().toISOString() });
}
function publicData(db) {
  return {
    banners: db.banners || [],
    institutes: (db.institutes || []).filter(i => i.status === 'ACTIVE'),
    courses: (db.courses || []).filter(c => c.status === 'PUBLISHED'),
    counselors: (db.counselors || []).filter(c => c.status === 'PUBLISHED'),
    articles: (db.articles || []).filter(a => a.status === 'PUBLISHED'),
    feedback: (db.feedback || []).filter(f => f.status === 'PUBLISHED'),
    videos: (db.videos || []).filter(v => v.status === 'PUBLISHED'),
    contactSettings: db.contactSettings || {}
  };
}
function sortCourses(courses) {
  return [...courses].sort((a, b) => Number(b.sponsored) - Number(a.sponsored) || (a.sequence || 9999) - (b.sequence || 9999) || (b.views || 0) - (a.views || 0));
}
function serveStatic(req, res) {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  let filePath = decodeURIComponent(reqUrl.pathname);
  if (filePath === '/') filePath = '/index.html';
  const abs = path.normalize(path.join(PUBLIC_DIR, filePath));
  if (!abs.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(abs, (err, data) => {
    if (err) {
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e, html) => {
        if (e) { res.writeHead(404); res.end('Not found'); }
        else { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html); }
      });
      return;
    }
    const ext = path.extname(abs).toLowerCase();
    const types = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.mp4':'video/mp4', '.webm':'video/webm', '.ogg':'video/ogg', '.mov':'video/quicktime' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
}
function buildInstituteFromBody(body) {
  const name = String(body.name || body.instituteName || '').trim();
  return {
    id: uid('inst'),
    name,
    shortName: String(body.shortName || name.split(' ').map(w => w[0]).join('').slice(0, 6).toUpperCase() || 'INST').trim(),
    slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
    category: body.category || 'Education Provider',
    email: body.email || '',
    phone: body.phone || '',
    whatsapp: body.whatsapp || body.phone || '',
    website: body.website || '#',
    status: body.status || 'ACTIVE',
    accountType: body.accountType || 'STANDARD',
    plan: body.plan || 'Startup',
    image: body.image || '/assets/gallery-1.svg',
    gallery: [body.image || '/assets/gallery-1.svg'],
    description: body.description || 'New institute profile created by admin.',
    longDescription: body.longDescription || body.description || 'New institute profile created by admin.',
    freeCoursesCount: 0,
    featuredFreeCourses: [],
    facilities: [],
    visits: 0,
    bannerViews: 0,
    leads: 0,
    rating: 4.5
  };
}
function buildCourseFromBody(body, inst) {
  const title = String(body.title || '').trim();
  const price = Number(body.price || 0);
  const status = body.status || 'PUBLISHED';
  return {
    id: uid('course'),
    title,
    slug: `${slugify(title)}-${Date.now().toString().slice(-5)}`,
    instituteId: inst.id,
    institute: inst.shortName || inst.name,
    image: body.image || '/assets/gallery-1.svg',
    type: body.type || 'Short Course',
    category: body.category || 'General',
    duration: body.duration || 'TBA',
    studyMode: body.studyMode || 'Online',
    price,
    currency: 'LKR',
    isFree: price === 0,
    discount: price === 0 ? 'Free Course' : (body.discount || 'Contact institute for offers'),
    rating: Number(body.rating || 4.5),
    sponsored: Boolean(body.sponsored),
    status,
    startDate: body.startDate || new Date().toISOString().slice(0,10),
    description: body.description || '',
    overview: body.overview || body.description || '',
    modules: Array.isArray(body.modules) ? body.modules : String(body.modules || 'Module 1').split('\n').map(x => x.trim()).filter(Boolean),
    skills: Array.isArray(body.skills) ? body.skills : String(body.skills || 'Skill').split(',').map(x => x.trim()).filter(Boolean),
    relatedJobs: Array.isArray(body.relatedJobs) ? body.relatedJobs : String(body.relatedJobs || 'Career Path').split(',').map(x => x.trim()).filter(Boolean),
    entryRequirements: body.entryRequirements || 'Contact institute for details.',
    award: body.award || body.type || 'Certificate',
    sequence: Number(body.sequence || 999),
    videos: Array.isArray(body.videos) ? body.videos : [],
    views: 0,
    leads: 0
  };
}
function updateCourseFromBody(course, body, inst) {
  const fields = ['title','category','type','duration','studyMode','image','discount','status','startDate','description','overview','entryRequirements','award'];
  fields.forEach(k => { if (body[k] !== undefined) course[k] = body[k]; });
  if (body.price !== undefined) {
    course.price = Number(body.price || 0);
    course.isFree = course.price === 0;
  }
  if (body.sponsored !== undefined) course.sponsored = Boolean(body.sponsored);
  if (body.sequence !== undefined) course.sequence = Number(body.sequence || 999);
  if (body.modules !== undefined) course.modules = Array.isArray(body.modules) ? body.modules : String(body.modules).split('\n').map(x => x.trim()).filter(Boolean);
  if (body.skills !== undefined) course.skills = Array.isArray(body.skills) ? body.skills : String(body.skills).split(',').map(x => x.trim()).filter(Boolean);
  if (body.relatedJobs !== undefined) course.relatedJobs = Array.isArray(body.relatedJobs) ? body.relatedJobs : String(body.relatedJobs).split(',').map(x => x.trim()).filter(Boolean);
  if (course.title) course.slug = course.slug || `${slugify(course.title)}-${Date.now().toString().slice(-5)}`;
  if (inst) course.institute = inst.shortName || inst.name;
  return course;
}
async function saveMedia(req, res, db, roles) {
  const user = requireUser(req, res, db, roles);
  if (!user) return;
  const body = await parseBody(req);
  if (!body.dataUrl || !body.filename) return bad(res, 'dataUrl and filename are required');
  const match = String(body.dataUrl).match(/^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return bad(res, 'Only base64 data URLs are supported');
  const mime = match[1].toLowerCase();
  const allowed = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogg', 'video/quicktime': 'mov'
  };
  if (!allowed[mime]) return bad(res, 'Unsupported file type. Use PNG/JPG/WebP/SVG or MP4/WebM/OGG/MOV.');
  const kind = mime.startsWith('video/') ? 'vidfile' : 'img';
  const fileName = `${uid(kind)}.${allowed[mime]}`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'uploads', fileName), Buffer.from(match[2], 'base64'));
  return send(res, 201, { url: `/uploads/${fileName}`, mime, kind });
}

async function handleApi(req, res) {
  const db = readDb();
  db.sessions = db.sessions || [];
  db.users = db.users || [];
  db.institutes = db.institutes || [];
  db.courses = db.courses || [];
  db.counselors = db.counselors || [];
  db.articles = db.articles || [];
  db.feedback = db.feedback || [];
  db.instituteRequests = db.instituteRequests || [];
  db.leads = db.leads || [];
  db.bookings = db.bookings || [];
  db.notifications = db.notifications || [];
  db.banners = db.banners || [];
  db.videos = db.videos || [];
  db.inquiries = db.inquiries || [];
  db.contactSettings = db.contactSettings || {};

  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;
  const p = url.pathname;

  try {
    if (method === 'GET' && p === '/api/health') return send(res, 200, { ok: true, app: 'FM Connect Full Stack v6 Future Minds Style UI' });
    if (method === 'GET' && p === '/api/public/home') return send(res, 200, publicData(db));
    if (method === 'GET' && p === '/api/public/courses') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const category = url.searchParams.get('category') || 'All';
      let courses = db.courses.filter(c => c.status === 'PUBLISHED');
      if (category !== 'All') courses = courses.filter(c => c.category === category);
      if (q) courses = courses.filter(c => `${c.title} ${c.description} ${c.institute} ${c.category}`.toLowerCase().includes(q));
      return send(res, 200, sortCourses(courses));
    }
    if (method === 'GET' && p.startsWith('/api/public/courses/')) {
      const slug = decodeURIComponent(p.split('/').pop());
      const course = db.courses.find(c => c.slug === slug || c.id === slug);
      if (!course) return bad(res, 'Course not found', 404);
      return send(res, 200, { ...course, instituteProfile: db.institutes.find(i => i.id === course.instituteId) || null });
    }
    if (method === 'GET' && p === '/api/public/institutes') return send(res, 200, db.institutes.filter(i => i.status === 'ACTIVE'));
    if (method === 'GET' && p.startsWith('/api/public/institutes/')) {
      const slug = decodeURIComponent(p.split('/').pop());
      const inst = db.institutes.find(i => i.slug === slug || i.id === slug);
      if (!inst) return bad(res, 'Institute not found', 404);
      return send(res, 200, { ...inst, courses: db.courses.filter(c => c.instituteId === inst.id && c.status === 'PUBLISHED') });
    }
    if (method === 'GET' && p === '/api/public/counselors') return send(res, 200, db.counselors.filter(c => c.status === 'PUBLISHED'));
    if (method === 'GET' && p === '/api/public/articles') return send(res, 200, db.articles.filter(a => a.status === 'PUBLISHED'));
    if (method === 'GET' && p === '/api/public/videos') return send(res, 200, db.videos.filter(v => v.status === 'PUBLISHED'));
    if (method === 'GET' && p === '/api/public/contact') return send(res, 200, db.contactSettings || {});
    if (method === 'POST' && p === '/api/public/inquiries') {
      const body = await parseBody(req);
      if (!body.name || !body.email || !body.subject || !body.message) return bad(res, 'Name, email, subject, and message are required');
      const inquiry = { id: uid('inq'), name: body.name, email: body.email, phone: body.phone || '', subject: body.subject, message: body.message, status: 'NEW', createdAt: new Date().toISOString() };
      db.inquiries.unshift(inquiry);
      const admin = db.users.find(u => u.role === 'ADMIN');
      if (admin) addNotification(db, admin.id, 'New inquiry received', `${inquiry.name} submitted an inquiry: ${inquiry.subject}`);
      writeDb(db);
      return send(res, 201, inquiry);
    }

    if (method === 'POST' && p === '/api/auth/login') {
      const body = await parseBody(req);
      const user = db.users.find(u => u.email === body.email && (u.password === body.password || u.passwordHash === body.password) && u.status === 'ACTIVE');
      if (!user) return bad(res, 'Invalid email/password or inactive account', 401);
      const token = crypto.randomBytes(32).toString('hex');
      db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1000*60*60*24*7).toISOString() });
      writeDb(db);
      return send(res, 200, { token, user: safeUser(user) });
    }
    if (method === 'POST' && p === '/api/auth/logout') {
      const token = getToken(req);
      if (token) db.sessions = db.sessions.filter(s => s.token !== token);
      writeDb(db);
      return send(res, 200, { ok: true });
    }
    if (method === 'GET' && p === '/api/me') {
      const user = requireUser(req, res, db);
      if (!user) return;
      return send(res, 200, safeUser(user));
    }
    if (method === 'POST' && p === '/api/student/signup') {
      const body = await parseBody(req);
      if (!body.name || !body.email || !body.password) return bad(res, 'Name, email, and password are required');
      if (db.users.some(u => u.email === body.email)) return bad(res, 'Email already exists');
      const user = { id: uid('u-student'), name: body.name, email: body.email, phone: body.phone || '', role: 'STUDENT', status: 'ACTIVE', password: body.password, profile: { educationLevel: body.educationLevel || '', district: body.district || '', interests: [], careerGoal: body.careerGoal || '', completion: 50 } };
      db.users.push(user);
      writeDb(db);
      return send(res, 201, { user: safeUser(user) });
    }
    if (method === 'PUT' && p === '/api/student/profile') {
      const user = requireUser(req, res, db, ['STUDENT']);
      if (!user) return;
      const body = await parseBody(req);
      user.profile = user.profile || {};
      Object.assign(user.profile, body.profile || {});
      if (body.name) user.name = body.name;
      if (body.phone) user.phone = body.phone;
      writeDb(db);
      return send(res, 200, safeUser(user));
    }
    if (method === 'POST' && p === '/api/student/leads') {
      const user = requireUser(req, res, db, ['STUDENT']);
      if (!user) return;
      const body = await parseBody(req);
      const course = db.courses.find(c => c.id === body.courseId);
      if (!course) return bad(res, 'Course not found', 404);
      const existing = db.leads.find(l => l.studentId === user.id && l.courseId === course.id && l.type === (body.type || 'INTERESTED'));
      if (existing) return send(res, 200, existing);
      const lead = { id: uid('lead'), studentId: user.id, studentName: user.name, courseId: course.id, courseTitle: course.title, instituteId: course.instituteId, type: body.type || 'INTERESTED', status: 'NEW', discount: course.discount, createdAt: new Date().toISOString() };
      db.leads.unshift(lead);
      course.leads = Number(course.leads || 0) + 1;
      const owner = db.users.find(u => u.instituteId === course.instituteId);
      if (owner) addNotification(db, owner.id, 'New student lead', `${user.name} submitted a request for ${course.title}.`);
      addNotification(db, user.id, 'Course request submitted', `Your request for ${course.title} was sent.`);
      writeDb(db);
      return send(res, 201, lead);
    }
    if (method === 'POST' && p === '/api/counseling/bookings') {
      const user = requireUser(req, res, db, ['STUDENT']);
      if (!user) return;
      const body = await parseBody(req);
      const counselor = db.counselors.find(c => c.id === body.counselorId);
      const slot = counselor?.slots.find(s => s.id === body.slotId);
      if (!slot || slot.status !== 'AVAILABLE') return bad(res, 'Slot is not available');
      slot.status = 'BOOKED';
      const booking = { id: uid('booking'), studentId: user.id, studentName: user.name, counselorId: counselor.id, counselorName: counselor.name, date: slot.date, time: slot.time, mode: slot.mode, status: 'CONFIRMED', createdAt: new Date().toISOString() };
      db.bookings.unshift(booking);
      addNotification(db, user.id, 'Counseling confirmed', `Your session with ${counselor.name} is confirmed.`);
      const counselorUser = db.users.find(u => u.counselorId === counselor.id);
      if (counselorUser) addNotification(db, counselorUser.id, 'New counseling booking', `${user.name} booked a ${slot.mode} session.`);
      writeDb(db);
      return send(res, 201, booking);
    }
    if (method === 'GET' && p === '/api/me/notifications') {
      const user = requireUser(req, res, db);
      if (!user) return;
      return send(res, 200, db.notifications.filter(n => n.userId === user.id));
    }
    if (method === 'POST' && p === '/api/me/notifications/read') {
      const user = requireUser(req, res, db);
      if (!user) return;
      db.notifications.forEach(n => { if (n.userId === user.id) n.read = true; });
      writeDb(db);
      return send(res, 200, { ok: true });
    }
    if (method === 'GET' && p === '/api/dashboard') {
      const user = requireUser(req, res, db);
      if (!user) return;
      if (user.role === 'STUDENT') return send(res, 200, { user: safeUser(user), leads: db.leads.filter(l => l.studentId === user.id), bookings: db.bookings.filter(b => b.studentId === user.id), notifications: db.notifications.filter(n => n.userId === user.id), recommended: sortCourses(db.courses.filter(c => c.status === 'PUBLISHED')).slice(0, 3), videos: db.videos.filter(v => v.status === 'PUBLISHED').slice(0, 3), stats: { availableCourses: db.courses.filter(c => c.status === 'PUBLISHED').length, activeInstitutes: db.institutes.filter(i => i.status === 'ACTIVE').length, openCounselingSlots: db.counselors.flatMap(c => c.slots || []).filter(s => s.status === 'AVAILABLE').length } });
      if (user.role === 'INSTITUTE_OWNER') return send(res, 200, { user: safeUser(user), institute: db.institutes.find(i => i.id === user.instituteId), courses: sortCourses(db.courses.filter(c => c.instituteId === user.instituteId)), leads: db.leads.filter(l => l.instituteId === user.instituteId), videos: db.videos.filter(v => v.ownerType === 'INSTITUTE' && (v.instituteId === user.instituteId || v.ownerId === user.instituteId)), stats: { publishedCourses: db.courses.filter(c => c.instituteId === user.instituteId && c.status === 'PUBLISHED').length, draftCourses: db.courses.filter(c => c.instituteId === user.instituteId && c.status === 'DRAFT').length, interestedLeads: db.leads.filter(l => l.instituteId === user.instituteId && l.type === 'INTERESTED').length, enrollmentLeads: db.leads.filter(l => l.instituteId === user.instituteId && l.type === 'ENROLLMENT_REQUEST').length } });
      if (user.role === 'COUNSELOR') return send(res, 200, { user: safeUser(user), counselor: db.counselors.find(c => c.id === user.counselorId), bookings: db.bookings.filter(b => b.counselorId === user.counselorId), videos: db.videos.filter(v => v.ownerType === 'COUNSELOR' && (v.counselorId === user.counselorId || v.ownerId === user.counselorId)), stats: { confirmedBookings: db.bookings.filter(b => b.counselorId === user.counselorId && b.status === 'CONFIRMED').length, completedBookings: db.bookings.filter(b => b.counselorId === user.counselorId && b.status === 'COMPLETED').length } });
      if (user.role === 'ADMIN') return send(res, 200, { users: db.users.map(safeUser), institutes: db.institutes, courses: db.courses, counselors: db.counselors, articles: db.articles, feedback: db.feedback, pendingArticles: db.articles.filter(a => a.status === 'PENDING_APPROVAL'), pendingFeedback: db.feedback.filter(f => f.status === 'PENDING_APPROVAL'), instituteRequests: db.instituteRequests, leads: db.leads, bookings: db.bookings, banners: db.banners, videos: db.videos, inquiries: db.inquiries, contactSettings: db.contactSettings, stats: { activeStudents: db.users.filter(u => u.role === 'STUDENT' && u.status === 'ACTIVE').length, activeInstitutes: db.institutes.filter(i => i.status === 'ACTIVE').length, publishedCourses: db.courses.filter(c => c.status === 'PUBLISHED').length, newInquiries: db.inquiries.filter(i => i.status === 'NEW').length, totalVideos: db.videos.length } });
    }

    if (method === 'POST' && p === '/api/shared/image') return saveMedia(req, res, db, ['ADMIN','INSTITUTE_OWNER','COUNSELOR']);
    if (method === 'POST' && p === '/api/shared/media') return saveMedia(req, res, db, ['ADMIN','INSTITUTE_OWNER','COUNSELOR']);
    if (method === 'POST' && p === '/api/institute/image') return saveMedia(req, res, db, ['ADMIN','INSTITUTE_OWNER']);

    if (method === 'PUT' && p === '/api/institute/profile') {
      const user = requireUser(req, res, db, ['INSTITUTE_OWNER']);
      if (!user) return;
      const body = await parseBody(req);
      const inst = db.institutes.find(i => i.id === user.instituteId);
      if (!inst) return bad(res, 'Institute not found', 404);
      const allowed = ['name','shortName','email','phone','whatsapp','website','image','description','longDescription','featuredFreeCourses','facilities','category'];
      allowed.forEach(k => { if (body[k] !== undefined) inst[k] = body[k]; });
      inst.freeCoursesCount = Array.isArray(inst.featuredFreeCourses) ? inst.featuredFreeCourses.length : inst.freeCoursesCount;
      db.courses.forEach(c => { if (c.instituteId === inst.id) c.institute = inst.shortName || inst.name; });
      writeDb(db);
      return send(res, 200, inst);
    }
    if (method === 'POST' && p === '/api/institute/courses') {
      const user = requireUser(req, res, db, ['INSTITUTE_OWNER']);
      if (!user) return;
      const body = await parseBody(req);
      const inst = db.institutes.find(i => i.id === user.instituteId);
      if (!inst) return bad(res, 'Institute not found', 404);
      if (!body.title || !body.category) return bad(res, 'Title and category are required');
      const course = buildCourseFromBody(body, inst);
      db.courses.unshift(course);
      writeDb(db);
      return send(res, 201, course);
    }
    if (method === 'PUT' && p.startsWith('/api/institute/courses/')) {
      const user = requireUser(req, res, db, ['INSTITUTE_OWNER']);
      if (!user) return;
      const id = p.split('/').pop();
      const body = await parseBody(req);
      const inst = db.institutes.find(i => i.id === user.instituteId);
      const course = db.courses.find(c => c.id === id && c.instituteId === user.instituteId);
      if (!course) return bad(res, 'Course not found', 404);
      updateCourseFromBody(course, body, inst);
      writeDb(db);
      return send(res, 200, course);
    }
    if (method === 'DELETE' && p.startsWith('/api/institute/courses/')) {
      const user = requireUser(req, res, db, ['INSTITUTE_OWNER']);
      if (!user) return;
      const id = p.split('/').pop();
      const course = db.courses.find(c => c.id === id && c.instituteId === user.instituteId);
      if (!course) return bad(res, 'Course not found', 404);
      db.courses = db.courses.filter(c => c.id !== id);
      writeDb(db);
      return send(res, 200, { ok: true });
    }
    if (method === 'PUT' && p === '/api/institute/course-order') {
      const user = requireUser(req, res, db, ['INSTITUTE_OWNER']);
      if (!user) return;
      const body = await parseBody(req);
      (body.items || []).forEach(item => {
        const c = db.courses.find(x => x.id === item.id && x.instituteId === user.instituteId);
        if (c) c.sequence = Number(item.sequence || 999);
      });
      writeDb(db);
      return send(res, 200, db.courses.filter(c => c.instituteId === user.instituteId));
    }

    if (method === 'POST' && p === '/api/institute/videos') {
      const user = requireUser(req, res, db, ['INSTITUTE_OWNER']);
      if (!user) return;
      const body = await parseBody(req);
      if (!body.title || !body.videoUrl) return bad(res, 'Title and video URL are required');
      const courseIds = body.courseId ? [body.courseId] : (Array.isArray(body.courseIds) ? body.courseIds : []);
      const video = { id: uid('vid'), title: body.title, category: body.category || 'Institute', scope: 'INSTITUTE', ownerType: 'INSTITUTE', ownerId: user.instituteId, instituteId: user.instituteId, courseIds, thumbnail: body.thumbnail || '/assets/video-institute-onboarding.png', description: body.description || '', videoUrl: body.videoUrl, status: body.status || 'PUBLISHED', featured: Boolean(body.featured), views: 0, createdAt: new Date().toISOString() };
      db.videos.unshift(video);
      writeDb(db);
      return send(res, 201, video);
    }
    if (method === 'PUT' && p.startsWith('/api/institute/videos/')) {
      const user = requireUser(req, res, db, ['INSTITUTE_OWNER']);
      if (!user) return;
      const id = p.split('/').pop();
      const body = await parseBody(req);
      const video = db.videos.find(v => v.id === id && v.ownerType === 'INSTITUTE' && (v.instituteId === user.instituteId || v.ownerId === user.instituteId));
      if (!video) return bad(res, 'Video not found', 404);
      ['title','category','thumbnail','description','videoUrl','status'].forEach(k => { if (body[k] !== undefined) video[k] = body[k]; });
      if (body.courseId !== undefined) video.courseIds = body.courseId ? [body.courseId] : [];
      if (body.featured !== undefined) video.featured = Boolean(body.featured);
      writeDb(db);
      return send(res, 200, video);
    }
    if (method === 'DELETE' && p.startsWith('/api/institute/videos/')) {
      const user = requireUser(req, res, db, ['INSTITUTE_OWNER']);
      if (!user) return;
      const id = p.split('/').pop();
      db.videos = db.videos.filter(v => !(v.id === id && v.ownerType === 'INSTITUTE' && (v.instituteId === user.instituteId || v.ownerId === user.instituteId)));
      writeDb(db);
      return send(res, 200, { ok: true });
    }

    if (method === 'POST' && p === '/api/counselor/videos') {
      const user = requireUser(req, res, db, ['COUNSELOR']);
      if (!user) return;
      const body = await parseBody(req);
      if (!body.title || !body.videoUrl) return bad(res, 'Title and video URL are required');
      const video = { id: uid('vid'), title: body.title, category: body.category || 'Counseling', scope: 'COUNSELOR', ownerType: 'COUNSELOR', ownerId: user.counselorId, counselorId: user.counselorId, thumbnail: body.thumbnail || '/assets/video-career-guidance.png', description: body.description || '', videoUrl: body.videoUrl, status: body.status || 'PUBLISHED', featured: Boolean(body.featured), views: 0, createdAt: new Date().toISOString() };
      db.videos.unshift(video);
      writeDb(db);
      return send(res, 201, video);
    }
    if (method === 'PUT' && p.startsWith('/api/counselor/videos/')) {
      const user = requireUser(req, res, db, ['COUNSELOR']);
      if (!user) return;
      const id = p.split('/').pop();
      const body = await parseBody(req);
      const video = db.videos.find(v => v.id === id && v.ownerType === 'COUNSELOR' && (v.counselorId === user.counselorId || v.ownerId === user.counselorId));
      if (!video) return bad(res, 'Video not found', 404);
      ['title','category','thumbnail','description','videoUrl','status'].forEach(k => { if (body[k] !== undefined) video[k] = body[k]; });
      if (body.featured !== undefined) video.featured = Boolean(body.featured);
      writeDb(db);
      return send(res, 200, video);
    }
    if (method === 'DELETE' && p.startsWith('/api/counselor/videos/')) {
      const user = requireUser(req, res, db, ['COUNSELOR']);
      if (!user) return;
      const id = p.split('/').pop();
      db.videos = db.videos.filter(v => !(v.id === id && v.ownerType === 'COUNSELOR' && (v.counselorId === user.counselorId || v.ownerId === user.counselorId)));
      writeDb(db);
      return send(res, 200, { ok: true });
    }

    if (method === 'POST' && p === '/api/admin/institute-requests') {
      const body = await parseBody(req);
      if (!body.instituteName || !body.email) return bad(res, 'Institute name and email required');
      const request = { id: uid('req'), instituteName: body.instituteName, contactName: body.contactName || '', email: body.email, phone: body.phone || '', category: body.category || 'Education Provider', status: 'NEW', notes: body.notes || '', createdAt: new Date().toISOString() };
      db.instituteRequests.unshift(request);
      const admin = db.users.find(u => u.role === 'ADMIN');
      if (admin) addNotification(db, admin.id, 'New institute request', `${request.instituteName} submitted a registration request.`);
      writeDb(db);
      return send(res, 201, request);
    }
    if (method === 'POST' && p.startsWith('/api/admin/institute-requests/') && p.endsWith('/approve')) {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const id = p.split('/')[4];
      const request = db.instituteRequests.find(r => r.id === id);
      if (!request) return bad(res, 'Request not found', 404);
      request.status = 'APPROVED';
      writeDb(db);
      return send(res, 200, request);
    }
    if (method === 'POST' && p.startsWith('/api/admin/institute-requests/') && p.endsWith('/convert')) {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const id = p.split('/')[4];
      const body = await parseBody(req);
      const request = db.instituteRequests.find(r => r.id === id);
      if (!request) return bad(res, 'Request not found', 404);
      const inst = buildInstituteFromBody({ instituteName: request.instituteName, name: request.instituteName, email: request.email, phone: request.phone, category: request.category, ...body, status: body.status || 'ACTIVE' });
      db.institutes.unshift(inst);
      const ownerEmail = body.ownerEmail || request.email;
      if (!db.users.some(u => u.email === ownerEmail)) {
        db.users.unshift({ id: uid('u-inst'), name: body.ownerName || `${inst.shortName} Owner`, email: ownerEmail, phone: request.phone || '', role: 'INSTITUTE_OWNER', status: 'ACTIVE', password: body.password || 'demo123', instituteId: inst.id });
      }
      request.status = 'CONVERTED';
      request.convertedInstituteId = inst.id;
      writeDb(db);
      return send(res, 201, inst);
    }
    if (method === 'POST' && p === '/api/admin/institutes') {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const body = await parseBody(req);
      if (!body.name || !body.email) return bad(res, 'Institute name and email are required');
      if (db.institutes.some(i => i.email === body.email || i.name.toLowerCase() === String(body.name).toLowerCase())) return bad(res, 'Institute already exists');
      const inst = buildInstituteFromBody(body);
      db.institutes.unshift(inst);
      if (body.ownerEmail && !db.users.some(u => u.email === body.ownerEmail)) {
        db.users.unshift({ id: uid('u-inst'), name: body.ownerName || `${inst.shortName} Owner`, email: body.ownerEmail, phone: body.phone || '', role: 'INSTITUTE_OWNER', status: 'ACTIVE', password: body.password || 'demo123', instituteId: inst.id });
      }
      writeDb(db);
      return send(res, 201, inst);
    }
    if (method === 'PUT' && p.startsWith('/api/admin/institutes/')) {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const id = p.split('/').pop();
      const body = await parseBody(req);
      const inst = db.institutes.find(i => i.id === id);
      if (!inst) return bad(res, 'Institute not found', 404);
      const allowed = ['name','shortName','email','phone','whatsapp','website','status','accountType','plan','image','description','longDescription','featuredFreeCourses','facilities','category','rating'];
      allowed.forEach(k => { if (body[k] !== undefined) inst[k] = body[k]; });
      db.courses.forEach(c => { if (c.instituteId === inst.id) c.institute = inst.shortName || inst.name; });
      writeDb(db);
      return send(res, 200, inst);
    }
    if (method === 'POST' && p.startsWith('/api/admin/institutes/') && p.endsWith('/toggle-status')) {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const id = p.split('/')[4];
      const inst = db.institutes.find(i => i.id === id);
      if (!inst) return bad(res, 'Institute not found', 404);
      inst.status = inst.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
      db.users.forEach(u => { if (u.instituteId === id) u.status = inst.status === 'ACTIVE' ? 'ACTIVE' : 'BLOCKED'; });
      writeDb(db);
      return send(res, 200, inst);
    }
    if (method === 'POST' && p === '/api/admin/users') {
      const admin = requireUser(req, res, db, ['ADMIN']);
      if (!admin) return;
      const body = await parseBody(req);
      if (!body.name || !body.email || !body.role) return bad(res, 'Name, email, and role are required');
      if (db.users.some(u => u.email === body.email)) return bad(res, 'Email already exists');
      const user = { id: uid('u'), name: body.name, email: body.email, phone: body.phone || '', role: body.role, status: body.status || 'ACTIVE', password: body.password || 'demo123' };
      if (body.role === 'INSTITUTE_OWNER') user.instituteId = body.instituteId || null;
      if (body.role === 'COUNSELOR') {
        const counselor = { id: uid('coun'), name: body.name, image: body.image || '/assets/gallery-2.svg', focus: body.focus || 'Career Guidance', languages: ['English'], bio: body.bio || 'Career counselor profile created by admin.', qualification: body.qualification || 'Qualified Counselor', status: 'PUBLISHED', slots: [] };
        db.counselors.unshift(counselor);
        user.counselorId = counselor.id;
      }
      if (body.role === 'STUDENT') user.profile = { educationLevel: '', district: '', interests: [], careerGoal: '', completion: 30 };
      db.users.unshift(user);
      writeDb(db);
      return send(res, 201, safeUser(user));
    }
    if (method === 'PUT' && p.startsWith('/api/admin/users/')) {
      const admin = requireUser(req, res, db, ['ADMIN']);
      if (!admin) return;
      const id = p.split('/').pop();
      const body = await parseBody(req);
      const user = db.users.find(u => u.id === id);
      if (!user) return bad(res, 'User not found', 404);
      ['name','email','phone','role','status','instituteId'].forEach(k => { if (body[k] !== undefined) user[k] = body[k]; });
      if (body.password) user.password = body.password;
      writeDb(db);
      return send(res, 200, safeUser(user));
    }
    if (method === 'POST' && p.startsWith('/api/admin/users/') && p.endsWith('/toggle-status')) {
      const admin = requireUser(req, res, db, ['ADMIN']);
      if (!admin) return;
      const id = p.split('/')[4];
      const user = db.users.find(u => u.id === id);
      if (!user) return bad(res, 'User not found', 404);
      user.status = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
      writeDb(db);
      return send(res, 200, safeUser(user));
    }
    if (method === 'POST' && p === '/api/admin/courses') {
      const admin = requireUser(req, res, db, ['ADMIN']);
      if (!admin) return;
      const body = await parseBody(req);
      const inst = db.institutes.find(i => i.id === body.instituteId);
      if (!inst) return bad(res, 'Institute is required');
      if (!body.title || !body.category) return bad(res, 'Title and category are required');
      const course = buildCourseFromBody(body, inst);
      db.courses.unshift(course);
      writeDb(db);
      return send(res, 201, course);
    }
    if (method === 'PUT' && p.startsWith('/api/admin/courses/')) {
      const admin = requireUser(req, res, db, ['ADMIN']);
      if (!admin) return;
      const id = p.split('/').pop();
      const body = await parseBody(req);
      const course = db.courses.find(c => c.id === id);
      if (!course) return bad(res, 'Course not found', 404);
      let inst = db.institutes.find(i => i.id === course.instituteId);
      if (body.instituteId) {
        const newInst = db.institutes.find(i => i.id === body.instituteId);
        if (newInst) { course.instituteId = newInst.id; inst = newInst; }
      }
      updateCourseFromBody(course, body, inst);
      writeDb(db);
      return send(res, 200, course);
    }
    if (method === 'DELETE' && p.startsWith('/api/admin/courses/')) {
      const admin = requireUser(req, res, db, ['ADMIN']);
      if (!admin) return;
      const id = p.split('/').pop();
      db.courses = db.courses.filter(c => c.id !== id);
      writeDb(db);
      return send(res, 200, { ok: true });
    }
    if (method === 'POST' && p.startsWith('/api/admin/inquiries/') && p.endsWith('/resolve')) {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const id = p.split('/')[4];
      const inquiry = db.inquiries.find(i => i.id === id);
      if (!inquiry) return bad(res, 'Inquiry not found', 404);
      inquiry.status = 'RESOLVED';
      inquiry.resolvedAt = new Date().toISOString();
      writeDb(db);
      return send(res, 200, inquiry);
    }
    if (method === 'POST' && p === '/api/admin/videos') {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const body = await parseBody(req);
      if (!body.title || !body.videoUrl) return bad(res, 'Title and video URL are required');
      const courseIds = body.courseId ? [body.courseId] : (Array.isArray(body.courseIds) ? body.courseIds : []);
      const video = { id: uid('vid'), title: body.title, category: body.category || 'Platform', scope: body.scope || 'PUBLIC', ownerType: body.ownerType || 'PLATFORM', ownerId: body.ownerId || 'platform', instituteId: body.instituteId || '', counselorId: body.counselorId || '', courseIds, thumbnail: body.thumbnail || '/assets/video-platform-tour.png', description: body.description || '', videoUrl: body.videoUrl, status: body.status || 'PUBLISHED', featured: Boolean(body.featured), views: 0, createdAt: new Date().toISOString() };
      db.videos.unshift(video);
      writeDb(db);
      return send(res, 201, video);
    }
    if (method === 'PUT' && p.startsWith('/api/admin/videos/')) {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const id = p.split('/').pop();
      const body = await parseBody(req);
      const video = db.videos.find(v => v.id === id);
      if (!video) return bad(res, 'Video not found', 404);
      ['title','category','scope','ownerType','ownerId','instituteId','counselorId','thumbnail','description','videoUrl','status'].forEach(k => { if (body[k] !== undefined) video[k] = body[k]; });
      if (body.courseId !== undefined) video.courseIds = body.courseId ? [body.courseId] : [];
      if (body.featured !== undefined) video.featured = Boolean(body.featured);
      writeDb(db);
      return send(res, 200, video);
    }
    if (method === 'DELETE' && p.startsWith('/api/admin/videos/')) {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const id = p.split('/').pop();
      db.videos = db.videos.filter(v => v.id !== id);
      writeDb(db);
      return send(res, 200, { ok: true });
    }

    if (method === 'POST' && p.startsWith('/api/admin/articles/') && p.endsWith('/approve')) {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const id = p.split('/')[4];
      const article = db.articles.find(a => a.id === id);
      if (!article) return bad(res, 'Article not found', 404);
      article.status = 'PUBLISHED';
      writeDb(db);
      return send(res, 200, article);
    }
    if (method === 'POST' && p.startsWith('/api/admin/feedback/') && p.endsWith('/approve')) {
      const user = requireUser(req, res, db, ['ADMIN']);
      if (!user) return;
      const id = p.split('/')[4];
      const feedback = db.feedback.find(f => f.id === id);
      if (!feedback) return bad(res, 'Feedback not found', 404);
      feedback.status = 'PUBLISHED';
      writeDb(db);
      return send(res, 200, feedback);
    }

    return bad(res, 'API route not found', 404);
  } catch (err) {
    console.error(err);
    return bad(res, err.message || 'Server error', 500);
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return handleApi(req, res);
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`FM Connect full-stack v7 real demo UI running at http://localhost:${PORT}`);
});
