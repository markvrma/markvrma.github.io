// Scroll-reveal for .mv-reveal elements. ponytail: vanilla IntersectionObserver,
// no animation library needed for a one-way fade-in-on-scroll.
document.addEventListener("DOMContentLoaded", function () {
  var targets = document.querySelectorAll(".mv-reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach(function (el) { observer.observe(el); });
});

// Dark mode toggle. Explicit user choice (localStorage) always wins over
// prefers-color-scheme; see the inline script in _includes/head.html that
// applies it before first paint to avoid a flash of the wrong theme.
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", function () {
    var current = document.documentElement.getAttribute("data-theme");
    var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = current ? current === "dark" : systemDark;
    var next = isDark ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
});
