const app = document.getElementById('app');
let currentToken = localStorage.getItem('fm_token_v2') || '';
let currentUser = null;
const state = { query: '', category: 'All', location: 'All', courseType: 'All', studyMode: 'All', cost: 'All', duration: 'All', institute: 'All', sponsored: 'All', sort: 'relevance', tab: 'overview', instituteTab: 'overview', courseTab: 'about' };

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
function roleName(role) { return ({ STUDENT:'Student', INSTITUTE_OWNER:'Institute', COUNSELOR:'Counselor', ADMIN:'Admin' })[role] || 'User'; }
function pill(label, tone = 'blue') { return `<span class="pill ${tone}">${esc(label)}</span>`; }
function statusPill(status) {
  const tone = status === 'ACTIVE' || status === 'PUBLISHED' || status === 'RESOLVED' ? 'green' : status === 'BLOCKED' || status === 'REJECTED' || status === 'DISABLED' ? 'red' : 'amber';
  return pill(status || 'N/A', tone);
}

function stars(value = 4.8) {
  const rounded = Math.max(1, Math.min(5, Math.round(Number(value || 4.8))));
  return `<span class="stars">${'★'.repeat(rounded)}${'☆'.repeat(5-rounded)}</span>`;
}
function firstWords(value, count = 20) {
  const words = String(value || '').split(/\s+/).filter(Boolean);
  return words.length > count ? `${words.slice(0, count).join(' ')}...` : words.join(' ');
}
function listItems(items = [], icon = '✓') {
  return (items || []).map(item => `<li><span>${esc(icon)}</span>${esc(item)}</li>`).join('');
}
function smallMetric(label, value, icon = '•') {
  return `<div class="mini-metric"><span class="mini-icon">${esc(icon)}</span><div><strong>${esc(value)}</strong><small>${esc(label)}</small></div></div>`;
}
function playOverlay() { return `<span class="play-circle">▶</span>`; }
function img(src, alt, cls = 'card-image') { return `<img class="${esc(cls)}" src="${esc(src || '/assets/gallery-1.svg')}" alt="${esc(alt || '')}" />`; }
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
  const logged = !!currentUser;
  return `
    <header class="header">
      <div class="container header-inner">
        <a href="#home" class="brand">
          <img src="/assets/logo.svg" class="brand-logo" alt="FM Connect" />
          <div><div class="brand-name">FM Connect</div><div class="brand-tag">Where futures take shape</div></div>
        </a>
        <nav class="nav">
          ${navLink('home','Home',top)}
          ${navLink('institutes','Institutes',top)}
          ${navLink('explore','Courses',top)}
          ${navLink('counseling','Counseling',top)}
          ${navLink('videos','Videos',top)}
          ${navLink('articles','Resources',top)}
          ${navLink('contact','Contact Us',top)}
          ${logged ? navLink('dashboard',`${roleName(currentUser.role)} Dashboard`,top) : ''}
        </nav>
        <div class="header-actions">
          <a class="icon-btn" href="#explore" title="Search">⌕</a>
          ${logged ? `<a class="btn btn-outline btn-small" href="#notifications">🔔</a><a class="btn btn-outline btn-small" href="#profile">${esc(currentUser.name)}</a><button class="btn btn-dark btn-small" id="logoutBtn">Logout</button>` : `<a class="btn btn-outline btn-small" href="#login">Login</a><a class="btn btn-primary btn-small" href="#signup">Sign Up Free</a>`}
        </div>
      </div>
    </header>`;
}
function navLink(key, label, active) { return `<a class="nav-link ${active === key ? 'active' : ''}" href="#${key}">${esc(label)}</a>`; }
function footer() {
  return `<footer class="footer">
    <div class="container footer-help">
      <div><h3>Have Questions? We’re Here to Help!</h3><p>Connect with our team for course, institute, counseling, sponsorship, and partnership inquiries.</p></div>
      <a class="btn btn-light" href="#contact">Contact Us</a>
    </div>
    <div class="container footer-grid">
      <div><img src="/assets/logo.svg" class="footer-logo" alt="FM Connect"/><p>FM Connect is Sri Lanka’s trusted education platform connecting students with the right opportunities and brighter futures.</p><div class="socials"><span>f</span><span>◎</span><span>▶</span><span>in</span></div></div>
      <div><h4>Explore</h4><a href="#institutes">Institutes</a><a href="#explore">Courses</a><a href="#videos">Videos</a><a href="#articles">Resources</a></div>
      <div><h4>Support</h4><a href="#contact">Contact Us</a><a href="#counseling">Counseling</a><a href="#articles">Articles</a><a href="#login">Login</a></div>
      <div><h4>For Institutes</h4><a href="#institute-register">Partner With Us</a><a href="#login">Institute Login</a><p class="muted">Upload courses, banners, images, and videos from the institute dashboard.</p></div>
    </div>
    <div class="footer-bottom">© 2026 FM Connect. All Rights Reserved. <span>Made with ❤️ in Sri Lanka</span></div>
  </footer>`;
}
function layout(content) {
  app.innerHTML = `${header()}<main>${content}</main>${footer()}`;
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
}
function stat(label, value, note = '', icon = '•') { return `<div class="card stat-card"><div class="stat-icon">${esc(icon)}</div><div><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(value)}</div><div class="muted">${esc(note)}</div></div></div>`; }
function sectionHead(title, subtitle = '', link = '') { return `<div class="section-head"><div><h2>${esc(title)}</h2>${subtitle ? `<p class="muted">${esc(subtitle)}</p>` : ''}</div>${link || ''}</div>`; }
function courseCard(c) {
  return `<article class="card course-card premium-card">
    <div class="media-wrap">${img(c.image, c.title)}<div class="media-badges">${c.isFree ? pill('Free Course','green') : pill(c.type,'blue')}${c.sponsored ? pill('Sponsored','amber') : ''}</div></div>
    <div class="card-body">
      <p class="eyebrow">${esc(c.institute)} • ${esc(c.category)}</p>
      <h3>${esc(c.title)}</h3>
      <p>${esc(firstWords(c.description, 19))}</p>
      <div class="rating-line">${stars(c.rating)} <span>${esc(c.rating || '4.8')} rating</span></div>
      <div class="meta-grid"><div><span class="meta-label">Duration</span><strong>${esc(c.duration)}</strong></div><div><span class="meta-label">Fee</span><strong>${esc(money(c.price,c.currency))}</strong></div></div>
      <div class="chips mt-2">${(c.skills || []).slice(0,3).map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
      <div class="card-footer"><a class="btn btn-outline" href="#course/${esc(c.slug)}">View Details</a><button class="btn btn-primary" data-lead="INTERESTED" data-course="${esc(c.id)}">Enquire</button></div>
    </div>
  </article>`;
}
function instituteCard(i) {
  return `<article class="card institute-card premium-card">
    <div class="media-wrap">${img(i.image, i.name)}<div class="institute-logo-mark">${esc(i.shortName || 'FM')}</div></div>
    <div class="card-body">
      <div class="card-tags">${i.accountType === 'SPONSORED' ? pill(i.plan,'amber') : pill(i.plan || 'Standard','blue')}${pill(`${i.freeCoursesCount || 0} free courses`,'green')}</div>
      <h3>${esc(i.name)}</h3>
      <p class="muted">${esc(i.category)} • ${esc(i.rating || '4.7')} rating</p>
      <p>${esc(firstWords(i.description, 22))}</p>
      <div class="mini-row">${smallMetric('Courses', String(i.courses?.length || i.courses || 0), '🎓')}${smallMetric('Students', `${Math.round((i.visits || 9500)/100)/10}k+`, '👥')}</div>
      <div class="card-footer"><a class="btn btn-outline" href="#institute/${esc(i.slug)}">View Institute</a><a class="btn btn-primary" href="#contact">Contact</a></div>
    </div>
  </article>`;
}
function videoCard(v, manageButtons = '') {
  const videoUrl = v.videoUrl || '#';
  const thumb = v.thumbnail || '/assets/video-platform-tour.png';
  return `<article class="card video-card premium-card">
    <a href="${esc(videoUrl)}" target="_blank" rel="noreferrer" class="video-thumb">${img(thumb, v.title)}${playOverlay()}<span class="duration">${esc(v.duration || '2:45')}</span></a>
    <div class="card-body"><div class="card-tags">${pill(v.category || 'Video','blue')}${v.featured ? pill('Featured','amber') : ''}${statusPill(v.status || 'PUBLISHED')}</div><h3>${esc(v.title)}</h3><p>${esc(firstWords(v.description || '', 18))}</p><p class="muted">${esc(v.ownerType || 'PLATFORM')} video • ${esc(v.views || 0)} views</p><div class="card-footer"><a class="btn btn-primary" href="${esc(videoUrl)}" target="_blank" rel="noreferrer">Watch Video</a>${manageButtons}</div></div>
  </article>`;
}
function inquirySection(contact = {}) {
  return `<section class="section contact-section" id="contact-us-section">
    <div class="container contact-panel">
      <div class="contact-copy">
        <p class="eyebrow orange">Contact Us</p>
        <h2>Have questions? We are here to help.</h2>
        <p>Reach out to us for any inquiries about courses, admissions, institute partnerships, videos, counseling, or Future Minds events.</p>
        <div class="contact-methods">
          ${smallMetric('Call Us', contact.phone || '+94 71 545 0000', '☎')}
          ${smallMetric('Email Us', contact.email || 'info@futureminds.lk', '✉')}
          ${smallMetric('Visit Us', contact.address || 'Colombo, Sri Lanka', '📍')}
        </div>
      </div>
      <div class="card form-card contact-form-card">
        <h3>Send us a message</h3>
        <form id="inquiryForm" class="form-grid two-col">
          <label>Name<input name="name" required placeholder="Your name" /></label>
          <label>Email<input name="email" type="email" required placeholder="Your email" /></label>
          <label>Phone<input name="phone" placeholder="Mobile number" /></label>
          <label>Subject<input name="subject" required placeholder="Course / Institute / Partnership" /></label>
          <label class="full">Message<textarea name="message" required placeholder="Write your message..."></textarea></label>
          <button class="btn btn-primary">Send Message</button>
        </form>
      </div>
    </div>
  </section>`;
}
async function homePage() {
  const data = await api('/api/public/home');
  const topCourses = data.courses.slice(0, 4);
  const topInstitutes = data.institutes.slice(0, 4);
  const videos = (data.videos || []).slice(0, 4);
  const feedback = (data.feedback || []).slice(0, 3);
  const counselor = (data.counselors || [])[0] || {};
  const banner = data.banners?.[0] || { image:'/assets/hero-futureminds-campus.png' };
  const categories = ['All', ...new Set(data.courses.map(c => c.category))];
  return `<section class="home-hero" style="--hero-image:url('${esc(banner.image)}')">
    <div class="hero-overlay"></div>
    <div class="container home-hero-inner">
      <div class="hero-copy">
        <p class="eyebrow">Trusted Institutes • Expert Guidance • Bright Futures</p>
        <h1>Where Futures <span>Take Shape</span></h1>
        <p>Find the right degree, course, institute, scholarship, video content, and career guidance to achieve your dreams.</p>
        <div class="hero-actions"><a class="btn btn-primary" href="#explore">Explore Courses</a><a class="btn btn-light" href="#counseling">Book Counseling</a></div>
      </div>
      <form id="searchForm" class="hero-search-card">
        <div class="search-tabs"><span class="active">🔎 Courses, degrees & institutes</span></div>
        <div class="hero-search-grid"><input name="q" value="${esc(state.query)}" placeholder="Search courses, institutes or keywords..."/><select name="category">${categories.map(c => `<option ${state.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select><select name="location"><option ${state.location === 'All' ? 'selected' : ''}>All</option><option ${state.location === 'Colombo' ? 'selected' : ''}>Colombo</option><option ${state.location === 'Malabe' ? 'selected' : ''}>Malabe</option><option ${state.location === 'Online' ? 'selected' : ''}>Online</option></select><select name="courseType"><option ${state.courseType === 'All' ? 'selected' : ''}>All</option><option ${state.courseType === 'Degree' ? 'selected' : ''}>Degree</option><option ${state.courseType === 'Diploma' ? 'selected' : ''}>Diploma</option><option ${state.courseType === 'Certificate' ? 'selected' : ''}>Certificate</option><option ${state.courseType === 'Short Course' ? 'selected' : ''}>Short Course</option></select><button class="btn btn-primary">Search</button></div>
      </form>
    </div>
  </section>
  <section class="section"><div class="container">${sectionHead('Featured Institutes','Explore trusted education partners and institute profiles.','<a href="#institutes" class="text-link">View all institutes →</a>')}<div class="grid grid-4">${topInstitutes.map(instituteCard).join('')}</div></div></section>
  <section class="section pt-0"><div class="container">${sectionHead('Featured Degrees & Courses','Sponsored courses, degrees, certificates, free courses, and online options.','<a href="#explore" class="text-link">View all courses →</a>')}<div class="section-note">Showing featured programs across degrees, diplomas, certificates, short courses, and free learning options.</div><div class="grid grid-4">${topCourses.map(courseCard).join('')}</div></div></section>
  <section class="stats-band"><div class="container stats-band-grid">${smallMetric('Trusted Institutes', `${data.institutes.length * 80}+`, '🏛')}${smallMetric('Courses & Programs', `${data.courses.length * 420}+`, '🎓')}${smallMetric('Free Courses', `${data.courses.filter(c=>c.isFree).length * 120}+`, '▶')}${smallMetric('Student Registrations', '125,000+', '👥')}</div></section>
  <section class="section"><div class="container">${sectionHead('Video Highlights','Campus tours, course explainers, career guidance, and institute videos.','<a href="#videos" class="text-link">View all videos →</a>')}<div class="grid grid-4">${videos.map(videoCard).join('')}</div></div></section>
  <section class="section section-soft"><div class="container counseling-feature"><div><p class="eyebrow orange">Expert Guidance</p><h2>Career counseling that makes a difference</h2><p>Get personalized guidance from experienced counselors and make confident decisions about your future.</p><ul class="feature-list"><li><span>✓</span>One-on-one expert sessions</li><li><span>✓</span>University and course selection</li><li><span>✓</span>Career path and aptitude guidance</li></ul><a class="btn btn-primary" href="#counseling">Book a Session</a></div><div class="counselor-photo"><img src="${esc(counselor.image || '/assets/counselor-career-guidance.png')}" alt="Career counselor"/></div><div class="card form-card available-card"><h3>Available This Week</h3>${(counselor.slots || []).slice(0,3).map(s => `<div class="slot-item"><div><b>${esc(s.date)}</b><div class="muted">${esc(s.time)} • ${esc(s.mode)}</div></div><a class="btn btn-outline btn-small" href="#counseling">Book</a></div>`).join('') || '<p>Slots will be available soon.</p>'}<a class="text-link" href="#counseling">View more slots →</a></div></div></section>
  <section class="section"><div class="container">${sectionHead('What Students Say','Community feedback and trust signals.')}<div class="grid grid-3">${feedback.map(f => `<div class="card testimonial-card"><p>“${esc(f.description)}”</p><div><strong>${esc(f.user)}</strong><div>${stars(f.rating || 5)}</div></div></div>`).join('') || '<div class="card testimonial-card"><p>“FM Connect helped me compare institutes, watch videos, and submit my course request quickly.”</p><strong>Student User</strong><div>${stars(5)}</div></div>'}</div></div></section>
  ${inquirySection(data.contactSettings || {})}`;
}
function courseLocation(c, instituteMap = {}) {
  return c.location || instituteMap[c.instituteId]?.location || instituteMap[c.instituteId]?.city || 'Colombo';
}
function durationMonths(value = '') {
  const text = String(value || '').toLowerCase();
  const number = Number((text.match(/\d+(\.\d+)?/) || ['0'])[0]);
  if (text.includes('year')) return number * 12;
  if (text.includes('month')) return number;
  if (text.includes('week')) return Math.max(1, Math.ceil(number / 4));
  if (text.includes('hour') || text.includes('day')) return 1;
  return number || 0;
}
function costMatches(price, bucket) {
  const p = Number(price || 0);
  if (!bucket || bucket === 'All') return true;
  if (bucket === 'Free') return p === 0;
  if (bucket === 'Under 100,000') return p > 0 && p < 100000;
  if (bucket === '100,000 - 250,000') return p >= 100000 && p <= 250000;
  if (bucket === '250,000 - 500,000') return p > 250000 && p <= 500000;
  if (bucket === '500,000+') return p > 500000;
  return true;
}
function durationMatches(months, bucket) {
  if (!bucket || bucket === 'All') return true;
  if (bucket === 'Short / Under 1 month') return months <= 1;
  if (bucket === '1 - 6 months') return months > 1 && months <= 6;
  if (bucket === '6 - 12 months') return months > 6 && months <= 12;
  if (bucket === '1 - 3 years') return months > 12 && months <= 36;
  if (bucket === '3+ years') return months > 36;
  return true;
}
function sortCourseResults(courses, sortBy) {
  const list = [...courses];
  if (sortBy === 'priceLow') return list.sort((a,b) => Number(a.price || 0) - Number(b.price || 0));
  if (sortBy === 'priceHigh') return list.sort((a,b) => Number(b.price || 0) - Number(a.price || 0));
  if (sortBy === 'rating') return list.sort((a,b) => Number(b.rating || 0) - Number(a.rating || 0));
  if (sortBy === 'durationShort') return list.sort((a,b) => durationMonths(a.duration) - durationMonths(b.duration));
  if (sortBy === 'newest') return list.sort((a,b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
  return list.sort((a,b) => Number(b.sponsored || 0) - Number(a.sponsored || 0) || Number(b.views || 0) - Number(a.views || 0));
}
function optionList(items, selected) {
  return items.map(item => `<option ${selected === item ? 'selected' : ''}>${esc(item)}</option>`).join('');
}
function activeFilterChips() {
  const chips = [];
  if (state.query) chips.push(`Keyword: ${state.query}`);
  if (state.category !== 'All') chips.push(`Category: ${state.category}`);
  if (state.location !== 'All') chips.push(`Location: ${state.location}`);
  if (state.courseType !== 'All') chips.push(`Type: ${state.courseType}`);
  if (state.studyMode !== 'All') chips.push(`Study mode: ${state.studyMode}`);
  if (state.cost !== 'All') chips.push(`Cost: ${state.cost}`);
  if (state.duration !== 'All') chips.push(`Duration: ${state.duration}`);
  if (state.institute !== 'All') chips.push(`Institute: ${state.institute}`);
  if (state.sponsored !== 'All') chips.push(`Listing: ${state.sponsored}`);
  return chips.length ? `<div class="active-filter-chips">${chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>` : '';
}
async function explorePage() {
  const all = await api('/api/public/courses');
  const institutes = await api('/api/public/institutes');
  const instituteMap = Object.fromEntries(institutes.map(i => [i.id, i]));
  const categories = ['All', ...new Set(all.map(c => c.category).filter(Boolean))];
  const locations = ['All', ...new Set(all.map(c => courseLocation(c, instituteMap)).filter(Boolean))];
  const courseTypes = ['All', ...new Set(all.map(c => c.type).filter(Boolean))];
  const studyModes = ['All', ...new Set(all.map(c => c.studyMode).filter(Boolean))];
  const instituteNames = ['All', ...institutes.map(i => i.name)];
  const costOptions = ['All', 'Free', 'Under 100,000', '100,000 - 250,000', '250,000 - 500,000', '500,000+'];
  const durationOptions = ['All', 'Short / Under 1 month', '1 - 6 months', '6 - 12 months', '1 - 3 years', '3+ years'];
  const sponsoredOptions = ['All', 'Sponsored only', 'Regular only'];
  const sortOptions = [{v:'relevance',l:'Best match'}, {v:'rating',l:'Highest rating'}, {v:'priceLow',l:'Lowest cost'}, {v:'priceHigh',l:'Highest cost'}, {v:'durationShort',l:'Shortest duration'}, {v:'newest',l:'Newest intake'}];
  const q = String(state.query || '').toLowerCase().trim();
  let courses = all.filter(c => {
    const inst = instituteMap[c.instituteId] || {};
    const haystack = [c.title, c.description, c.overview, c.category, c.type, c.institute, inst.name, ...(c.skills || []), ...(c.relatedJobs || [])].join(' ').toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (state.category !== 'All' && c.category !== state.category) return false;
    if (state.location !== 'All' && courseLocation(c, instituteMap) !== state.location) return false;
    if (state.courseType !== 'All' && c.type !== state.courseType) return false;
    if (state.studyMode !== 'All' && c.studyMode !== state.studyMode) return false;
    if (state.institute !== 'All' && c.institute !== state.institute && inst.name !== state.institute) return false;
    if (state.sponsored === 'Sponsored only' && !c.sponsored) return false;
    if (state.sponsored === 'Regular only' && c.sponsored) return false;
    if (!costMatches(c.price, state.cost)) return false;
    if (!durationMatches(durationMonths(c.duration), state.duration)) return false;
    return true;
  });
  courses = sortCourseResults(courses, state.sort);
  const freeCount = courses.filter(c => c.isFree || Number(c.price || 0) === 0).length;
  const sponsoredCount = courses.filter(c => c.sponsored).length;
  return `<section class="page-hero small"><div class="container"><p class="eyebrow">Course Discovery</p><h1>Find the right course faster</h1><p class="muted">Use richer filters to compare programs by location, cost, duration, study mode, institute, and course type.</p><form id="searchForm" class="advanced-filter-bar"><label class="filter-wide">Search<input name="q" value="${esc(state.query)}" placeholder="Search courses, institutes, careers or keywords..."/></label><label>Category<select name="category">${optionList(categories, state.category)}</select></label><label>Location<select name="location">${optionList(locations, state.location)}</select></label><label>Type<select name="courseType">${optionList(courseTypes, state.courseType)}</select></label><label>Study mode<select name="studyMode">${optionList(studyModes, state.studyMode)}</select></label><label>Cost<select name="cost">${optionList(costOptions, state.cost)}</select></label><label>Duration<select name="duration">${optionList(durationOptions, state.duration)}</select></label><label>Institute<select name="institute">${optionList(instituteNames, state.institute)}</select></label><label>Listing<select name="sponsored">${optionList(sponsoredOptions, state.sponsored)}</select></label><label>Sort by<select name="sort">${sortOptions.map(o => `<option value="${esc(o.v)}" ${state.sort === o.v ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select></label><div class="filter-actions"><button class="btn btn-primary">Apply Filters</button><button class="btn btn-outline" type="button" id="clearFilters">Reset</button></div></form>${activeFilterChips()}</div></section><section class="section"><div class="container"><div class="results-toolbar"><div><h2>${courses.length} course${courses.length === 1 ? '' : 's'} found</h2><p class="muted">${freeCount} free course${freeCount === 1 ? '' : 's'} • ${sponsoredCount} sponsored result${sponsoredCount === 1 ? '' : 's'}</p></div><a href="#contact" class="btn btn-outline">Need help choosing?</a></div><div class="grid grid-3">${courses.map(courseCard).join('') || '<div class="card form-card"><h3>No courses found</h3><p class="muted">Try clearing filters or changing the keyword.</p><button class="btn btn-primary" id="clearFilters">Reset filters</button></div>'}</div></div></section>`;
}
async function institutesPage() {
  const items = await api('/api/public/institutes');
  return `<section class="page-hero small"><div class="container"><p class="eyebrow">Partner Institutes</p><h1>Universities and education institutes</h1><p class="muted">Browse institute profiles, images, videos, free courses, and admission contact details.</p></div></section><section class="section"><div class="container grid grid-3">${items.map(instituteCard).join('')}</div></section>`;
}
async function institutePage(slug) {
  const i = await api(`/api/public/institutes/${encodeURIComponent(slug)}`);
  const allVideos = await api('/api/public/videos');
  const instVideos = allVideos.filter(v => v.instituteId === i.id || v.ownerId === i.id || v.ownerType === 'PLATFORM').slice(0, 4);
  const gallery = i.gallery && i.gallery.length ? i.gallery : [i.image, '/assets/real-campus-walk.jpg', '/assets/real-counselor.jpg'];
  const tab = state.instituteTab || 'overview';
  const tabButtons = [
    ['overview','Overview'], ['programs','Courses'], ['gallery','Gallery'], ['videos','Videos'], ['admissions','Admissions'], ['reviews','Reviews'], ['contact','Contact']
  ].map(([key,label]) => `<button class="profile-tab ${tab === key ? 'active' : ''}" data-inst-tab="${key}">${label}</button>`).join('');
  let tabContent = '';
  if (tab === 'programs') {
    tabContent = `<section class="section section-soft"><div class="container">${sectionHead('Courses and Degrees','Programs offered by this institute.','<a href="#explore" class="text-link">View all courses →</a>')}<div class="grid grid-2">${(i.courses || []).map(courseCard).join('') || '<p>No published courses yet.</p>'}</div></div></section>`;
  } else if (tab === 'gallery') {
    tabContent = `<section class="section"><div class="container">${sectionHead('Image Gallery','Campus, classroom, lab and student-life photos.')}<div class="gallery-grid-large">${gallery.map(g => `<img src="${esc(g)}" alt="${esc(i.name)} gallery"/>`).join('')}</div></div></section>`;
  } else if (tab === 'videos') {
    tabContent = `<section class="section section-soft"><div class="container">${sectionHead('Institute Videos','Campus tour, student life, admissions guidance and program explainers.','<a class="text-link" href="#videos">View all videos →</a>')}<div class="grid grid-3">${instVideos.map(videoCard).join('') || '<p>No videos yet.</p>'}</div></div></section>`;
  } else if (tab === 'admissions') {
    tabContent = `<section class="section"><div class="container detail-grid"><div class="card form-card"><h3>Admissions and upcoming intakes</h3><div class="grid grid-2"><div class="module-card"><span>Upcoming Intake</span><h4>July 2026 Intake</h4><p class="muted">Applications open for selected programs. Students can submit an inquiry or apply from course pages.</p></div><div class="module-card"><span>Open Day</span><h4>24 May 2026</h4><p class="muted">Campus tour, program information session, and counseling guidance.</p></div></div><div class="button-row"><a class="btn btn-primary" href="#explore">Apply for a Course</a><a class="btn btn-outline" href="#contact">Ask Admission Question</a></div></div><aside class="card form-card"><h3>Admission Support</h3><p>FM Connect can connect students with institute teams for program details, entry requirements, and scholarship options.</p><a class="btn btn-primary" href="#contact">Submit Inquiry</a></aside></div></section>`;
  } else if (tab === 'reviews') {
    tabContent = `<section class="section section-soft"><div class="container">${sectionHead('Student Success Stories','Demo reviews shown for presentation purposes.')}<div class="grid grid-3"><div class="card testimonial-card"><p>“The platform helped me compare programs and select the right path.”</p><strong>Ananya Deshapande</strong><div>${stars(5)}</div></div><div class="card testimonial-card"><p>“The campus information and videos made it easy to understand the institute.”</p><strong>Rohit Sharma</strong><div>${stars(5)}</div></div><div class="card testimonial-card"><p>“I submitted an inquiry and received clear guidance for my next intake.”</p><strong>Sneha Patil</strong><div>${stars(5)}</div></div></div></div></section>`;
  } else if (tab === 'contact') {
    tabContent = `<section class="section"><div class="container detail-grid"><div class="card form-card"><h3>Contact ${esc(i.shortName || i.name)}</h3><p><b>Phone:</b> ${esc(i.phone || '+94 71 545 0000')}</p><p><b>Email:</b> ${esc(i.email || 'info@futureminds.lk')}</p><p><b>Website:</b> ${esc(i.website || '#')}</p><p><b>WhatsApp:</b> ${esc(i.whatsapp || i.phone || '+94 71 545 0000')}</p><a class="btn btn-primary" href="#contact">Submit Contact Us Message</a></div><aside class="card form-card"><h3>Need help choosing?</h3><p>Book a counseling session and get guidance before you apply.</p><a class="btn btn-outline" href="#counseling">Book Counseling</a></aside></div></section>`;
  } else {
    tabContent = `<section class="section"><div class="container detail-grid"><div><div class="card form-card profile-overview"><h3>About ${esc(i.shortName || i.name)}</h3><p>${esc(i.longDescription || i.description)}</p><div class="overview-columns"><div><h4>Facilities</h4><ul class="feature-list">${listItems(i.facilities || ['Modern labs','Career services','Student support'])}</ul></div><div><h4>Popular Fields</h4><div class="chips">${['Engineering','Business','Computing','Design','Sciences'].map(x => `<span class="chip">${x}</span>`).join('')}</div><h4>Scholarships</h4><p class="muted">Merit-based and need-based options available.</p></div></div></div><div class="mt-2">${sectionHead('Gallery','','<button class="text-link plain-link" data-inst-tab="gallery">View all photos →</button>')}<div class="gallery-strip">${gallery.map(g => `<img src="${esc(g)}" alt="${esc(i.name)} gallery"/>`).join('')}</div></div><div class="mt-2">${sectionHead('Videos','','<button class="text-link plain-link" data-inst-tab="videos">View all videos →</button>')}<div class="grid grid-2">${instVideos.map(videoCard).join('') || '<p>No videos yet.</p>'}</div></div></div><aside class="sidebar-stack"><div class="card form-card"><h3>Contact & Inquiry</h3><p><b>Phone:</b> ${esc(i.phone || '+94 71 545 0000')}</p><p><b>Email:</b> ${esc(i.email || 'info@futureminds.lk')}</p><p><b>Website:</b> ${esc(i.website || '#')}</p><a class="btn btn-primary" href="#contact">Submit Inquiry</a></div><div class="card form-card"><h3>Next Open Day</h3><div class="open-day"><strong>24</strong><span>May 2026</span></div><p>Campus tour, program information, and counseling.</p><button class="btn btn-outline" data-inst-tab="admissions">View Admissions</button></div><div class="card form-card"><h3>Upcoming Intake</h3><p><b>July 2026 Intake</b></p><p class="muted">Applications open.</p><button class="btn btn-primary" data-inst-tab="programs">View Courses</button></div></aside></div></section>`;
  }
  return `<section class="institute-profile-hero" style="--hero-image:url('${esc(i.image)}')"><div class="container profile-hero-content"><div class="profile-logo-card"><div class="logo-text">${esc(i.shortName || 'FM')}</div></div><div><p class="eyebrow">${esc(i.category)} • ${i.accountType === 'SPONSORED' ? 'Featured Partner' : 'Partner Institute'}</p><h1>${esc(i.name)}</h1><div class="rating-line">${stars(i.rating || 4.7)} <span>${esc(i.rating || 4.7)} rating • Sri Lanka • Established education partner</span></div><div class="button-row"><button class="btn btn-primary" data-inst-tab="programs">Apply Now</button><a class="btn btn-light" href="#counseling">Book Counseling</a><button class="btn btn-outline translucent" data-inst-tab="contact">♡ Enquire</button></div></div></div></section>
  <section class="profile-metrics"><div class="container profile-metrics-grid">${smallMetric('Students', '12,500+', '👥')}${smallMetric('Courses', String(i.courses?.length || i.courses || 0), '🎓')}${smallMetric('Free Courses', String(i.freeCoursesCount || 0), '✨')}${smallMetric('Placement Focus', '98%', '📈')}</div></section>
  <section class="profile-tabs"><div class="container">${tabButtons}</div></section>
  ${tabContent}`;
}
async function coursePage(slug) {
  const c = await api(`/api/public/courses/${encodeURIComponent(slug)}`);
  const allVideos = await api('/api/public/videos');
  const courseVideos = allVideos.filter(v => (v.courseIds || []).includes(c.id) || v.courseId === c.id || (c.videos || []).includes(v.id) || v.category === c.category || v.ownerType === 'PLATFORM').slice(0, 4);
  const tab = state.courseTab || 'about';
  const tabButtons = [['about','About'], ['modules','Modules'], ['videos','Videos'], ['careers','Careers'], ['reviews','Reviews']]
    .map(([key,label]) => `<button class="profile-tab ${tab === key ? 'active' : ''}" data-course-tab="${key}">${label}</button>`).join('');
  let tabContent = '';
  if (tab === 'modules') {
    tabContent = `<section class="section"><div class="container narrow"><div class="card form-card"><h3>There are ${esc((c.modules || []).length || 4)} modules in this course</h3>${(c.modules || []).map((m, idx) => `<div class="module-card"><span>Module ${idx+1}</span><h4>${esc(m)}</h4><p class="muted">Includes videos, readings, quizzes, and practice activities.</p></div>`).join('')}</div></div></section>`;
  } else if (tab === 'videos') {
    tabContent = `<section class="section section-soft"><div class="container">${sectionHead('Course Videos','Course explainers, student experience videos, module previews, and related guidance.','<a class="text-link" href="#videos">View all videos →</a>')}<div class="grid grid-4">${courseVideos.map(videoCard).join('') || '<p>No videos yet.</p>'}</div></div></section>`;
  } else if (tab === 'careers') {
    tabContent = `<section class="section"><div class="container detail-grid"><div class="card form-card"><h3>Related career paths</h3><p>These are possible career directions linked to this course or degree.</p><div class="chips">${(c.relatedJobs || []).map(job => `<span class="chip">${esc(job)}</span>`).join('')}</div></div><aside class="card form-card"><h3>Need guidance?</h3><p>Book a counseling session before choosing your pathway.</p><a class="btn btn-primary" href="#counseling">Book Counseling</a></aside></div></section>`;
  } else if (tab === 'reviews') {
    tabContent = `<section class="section section-soft"><div class="container">${sectionHead('Student reviews','Demo reviews shown for presentation purposes.')}<div class="grid grid-3"><div class="card testimonial-card"><p>“Clear course details and helpful guidance.”</p><strong>Student Review</strong><div>${stars(5)}</div></div><div class="card testimonial-card"><p>“The video section helped me understand the program better.”</p><strong>Future Learner</strong><div>${stars(5)}</div></div><div class="card testimonial-card"><p>“Easy to send an enquiry and compare with other programs.”</p><strong>FM Connect User</strong><div>${stars(5)}</div></div></div></div></section>`;
  } else {
    tabContent = `<section class="section"><div class="container detail-grid"><div><div class="card form-card"><h3>What you’ll learn</h3><ul class="feature-list">${listItems(c.skills || ['Career-ready knowledge','Practical exposure','Professional guidance'])}</ul></div><div class="card form-card mt-2"><h3>Course overview</h3><p>${esc(c.overview || c.description)}</p><p class="muted">Entry requirements: ${esc(c.entryRequirements || 'Contact institute for details.')}</p></div></div><aside class="sidebar-stack"><div class="card form-card"><h3>Course summary</h3><p><b>Institute:</b> ${esc(c.institute)}</p><p><b>Award:</b> ${esc(c.award || c.type)}</p><p><b>Starts:</b> ${esc(c.startDate || 'Upcoming intake')}</p><p><b>Discount:</b> ${esc(c.discount || 'Contact institute')}</p><p><b>Fee:</b> ${esc(money(c.price,c.currency))}</p><button class="btn btn-primary" data-lead="ENROLLMENT_REQUEST" data-course="${esc(c.id)}">Enroll Now</button></div><div class="card form-card"><h3>Related careers</h3><div class="chips">${(c.relatedJobs || []).map(job => `<span class="chip">${esc(job)}</span>`).join('')}</div></div></aside></div></section>`;
  }
  return `<section class="course-detail-hero"><div class="container course-hero-grid"><div><p class="eyebrow">${esc(c.type)} • ${esc(c.category)}</p><h1>${esc(c.title)}</h1><p>${esc(c.overview || c.description)}</p><div class="rating-line">${stars(c.rating || 4.8)} <span>${esc(c.rating || 4.8)} rating • ${esc(c.institute)}</span></div><div class="course-facts">${smallMetric('Level', c.type || 'Course', '🎓')}${smallMetric('Duration', c.duration || 'Flexible', '⏱')}${smallMetric('Schedule', c.studyMode || 'Flexible', '📅')}${smallMetric('Fee', money(c.price,c.currency), '💳')}</div><div class="button-row"><button class="btn btn-primary" data-lead="ENROLLMENT_REQUEST" data-course="${esc(c.id)}">Enroll Now</button><button class="btn btn-light" data-lead="INTERESTED" data-course="${esc(c.id)}">Interested</button><a class="btn btn-outline translucent" href="#contact">Ask a Question</a></div></div><div class="course-hero-media"><img src="${esc(c.image)}" alt="${esc(c.title)}"/></div></div></section>
  <section class="profile-tabs"><div class="container">${tabButtons}</div></section>
  ${tabContent}`;
}
async function counselingPage() {
  const items = await api('/api/public/counselors');
  return `<section class="page-hero small"><div class="container"><p class="eyebrow">Expert Guidance</p><h1>Career counseling</h1><p class="muted">Book online or physical sessions with experienced counselors.</p></div></section><section class="section"><div class="container grid grid-3">${items.map(c => `<div class="card counselor-card premium-card"><div class="media-wrap">${img(c.image,c.name)}<div class="media-badges">${pill(c.focus || 'Counselor','blue')}</div></div><div class="card-body"><h3>${esc(c.name)}</h3><p class="muted">${esc(c.qualification)}</p><p>${esc(c.bio)}</p><div class="chips">${(c.languages || []).map(l => `<span class="chip">${esc(l)}</span>`).join('')}</div>${(c.slots || []).filter(s => s.status === 'AVAILABLE').slice(0,3).map(s => `<div class="slot-item"><div><b>${esc(s.date)} ${esc(s.time)}</b><div class="muted">${esc(s.mode)}</div></div><button class="btn btn-primary btn-small" data-book="${esc(c.id)}" data-slot="${esc(s.id)}">Book</button></div>`).join('')}</div></div>`).join('')}</div></section>`;
}
async function articlesPage() {
  const items = await api('/api/public/articles');
  return `<section class="page-hero small"><div class="container"><p class="eyebrow">Resources</p><h1>Articles and expert thoughts</h1><p class="muted">Student and expert content to help with higher education and career choices.</p></div></section><section class="section"><div class="container grid grid-3">${items.map(a => `<div class="card article-card premium-card">${img(a.image,a.title)}<div class="card-body"><p class="eyebrow">${esc(a.category)}</p><h3>${esc(a.title)}</h3><p class="muted">${esc(a.author)} • ${esc(a.createdAt || '')}</p><p>${esc(a.summary)}</p></div></div>`).join('')}</div></section>`;
}
async function videosPage() {
  const items = await api('/api/public/videos');
  return `<section class="page-hero small"><div class="container"><p class="eyebrow">Video Library</p><h1>Watch all published videos</h1><p class="muted">Students can watch platform videos, institute videos, counselor videos, and course/degree videos.</p></div></section><section class="section"><div class="container grid grid-3">${items.map(videoCard).join('') || '<p>No videos published.</p>'}</div></section>`;
}
async function contactPage() {
  const contact = await api('/api/public/contact');
  return `<section class="page-hero small"><div class="container"><p class="eyebrow">Contact Us</p><h1>Talk to the FM Connect team</h1><p class="muted">Send questions about courses, institutes, counseling, sponsorships, and partnerships.</p></div></section>${inquirySection(contact)}`;
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
  const tabs = [{key:'overview',label:'Overview'}, {key:'stats',label:'Stats'}, {key:'requests',label:'Requests'}, {key:'videos',label:'Videos'}];
  let body = '';
  if (state.tab === 'stats') body = `<div class="grid grid-3">${stat('Available Courses', String(d.stats?.availableCourses || 0), 'Public course catalog', '🎓')}${stat('Institutes', String(d.stats?.activeInstitutes || 0), 'Active institute partners', '🏫')}${stat('Open Slots', String(d.stats?.openCounselingSlots || 0), 'Counseling availability', '📅')}</div>`;
  else if (state.tab === 'requests') body = `<div class="card form-card"><h3>My course requests</h3>${d.leads.map(l => `<p><b>${esc(l.courseTitle)}</b> • ${esc(l.type)} • ${esc(l.status)}</p>`).join('') || '<p>No requests yet.</p>'}</div>`;
  else if (state.tab === 'videos') body = `<div class="grid grid-3">${(d.videos || []).map(videoCard).join('') || '<p>No videos available.</p>'}</div>`;
  else body = `<div class="grid grid-3">${stat('Profile', `${d.user.profile?.completion || 0}%`, 'Completed', '👤')}${stat('Requests', String(d.leads.length), 'Course leads', '📨')}${stat('Bookings', String(d.bookings.length), 'Counseling sessions', '💬')}</div><div class="grid grid-2 mt-2"><div class="card form-card"><h3>My requests</h3>${d.leads.map(l => `<p><b>${esc(l.courseTitle)}</b> • ${esc(l.type)} • ${esc(l.status)}</p>`).join('') || '<p>No requests yet.</p>'}</div><div class="card form-card"><h3>Upcoming bookings</h3>${d.bookings.map(b => `<p><b>${esc(b.counselorName)}</b> • ${esc(b.date)} ${esc(b.time)} • ${esc(b.status)}</p>`).join('') || '<p>No bookings yet.</p>'}</div></div>`;
  return `<section class="section"><div class="container"><h1>Student dashboard</h1>${dashTabs(tabs)}${body}</div></section>`;
}
function instituteDash(d) {
  const tabs = [{key:'overview',label:'Overview'}, {key:'stats',label:'Stats'}, {key:'profile',label:'Institute Profile'}, {key:'courses',label:'Courses'}, {key:'videos',label:'Videos'}, {key:'leads',label:'Leads'}];
  let body = '';
  if (state.tab === 'profile') body = instituteProfileForm(d.institute);
  else if (state.tab === 'courses') body = instituteCoursesPanel(d.courses);
  else if (state.tab === 'videos') body = instituteVideosPanel(d.videos || [], d.courses || []);
  else if (state.tab === 'leads') body = `<div class="card form-card"><h3>Student leads</h3>${d.leads.map(l => `<p><b>${esc(l.studentName)}</b> • ${esc(l.courseTitle)} • ${esc(l.type)} • ${esc(l.status)}</p>`).join('') || '<p>No leads yet.</p>'}</div>`;
  else if (state.tab === 'stats') body = `<div class="grid grid-3">${stat('Published Courses', String(d.stats?.publishedCourses || 0), 'Visible on website', '🎓')}${stat('Draft Courses', String(d.stats?.draftCourses || 0), 'Internal course records', '📝')}${stat('Interested Leads', String(d.stats?.interestedLeads || 0), 'Students not ready to enroll', '⭐')}${stat('Enrollment Leads', String(d.stats?.enrollmentLeads || 0), 'Enroll Now requests', '📈')}${stat('Videos', String((d.videos || []).length), 'Institute video content', '▶')}${stat('Profile Views', String(d.institute?.visits || 0), 'Demo analytics', '👁')}</div>`;
  else body = `<div class="grid grid-3">${stat('Courses', String(d.courses.length), 'Created courses', '🎓')}${stat('Published', String(d.courses.filter(c => c.status === 'PUBLISHED').length), 'Visible courses', '✅')}${stat('Leads', String(d.leads.length), 'Student requests', '📨')}</div><div class="card form-card mt-2"><h3>What you can manage now</h3><p>Edit courses/degrees, upload course and institute videos, link videos to courses, update institute profile details, and view leads.</p></div>`;
  return `<section class="section"><div class="container"><h1>Institute owner dashboard</h1>${dashTabs(tabs)}${body}</div></section>`;
}
function instituteProfileForm(i) {
  return `<div class="card form-card"><h3>Edit institute profile</h3><form id="instProfileForm" class="form-grid two-col"><label>Name<input name="name" value="${esc(i.name)}"/></label><label>Short name<input name="shortName" value="${esc(i.shortName || '')}"/></label><label>Email<input name="email" value="${esc(i.email || '')}"/></label><label>Phone<input name="phone" value="${esc(i.phone || '')}"/></label><label>Website<input name="website" value="${esc(i.website || '')}"/></label><label>Category<input name="category" value="${esc(i.category || '')}"/></label><label class="full">Image upload<input name="imageFile" type="file" accept="image/*"/></label><label class="full">Description<textarea name="description">${esc(i.description || '')}</textarea></label><label class="full">Long description<textarea name="longDescription">${esc(i.longDescription || '')}</textarea></label><label class="full">Free courses, comma separated<input name="featuredFreeCourses" value="${esc((i.featuredFreeCourses || []).join(', '))}"/></label><label class="full">Facilities, comma separated<input name="facilities" value="${esc((i.facilities || []).join(', '))}"/></label><button class="btn btn-primary">Save institute profile</button></form></div>`;
}
function courseFields(c = {}) {
  return `<label>Title<input name="title" value="${esc(c.title || '')}" required/></label><label>Category<input name="category" value="${esc(c.category || '')}" required/></label><label>Type<select name="type">${['Degree','Diploma','Certificate','Short Course'].map(x => `<option ${c.type === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>Status<select name="status">${['DRAFT','PENDING_APPROVAL','PUBLISHED','DISABLED'].map(x => `<option ${c.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>Duration<input name="duration" value="${esc(c.duration || '')}"/></label><label>Study mode<input name="studyMode" value="${esc(c.studyMode || '')}"/></label><label>Price<input type="number" name="price" value="${esc(c.price || 0)}"/></label><label>Discount<input name="discount" value="${esc(c.discount || '')}"/></label><label>Image upload<input name="imageFile" type="file" accept="image/*"/></label><label>Image path<input name="image" value="${esc(c.image || '')}"/></label><label class="full">Description<textarea name="description">${esc(c.description || '')}</textarea></label><label class="full">Modules, one per line<textarea name="modules">${esc((c.modules || []).join('\n'))}</textarea></label><label class="full">Skills, comma separated<input name="skills" value="${esc((c.skills || []).join(', '))}"/></label><label class="full">Related jobs, comma separated<input name="relatedJobs" value="${esc((c.relatedJobs || []).join(', '))}"/></label><label>Sponsored<input type="checkbox" name="sponsored" ${c.sponsored ? 'checked' : ''}/></label>`;
}
function instituteCoursesPanel(courses) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Add new course / degree</h3><form id="courseCreateForm" class="form-grid">${courseFields({ status:'PUBLISHED', type:'Degree', image:'/assets/gallery-1.svg' })}<button class="btn btn-primary">Create course</button></form></div><div class="stack">${courses.map(c => `<details class="card form-card"><summary><b>${esc(c.title)}</b> ${statusPill(c.status)} <span class="muted">${esc(c.category)} • ${money(c.price)}</span></summary><form class="courseEditForm form-grid mt-2" data-id="${esc(c.id)}">${courseFields(c)}<button class="btn btn-primary">Save changes</button><button type="button" class="btn btn-outline" data-delete-course="${esc(c.id)}">Delete course</button></form></details>`).join('') || '<p>No courses yet.</p>'}</div></div>`;
}
function videoFields(v = {}, courses = []) {
  return `<label>Title<input name="title" value="${esc(v.title || '')}" required/></label><label>Category<input name="category" value="${esc(v.category || '')}"/></label><label>Status<select name="status">${['PUBLISHED','DRAFT','DISABLED'].map(x => `<option ${v.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>Video URL<input name="videoUrl" value="${esc(v.videoUrl || '')}" placeholder="Paste YouTube/Drive/video URL or upload file below"/></label><label>Upload video file<input name="videoFile" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime"/></label><label>Thumbnail path<input name="thumbnail" value="${esc(v.thumbnail || '/assets/video-platform-tour.png')}"/></label><label>Upload thumbnail<input name="thumbnailFile" type="file" accept="image/*"/></label>${courses.length ? `<label>Show inside course / degree<select name="courseId"><option value="">General institute/platform video</option>${courses.map(c => `<option value="${esc(c.id)}" ${(v.courseIds || []).includes(c.id) || v.courseId === c.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></label>` : ''}<label class="full">Description<textarea name="description">${esc(v.description || '')}</textarea></label><label>Featured<input type="checkbox" name="featured" ${v.featured ? 'checked' : ''}/></label>`;
}
function instituteVideosPanel(videos, courses = []) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Upload institute / course video</h3><p class="muted">Upload a video file or paste a video URL. Link it to a course to show it inside that course detail page.</p><form id="instituteVideoCreateForm" class="form-grid">${videoFields({ status:'PUBLISHED', category:'Institute', thumbnail:'/assets/video-institute-onboarding.png' }, courses)}<button class="btn btn-primary">Create video</button></form></div><div class="stack">${videos.map(v => `<details class="card form-card"><summary><b>${esc(v.title)}</b> ${statusPill(v.status)}</summary><form class="instituteVideoEditForm form-grid mt-2" data-id="${esc(v.id)}">${videoFields(v, courses)}<button class="btn btn-primary">Save video</button><button type="button" class="btn btn-outline" data-delete-institute-video="${esc(v.id)}">Delete video</button></form></details>`).join('') || '<p>No videos yet.</p>'}</div></div>`;
}
function counselorDash(d) {
  const tabs = [{key:'overview',label:'Overview'}, {key:'stats',label:'Stats'}, {key:'availability',label:'Availability / Slots'}, {key:'videos',label:'My Videos'}];
  let body = '';
  const openSlots = (d.counselor?.slots || []).filter(s => s.status === 'AVAILABLE').length;
  if (state.tab === 'stats') body = `<div class="grid grid-3">${stat('Confirmed', String(d.stats?.confirmedBookings || 0), 'Current confirmed sessions', '✅')}${stat('Completed', String(d.stats?.completedBookings || 0), 'Completed sessions', '🏁')}${stat('Open Slots', String(openSlots), 'Available counseling slots', '📅')}${stat('Videos', String((d.videos || []).length), 'Counselor guidance videos', '▶')}</div>`;
  else if (state.tab === 'availability') body = counselorSlotsPanel(d.counselor || {});
  else if (state.tab === 'videos') body = counselorVideosPanel(d.videos || []);
  else body = `<div class="grid grid-3">${stat('Bookings', String(d.bookings.length), 'Student sessions', '💬')}${stat('Open slots', String(openSlots), 'Available', '📅')}${stat('Focus', d.counselor?.focus || 'Career Guidance', 'Specialization', '🎯')}</div><div class="card form-card mt-2"><h3>Bookings</h3>${d.bookings.map(b => `<p><b>${esc(b.studentName)}</b> • ${esc(b.date)} ${esc(b.time)} • ${esc(b.mode || '')} • ${esc(b.status)}</p>`).join('') || '<p>No bookings yet.</p>'}</div><div class="card form-card mt-2"><h3>Next available slots</h3>${(d.counselor?.slots || []).filter(s => s.status === 'AVAILABLE').slice(0,5).map(s => `<p><b>${esc(s.date)} ${esc(s.time)}</b> • ${esc(s.mode)} ${s.location ? '• ' + esc(s.location) : ''}</p>`).join('') || '<p>No available slots yet. Add slots from the Availability / Slots tab.</p>'}</div>`;
  return `<section class="section"><div class="container"><h1>Counselor dashboard</h1>${dashTabs(tabs)}${body}</div></section>`;
}
function slotFields(s = {}) {
  return `<label>Date<input name="date" type="date" value="${esc(s.date || '')}" required/></label><label>Start time<input name="time" type="time" value="${esc(s.time || '')}" required/></label><label>End time<input name="endTime" type="time" value="${esc(s.endTime || '')}"/></label><label>Mode<select name="mode"><option ${s.mode === 'Online' ? 'selected' : ''}>Online</option><option ${s.mode === 'Physical' ? 'selected' : ''}>Physical</option></select></label><label>Capacity<input name="capacity" type="number" min="1" value="${esc(s.capacity || 1)}"/></label><label>Status<select name="status">${['AVAILABLE','BOOKED','DISABLED','CANCELLED'].map(x => `<option ${s.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label class="full">Meeting link for online sessions<input name="meetingLink" value="${esc(s.meetingLink || '')}" placeholder="Google Meet / Zoom / Teams link"/></label><label class="full">Location for physical sessions<input name="location" value="${esc(s.location || '')}" placeholder="BMICH, Future Minds booth, campus room, etc."/></label><label class="full">Notes<textarea name="notes">${esc(s.notes || '')}</textarea></label>`;
}
function slotSummary(s) {
  return `<b>${esc(s.date)} ${esc(s.time)}</b>${s.endTime ? ` - ${esc(s.endTime)}` : ''} • ${esc(s.mode)} • ${statusPill(s.status || 'AVAILABLE')}`;
}
function counselorSlotsPanel(counselor = {}) {
  const slots = counselor.slots || [];
  return `<div class="grid grid-2"><div class="card form-card"><h3>Add available booking slot</h3><p class="muted">Students will see AVAILABLE slots in the public Counseling page and can book them.</p><form id="counselorSlotCreateForm" class="form-grid">${slotFields({ status:'AVAILABLE', mode:'Online', capacity:1 })}<button class="btn btn-primary">Add slot</button></form></div><div class="stack"><div class="card form-card"><h3>My availability</h3><p class="muted">Edit or disable slots. Booked slots cannot be deleted from the demo.</p></div>${slots.map(s => `<details class="card form-card"><summary>${slotSummary(s)}</summary><form class="counselorSlotEditForm form-grid mt-2" data-id="${esc(s.id)}">${slotFields(s)}<button class="btn btn-primary">Save slot</button><button type="button" class="btn btn-outline" data-delete-counselor-slot="${esc(s.id)}">Delete slot</button></form></details>`).join('') || '<p>No slots yet.</p>'}</div></div>`;
}
function counselorVideosPanel(videos = []) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Upload counselor guidance video</h3><p class="muted">Counselor videos are visible to students in the Videos page and as guidance content.</p><form id="counselorVideoCreateForm" class="form-grid">${videoFields({ status:'PUBLISHED', category:'Counseling', thumbnail:'/assets/video-career-guidance.png' })}<button class="btn btn-primary">Create video</button></form></div><div class="stack">${videos.map(v => `<details class="card form-card"><summary><b>${esc(v.title)}</b> ${statusPill(v.status)}</summary><form class="counselorVideoEditForm form-grid mt-2" data-id="${esc(v.id)}">${videoFields(v)}<button class="btn btn-primary">Save video</button><button type="button" class="btn btn-outline" data-delete-counselor-video="${esc(v.id)}">Delete video</button></form></details>`).join('') || '<p>No videos yet.</p>'}</div></div>`;
}
function adminDash(d) {
  const tabs = [{key:'overview',label:'Overview'}, {key:'stats',label:'Stats'}, {key:'institutes',label:'Institutes'}, {key:'counselors',label:'Counselors'}, {key:'users',label:'Users'}, {key:'courses',label:'Courses'}, {key:'inquiries',label:'Contact Us'}, {key:'videos',label:'Videos'}, {key:'requests',label:'Institute Requests'}, {key:'content',label:'Content'}];
  let body = '';
  if (state.tab === 'institutes') body = adminInstitutesPanel(d);
  else if (state.tab === 'counselors') body = adminCounselorsPanel(d);
  else if (state.tab === 'users') body = adminUsersPanel(d);
  else if (state.tab === 'courses') body = adminCoursesPanel(d);
  else if (state.tab === 'inquiries') body = adminInquiriesPanel(d);
  else if (state.tab === 'videos') body = adminVideosPanel(d);
  else if (state.tab === 'requests') body = adminRequestsPanel(d);
  else if (state.tab === 'content') body = adminContentPanel(d);
  else if (state.tab === 'stats') body = `<div class="grid grid-3">${stat('Active Students', String(d.stats?.activeStudents || 0), 'Student accounts', '👥')}${stat('Active Institutes', String(d.stats?.activeInstitutes || 0), 'Live institute profiles', '🏫')}${stat('Published Courses', String(d.stats?.publishedCourses || 0), 'Visible courses', '🎓')}${stat('New Contact Messages', String(d.stats?.newInquiries || 0), 'Need follow-up', '📩')}${stat('Videos', String(d.stats?.totalVideos || 0), 'Managed videos', '▶')}${stat('Total Leads', String(d.leads.length), 'Student course requests', '📈')}</div>`;
  else body = `<div class="grid grid-3">${stat('Users', String(d.users.length), 'All role users', '👥')}${stat('Institutes', String(d.institutes.length), 'Active and blocked', '🏫')}${stat('Courses', String(d.courses.length), 'All statuses', '🎓')}</div><div class="grid grid-3 mt-2">${stat('Contact Messages', String((d.inquiries || []).filter(i => i.status === 'NEW').length), 'New messages', '📩')}${stat('Videos', String((d.videos || []).length), 'Platform, institute, course, and counselor videos', '▶')}${stat('Leads', String(d.leads.length), 'Student requests', '📨')}</div>`;
  return `<section class="section"><div class="container"><h1>Admin dashboard</h1>${dashTabs(tabs)}${body}</div></section>`;
}
function instituteOptions(institutes, selected = '') { return (institutes || []).map(i => `<option value="${esc(i.id)}" ${selected === i.id ? 'selected' : ''}>${esc(i.name)}</option>`).join(''); }
function adminInstitutesPanel(d) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Create institute + owner</h3><form id="adminInstituteCreateForm" class="form-grid"><label>Institute name<input name="name" required/></label><label>Email<input name="email" type="email" required/></label><label>Phone<input name="phone"/></label><label>Category<input name="category"/></label><label>Plan<input name="plan" value="Startup"/></label><label>Account type<select name="accountType"><option>STANDARD</option><option>SPONSORED</option></select></label><label>Owner name<input name="ownerName"/></label><label>Owner email<input name="ownerEmail" type="email"/></label><label>Image upload<input name="imageFile" type="file" accept="image/*"/></label><label class="full">Description<textarea name="description"></textarea></label><button class="btn btn-primary">Create institute</button></form></div><div class="stack">${d.institutes.map(i => `<details class="card form-card"><summary><b>${esc(i.name)}</b> ${statusPill(i.status)} <span class="muted">${esc(i.plan)} • ${esc(i.accountType)}</span></summary><form class="adminInstituteEditForm form-grid mt-2" data-id="${esc(i.id)}"><label>Name<input name="name" value="${esc(i.name)}"/></label><label>Short name<input name="shortName" value="${esc(i.shortName || '')}"/></label><label>Email<input name="email" value="${esc(i.email || '')}"/></label><label>Phone<input name="phone" value="${esc(i.phone || '')}"/></label><label>Website<input name="website" value="${esc(i.website || '')}"/></label><label>Status<select name="status"><option ${i.status==='ACTIVE'?'selected':''}>ACTIVE</option><option ${i.status==='BLOCKED'?'selected':''}>BLOCKED</option><option ${i.status==='PENDING'?'selected':''}>PENDING</option></select></label><label>Plan<input name="plan" value="${esc(i.plan || '')}"/></label><label>Account type<input name="accountType" value="${esc(i.accountType || '')}"/></label><label class="full">Description<textarea name="description">${esc(i.description || '')}</textarea></label><button class="btn btn-primary">Save institute</button><button type="button" class="btn btn-outline" data-toggle-institute="${esc(i.id)}">Activate / Block</button></form></details>`).join('')}</div></div>`;
}
function adminUsersPanel(d) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Add user</h3><form id="adminUserCreateForm" class="form-grid"><label>Name<input name="name" required/></label><label>Email<input name="email" type="email" required/></label><label>Phone<input name="phone"/></label><label>Role<select name="role"><option>STUDENT</option><option>INSTITUTE_OWNER</option><option>COUNSELOR</option><option>ADMIN</option></select></label><label>Institute for owner<select name="instituteId"><option value="">None</option>${instituteOptions(d.institutes)}</select></label><label>Password<input name="password" value="demo123"/></label><button class="btn btn-primary">Create user</button></form></div><div class="stack">${d.users.map(u => `<details class="card form-card"><summary><b>${esc(u.name)}</b> ${statusPill(u.status)} <span class="muted">${esc(u.role)} • ${esc(u.email)}</span></summary><form class="adminUserEditForm form-grid mt-2" data-id="${esc(u.id)}"><label>Name<input name="name" value="${esc(u.name)}"/></label><label>Email<input name="email" type="email" value="${esc(u.email)}"/></label><label>Phone<input name="phone" value="${esc(u.phone || '')}"/></label><label>Role<input name="role" value="${esc(u.role)}"/></label><label>Status<input name="status" value="${esc(u.status)}"/></label><label>Password reset<input name="password" placeholder="Leave empty to keep"/></label><button class="btn btn-primary">Save user</button><button type="button" class="btn btn-outline" data-toggle-user="${esc(u.id)}">Activate / Block</button></form></details>`).join('')}</div></div>`;
}
function counselorFields(c = {}) {
  return `<label>Name<input name="name" value="${esc(c.name || '')}" required/></label><label>Email<input name="email" type="email" value="${esc(c.email || '')}" required/></label><label>Phone<input name="phone" value="${esc(c.phone || '')}"/></label><label>Focus area<input name="focus" value="${esc(c.focus || 'Career Guidance')}"/></label><label>Qualification<input name="qualification" value="${esc(c.qualification || '')}"/></label><label>Years experience<input name="yearsExperience" value="${esc(c.yearsExperience || '')}"/></label><label>Image path<input name="image" value="${esc(c.image || '/assets/real-counselor.jpg')}"/></label><label>Status<select name="status">${['PUBLISHED','DRAFT','HIDDEN','BLOCKED'].map(x => `<option ${c.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label class="full">Languages, comma separated<input name="languages" value="${esc((c.languages || []).join(', '))}"/></label><label class="full">Bio<textarea name="bio">${esc(c.bio || '')}</textarea></label>`;
}
function adminCounselorsPanel(d) {
  const counselors = d.counselors || [];
  return `<div class="grid grid-2"><div class="card form-card"><h3>Create counselor + login</h3><p class="muted">This creates both the public counselor profile and counselor login account.</p><form id="adminCounselorCreateForm" class="form-grid">${counselorFields({ status:'PUBLISHED', image:'/assets/real-counselor.jpg', languages:['English','Sinhala'] })}<label>Password<input name="password" value="demo123"/></label><label>User account status<select name="userStatus"><option>ACTIVE</option><option>BLOCKED</option></select></label><button class="btn btn-primary">Create counselor</button></form></div><div class="stack">${counselors.map(c => `<details class="card form-card"><summary><b>${esc(c.name)}</b> ${statusPill(c.status)} <span class="muted">${esc(c.focus || '')} • ${(c.slots || []).filter(s => s.status === 'AVAILABLE').length} open slots</span></summary><form class="adminCounselorEditForm form-grid mt-2" data-id="${esc(c.id)}">${counselorFields(c)}<label>Password reset<input name="password" placeholder="Leave empty to keep"/></label><button class="btn btn-primary">Save counselor</button></form><div class="mt-2 slot-admin-box"><h4>Manage availability slots</h4><form class="adminSlotCreateForm form-grid" data-counselor-id="${esc(c.id)}">${slotFields({ status:'AVAILABLE', mode:'Online', capacity:1 })}<button class="btn btn-primary">Add slot for counselor</button></form><div class="stack mt-2">${(c.slots || []).map(s => `<details class="card form-card"><summary>${slotSummary(s)}</summary><form class="adminSlotEditForm form-grid mt-2" data-counselor-id="${esc(c.id)}" data-slot-id="${esc(s.id)}">${slotFields(s)}<button class="btn btn-primary">Save slot</button><button type="button" class="btn btn-outline" data-delete-admin-slot="${esc(c.id)}::${esc(s.id)}">Delete slot</button></form></details>`).join('') || '<p>No slots yet.</p>'}</div></div></details>`).join('') || '<p>No counselors yet.</p>'}</div></div>`;
}
function adminCoursesPanel(d) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Add course for any institute</h3><form id="adminCourseCreateForm" class="form-grid"><label>Institute<select name="instituteId" required>${instituteOptions(d.institutes)}</select></label>${courseFields({ status:'PUBLISHED', type:'Degree', image:'/assets/gallery-1.svg' })}<button class="btn btn-primary">Create course</button></form></div><div class="stack">${d.courses.map(c => `<details class="card form-card"><summary><b>${esc(c.title)}</b> ${statusPill(c.status)} <span class="muted">${esc(c.institute)} • ${esc(c.category)}</span></summary><form class="adminCourseEditForm form-grid mt-2" data-id="${esc(c.id)}"><label>Institute<select name="instituteId">${instituteOptions(d.institutes, c.instituteId)}</select></label>${courseFields(c)}<button class="btn btn-primary">Save course</button><button type="button" class="btn btn-outline" data-admin-delete-course="${esc(c.id)}">Delete course</button></form></details>`).join('')}</div></div>`;
}
function adminInquiriesPanel(d) {
  return `<div class="card form-card"><h3>Contact Us submissions</h3><div class="stack">${(d.inquiries || []).map(i => `<div class="card form-card"><div class="card-tags">${statusPill(i.status)}</div><h3>${esc(i.subject)}</h3><p><b>${esc(i.name)}</b> • ${esc(i.email)} • ${esc(i.phone || '')}</p><p>${esc(i.message)}</p><p class="muted">${esc(i.createdAt || '')}</p>${i.status !== 'RESOLVED' ? `<button class="btn btn-primary btn-small" data-resolve-inquiry="${esc(i.id)}">Mark Resolved</button>` : ''}</div>`).join('') || '<p>No messages yet.</p>'}</div></div>`;
}
function adminVideosPanel(d) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Upload / add platform video</h3><p class="muted">Admin can upload platform videos, institute videos, counselor videos, and course/degree videos.</p><form id="adminVideoCreateForm" class="form-grid">${videoFields({ status:'PUBLISHED', category:'Platform', thumbnail:'/assets/video-platform-tour.png' }, d.courses || [])}<label>Institute optional<select name="instituteId"><option value="">Platform / no institute</option>${instituteOptions(d.institutes)}</select></label><label>Counselor optional<select name="counselorId"><option value="">No counselor</option>${(d.counselors || []).map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label><button class="btn btn-primary">Create video</button></form></div><div class="stack">${(d.videos || []).map(v => `<details class="card form-card"><summary><b>${esc(v.title)}</b> ${statusPill(v.status)} <span class="muted">${esc(v.category)} • ${esc(v.ownerType || '')}</span></summary><form class="adminVideoEditForm form-grid mt-2" data-id="${esc(v.id)}">${videoFields(v, d.courses || [])}<label>Institute optional<select name="instituteId"><option value="">Platform / no institute</option>${instituteOptions(d.institutes, v.instituteId || '')}</select></label><label>Counselor optional<select name="counselorId"><option value="">No counselor</option>${(d.counselors || []).map(c => `<option value="${esc(c.id)}" ${v.counselorId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label><button class="btn btn-primary">Save video</button><button type="button" class="btn btn-outline" data-delete-admin-video="${esc(v.id)}">Delete video</button></form></details>`).join('') || '<p>No videos yet.</p>'}</div></div>`;
}
function adminRequestsPanel(d) {
  return `<div class="card form-card"><h3>Institute registration requests</h3><div class="stack">${d.instituteRequests.map(r => `<div class="card form-card"><h3>${esc(r.instituteName)}</h3><p>${esc(r.contactName)} • ${esc(r.email)} • ${esc(r.phone)}</p><p class="muted">${esc(r.category)} • ${esc(r.status)}</p><p>${esc(r.notes || '')}</p>${r.status === 'NEW' ? `<button class="btn btn-outline btn-small" data-approve-req="${esc(r.id)}">Approve</button> <button class="btn btn-primary btn-small" data-convert-req="${esc(r.id)}">Convert to institute + owner</button>` : ''}</div>`).join('') || '<p>No requests.</p>'}</div></div>`;
}
function adminContentPanel(d) {
  return `<div class="grid grid-2"><div class="card form-card"><h3>Pending articles</h3>${d.pendingArticles.map(a => `<p><b>${esc(a.title)}</b> • ${esc(a.author)} <button class="btn btn-primary btn-small" data-approve-article="${esc(a.id)}">Approve</button></p>`).join('') || '<p>No pending articles.</p>'}</div><div class="card form-card"><h3>Pending feedback</h3>${d.pendingFeedback.map(f => `<p><b>${esc(f.user)}</b> • ${esc(f.target)} <button class="btn btn-primary btn-small" data-approve-feedback="${esc(f.id)}">Approve</button></p>`).join('') || '<p>No pending feedback.</p>'}</div></div>`;
}
function formToObject(form) {
  const fd = new FormData(form);
  const obj = {};
  for (const [key, value] of fd.entries()) {
    if (value instanceof File) continue;
    obj[key] = value;
  }
  obj.sponsored = fd.get('sponsored') === 'on';
  obj.featured = fd.get('featured') === 'on';
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
async function uploadFileFromForm(form, inputName) {
  const file = new FormData(form).get(inputName);
  if (!file || !file.name) return '';
  const dataUrl = await fileToDataUrl(file);
  const result = await api('/api/shared/media', { method:'POST', body: JSON.stringify({ filename: file.name, dataUrl }) });
  return result.url;
}
async function uploadFromForm(form) {
  return uploadFileFromForm(form, 'imageFile');
}
async function prepareVideoPayload(form) {
  const obj = formToObject(form);
  const uploadedVideo = await uploadFileFromForm(form, 'videoFile');
  const uploadedThumb = await uploadFileFromForm(form, 'thumbnailFile');
  if (uploadedVideo) obj.videoUrl = uploadedVideo;
  if (uploadedThumb) obj.thumbnail = uploadedThumb;
  return obj;
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
  document.getElementById('searchForm')?.addEventListener('submit', e => { e.preventDefault(); const f = new FormData(e.target); state.query = f.get('q') || ''; state.category = f.get('category') || 'All'; state.location = f.get('location') || 'All'; state.courseType = f.get('courseType') || 'All'; state.studyMode = f.get('studyMode') || 'All'; state.cost = f.get('cost') || 'All'; state.duration = f.get('duration') || 'All'; state.institute = f.get('institute') || 'All'; state.sponsored = f.get('sponsored') || 'All'; state.sort = f.get('sort') || 'relevance'; if ((route()[0] || 'home') !== 'explore') nav('explore'); else render(); });
  document.getElementById('loginForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const f = new FormData(e.target); const r = await api('/api/auth/login', { method:'POST', body: JSON.stringify({ email:f.get('email'), password:f.get('password') }) }); currentToken = r.token; currentUser = r.user; localStorage.setItem('fm_token_v2', currentToken); state.tab = 'overview'; toast('Login successful'); nav('dashboard'); } catch(err) { toast(err.message); } });
  document.getElementById('signupForm')?.addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/student/signup', { method:'POST', body: JSON.stringify(formToObject(e.target)) }); toast('Account created. Please login.'); nav('login'); } catch(err) { toast(err.message); } });
  document.getElementById('instReqForm')?.addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/admin/institute-requests', { method:'POST', body: JSON.stringify(formToObject(e.target)) }); toast('Institute request submitted'); e.target.reset(); } catch(err) { toast(err.message); } });
  document.getElementById('inquiryForm')?.addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/public/inquiries', { method:'POST', body: JSON.stringify(formToObject(e.target)) }); toast('Message submitted successfully'); e.target.reset(); } catch(err) { toast(err.message); } });
  document.getElementById('studentProfileForm')?.addEventListener('submit', async e => { e.preventDefault(); const f = new FormData(e.target); await api('/api/student/profile', { method:'PUT', body: JSON.stringify({ name:f.get('name'), phone:f.get('phone'), profile:{ district:f.get('district'), educationLevel:f.get('educationLevel'), careerGoal:f.get('careerGoal') } }) }); toast('Profile updated'); render(); });
  document.getElementById('markRead')?.addEventListener('click', async () => { await api('/api/me/notifications/read', { method:'POST' }); toast('Notifications marked as read'); render(); });
  document.getElementById('instProfileForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(e.target); const imgPath = await uploadFromForm(e.target); if (imgPath) obj.image = imgPath; obj.featuredFreeCourses = String(obj.featuredFreeCourses || '').split(',').map(x => x.trim()).filter(Boolean); obj.facilities = String(obj.facilities || '').split(',').map(x => x.trim()).filter(Boolean); await api('/api/institute/profile', { method:'PUT', body: JSON.stringify(obj) }); toast('Institute profile updated'); render(); } catch(err) { toast(err.message); } });
  document.getElementById('courseCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(e.target); const imgPath = await uploadFromForm(e.target); if (imgPath) obj.image = imgPath; await api('/api/institute/courses', { method:'POST', body: JSON.stringify(obj) }); toast('Course created'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.courseEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(form); const imgPath = await uploadFromForm(form); if (imgPath) obj.image = imgPath; await api(`/api/institute/courses/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(obj) }); toast('Course updated'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('instituteVideoCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = await prepareVideoPayload(e.target); await api('/api/institute/videos', { method:'POST', body: JSON.stringify(obj) }); toast('Institute video created'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.instituteVideoEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { const obj = await prepareVideoPayload(form); await api(`/api/institute/videos/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(obj) }); toast('Video updated'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('counselorVideoCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = await prepareVideoPayload(e.target); await api('/api/counselor/videos', { method:'POST', body: JSON.stringify(obj) }); toast('Counselor video created'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.counselorVideoEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { const obj = await prepareVideoPayload(form); await api(`/api/counselor/videos/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(obj) }); toast('Counselor video updated'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('counselorSlotCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/counselor/slots', { method:'POST', body: JSON.stringify(formToObject(e.target)) }); toast('Availability slot added'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.counselorSlotEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { await api(`/api/counselor/slots/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(formToObject(form)) }); toast('Availability slot updated'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('adminInstituteCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(e.target); const imgPath = await uploadFromForm(e.target); if (imgPath) obj.image = imgPath; await api('/api/admin/institutes', { method:'POST', body: JSON.stringify(obj) }); toast('Institute created'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.adminInstituteEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { await api(`/api/admin/institutes/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(formToObject(form)) }); toast('Institute updated'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('adminUserCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { await api('/api/admin/users', { method:'POST', body: JSON.stringify(formToObject(e.target)) }); toast('User created'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.adminUserEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(form); if (!obj.password) delete obj.password; await api(`/api/admin/users/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(obj) }); toast('User updated'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('adminCounselorCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(e.target); if (!obj.password) delete obj.password; await api('/api/admin/counselors', { method:'POST', body: JSON.stringify(obj) }); toast('Counselor created'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.adminCounselorEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(form); if (!obj.password) delete obj.password; await api(`/api/admin/counselors/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(obj) }); toast('Counselor updated'); render(); } catch(err) { toast(err.message); } }));
  document.querySelectorAll('.adminSlotCreateForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { await api(`/api/admin/counselors/${form.dataset.counselorId}/slots`, { method:'POST', body: JSON.stringify(formToObject(form)) }); toast('Counselor slot added'); render(); } catch(err) { toast(err.message); } }));
  document.querySelectorAll('.adminSlotEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { await api(`/api/admin/counselors/${form.dataset.counselorId}/slots/${form.dataset.slotId}`, { method:'PUT', body: JSON.stringify(formToObject(form)) }); toast('Counselor slot updated'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('adminCourseCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(e.target); const imgPath = await uploadFromForm(e.target); if (imgPath) obj.image = imgPath; await api('/api/admin/courses', { method:'POST', body: JSON.stringify(obj) }); toast('Course created by admin'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.adminCourseEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { const obj = formToObject(form); const imgPath = await uploadFromForm(form); if (imgPath) obj.image = imgPath; await api(`/api/admin/courses/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(obj) }); toast('Course updated by admin'); render(); } catch(err) { toast(err.message); } }));
  document.getElementById('adminVideoCreateForm')?.addEventListener('submit', async e => { e.preventDefault(); try { const obj = await prepareVideoPayload(e.target); if (obj.instituteId) { obj.ownerType = 'INSTITUTE'; obj.ownerId = obj.instituteId; obj.scope = 'INSTITUTE'; } else if (obj.counselorId) { obj.ownerType = 'COUNSELOR'; obj.ownerId = obj.counselorId; obj.scope = 'COUNSELOR'; } await api('/api/admin/videos', { method:'POST', body: JSON.stringify(obj) }); toast('Video created'); render(); } catch(err) { toast(err.message); } });
  document.querySelectorAll('.adminVideoEditForm').forEach(form => form.addEventListener('submit', async e => { e.preventDefault(); try { const obj = await prepareVideoPayload(form); if (obj.instituteId) { obj.ownerType = 'INSTITUTE'; obj.ownerId = obj.instituteId; obj.scope = 'INSTITUTE'; } else if (obj.counselorId) { obj.ownerType = 'COUNSELOR'; obj.ownerId = obj.counselorId; obj.scope = 'COUNSELOR'; } await api(`/api/admin/videos/${form.dataset.id}`, { method:'PUT', body: JSON.stringify(obj) }); toast('Video updated'); render(); } catch(err) { toast(err.message); } }));
}
function bindActions() {
  document.getElementById('clearFilters')?.addEventListener('click', () => { state.query = ''; state.category = 'All'; state.location = 'All'; state.courseType = 'All'; state.studyMode = 'All'; state.cost = 'All'; state.duration = 'All'; state.institute = 'All'; state.sponsored = 'All'; state.sort = 'relevance'; render(); });
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { state.tab = b.dataset.tab; render(); }));
  document.querySelectorAll('[data-inst-tab]').forEach(b => b.addEventListener('click', () => { state.instituteTab = b.dataset.instTab; render(); }));
  document.querySelectorAll('[data-course-tab]').forEach(b => b.addEventListener('click', () => { state.courseTab = b.dataset.courseTab; render(); }));
  document.querySelectorAll('[data-lead]').forEach(b => b.addEventListener('click', () => submitLead(b.dataset.course, b.dataset.lead)));
  document.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', () => bookSlot(b.dataset.book, b.dataset.slot)));
  document.querySelectorAll('[data-delete-course]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Delete this course?')) return; await api(`/api/institute/courses/${b.dataset.deleteCourse}`, { method:'DELETE' }); toast('Course deleted'); render(); }));
  document.querySelectorAll('[data-admin-delete-course]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Delete this course?')) return; await api(`/api/admin/courses/${b.dataset.adminDeleteCourse}`, { method:'DELETE' }); toast('Course deleted'); render(); }));
  document.querySelectorAll('[data-delete-institute-video]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Delete this video?')) return; await api(`/api/institute/videos/${b.dataset.deleteInstituteVideo}`, { method:'DELETE' }); toast('Video deleted'); render(); }));
  document.querySelectorAll('[data-delete-admin-video]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Delete this video?')) return; await api(`/api/admin/videos/${b.dataset.deleteAdminVideo}`, { method:'DELETE' }); toast('Video deleted'); render(); }));
  document.querySelectorAll('[data-delete-counselor-video]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Delete this video?')) return; await api(`/api/counselor/videos/${b.dataset.deleteCounselorVideo}`, { method:'DELETE' }); toast('Video deleted'); render(); }));
  document.querySelectorAll('[data-delete-counselor-slot]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Delete this slot?')) return; await api(`/api/counselor/slots/${b.dataset.deleteCounselorSlot}`, { method:'DELETE' }); toast('Availability slot deleted'); render(); }));
  document.querySelectorAll('[data-delete-admin-slot]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Delete this counselor slot?')) return; const [counselorId, slotId] = b.dataset.deleteAdminSlot.split('::'); await api(`/api/admin/counselors/${counselorId}/slots/${slotId}`, { method:'DELETE' }); toast('Counselor slot deleted'); render(); }));
  document.querySelectorAll('[data-toggle-institute]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/institutes/${b.dataset.toggleInstitute}/toggle-status`, { method:'POST' }); toast('Institute status changed'); render(); }));
  document.querySelectorAll('[data-toggle-user]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/users/${b.dataset.toggleUser}/toggle-status`, { method:'POST' }); toast('User status changed'); render(); }));
  document.querySelectorAll('[data-approve-req]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/institute-requests/${b.dataset.approveReq}/approve`, { method:'POST' }); toast('Request approved'); render(); }));
  document.querySelectorAll('[data-convert-req]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/institute-requests/${b.dataset.convertReq}/convert`, { method:'POST', body: JSON.stringify({ password:'demo123' }) }); toast('Request converted to institute + owner'); render(); }));
  document.querySelectorAll('[data-approve-article]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/articles/${b.dataset.approveArticle}/approve`, { method:'POST' }); toast('Article approved'); render(); }));
  document.querySelectorAll('[data-approve-feedback]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/feedback/${b.dataset.approveFeedback}/approve`, { method:'POST' }); toast('Feedback approved'); render(); }));
  document.querySelectorAll('[data-resolve-inquiry]').forEach(b => b.addEventListener('click', async () => { await api(`/api/admin/inquiries/${b.dataset.resolveInquiry}/resolve`, { method:'POST' }); toast('Message resolved'); render(); }));
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
    else if (key === 'videos') content = await videosPage();
    else if (key === 'contact') content = await contactPage();
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
window.addEventListener('hashchange', () => { const key = route()[0]; if (key !== 'dashboard') state.tab = 'overview'; if (key !== 'institute') state.instituteTab = 'overview'; if (key !== 'course') state.courseTab = 'about'; render(); });
render();


// ===== SaaS NAVIGATION + SCROLL FIX (v12) =====

function saasNavigate(url) {
  window.history.pushState({}, "", url);
  renderPage(url); // existing app function assumed
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// hard safety scroll reset on load
window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});

// back/forward navigation fix
window.addEventListener("popstate", () => {
  renderPage(window.location.pathname);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener("DOMContentLoaded", () => {
  window.scrollTo(0, 0);
});



// ===== V13 HARD SCROLL FIX =====

window.history.scrollRestoration = 'manual';

// override any navigation
function saasNavigate(url) {
  window.history.pushState({}, "", url);
  if (typeof renderPage === "function") renderPage(url);

  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, 10);
}

// global scroll reset after render
function forceScrollTop() {
  setTimeout(() => window.scrollTo(0, 0), 0);
}

// hook into page load
window.addEventListener("load", () => {
  forceScrollTop();
});

window.addEventListener("popstate", () => {
  if (typeof renderPage === "function") renderPage(window.location.pathname);
  forceScrollTop();
});

// intercept all internal anchor clicks
document.addEventListener("click", function(e) {
  const a = e.target.closest("a");
  if (!a) return;

  const href = a.getAttribute("href");
  if (!href || href.startsWith("http") || href.startsWith("mailto")) return;

  e.preventDefault();
  saasNavigate(href);
});

