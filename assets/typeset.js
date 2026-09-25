// Three places where knowing a paragraph's lines before the browser does is
// actually useful. Each one is a progressive enhancement: without this file
// the page still reads fine (float, CSS grid, full abstract).
import { prepare, layout, prepareWithSegments, layoutWithLines, layoutNextLine, measureNaturalWidth } from './js/pretext/layout.js'
import { prepareRichInline, layoutNextRichInlineLineRange, materializeRichInlineLineRange, measureRichInlineStats } from './js/pretext/rich-inline.js'

const $ = s => document.querySelector(s)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const fontOf = (el, weight = 400, style = 'normal') => {
  const cs = getComputedStyle(el)
  return { font: `${style} ${weight} ${cs.fontSize} ${cs.fontFamily}`, lh: parseFloat(cs.lineHeight), cs }
}

// ── 1. The intro paragraph flows around the portrait window, wherever you drag it.
function flowIntro() {
  const flow = $('#flow'), p = $('#intro'), win = $('#portrait')
  const { cs, lh } = fontOf(p)
  // Rebuild the paragraph's inline runs as rich-inline items, remembering the
  // element each run came from so links and bold survive the re-set.
  const items = [], sources = []
  for (const n of p.childNodes) {
    const bold = n.nodeName === 'STRONG'
    items.push({ text: n.textContent, font: `normal ${bold ? 700 : 400} ${cs.fontSize} ${cs.fontFamily}` })
    sources.push(n.nodeType === 1 ? n : null)
  }
  const prepared = prepareRichInline(items)
  flow.classList.add('flowed-on')
  p.classList.add('flowed')
  $('#flowHint').hidden = false

  let W = 0, winW = 0, winH = 0, pos = null, raf = 0, maxY = 0
  const GAP = 18, MIN_SLOT = 72
  const spec = makeSpecDraggable(flow, () => schedule())

  // Everything the text has to avoid, in the paragraph's coordinates.
  const obstacles = () => {
    const out = [{ x: pos.x, y: pos.y, w: winW, h: winH }]
    const r = spec.rect()
    if (r) out.push(r)
    return out
  }
  // Free horizontal runs of one line band once the obstacles are cut out.
  function slotsFor(y, obs) {
    const cuts = obs.filter(o => o.y - 8 < y + lh && o.y + o.h + 12 > y).map(o => [o.x - GAP, o.x + o.w + GAP]).sort((a, b) => a[0] - b[0])
    const out = []
    let x = 0
    for (const [a, b] of cuts) { if (a - x >= MIN_SLOT) out.push([x, Math.min(a, W)]); x = Math.max(x, b) }
    if (W - x >= MIN_SLOT) out.push([x, W])
    return out
  }

  function render() {
    raf = 0
    const obs = obstacles()
    const placed = []
    let cursor, y = 0
    rows: for (let guard = 0; guard < 400; guard++, y += lh) {
      for (const [a, b] of slotsFor(y, obs)) {
        const range = layoutNextRichInlineLineRange(prepared, b - a, cursor)
        if (!range) break rows
        placed.push({ x: a, y, line: materializeRichInlineLineRange(prepared, range) })
        cursor = range.end
      }
    }
    const lines = placed.map(({ x, y, line }) => {
      const ln = document.createElement('span')
      ln.className = 'ln'
      ln.style.transform = `translate(${x}px, ${y}px)`
      line.fragments.forEach((f, i) => {
        if (i > 0 && f.gapBefore > 0) ln.append(' ')
        const src = sources[f.itemIndex]
        if (!src) return ln.append(f.text)
        const el = src.cloneNode(false)
        el.textContent = f.text
        ln.append(el)
      })
      return ln
    })
    p.replaceChildren(...lines)
    const textH = placed.length ? placed[placed.length - 1].y + lh : 0
    p.style.height = `${textH}px`
    flow.style.minHeight = `${Math.max(textH, pos.y + winH + 8)}px`
    win.style.transform = `translate(${pos.x}px, ${pos.y}px)`
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(render) }

  new ResizeObserver(([e]) => {
    W = e.contentRect.width
    winW = win.offsetWidth; winH = win.offsetHeight
    maxY = measureRichInlineStats(prepared, W).lineCount * lh + 24
    if (!pos) pos = { x: W - winW, y: 4 } // where the CSS float had it
    pos.x = clamp(pos.x, 0, Math.max(0, W - winW))
    pos.y = clamp(pos.y, -8, maxY)
    render()
  }).observe(flow)

  let drag = null
  win.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || e.button > 0) return
    drag = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    win.setPointerCapture(e.pointerId)
    win.classList.add('dragging')
  })
  win.addEventListener('pointermove', e => {
    if (!drag) return
    pos.x = clamp(e.clientX - drag.dx, 0, Math.max(0, W - winW))
    pos.y = clamp(e.clientY - drag.dy, -8, maxY)
    schedule()
  })
  const end = () => { drag = null; win.classList.remove('dragging') }
  win.addEventListener('pointerup', end)
  win.addEventListener('pointercancel', end)
  win.addEventListener('keydown', e => {
    if (e.target !== win) return
    const step = e.shiftKey ? 60 : 20
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (e.key === 'Home') { pos = { x: W - winW, y: 4 } }
    else if (!d) return
    else { pos.x = clamp(pos.x + d[0], 0, Math.max(0, W - winW)); pos.y = clamp(pos.y + d[1], -8, maxY) }
    e.preventDefault(); schedule()
  })
  win.addEventListener('dblclick', e => { if (!e.target.closest('button')) { pos = { x: W - winW, y: 4 }; schedule() } })
}

