// Everything the page needs on every visit: theme, the byte meter, the
// portrait's bitrate switch, citation copy and the little shell. The pretext
// enhancements live in typeset.js and load after this.
const $ = s => document.querySelector(s)
const root = document.documentElement

// ── theme: paper (light) / phosphor (dark) ─────────────────────────────────
const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
function setTheme(t) {
  root.dataset.theme = t
  try { localStorage.setItem('theme', t) } catch {}
  const meta = $('meta[name="theme-color"]')
  if (meta) meta.content = t === 'dark' ? '#17171a' : '#f0ebe0'
}
$('#themeBtn').addEventListener('click', () => setTheme(isDark() ? 'light' : 'dark'))

// ── byte meter: what this page actually cost to load ───────────────────────
const meter = $('#meter'), weight = $('#weight')
const seen = new Set()
let bytes = 0
function count(e) {
  if (seen.has(e.name)) return
  seen.add(e.name)
  bytes += e.transferSize || e.encodedBodySize || 0
  const kb = `${(bytes / 1024).toFixed(1)} KB`
  meter.innerHTML = `<b>${kb}</b> loaded`
  weight.textContent = kb
}
performance.getEntriesByType('navigation').forEach(count)
performance.getEntriesByType('resource').forEach(count)
try { new PerformanceObserver(l => l.getEntries().forEach(count)).observe({ type: 'resource', buffered: true }) } catch {}

// ── portrait: 1-bit by default, 24-bit on request ──────────────────────────
const portrait = $('#portrait'), bitBtn = $('#bitBtn'), hiImg = $('#hiImg'), bitLabel = $('#bitLabel')
function showHi(on) {
  portrait.classList.toggle('hi', on)
  bitLabel.textContent = on ? '24-bit' : '1-bit'
  bitBtn.textContent = on ? '1-bit · 4 KB' : '24-bit · 20 KB'
}
function toggleBitrate() {
  if (hiImg.src) return showHi(!portrait.classList.contains('hi'))
  bitBtn.textContent = 'loading…'
  hiImg.onload = () => showHi(true)
  hiImg.src = hiImg.dataset.src
}
bitBtn.addEventListener('click', toggleBitrate)

// ── citation ───────────────────────────────────────────────────────────────
const citeText = () => { const c = $('#cite').cloneNode(true); c.querySelector('.kw')?.remove(); return c.textContent.trim() }
$('#copyCite').addEventListener('click', async e => {
  try { await navigator.clipboard.writeText(citeText().replace(/\s+/g, ' ')); e.target.textContent = 'copied ✓' }
  catch { e.target.textContent = 'select it above ↑' }
  setTimeout(() => { e.target.textContent = 'copy citation' }, 1800)
})

// ── the shell ──────────────────────────────────────────────────────────────
const term = $('#term'), out = $('#termOut'), inp = $('#termIn')
const LINKS = {
  github: 'https://github.com/markvrma', linkedin: 'https://www.linkedin.com/in/markvrma', medium: 'https://markvrma.medium.com/',
  cv: '/files/mark_verma.pdf', mail: 'mailto:markvrma@gmail.com', lab: '/typeset/', paper: 'https://ieeexplore.ieee.org/document/10119431',
}
const SECTIONS = { work: 'work', paper: 'paper', projects: 'projects', skills: 'skills', edu: 'edu', contact: 'contact', home: 'hi' }
document.querySelectorAll('.proj').forEach((el, i) => { el.dataset.i = i })
const projects = () => [...document.querySelectorAll('.proj')].sort((a, b) => a.dataset.i - b.dataset.i).map(el => {
  const a = el.querySelector('h3 a')
  const name = a.textContent.split(' — ')[0].toLowerCase().replace(/\s+/g, '-')
  return { name, href: a.getAttribute('href'), desc: el.querySelector('.desc').textContent.trim() }
})
const history = []
let hIdx = 0

function print(text, cls) {
  const line = document.createElement('div')
  if (cls) line.className = cls
  // turn urls and paths into links
  for (const part of String(text).split(/((?<=^|\s)(?:https?:\/\/|mailto:|\/)[^\s)]+)/)) {
    if (/^(https?:\/\/|mailto:|\/)./.test(part)) {
      const a = document.createElement('a'); a.href = part; a.textContent = part
      if (part.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener' }
      line.append(a)
    } else line.append(part)
  }
  out.append(line)
  out.scrollTop = out.scrollHeight
}
const go = href => href.startsWith('http') ? window.open(href, '_blank', 'noopener') : (location.href = href)

