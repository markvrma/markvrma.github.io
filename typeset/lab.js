// unreflowed — a pretext lab.
// Every text line on this page is positioned by pretext, then drawn. The only
// DOM measurements are ResizeObserver sizes, the hero title's rects (on resize),
// and Plate IV's deliberate offsetHeight reads.
import {
  prepare, layout, prepareWithSegments, layoutNextLineRange, materializeLineRange,
  walkLineRanges, layoutWithLines, measureLineStats, measureNaturalWidth,
} from '../assets/js/pretext/layout.js'

const SERIF = '"Fraunces", Georgia, serif'
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace'
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches
const START = { segmentIndex: 0, graphemeIndex: 0 }
const $ = s => document.querySelector(s)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const lerp = (a, b, t) => a + (b - a) * t
const smooth = t => t * t * (3 - 2 * t)
const now = () => performance.now()

const C = {
  bg: '#0f0e0c', bg2: '#171512', ink: '#efe8da', ink2: '#b9b0a0', muted: '#7a7266',
  line: '#2c2823', accent: '#ff5a36', accent2: '#7fd1b9', gold: '#e8b44a',
}
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
const mixA = (a, b, t) => a.map((v, i) => lerp(v, b[i], t))
const mix = (a, b, t) => `rgb(${mixA(a, b, t).map(Math.round).join(',')})`
const INK = rgb(C.ink), BASE = rgb('#8a8272'), ACC = rgb(C.accent), TEAL = rgb(C.accent2)

function fmtMs(ms) {
  if (ms <= 0) return '<0.1 ms' // below the (coarsened) timer resolution
  if (ms < 0.1) return `${(ms * 1000).toFixed(1)} µs`
  if (ms < 10) return `${ms.toFixed(2)} ms`
  return `${ms.toFixed(1)} ms`
}

// prepare() is the expensive step, so every (text, font) pair is prepared once.
const preparedCache = new Map()
function prepped(text, font) {
  const key = font + '\u0000' + text
  let p = preparedCache.get(key)
  if (!p) preparedCache.set(key, p = prepareWithSegments(text, font))
  return p
}

// A canvas that tracks its CSS size through ResizeObserver (no per-frame reads).
function surface(canvas, onResize) {
  const s = { canvas, ctx: canvas.getContext('2d'), w: 0, h: 0, dpr: 1 }
  new ResizeObserver(([e]) => {
    s.w = e.contentRect.width
    s.h = e.contentRect.height
    s.dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(s.w * s.dpr)
    canvas.height = Math.round(s.h * s.dpr)
    s.ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0)
    onResize && onResize(s)
  }).observe(canvas)
  return s
}

// One rAF loop; scenes only tick while on screen. dt is in 60fps frames.
const scenes = []
function scene(el, tick) {
  const sc = { tick, visible: false }
  scenes.push(sc)
  new IntersectionObserver(([e]) => { sc.visible = e.isIntersecting }, { rootMargin: '80px' }).observe(el)
  return sc
}
let lastT = now()
function frame(t) {
  const dt = Math.min(3, (t - lastT) / (1000 / 60))
  lastT = t
  for (const sc of scenes) if (sc.visible) sc.tick(dt, t)
  requestAnimationFrame(frame)
}