// The spec sheet can be picked up too. On first drag it leaves a same-sized
// placeholder in the grid and floats inside the hero, so moving it never
// shifts the layout underneath; if it lands on the intro, the intro wraps.
function makeSpecDraggable(flow, onMove) {
  const spec = $('#spec'), hero = $('#hi')
  let floating = false, x = 0, y = 0, ph = null, flowOff = { x: 0, y: 0 }, drag = null, moved = false, z = 5
  const box = () => ({ w: spec.offsetWidth, h: spec.offsetHeight, hw: hero.clientWidth, hh: hero.clientHeight })
  function measureFlow() {
    const h = hero.getBoundingClientRect(), f = flow.getBoundingClientRect()
    flowOff = { x: f.left - h.left, y: f.top - h.top }
  }
  function place() {
    const b = box()
    x = clamp(x, 0, Math.max(0, b.hw - b.w)); y = clamp(y, 0, Math.max(0, b.hh - b.h))
    spec.style.transform = `translate(${x}px, ${y}px)`
    onMove()
  }
  function lift() {
    if (floating) return
    const h = hero.getBoundingClientRect(), r = spec.getBoundingClientRect()
    ph = document.createElement('div')
    ph.className = 'spec-ph'; ph.style.height = `${r.height}px`
    spec.before(ph)
    spec.style.width = `${r.width}px`
    spec.classList.add('floating')
    x = r.left - h.left; y = r.top - h.top
    floating = true
    measureFlow()
  }
  function reset() {
    if (!floating) return
    ph.remove(); ph = null
    spec.classList.remove('floating'); spec.style.width = spec.style.transform = ''
    floating = false
    onMove()
  }
  spec.addEventListener('pointerdown', e => {
    if (e.button > 0) return
    // on touch only the title bar grabs, so swiping the sheet still scrolls the page
    if (e.pointerType !== 'mouse' && !e.target.closest('h3')) return
    drag = { sx: e.clientX, sy: e.clientY, id: e.pointerId }
    moved = false
  })
  spec.addEventListener('pointermove', e => {
    if (!drag) return
    if (!moved) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return
      moved = true
      lift()
      drag.ox = x - drag.sx; drag.oy = y - drag.sy
      spec.setPointerCapture(drag.id)
      spec.classList.add('dragging')
      spec.style.zIndex = ++z
      getSelection()?.removeAllRanges()
    }
    x = e.clientX + drag.ox; y = e.clientY + drag.oy
    place()
  })
  const end = () => { drag = null; spec.classList.remove('dragging') }
  spec.addEventListener('pointerup', end)
  spec.addEventListener('dragstart', e => e.preventDefault())
  spec.querySelector('h3').addEventListener('touchstart', e => e.preventDefault(), { passive: false })
  spec.addEventListener('pointercancel', end)
  // a drag that started on a link shouldn't also follow it
  spec.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false } }, true)
  spec.addEventListener('dblclick', e => { if (!e.target.closest('a')) reset() })
  spec.addEventListener('keydown', e => {
    if (e.target !== spec) return
    if (e.key === 'Home') { reset(); e.preventDefault(); return }
    const step = e.shiftKey ? 60 : 20
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (!d) return
    lift(); x += d[0]; y += d[1]; place(); e.preventDefault()
  })
  new ResizeObserver(() => { if (floating) { measureFlow(); place() } }).observe(hero)
  return {
    // the sheet's box in the intro paragraph's coordinates, or null while it sits in its column
    rect: () => floating ? { x: x - flowOff.x, y: y - flowOff.y, w: spec.offsetWidth, h: spec.offsetHeight } : null,
  }
}

