# markvrma.github.io

Personal site of Mark Verma. Hand-written static HTML, served as-is by GitHub
Pages (`.nojekyll`, so there is no build step).

- `index.html`, `assets/site.css`, `assets/site.js`: the site. No webfonts, no
  framework, no trackers.
- `assets/typeset.js`: progressive enhancements built on
  [pretext](https://github.com/chenglou/pretext) (vendored, MIT, in
  `assets/js/pretext/`). It re-sets the intro around the draggable portrait,
  lays out the project masonry from predicted heights, and clamps the abstract
  to three lines. Without it the page falls back to a float, a CSS grid and
  the full abstract.
- `typeset/`: the pretext lab.
- `kanban/`, `countdowns/`, `t1ssuepap3r/`: personal tools, standalone.
- `about/`, `publications/`, `cv/`, `resume/`: redirects for old URLs.

The pre-redesign Jekyll site is kept on the `backup/pre-redesign-2026-09`
branch.

Run locally with any static server, e.g. `python3 -m http.server`.