// Subtract blocked intervals from [lo, hi]; returns slots tagged with what bounds them.
function freeSlots(lo, hi, blocked, minW) {
  blocked.sort((a, b) => a[0] - b[0])
  const out = []
  let x = lo, leftWall = true
  for (const [a, b] of blocked) {
    if (b <= x) continue
    if (a > x && Math.min(a, hi) - x >= minW) out.push({ l: x, r: Math.min(a, hi), leftWall, rightWall: false })
    x = Math.max(x, b)
    leftWall = false
    if (x >= hi) break
  }
  if (hi - x >= minW) out.push({ l: x, r: hi, leftWall, rightWall: true })
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// I · Gravity well — the bio flows around orbs, the cursor lens, and the title.
// ─────────────────────────────────────────────────────────────────────────────
const BIO = `I'm Mark, an ML engineer at 314e Corp in Bengaluru. I build and operate MLOps pipelines for healthcare ML systems: orchestration, distributed data processing, and model serving at scale. I took a fine-tuned 27B vision-language model to 0.96 test accuracy across 26 clinical entity types in production. I wrote a model-agnostic VLM fine-tuning package on SkyPilot, Temporal and ClearML that trains Gemma 3 and Qwen through one dispatch layer. I built the human-in-the-loop retraining loop, from reviewer feedback to stratified datasets to automated deployment, gated by a per-entity F1 regression check. I built a weekly drift monitor that tells genuine model regression apart from reviewers changing their labelling conventions, two causes that look identical in F1 and need opposite fixes. I trained a calibrated XGBoost confidence model on 99,427 reviewed extractions, which retired 83% of manual entity review. I moved serving from Transformers to vLLM to SGLang and reached 64 concurrent jobs per worker. I cut training from 90 hours to 25 by replacing an iterable dataset with lazy map-style loading. Outside work I write low-level Rust and Python for fun: rumpy, a zero-dependency NumPy written from scratch; msm, a terminal YouTube Music player; and ML models built from first principles, without the high-level abstractions. This paragraph is never measured by the browser. Pretext computes every line and a canvas draws it, sixty times a second. ✦ `

function heroScene() {
  const hero = $('#hero'), canvas = $('#heroCanvas')
  let font, lh, small, titleRects = [], lensR = 100
  const s = surface(canvas, setup)

  const ORBS = [
    { label: '0.96', sub: 'test accuracy', r: 66, hx: .70, hy: .36, ax: .10, ay: .13, fx: .00021, fy: .00017, ph: 0 },
    { label: '64×', sub: 'concurrent jobs', r: 50, hx: .86, hy: .66, ax: .06, ay: .11, fx: .00027, fy: .00023, ph: 2 },
    { label: '90→25h', sub: 'training time', r: 58, hx: .46, hy: .74, ax: .12, ay: .07, fx: .00018, fy: .00025, ph: 4 },
    { label: '83%', sub: 'review retired', r: 44, hx: .90, hy: .24, ax: .05, ay: .08, fx: .0003, fy: .0002, ph: 1 },
  ]
  const SPAWN = ['loss', 'grad', 'attn', 'KV', 'fp16', 'LoRA', 'NaN', 'ε', 'Adam', 'τ', 'top-k', 'ReLU']
  let orbs = []
  const ptr = { x: 0, y: 0, in: false, down: null, drag: null, lastX: 0, lastY: 0, vx: 0, vy: 0 }
  const lens = { x: 0, y: 0, p: 0 }
  let spawnIdx = 0, layoutAvg = 0, stats = { lines: 0, slots: 0 }

  function home(o, t) {
    const tt = REDUCED ? 0 : t
    return [s.w * (o.hx + o.ax * Math.sin(tt * o.fx + o.ph)), s.h * (o.hy + o.ay * Math.cos(tt * o.fy + o.ph))]
  }

  function setup() {
    small = s.w < 640
    font = `400 ${small ? 15 : 17}px ${SERIF}`
    lh = small ? 22 : 26
    lensR = small ? 64 : Math.min(110, s.w * 0.1)
    prepped(BIO, font)
    measureTitle()
    if (!orbs.length) {
      orbs = ORBS.map(o => ({ ...o, x: 0, y: 0, vx: 0, vy: 0 }))
      for (const o of orbs) [o.x, o.y] = home(o, now())
    }
    for (const o of orbs) o.rr = o.r * (small ? 0.68 : 1)
  }

  // The title stays real DOM (selectable, indexable). Its line boxes are read
  // once per resize and become rectangular obstacles.
  function measureTitle() {
    const hr = hero.getBoundingClientRect()
    titleRects = []
    for (const el of $('#heroTitle').children) {
      const range = document.createRange()
      range.selectNodeContents(el)
      for (const r of range.getClientRects()) {
        if (r.width < 2) continue
        titleRects.push({ x: r.left - hr.left, y: r.top - hr.top, w: r.width, h: r.height })
      }
    }
  }
  document.fonts.addEventListener('loadingdone', () => s.w && measureTitle())

  // pointer
  const hit = (x, y) => { for (let i = orbs.length - 1; i >= 0; i--) if (Math.hypot(orbs[i].x - x, orbs[i].y - y) < orbs[i].rr) return orbs[i]; return null }
  canvas.addEventListener('pointermove', e => {
    ptr.vx = e.offsetX - ptr.x; ptr.vy = e.offsetY - ptr.y
    ptr.x = e.offsetX; ptr.y = e.offsetY; ptr.in = true
    if (ptr.drag) { ptr.drag.x = ptr.x; ptr.drag.y = ptr.y }
  })
  canvas.addEventListener('pointerdown', e => {
    ptr.x = e.offsetX; ptr.y = e.offsetY; ptr.in = true
    if (lens.p < 0.05) { lens.x = ptr.x; lens.y = ptr.y }
    canvas.setPointerCapture(e.pointerId)
    ptr.drag = hit(ptr.x, ptr.y)
    ptr.down = ptr.drag ? null : { x: ptr.x, y: ptr.y }
  })
  canvas.addEventListener('pointerup', e => {
    if (ptr.drag) { ptr.drag.vx = ptr.vx; ptr.drag.vy = ptr.vy; ptr.drag = null }
    else if (ptr.down && Math.hypot(ptr.x - ptr.down.x, ptr.y - ptr.down.y) < 6) {
      const r = (small ? 26 : 34) + Math.random() * 16
      const o = { label: SPAWN[spawnIdx++ % SPAWN.length], sub: '', r, rr: r, hx: ptr.x / s.w, hy: ptr.y / s.h, ax: .02, ay: .03,
        fx: .0004 + Math.random() * .0003, fy: .0003 + Math.random() * .0003, ph: Math.random() * 6, x: ptr.x, y: ptr.y, vx: 0, vy: -4, spawned: true }
      orbs.push(o)
      const spawned = orbs.filter(o => o.spawned)
      if (spawned.length > 6) orbs.splice(orbs.indexOf(spawned[0]), 1)
    }
    ptr.down = null
    if (e.pointerType !== 'mouse') ptr.in = false
  })
  canvas.addEventListener('pointerleave', () => { ptr.in = false })
  canvas.addEventListener('pointercancel', () => { ptr.in = false; ptr.drag = null })

  function physics(dt, t) {
    const lensOn = ptr.in && !ptr.drag
    lens.p += ((lensOn ? 1 : 0) - lens.p) * 0.12 * dt
    lens.x += (ptr.x - lens.x) * 0.3 * dt
    lens.y += (ptr.y - lens.y) * 0.3 * dt
    for (const o of orbs) {
      if (o === ptr.drag) continue
      const [hx, hy] = home(o, t)
      o.vx += (hx - o.x) * 0.006 * dt
      o.vy += (hy - o.y) * 0.006 * dt
      // the lens shoves orbs out of its way
      const dx = o.x - lens.x, dy = o.y - lens.y, d = Math.hypot(dx, dy) || 1, min = o.rr + lensR * lens.p + 10
      if (lens.p > 0.1 && d < min) { o.vx += dx / d * (min - d) * 0.08 * dt; o.vy += dy / d * (min - d) * 0.08 * dt }
      o.vx *= Math.pow(0.9, dt); o.vy *= Math.pow(0.9, dt)
      o.x += o.vx * dt; o.y += o.vy * dt
      if (o.x < o.rr) { o.x = o.rr; o.vx = Math.abs(o.vx) * 0.6 }
      if (o.x > s.w - o.rr) { o.x = s.w - o.rr; o.vx = -Math.abs(o.vx) * 0.6 }
      if (o.y < o.rr) { o.y = o.rr; o.vy = Math.abs(o.vy) * 0.6 }
      if (o.y > s.h - o.rr) { o.y = s.h - o.rr; o.vy = -Math.abs(o.vy) * 0.6 }
    }
    // orbs are shoved off the title so it stays readable
    for (const o of orbs) for (const r of titleRects) {
      if (o === ptr.drag) continue
      const nx = clamp(o.x, r.x, r.x + r.w), ny = clamp(o.y, r.y, r.y + r.h), dx = o.x - nx, dy = o.y - ny, d = Math.hypot(dx, dy)
      if (d < o.rr + 8) {
        if (d > 0.01) { o.x += dx / d * (o.rr + 8 - d) * 0.3; o.y += dy / d * (o.rr + 8 - d) * 0.3 }
        else o.x += 4 * dt
      }
    }
    for (let i = 0; i < orbs.length; i++) for (let j = i + 1; j < orbs.length; j++) {
      const a = orbs[i], b = orbs[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, min = a.rr + b.rr + 12
      if (d < min) {
        const push = (min - d) * 0.5, ux = dx / d, uy = dy / d
        if (a !== ptr.drag) { a.x -= ux * push; a.y -= uy * push }
        if (b !== ptr.drag) { b.x += ux * push; b.y += uy * push }
      }
    }
  }

  function hudRects(ctx) {
    ctx.font = `400 11px ${MONO}`
    const hud = small
      ? `${fmtMs(layoutAvg)} · ${stats.lines} lines · 0 DOM reads`
      : `I · gravity well    layout ${fmtMs(layoutAvg)}/frame    ${stats.lines} lines in ${stats.slots} slots    DOM reads 0`
    const hint = small ? 'drag · tap to spawn' : 'move to bend the text · drag an orb · click to spawn one'
    const g = small ? 16 : Math.max(16, Math.min(48, s.w * 0.04))
    const hw = ctx.measureText(hud).width + 20, nw = ctx.measureText(hint).width + 20
    const out = [{ x: g, y: s.h - 44, w: hw, h: 26, text: hud, strong: true }]
    if (!small || s.w > hw + nw + 3 * g) out.push({ x: s.w - g - nw, y: s.h - 44, w: nw, h: 26, text: hint })
    else out.push({ x: g, y: s.h - 76, w: nw, h: 26, text: hint })
    return out
  }

  function tick(dt, t) {
    const { ctx, w, h } = s
    if (!w) return
    physics(dt, t)
    const prepared = prepped(BIO, font)
    const huds = hudRects(ctx)
    const circles = orbs.map(o => ({ x: o.x, y: o.y, r: o.rr }))
    if (lens.p > 0.02) circles.push({ x: lens.x, y: lens.y, r: lensR * smooth(lens.p), lens: true })
    const rects = titleRects.concat(huds)
    const margin = small ? 16 : Math.max(16, Math.min(48, w * 0.04))
    const pad = small ? 8 : 12

    // Pass 1: layout only (timed).
    const t0 = now()
    const placed = []
    let cursor = START, slotsN = 0
    for (let y = 58; y + lh <= h - 6; y += lh) {
      const mid = y + lh / 2, blocked = []
      for (const c of circles) {
        const dy = Math.max(0, Math.abs(c.y - mid) - lh / 2), R = c.r + pad
        if (dy < R) { const half = Math.sqrt(R * R - dy * dy); blocked.push([c.x - half, c.x + half]) }
      }
      for (const r of rects) if (r.y < y + lh && r.y + r.h > y) blocked.push([r.x - pad, r.x + r.w + pad])
      for (const slot of freeSlots(margin, w - margin, blocked, small ? 34 : 44)) {
        let range = layoutNextLineRange(prepared, cursor, slot.r - slot.l)
        if (!range) { cursor = START; range = layoutNextLineRange(prepared, cursor, slot.r - slot.l) }
        if (!range) continue
        // a slot too narrow for the next word stays empty rather than splitting it
        if (range.end.graphemeIndex > 0 && slot.r - slot.l < 160) continue
        placed.push({ slot, y, line: materializeLineRange(prepared, range) })
        cursor = range.end
        slotsN++
      }
    }
    const took = now() - t0
    layoutAvg = layoutAvg ? lerp(layoutAvg, took, 0.05) : took
    stats = { lines: new Set(placed.map(p => p.y)).size, slots: slotsN }

    // Pass 2: paint.
    ctx.clearRect(0, 0, w, h)
    ctx.font = font
    ctx.textBaseline = 'middle'
    const lensC = circles.find(c => c.lens)
    for (const { slot, y, line } of placed) {
      const x = slot.leftWall && !slot.rightWall ? slot.r - line.width
        : !slot.leftWall && !slot.rightWall ? (slot.l + slot.r - line.width) / 2 : slot.l
      const x1 = x + line.width, cy = y + lh / 2
      const near = c => { const dx = Math.max(x - c.x, 0, c.x - x1), dy = cy - c.y; return Math.hypot(dx, dy) - c.r }
      let glow = 0
      for (const c of circles) if (!c.lens) glow = Math.max(glow, clamp(1 - near(c) / 70, 0, 1))
      const heat = lensC ? clamp(1 - near(lensC) / 110, 0, 1) * lens.p : 0
      ctx.fillStyle = mix(mixA(BASE, INK, glow), ACC, heat * 0.95)
      ctx.fillText(line.text, x, cy)
    }

    // orbs
    for (const o of orbs) {
      ctx.beginPath(); ctx.arc(o.x, o.y, o.rr, 0, Math.PI * 2)
      ctx.fillStyle = o.spawned ? '#1f1c18' : '#1b1916'; ctx.fill()
      ctx.lineWidth = 1; ctx.strokeStyle = o.spawned ? C.accent2 : '#4a443b'; ctx.stroke()
      ctx.textAlign = 'center'
      ctx.fillStyle = o.spawned ? C.accent2 : C.ink
      ctx.font = `italic 700 ${Math.round(o.rr * (o.sub ? 0.4 : 0.5))}px ${SERIF}`
      ctx.fillText(o.label, o.x, o.y - (o.sub ? o.rr * 0.08 : 0))
      if (o.sub) { ctx.font = `400 ${small ? 8 : 10}px ${MONO}`; ctx.fillStyle = C.muted; ctx.fillText(o.sub, o.x, o.y + o.rr * 0.34) }
      ctx.textAlign = 'left'
    }
    // lens
    if (lensC) {
      const g = ctx.createRadialGradient(lensC.x, lensC.y, lensC.r * 0.2, lensC.x, lensC.y, lensC.r + 30)
      g.addColorStop(0, 'rgba(255,90,54,0.10)'); g.addColorStop(0.8, 'rgba(255,90,54,0.05)'); g.addColorStop(1, 'rgba(255,90,54,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lensC.x, lensC.y, lensC.r + 30, 0, Math.PI * 2); ctx.fill()
      ctx.setLineDash([3, 5]); ctx.strokeStyle = `rgba(255,90,54,${0.8 * lens.p})`; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.arc(lensC.x, lensC.y, lensC.r, t * 0.0004, t * 0.0004 + Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 3, 0, Math.PI * 2); ctx.fill()
    }
    // hud, painted on canvas so it can be an obstacle without a DOM read
    ctx.font = `400 11px ${MONO}`
    for (const r of huds) {
      ctx.fillStyle = 'rgba(15,14,12,0.85)'; ctx.strokeStyle = C.line
      ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 6); ctx.fill(); ctx.stroke()
      ctx.fillStyle = r.strong ? C.accent2 : C.muted
      ctx.fillText(r.text, r.x + 10, r.y + r.h / 2 + 1)
    }
  }
  scene(hero, tick)
}

// ─────────────────────────────────────────────────────────────────────────────
// II · Pour — text fills a rasterised, morphing silhouette.
// ─────────────────────────────────────────────────────────────────────────────
const POUR = `from first principles: a tensor is a flat buffer, a shape, and a list of strides; broadcasting is a stride of zero; a reduction is a loop that forgets an axis; matmul is three loops and the only interesting question is their order, because ikj walks memory the way the cache wants to be walked. backpropagation is the chain rule with bookkeeping. attention is a weighted average whose weights are learned. a confidence score is only useful once it is calibrated. a regression gate should scale its tolerance to the score it is protecting. text layout, it turns out, is also just arithmetic, once someone has measured every segment for you. `
const VOID = `negative space is also a column. the same engine that fills the shape is filling the room around it with a second paragraph, one slot at a time, never asking the browser where anything goes. `

function pourScene() {
  const stage = $('#pour'), canvas = $('#pourCanvas')
  const mask = document.createElement('canvas')
  const m = mask.getContext('2d', { willReadFrequently: true })
  const MS = 0.5 // mask resolution relative to CSS px
  let grad, font = `400 13px ${SERIF}`, lh = 16
  const s = surface(canvas, () => {
    mask.width = Math.ceil(s.w * MS); mask.height = Math.ceil(s.h * MS)
    grad = s.ctx.createLinearGradient(0, 0, s.w, s.h)
    grad.addColorStop(0, C.accent); grad.addColorStop(0.5, C.gold); grad.addColorStop(1, C.accent2)
    const narrow = s.w < 600
    font = `400 ${narrow ? 11 : 13}px ${SERIF}`; lh = narrow ? 13 : 16
    prepped(POUR, font)
  })

  const heart = (c, w, h) => {
    const k = Math.min(w, h) / 36
    c.beginPath()
    for (let i = 0; i <= 120; i++) {
      const a = i / 120 * Math.PI * 2
      const x = 16 * Math.sin(a) ** 3, y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))
      i ? c.lineTo(x * k, y * k + k) : c.moveTo(x * k, y * k + k)
    }
    c.fill()
  }
  const SHAPES = [
    { name: 'mv', ch: 'mv', style: 'italic 900' },
    { name: '∇ nabla', ch: '∇', style: '700' },
    { name: 'λ lambda', ch: 'λ', style: '700' },
    { name: '{ } scope', ch: '{ }', style: '900' },
    { name: '∞ epochs', ch: '∞', style: '700' },
    { name: '♥ fin', draw: heart },
  ]
  function drawShape(sh, w, h) {
    if (sh.draw) return sh.draw(m, w * 0.9, h * 0.9)
    const F = 200
    m.font = `${sh.style} ${F}px ${SERIF}`
    if (!sh.mt) {
      const t = m.measureText(sh.ch)
      sh.mt = { l: t.actualBoundingBoxLeft, r: t.actualBoundingBoxRight, a: t.actualBoundingBoxAscent, d: t.actualBoundingBoxDescent }
    }
    const { l, r, a, d } = sh.mt
    const k = Math.min(w * 0.88 / (l + r), h * 0.86 / (a + d))
    m.scale(k, k)
    m.textBaseline = 'alphabetic'
    m.fillText(sh.ch, -(r - l) / 2, (a - d) / 2)
  }

  let from = 0, to = 0, tr = 1, holdUntil = 0, auto = true, pausedUntil = 0
  const ptr = { x: 0, y: 0, in: false, p: 0 }
  canvas.addEventListener('pointermove', e => { ptr.x = e.offsetX; ptr.y = e.offsetY; ptr.in = true })
  canvas.addEventListener('pointerdown', e => { ptr.x = e.offsetX; ptr.y = e.offsetY; ptr.in = true })
  canvas.addEventListener('pointerleave', () => { ptr.in = false })
  canvas.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') ptr.in = false })

  const chips = $('#pourChips'), readout = $('#pourReadout')
  const buttons = SHAPES.map((sh, i) => {
    const b = document.createElement('button')
    b.className = 'chip'; b.textContent = sh.name
    b.onclick = () => { go(i); pausedUntil = now() + 9000 }
    chips.insertBefore(b, readout)
    return b
  })
  function go(i) {
    if (i === to && tr >= 1) return
    from = tr >= 0.5 ? to : from
    to = i; tr = 0
    buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)))
  }
  go(0)
  let frameN = 0, layoutAvg = 0

  function tick(dt, t) {
    const { ctx, w, h } = s
    if (!w) return
    if (tr < 1) { tr = Math.min(1, tr + dt / 80); if (tr >= 1) holdUntil = t + 3200 }
    else if (auto && !REDUCED && t > holdUntil && t > pausedUntil) go((to + 1) % SHAPES.length)
    ptr.p += ((ptr.in ? 1 : 0) - ptr.p) * 0.15 * dt

    // Rasterise: blurred crossfade of the two shapes, thresholded while sampling.
    const mw = mask.width, mh = mask.height, e = smooth(tr)
    const breathe = REDUCED ? 1 : 1 + 0.025 * Math.sin(t * 0.0019)
    const squeeze = (1 - 0.14 * Math.sin(Math.PI * e)) * breathe
    const rot = REDUCED ? 0 : 0.05 * Math.sin(t * 0.0007)
    m.setTransform(1, 0, 0, 1, 0, 0)
    m.globalCompositeOperation = 'source-over'
    m.clearRect(0, 0, mw, mh)
    m.filter = 'blur(4px)'
    m.fillStyle = '#fff'
    const layers = from === to ? [[to, 1]] : [[from, 1 - e], [to, e]]
    for (const [idx, alpha] of layers) {
      m.save(); m.globalAlpha = alpha; m.globalCompositeOperation = 'lighter'
      m.translate(mw / 2, mh / 2); m.rotate(rot); m.scale(squeeze, squeeze)
      drawShape(SHAPES[idx], mw, mh)
      m.restore()
    }
    m.filter = 'none'
    if (ptr.p > 0.02) {
      m.globalCompositeOperation = 'destination-out'
      m.beginPath(); m.arc(ptr.x * MS, ptr.y * MS, (w < 600 ? 34 : 54) * MS * ptr.p, 0, Math.PI * 2); m.fill()
      m.globalCompositeOperation = 'source-over'
    }
    const data = m.getImageData(0, 0, mw, mh).data
    const inside = (x, y) => data[(y * mw + x) * 4 + 3] > 127

    // Two streams: the shape's paragraph fills inside runs, VOID fills the rest.
    const streams = [
      { p: prepped(VOID, font), cursor: START, min: 40 },
      { p: prepped(POUR, font), cursor: START, min: 18 },
    ]
    const fill = (st, l, r, y, inShape) => {
      if (r - l < st.min) return
      let range = layoutNextLineRange(st.p, st.cursor, r - l)
      if (!range) { st.cursor = START; range = layoutNextLineRange(st.p, st.cursor, r - l) }
      if (!range) return
      placed.push({ x: l, y, inShape, text: materializeLineRange(st.p, range).text })
      st.cursor = range.end
    }
    const t0 = now()
    const placed = []
    const edge = w < 600 ? 12 : 22
    for (let y = 8; y + lh <= h - 8; y += lh) {
      const rows = [y + 2, y + lh / 2, y + lh - 2].map(v => clamp(Math.floor(v * MS), 0, mh - 1))
      let runStart = 0, state = rows.every(r => inside(0, r))
      for (let x = 1; x <= mw; x++) {
        const on = x < mw && rows.every(r => inside(x, r))
        if (x < mw && on === state) continue
        const l = runStart / MS, r = x / MS
        // outside runs keep a gap from the shape so the silhouette stays legible
        if (state) fill(streams[1], l + 1, r - 1, y, true)
        else fill(streams[0], Math.max(edge, runStart ? l + 12 : 0), Math.min(w - edge, x < mw ? r - 12 : w), y, false)
        runStart = x; state = on
      }
    }
    const took = now() - t0
    layoutAvg = layoutAvg ? lerp(layoutAvg, took, 0.05) : took

    ctx.clearRect(0, 0, w, h)
    ctx.font = font; ctx.textBaseline = 'middle'
    for (const p of placed) { ctx.fillStyle = p.inShape ? grad : '#3b362f'; ctx.fillText(p.text, p.x, p.y + lh / 2) }
    if (ptr.p > 0.05) {
      ctx.strokeStyle = `rgba(239,232,218,${0.35 * ptr.p})`; ctx.setLineDash([2, 4])
      ctx.beginPath(); ctx.arc(ptr.x, ptr.y, (w < 600 ? 34 : 54) * ptr.p, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
    }
    if (++frameN % 12 === 0) readout.innerHTML = `<b>${placed.length}</b> slots, two paragraphs, filled in <b>${fmtMs(layoutAvg)}</b>/frame`
  }
  scene(stage, tick)
}