// ── 2. Projects: a masonry that keeps reading order, with every card's height
// predicted from its text instead of rendered and measured first.
function masonry() {
  const grid = $('#grid')
  const cards = [...grid.querySelectorAll(':scope > .proj')]
  const GAP = 26
  const specs = cards.map(card => {
    const h3 = card.querySelector('h3'), desc = card.querySelector('.desc')
    const t = fontOf(h3, getComputedStyle(h3).fontWeight, getComputedStyle(h3).fontStyle), d = fontOf(desc)
    return {
      card,
      title: prepare(h3.textContent, t.font), tlh: t.lh,
      desc: prepare(desc.textContent, d.font), dlh: d.lh,
      chrome: card.classList.contains('note') ? 118 : 146, // bar + padding + tags + links
    }
  })
  let lastKey = ''
  new ResizeObserver(([e]) => {
    const W = e.contentRect.width
    const n = W >= 900 ? 3 : W >= 580 ? 2 : 1
    const key = `${n}:${Math.round(W)}`
    if (key === lastKey) return
    lastKey = key
    if (n === 1) { grid.classList.remove('masonry'); grid.replaceChildren(...cards); return }
    const inner = (W - GAP * (n - 1)) / n - 4 - 36
    const heights = new Array(n).fill(0), cols = Array.from({ length: n }, () => [])
    for (const s of specs) {
      const h = s.chrome + layout(s.title, inner, s.tlh).height + layout(s.desc, inner, s.dlh).height
      const j = heights.indexOf(Math.min(...heights))
      cols[j].push(s.card)
      heights[j] += h + GAP
    }
    grid.classList.add('masonry')
    grid.replaceChildren(...cols.map(c => { const col = document.createElement('div'); col.className = 'col'; col.append(...c); return col }))
  }).observe(grid)
}

// ── 3. The abstract: exactly three lines, with the "more" link sitting at the
// end of the third line rather than on a line of its own.
function abstractClamp() {
  const el = $('#abstract')
  const fullHTML = el.innerHTML
  const text = el.textContent.replace(/\s+/g, ' ').trim()
  const { font, lh } = fontOf(el)
  const prepared = prepareWithSegments(text, font)
  const btn = document.createElement('button')
  btn.type = 'button'; btn.className = 'more'
  const LABEL = 'read the full abstract'
  const moreW = measureNaturalWidth(prepareWithSegments(`… ${LABEL}`, `normal 700 12px ${getComputedStyle(document.body).getPropertyValue('--mono')}`)) + 10
  let open = false, W = 0
  function render() {
    if (open) {
      el.innerHTML = fullHTML
      btn.textContent = 'show less'; btn.setAttribute('aria-expanded', 'true')
      el.append(' ', btn)
      return
    }
    const { lines } = layoutWithLines(prepared, W, lh)
    if (lines.length <= 3) { el.innerHTML = fullHTML; return }
    const third = layoutNextLine(prepared, lines[2].start, W - moreW)
    const shown = lines[0].text + lines[1].text + (third ? third.text.trimEnd() : '')
    btn.textContent = LABEL; btn.setAttribute('aria-expanded', 'false')
    el.replaceChildren(`${shown}… `, btn)
  }
  btn.addEventListener('click', () => { open = !open; render() })
  new ResizeObserver(([e]) => { if (Math.abs(e.contentRect.width - W) > 0.5) { W = e.contentRect.width; render() } }).observe(el)
}

for (const f of [flowIntro, masonry, abstractClamp]) {
  try { f() } catch (err) { console.warn(f.name, err) }
}