const COMMANDS = {
  help: () => print(`commands:
  whoami            who is this
  ls [projects]     list sections or projects
  cd <section>      jump to work | paper | projects | skills | edu | contact
  cat <project>     read a project's blurb
  open <name>       open a project, or github | linkedin | medium | cv | mail | lab | paper
  theme [paper|phosphor]
  bitrate           swap the portrait between 1-bit and 24-bit
  weight            bytes this page has cost you
  clear, exit`),
  whoami: () => print('Mark Verma — ML Engineer at 314e Corp, Bengaluru. he/him.\nbuilds MLOps pipelines for healthcare ML; writes Rust and Python for fun.'),
  ls: arg => arg === 'projects' || arg === 'src'
    ? print(projects().map(p => p.name).join('\n'))
    : print('work/  paper/  projects/  skills/  edu/  contact/  cv.pdf  lab/', 'dim'),
  cd: arg => {
    const id = SECTIONS[(arg || 'home').replace(/\/$/, '')]
    if (!id) return print(`cd: no such section: ${arg}`, 'err')
    term.close(); document.getElementById(id).scrollIntoView({ behavior: 'smooth' })
  },
  cat: arg => {
    const p = projects().find(p => p.name.startsWith((arg || '').toLowerCase()))
    p ? print(`${p.desc}\n→ ${p.href}`) : print(`cat: ${arg || ''}: no such project (try: ls projects)`, 'err')
  },
  open: arg => {
    const key = (arg || '').toLowerCase()
    const href = LINKS[key] || projects().find(p => key && p.name.startsWith(key))?.href
    if (!href) return print(`open: nothing called ${arg || '(nothing)'}`, 'err')
    print(`opening ${href}`, 'dim'); go(href)
  },
  theme: arg => {
    const t = arg === 'paper' ? 'light' : arg === 'phosphor' ? 'dark' : isDark() ? 'light' : 'dark'
    setTheme(t); print(`theme → ${t === 'dark' ? 'phosphor' : 'paper'}`, 'dim')
  },
  bitrate: () => { toggleBitrate(); print('toggled the portrait.', 'dim') },
  weight: () => print(`${(bytes / 1024).toFixed(1)} KB over ${seen.size} requests. no webfonts, no trackers.`),
  date: () => print(new Date().toString()),
  echo: (arg, rest) => print(rest),
  uname: () => print('markvrma.github.io · static html · no build step · no framework'),
  sudo: (arg, rest) => rest === 'hire mark'
    ? (print('[sudo] permission granted. opening your mail client…'), go('mailto:markvrma@gmail.com?subject=Let%27s%20work%20together'))
    : print('mark is not in the sudoers file. this incident will be reported.', 'err'),
  rm: () => print('nice try.', 'err'),
  clear: () => { out.textContent = '' },
  exit: () => term.close(),
}
COMMANDS.cv = () => COMMANDS.open('cv')
COMMANDS.mail = () => COMMANDS.open('mail')

function run(raw) {
  const line = raw.trim()
  print(`$ ${line}`, 'dim')
  if (!line) return
  history.push(line); hIdx = history.length
  const [cmd, arg] = line.split(/\s+/)
  const rest = line.slice(cmd.length).trim()
  const fn = COMMANDS[cmd.toLowerCase()]
  fn ? fn(arg, rest) : print(`${cmd}: command not found. try help`, 'err')
}
function openTerm() {
  if (term.open) return
  term.showModal()
  if (!out.childElementCount) print('markvrma.github.io — type help. esc to leave.', 'dim')
  inp.focus()
}
$('#termBtn').addEventListener('click', openTerm)
$('#termClose').addEventListener('click', () => term.close())
$('#termForm').addEventListener('submit', e => { e.preventDefault(); run(inp.value); inp.value = '' })
inp.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' && hIdx > 0) { inp.value = history[--hIdx]; e.preventDefault() }
  else if (e.key === 'ArrowDown') { hIdx = Math.min(history.length, hIdx + 1); inp.value = history[hIdx] || '' }
  else if (e.key === 'Tab') {
    e.preventDefault()
    const [cmd, arg = ''] = inp.value.split(/\s+/)
    const pool = inp.value.includes(' ') ? [...projects().map(p => p.name), ...Object.keys(LINKS), ...Object.keys(SECTIONS)] : Object.keys(COMMANDS)
    const hit = pool.filter(w => w.startsWith(inp.value.includes(' ') ? arg : cmd))
    if (hit.length === 1) inp.value = inp.value.includes(' ') ? `${cmd} ${hit[0]}` : hit[0] + ' '
    else if (hit.length) print(hit.join('  '), 'dim')
  }
})
term.addEventListener('click', e => { if (e.target === term) term.close() })
document.addEventListener('keydown', e => {
  if ((e.key === '/' || e.key === '`') && !e.target.closest('input, textarea, [contenteditable]') && !e.metaKey && !e.ctrlKey) {
    e.preventDefault(); openTerm()
  }
})

// ── pretext enhancements, only where the engine can run ────────────────────
if (typeof Intl !== 'undefined' && Intl.Segmenter) import('./typeset.js').catch(err => console.warn('typeset skipped:', err))