// ─────────────────────────────────────────────────────────────────────────────
// III · Shrinkwrap — CSS fit-content vs the tightest width with the same lines.
// ─────────────────────────────────────────────────────────────────────────────
const CHAT = [
  { me: true, t: 'can you make these chat bubbles fit their text?' },
  { me: false, t: 'Sure. CSS gives you width: fit-content, which is exactly right until the text wraps. Then it snaps to max-width and leaves a ragged gutter on the right.' },
  { me: true, t: 'so every bubble that wraps is secretly too wide?' },
  { me: false, t: 'Every one. The fix is the narrowest width that keeps the same number of lines. That is a binary search over walkLineRanges(), which is pure arithmetic with no reflow.' },
  { me: true, t: 'how long does that take' },
  { me: false, t: 'About as long as it took you to read this word.' },
  { me: true, t: 'ship it 🚢' },
]

function shrinkScene() {
  const BFONT = `400 15px ${SERIF}`, BLH = 21, PADX = 13, PADY = 9
  const tCss = $('#threadCss'), tTight = $('#threadTight'), slider = $('#bubbleMax')
  const msgs = CHAT.map(m => {
    const p = prepped(m.t, BFONT)
    const mk = parent => {
      const b = document.createElement('div')
      b.className = 'bubble' + (m.me ? ' me' : '')
      const txt = document.createElement('span'); txt.className = 'txt'; txt.textContent = m.t
      const ghosts = document.createElement('div')
      b.append(ghosts, txt); parent.append(b)
      return { b, ghosts }
    }
    return { ...m, p, natural: measureNaturalWidth(p), css: mk(tCss), tight: mk(tTight) }
  })
  let threadW = 0

  function ghosts(el, widths, boxW) {
    let waste = 0, html = ''
    widths.forEach((lw, i) => {
      const gw = boxW - lw
      if (gw <= 1) return
      waste += gw * BLH
      html += `<div class="ghost" style="top:${PADY + i * BLH}px;width:${gw.toFixed(1)}px"></div>`
    })
    el.innerHTML = html
    return waste
  }

  function update() {
    const maxW = +slider.value
    $('#bubbleMaxVal').textContent = maxW + 'px'
    if (!threadW) return
    const avail = Math.floor(Math.min(maxW, threadW) - 2 * PADX)
    let wasteCss = 0, wasteTight = 0, steps = 0
    const t0 = now()
    for (const m of msgs) {
      const widths = []
      walkLineRanges(m.p, avail, l => widths.push(l.width))
      const n = widths.length
      // What fit-content does: max-content if it fits, otherwise the whole max-width.
      const cssBox = n > 1 ? avail : Math.min(m.natural, avail)
      m.css.b.style.maxWidth = `${avail + 2 * PADX}px`
      wasteCss += ghosts(m.css.ghosts, widths, cssBox)
      // Binary search the narrowest width that still produces n lines.
      let lo = 1, hi = avail
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        steps++
        if (measureLineStats(m.p, mid).lineCount <= n) hi = mid
        else lo = mid + 1
      }
      const tw = []
      walkLineRanges(m.p, lo, l => tw.push(l.width))
      const box = Math.min(avail, Math.ceil(Math.max(...tw)) + 1)
      m.tight.b.style.width = `${box + 2 * PADX}px`
      const tw2 = []
      walkLineRanges(m.p, box, l => tw2.push(l.width))
      wasteTight += ghosts(m.tight.ghosts, tw2, box)
    }
    const took = now() - t0
    const k = v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)
    $('#wasteCss').textContent = `dead space ${k(wasteCss)} px²`
    $('#wasteTight').textContent = `dead space ${k(wasteTight)} px²`
    $('#wrapReadout').innerHTML = `<b>${steps}</b> trial layouts in <b>${fmtMs(took)}</b>`
  }
  slider.addEventListener('input', update)
  new ResizeObserver(([e]) => { threadW = e.contentRect.width; update() }).observe(tTight)
}

