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

// Dark mode toggle. The inline script in _includes/head.html always stamps
// data-theme before first paint -- dark unless a stored choice says otherwise --
// so the attribute is the single source of truth here.
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
});
