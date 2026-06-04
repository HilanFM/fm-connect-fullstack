
// ===== FM CONNECT v14 - REACT-LEVEL SAAS ROUTER =====

// Global state
const AppState = {
  currentRoute: "/",
  data: {},
};

// Routes
const routes = {
  "/": renderHome,
  "/courses": renderCourses,
  "/institutes": renderInstitutes,
  "/course": renderCourseDetail,
  "/institute": renderInstituteDetail,
  "/contact": renderContact,
};

// Core render engine (mini React style)
function renderPage(route) {
  AppState.currentRoute = route;

  const root = document.getElementById("app");
  if (!root) return;

  root.innerHTML = "";

  const baseRoute = route.split("?")[0].split("/")[1];

  let handler = routes["/" + baseRoute];
  if (!handler) handler = renderHome;

  const page = handler(route);

  root.appendChild(page);

  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Navigation (React-like)
function navigate(path) {
  window.history.pushState({}, "", path);
  renderPage(path);
}

// Back/forward support
window.addEventListener("popstate", () => {
  renderPage(window.location.pathname);
});

// Boot
document.addEventListener("DOMContentLoaded", () => {
  renderPage(window.location.pathname);
});

// ===== PAGE COMPONENTS =====

function el(tag, className, innerText) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (innerText) e.innerText = innerText;
  return e;
}

function renderHome() {
  const div = el("div", "page");
  div.innerHTML = `
    <h1>FM Connect</h1>
    <p>Future Minds SaaS Platform</p>
    <button onclick="navigate('/courses')">Explore Courses</button>
  `;
  return div;
}

function renderCourses() {
  const div = el("div", "page");
  div.innerHTML = `
    <h1>Courses</h1>
    <p>Advanced SaaS Course Listing</p>
  `;
  return div;
}

function renderInstitutes() {
  const div = el("div", "page");
  div.innerHTML = `
    <h1>Institutes</h1>
  `;
  return div;
}

function renderCourseDetail() {
  const div = el("div", "page");
  div.innerHTML = `<h1>Course Detail</h1>`;
  return div;
}

function renderInstituteDetail() {
  const div = el("div", "page");
  div.innerHTML = `<h1>Institute Detail</h1>`;
  return div;
}

function renderContact() {
  const div = el("div", "page");
  div.innerHTML = `<h1>Contact Us</h1>`;
  return div;
}