// ─────────────────────────────────────────────────────────────────────────────
// IV · The height oracle — predicted vs. rendered heights, as a parity plot.
// ─────────────────────────────────────────────────────────────────────────────
const CORPUS = [
  'Built and owned the entity-extraction ML stack behind a clinical document-processing product, taking a fine-tuned 27B vision-language model to 0.96 test accuracy across 26 clinical entity types in production.',
  'Wrote a 7,600-line model-agnostic VLM fine-tuning package on SkyPilot, Temporal and ClearML that trains Gemma 3, Qwen3.5-9B and Qwen3.6-27B through one model-family dispatch layer.',
  'Built the human-in-the-loop retraining loop from reviewer feedback through stratified dataset construction to automated deployment, gated by a per-entity F1 regression check.',
  'Built a weekly accuracy-drift monitor separating genuine model regression from reviewer labelling-convention change — two causes indistinguishable in F1 that demand opposite responses.',
  'Trained a calibrated XGBoost confidence model over logprobs, OCR grounding and text embeddings on 99,427 reviewed extractions, halving the false-approval rate (1.4% vs 2.7%).',
  'Migrated entity-extraction serving from Transformers to vLLM to SGLang on RunPod serverless, reaching 64 concurrent jobs per worker with continuous batching.',
  'Cut model training time from 90 hours to 25 hours by replacing an iterable dataset with map-style lazy loading and sizing batches from available VRAM.',
  'A zero-dependency NumPy, written from scratch in pure Rust — flat buffer + shape + strides. Reimplements broadcasting, axis reductions, and matmul from first principles.',
  'A terminal player that browses YouTube Music and your local library side by side, plays audio through mpv over its JSON IPC socket, and scrobbles to Last.fm.',
  'Stop choosing, start watching — rolls a random unseen episode from the shows you follow and never repeats one until the pool is exhausted.',
  'Scores a resume against a hand-written hiring rubric, then matches it against a pasted job description with an open-weights NLI model, entirely in the browser.',
  'Trained a CNN to 98.4% accuracy for medical-waste classification and deployed it as an interactive TensorFlow.js web application.',
  'Core ML/DL models — backpropagation, CNNs, transformers — implemented from first principles in pure PyTorch, without high-level abstractions.',
  'Hi, I\'m Mark.',
  'Bengaluru, India · 314e Corp · Software Development Engineer (Jan 2025 – Present)',
]

function evalScene() {
  const stage = $('#parity'), canvas = $('#parityCanvas'), tip = $('#parityTip'), probe = $('#probe'), btn = $('#runEval')
  let results = null, revealStart = 0, hover = -1, dirty = true
  const s = surface(canvas, () => { dirty = true })
  const M = { l: 54, r: 16, t: 18, b: 44 }

  function run() {
    btn.disabled = true
    const N = 400, SIZES = [13, 14, 15, 16, 17, 18, 19]
    const samples = []
    for (let i = 0; i < N; i++) {
      const size = SIZES[(Math.random() * SIZES.length) | 0]
      samples.push({ text: CORPUS[(Math.random() * CORPUS.length) | 0], size, lh: Math.round(size * 1.45), w: 110 + ((Math.random() * 460) | 0) })
    }
    // prepare(): the one-time cost, amortised across every width.
    const tp = now()
    const handles = new Map()
    for (const sm of samples) {
      const key = sm.size + '|' + sm.text
      if (!handles.has(key)) handles.set(key, prepare(sm.text, `400 ${sm.size}px ${SERIF}`))
      sm.h = handles.get(key)
    }
    const prepMs = now() - tp
    // layout(): the hot path. Repeat until the timer has something to measure.
    let reps = 0
    const tl = now()
    do { for (const sm of samples) sm.pred = layout(sm.h, sm.w, sm.lh).height; reps++ } while (now() - tl < 25)
    const layoutPer = (now() - tl) / (reps * N)
    // Ground truth, the expensive way: write a style, force a reflow, read it back.
    const td = now()
    for (const sm of samples) {
      probe.style.cssText = `width:${sm.w}px;font:400 ${sm.size}px/${sm.lh}px ${SERIF};font-optical-sizing:none`
      probe.textContent = sm.text
      sm.act = probe.offsetHeight
    }
    const domPer = (now() - td) / N
    probe.textContent = ''

    const exact = samples.filter(sm => sm.pred === sm.act).length
    const mae = samples.reduce((a, sm) => a + Math.abs(sm.pred - sm.act), 0) / N
    $('#tExact').textContent = `${(exact / N * 100).toFixed(1)}%`
    $('#tMae').textContent = mae.toFixed(2)
    $('#tPre').textContent = fmtMs(layoutPer)
    $('#tPreS').textContent = `per paragraph · + ${fmtMs(prepMs)} one-time prepare()`
    $('#tDom').textContent = fmtMs(domPer)
    $('#tDomS').textContent = `per paragraph · ${Math.round(domPer / layoutPer).toLocaleString()}× slower`
    const worst = samples.reduce((a, b) => Math.abs(b.pred - b.act) > Math.abs(a.pred - a.act) ? b : a)
    const typical = samples.reduce((a, b) => Math.abs(b.act - 110) < Math.abs(a.act - 110) ? b : a)
    const show = worst.pred !== worst.act ? worst : typical
    const el = $('#tWorst')
    el.style.cssText = `font-size:${show.size}px;line-height:${show.lh}px;width:${Math.min(show.w, el.parentElement.clientWidth - 40)}px`
    el.textContent = show.text
    el.previousElementSibling.textContent = worst.pred !== worst.act
      ? `worst sample · off by ${Math.abs(worst.pred - worst.act)}px at ${worst.w}px wide`
      : `no misses · e.g. ${typical.w}px wide, ${typical.size}px type → predicted ${typical.pred}px, rendered ${typical.act}px`
    $('#evalReadout').textContent = `n=${N} · ${handles.size} prepared handles · widths 110–570px · Fraunces 13–19px`
    results = samples
    revealStart = now(); dirty = true
    btn.disabled = false; btn.textContent = 'run again · n=400'
  }
  btn.addEventListener('click', run)
  let autoRan = false
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !autoRan) { autoRan = true; setTimeout(run, 250) } }, { threshold: 0.35 }).observe(stage)

  let scale = 400, pts = []
  canvas.addEventListener('pointermove', e => {
    let best = -1, bd = 14
    pts.forEach((p, i) => { const d = Math.hypot(p.x - e.offsetX, p.y - e.offsetY); if (d < bd) { bd = d; best = i } })
    if (best !== hover) { hover = best; dirty = true }
    if (best >= 0) {
      const sm = results[best], p = pts[best]
      tip.innerHTML = `predicted <b>${sm.pred}px</b> · actual <b>${sm.act}px</b><br>${sm.w}px wide · ${sm.size}/${sm.lh}px<br><span style="color:${C.muted}">${sm.text.slice(0, 70)}…</span>`
      tip.style.left = `${Math.min(p.x + 12, s.w - 250)}px`; tip.style.top = `${Math.max(4, p.y - 70)}px`; tip.style.opacity = 1
    } else tip.style.opacity = 0
  })
  canvas.addEventListener('pointerleave', () => { hover = -1; tip.style.opacity = 0; dirty = true })

  function tick(dt, t) {
    const { ctx, w, h } = s
    const revealing = results && t - revealStart < 1500
    if (!w || (!dirty && !revealing)) return
    dirty = false
    ctx.clearRect(0, 0, w, h)
    const pw = w - M.l - M.r, ph = h - M.t - M.b
    if (results) scale = Math.ceil(Math.max(...results.map(r => Math.max(r.act, r.pred))) * 1.08 / 50) * 50
    const X = v => M.l + v / scale * pw, Y = v => M.t + ph - v / scale * ph
    // axes + grid
    ctx.font = `400 10px ${MONO}`; ctx.textBaseline = 'middle'
    const step = scale / 5
    for (let v = 0; v <= scale + 0.1; v += step) {
      ctx.strokeStyle = C.line; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(M.l, Y(v)); ctx.lineTo(M.l + pw, Y(v)); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(X(v), M.t); ctx.lineTo(X(v), M.t + ph); ctx.stroke()
      ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.fillText(Math.round(v), M.l - 8, Y(v))
      ctx.textAlign = 'center'; ctx.fillText(Math.round(v), X(v), M.t + ph + 14)
    }
    ctx.fillStyle = C.ink2; ctx.textAlign = 'center'
    ctx.fillText('actual height · DOM offsetHeight (px)', M.l + pw / 2, h - 10)
    ctx.save(); ctx.translate(14, M.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('predicted · pretext layout() (px)', 0, 0); ctx.restore()
    // y = x
    ctx.setLineDash([4, 4]); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(scale), Y(scale)); ctx.stroke(); ctx.setLineDash([])
    ctx.textAlign = 'left'
    if (!results) { ctx.fillStyle = C.muted; ctx.fillText('waiting for the eval…', M.l + 12, M.t + 14); return }
    // points
    const shown = Math.floor(results.length * smooth(clamp((t - revealStart) / 1500, 0, 1)))
    pts = results.map(r => ({ x: X(r.act), y: Y(r.pred) }))
    let exact = 0, off = 0
    for (let i = 0; i < shown; i++) {
      const r = results[i], p = pts[i], ok = r.pred === r.act
      ok ? exact++ : off++
      ctx.beginPath(); ctx.arc(p.x, p.y, i === hover ? 6 : 4, 0, Math.PI * 2)
      ctx.fillStyle = ok ? C.accent2 : C.accent; ctx.fill()
      ctx.lineWidth = 2; ctx.strokeStyle = C.bg2; ctx.stroke()
    }
    // legend
    const lx = M.l + 12, ly = M.t + 14
    ctx.fillStyle = C.accent2; ctx.beginPath(); ctx.arc(lx + 4, ly, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = C.ink2; ctx.fillText(`exact (${exact})`, lx + 14, ly)
    ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(lx + 4, ly + 18, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = C.ink2; ctx.fillText(`off by ≥1px (${off})`, lx + 14, ly + 18)
  }
  scene(stage, tick)
}

// ─────────────────────────────────────────────────────────────────────────────
// V · Shatter & reflow — words are bodies with springs to their laid-out slots.
// ─────────────────────────────────────────────────────────────────────────────
const INTRO = `I'm an ML engineer at 314e Corp in Bengaluru, where I build and operate MLOps pipelines for healthcare ML systems — orchestration, distributed data processing, and model serving at scale. Outside of work I write low-level Rust and Python for fun: reimplementing NumPy from scratch, and building terminal tools I actually use every day.`

function shatterScene() {
  const stage = $('#shatter'), canvas = $('#shatterCanvas'), dropBtn = $('#dropBtn'), readout = $('#shatterReadout')
  let font, lh, colW = 0, x0 = 28, y0 = 44, lines = [], words = [], mode = 'flow', ground, layoutMs = 0
  const s = surface(canvas, () => {
    const narrow = s.w < 600
    font = `400 ${narrow ? 16 : 19}px ${SERIF}`; lh = narrow ? 24 : 30
    x0 = narrow ? 16 : 32
    colW = clamp(colW || Math.min(560, s.w - 120), 160, s.w - x0 - 30)
    relayout(true)
    if (mode === 'fall') { ground = new Float32Array(Math.ceil(s.w) + 1).fill(s.h - 10); for (const wd of words) wd.rest = false }
  })
  const ptr = { x: -999, y: -999, handle: false, over: false }

  function relayout(snap) {
    const { ctx } = s
    const prepared = prepped(INTRO, font)
    const t0 = now()
    lines = layoutWithLines(prepared, colW, lh).lines
    layoutMs = now() - t0
    ctx.font = font
    let k = 0
    lines.forEach((line, li) => {
      for (const m of line.text.matchAll(/\S+/g)) {
        const tx = x0 + ctx.measureText(line.text.slice(0, m.index)).width, ty = y0 + li * lh
        let wd = words[k]
        if (!wd) wd = words[k] = { x: tx, y: ty, vx: 0, vy: 0, a: 0, va: 0, delay: 0, rest: false }
        wd.text = m[0]; wd.w = ctx.measureText(m[0]).width; wd.tx = tx; wd.ty = ty; wd.line = li
        if (snap && mode === 'flow') { wd.x = tx; wd.y = ty }
        k++
      }
    })
    words.length = k
    readout.innerHTML = `maxWidth <b>${Math.round(colW)}px</b> · <b>${lines.length}</b> lines · <b>${k}</b> words · layoutWithLines() <b>${fmtMs(layoutMs)}</b>`
  }

  function drop() {
    mode = 'fall'
    ground = new Float32Array(Math.ceil(s.w) + 1).fill(s.h - 10)
    for (const wd of words) {
      wd.rest = false
      wd.delay = (lines.length - wd.line) * 5 + Math.random() * 10
      wd.vx = (Math.random() - 0.5) * 3; wd.vy = -Math.random() * 3
      wd.va = (Math.random() - 0.5) * 0.12
    }
    dropBtn.textContent = 'reflow'
  }
  function reflow() {
    mode = 'flow'
    words.forEach((wd, i) => { wd.rest = false; wd.delay = i * 0.6; wd.va = 0 })
    dropBtn.textContent = 'drop it'
  }
  dropBtn.addEventListener('click', () => mode === 'flow' ? drop() : reflow())
  $('#shakeBtn').addEventListener('click', () => {
    if (mode === 'fall') ground.fill(s.h - 10)
    for (const wd of words) {
      wd.rest = false; wd.delay = 0
      wd.vx += (Math.random() - 0.5) * 16; wd.vy += -4 - Math.random() * 10; wd.va = (Math.random() - 0.5) * 0.3
    }
  })

  const handleX = () => x0 + colW
  const onHandle = (x, y) => Math.abs(x - handleX()) < 16 && y > y0 - 30 && y < y0 + Math.max(lines.length, 3) * lh + 30
  canvas.addEventListener('pointerdown', e => {
    if (onHandle(e.offsetX, e.offsetY)) { ptr.handle = true; canvas.setPointerCapture(e.pointerId) }
  })
  canvas.addEventListener('pointermove', e => {
    ptr.x = e.offsetX; ptr.y = e.offsetY
    ptr.over = onHandle(ptr.x, ptr.y)
    canvas.style.cursor = ptr.handle || ptr.over ? 'ew-resize' : 'default'
    if (ptr.handle) { colW = clamp(ptr.x - x0, 160, s.w - x0 - 20); relayout(false) }
  })
  canvas.addEventListener('pointerup', () => { ptr.handle = false })
  canvas.addEventListener('pointerleave', () => { ptr.x = ptr.y = -999; ptr.over = false })

  function tick(dt, t) {
    const { ctx, w, h } = s
    if (!w) return
    const wh = lh * 0.78
    for (const wd of words) {
      if (wd.delay > 0) { wd.delay -= dt; continue }
      if (mode === 'flow') {
        const k = REDUCED ? 0.3 : 0.08
        wd.vx += ((wd.tx - wd.x) * k - wd.vx * 0.26) * dt
        wd.vy += ((wd.ty - wd.y) * k - wd.vy * 0.26) * dt
        // the pointer nudges words, the springs put them back
        const dx = wd.x + wd.w / 2 - ptr.x, dy = wd.y + wh / 2 - ptr.y, d = Math.hypot(dx, dy)
        if (!ptr.handle && d < 70 && d > 0.1) { wd.vx += dx / d * (70 - d) * 0.05 * dt; wd.vy += dy / d * (70 - d) * 0.05 * dt }
        wd.a += (0 - wd.a) * 0.15 * dt
      } else if (!wd.rest) {
        wd.vy += 0.45 * dt
        wd.a += wd.va * dt
        if (wd.x < 4) { wd.x = 4; wd.vx = Math.abs(wd.vx) * 0.5 }
        if (wd.x + wd.w > w - 4) { wd.x = w - 4 - wd.w; wd.vx = -Math.abs(wd.vx) * 0.5 }
        const a = clamp(Math.floor(wd.x), 0, ground.length - 1), b = clamp(Math.ceil(wd.x + wd.w), 0, ground.length - 1)
        const sa = clamp(Math.floor(wd.x + wd.w * 0.12), 0, ground.length - 1), sb = clamp(Math.ceil(wd.x + wd.w * 0.88), 0, ground.length - 1)
        let top = h
        for (let i = sa; i <= sb; i++) top = Math.min(top, ground[i])
        if (wd.y + wh + wd.vy * dt >= top && wd.vy > 0) {
          wd.y = top - wh
          if (wd.vy > 4) { wd.vy = -wd.vy * 0.28; wd.vx *= 0.6; wd.va *= -0.5 }
          else {
            wd.rest = true; wd.vx = wd.vy = 0
            wd.a = clamp(wd.a % (Math.PI * 2), -0.08, 0.08)
            for (let i = a; i <= b; i++) ground[i] = Math.min(ground[i], wd.y + wh * 0.08)
          }
        }
      }
      if (!wd.rest) { wd.x += wd.vx * dt; wd.y += wd.vy * dt }
    }

    ctx.clearRect(0, 0, w, h)
    // ruled lines where the paragraph lives
    ctx.strokeStyle = C.line; ctx.lineWidth = 1
    for (let i = 0; i < lines.length; i++) {
      const y = Math.round(y0 + i * lh + lh * 0.72) + 0.5
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + colW, y); ctx.stroke()
    }
    // handle
    const hx = handleX() + 8, top = y0 - 18, bot = y0 + lines.length * lh + 8
    ctx.setLineDash([4, 5]); ctx.strokeStyle = ptr.over || ptr.handle ? C.accent : C.muted
    ctx.beginPath(); ctx.moveTo(hx + 0.5, top); ctx.lineTo(hx + 0.5, bot); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = ptr.over || ptr.handle ? C.accent : C.ink2
    ctx.beginPath(); ctx.roundRect(hx - 4, (top + bot) / 2 - 16, 8, 32, 4); ctx.fill()
    ctx.font = `400 10px ${MONO}`; ctx.fillStyle = C.muted; ctx.textBaseline = 'alphabetic'
    ctx.fillText(`${Math.round(colW)}px`, hx - 44, top - 4)
    // words
    ctx.font = font; ctx.textBaseline = 'middle'
    for (const wd of words) {
      const speed = Math.min(1, Math.hypot(wd.vx, wd.vy) / 9)
      ctx.fillStyle = mode === 'fall' && wd.rest ? mix(INK, TEAL, 0.35) : mix(INK, ACC, speed)
      if (Math.abs(wd.a) < 0.002) ctx.fillText(wd.text, wd.x, wd.y + wh / 2)
      else {
        ctx.save(); ctx.translate(wd.x + wd.w / 2, wd.y + wh / 2); ctx.rotate(wd.a)
        ctx.fillText(wd.text, -wd.w / 2, 0); ctx.restore()
      }
    }
  }
  scene(stage, tick)
}

// ─────────────────────────────────────────────────────────────────────────────
async function boot() {
  // Canvas measurement must see the real font, or every width is wrong.
  try {
    await Promise.all(['400 17px Fraunces', '700 17px Fraunces', '900 17px Fraunces', 'italic 700 17px Fraunces',
      'italic 900 17px Fraunces', '400 11px "JetBrains Mono"'].map(f => document.fonts.load(f)))
    await document.fonts.ready
  } catch {}
  for (const [name, fn] of [['hero', heroScene], ['pour', pourScene], ['shrink', shrinkScene], ['eval', evalScene], ['shatter', shatterScene]]) {
    try { fn() } catch (err) { console.error(name, err) }
  }
  requestAnimationFrame(frame)
}
boot()
