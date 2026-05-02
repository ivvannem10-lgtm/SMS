// Canvas-based tutorial frame renderer — no external libraries needed.
// Called every animation frame from AnimatedTutorialPlayer in help/page.tsx.

// ── Easing ────────────────────────────────────────────────────────────────────
export function easeOut(t: number): number { return 1 - Math.pow(1 - t, 2) }
export function easeIn(t: number): number  { return t * t }

// ── Text utilities ─────────────────────────────────────────────────────────────
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
      if (lines.length >= maxLines) break
    } else {
      current = test
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

// ── Path helpers ───────────────────────────────────────────────────────────────
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function fillRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color; rrect(ctx, x, y, w, h, r); ctx.fill()
}

function strokeRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string, lw = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; rrect(ctx, x, y, w, h, r); ctx.stroke()
}

// ── Action type detection ──────────────────────────────────────────────────────
type Action = 'navigate' | 'click' | 'type' | 'search' | 'drag' | 'save' | 'upload' | 'view'

function detectAction(step: string): Action {
  const s = step.toLowerCase()
  if (s.includes('drag') || s.includes('drop'))                                      return 'drag'
  if (s.includes('search') || s.includes('find'))                                    return 'search'
  if (s.includes('type') || s.includes('enter') || s.includes('fill'))               return 'type'
  if (s.includes('save') || s.includes('confirm') || s.includes('click "save"'))     return 'save'
  if (s.includes('upload') || s.includes('attach') || s.includes('select file'))     return 'upload'
  if (s.includes('click') || s.includes('select') || s.includes('choose') || s.includes('press')) return 'click'
  if (s.includes('view') || s.includes('review') || s.includes('see') || s.includes('check'))     return 'view'
  return 'navigate'
}

// ── Action mockup drawings ─────────────────────────────────────────────────────

function drawMockupShell(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Outer frame
  fillRR(ctx, x, y, w, h, 6, '#f0f4fa')
  strokeRR(ctx, x, y, w, h, 6, '#e4ebf5', 1)

  // Mini sidebar
  fillRR(ctx, x, y, 52, h, 6, '#0c1e3d')
  ctx.fillStyle = '#0c1e3d'
  ctx.fillRect(x + 26, y, 26, h) // square right edge

  // Sidebar nav items
  const navColors = ['#1a4a8a', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.06)']
  for (let i = 0; i < 5; i++) {
    fillRR(ctx, x + 6, y + 10 + i * 20, 40, 14, 4, navColors[i])
  }
}

function drawClickAction(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pulse: number) {
  // Table rows
  const cx = x + 58, cw = w - 66
  const rowH = 22
  fillRR(ctx, cx, y + 6, cw, rowH, 3, '#eef3fb')          // header row
  ctx.fillStyle = '#1a4a8a'; ctx.font = '600 9px system-ui, sans-serif'; ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText('NAME', cx + 8, y + 6 + rowH / 2)
  ctx.fillText('STATUS', cx + cw * 0.55, y + 6 + rowH / 2)

  const rowData = [0.72, 0.45, 0.60, 0.38]
  for (let i = 0; i < Math.min(4, Math.floor((h - 36) / (rowH + 3))); i++) {
    const ry = y + 6 + rowH * (i + 1) + i * 3
    const highlighted = i === 1
    ctx.fillStyle = highlighted ? '#eef3fb' : (i % 2 === 0 ? '#fff' : '#f8fafd')
    ctx.fillRect(cx, ry, cw, rowH)
    ctx.fillStyle = highlighted ? '#1a4a8a' : '#d1d5db'
    ctx.fillRect(cx + 8, ry + 6, cw * rowData[i], 10)
    ctx.fillStyle = '#e4ebf5'
    ctx.fillRect(cx + cw * 0.55 + 4, ry + 6, 40, 10)
    if (highlighted) {
      // Pulsing ring on hovered row
      const pAlpha = 0.3 + pulse * 0.5
      ctx.strokeStyle = `rgba(26, 74, 138, ${pAlpha})`
      ctx.lineWidth = 1.5
      ctx.strokeRect(cx, ry, cw, rowH)
      // Cursor dot
      const dotR = 5 + pulse * 3
      ctx.fillStyle = `rgba(26, 74, 138, ${0.4 + pulse * 0.4})`
      ctx.beginPath(); ctx.arc(cx + cw - 12, ry + rowH / 2, dotR, 0, Math.PI * 2); ctx.fill()
    }
  }
}

function drawTypeAction(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pulse: number) {
  const cx = x + 58, cw = w - 66
  const fieldH = 26, gap = 8
  const labels = ['Full Name', 'Email Address', 'Program']
  for (let i = 0; i < Math.min(labels.length, Math.floor(h / (fieldH + gap))); i++) {
    const fy = y + 10 + i * (fieldH + gap)
    const active = i === 0
    fillRR(ctx, cx, fy, cw, fieldH, 5, active ? '#fff' : '#f8fafd')
    strokeRR(ctx, cx, fy, cw, fieldH, 5, active ? '#1a4a8a' : '#e4ebf5', active ? 1.5 : 1)
    ctx.fillStyle = active ? '#0f172a' : '#cbd5e1'
    ctx.font = `${active ? '500' : '400'} 10px system-ui, sans-serif`
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText(active ? labels[i] + '...' : labels[i], cx + 8, fy + fieldH / 2)
    if (active && pulse > 0.5) {
      const tw = ctx.measureText(labels[i] + '...').width
      ctx.fillStyle = '#1a4a8a'
      ctx.fillRect(cx + 8 + tw + 2, fy + 6, 1.5, fieldH - 12)
    }
  }
}

function drawSearchAction(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pulse: number) {
  const cx = x + 58, cw = w - 66
  const sh = 30, sy = y + h / 2 - sh / 2
  fillRR(ctx, cx, sy, cw, sh, 8, '#fff')
  strokeRR(ctx, cx, sy, cw, sh, 8, '#1a4a8a', 1.5)
  // Search icon
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(cx + 14, sy + sh / 2, 7, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + 19, sy + sh / 2 + 5); ctx.lineTo(cx + 23, sy + sh / 2 + 9); ctx.stroke()
  ctx.fillStyle = '#94a3b8'; ctx.font = '400 10px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText('Search students, ID, or email…', cx + 28, sy + sh / 2)
  // Pulsing glow
  ctx.strokeStyle = `rgba(26, 74, 138, ${0.15 + pulse * 0.3})`
  ctx.lineWidth = 4
  rrect(ctx, cx - 1, sy - 1, cw + 2, sh + 2, 9); ctx.stroke()
}

function drawSaveAction(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pulse: number) {
  const bx = x + w / 2, by = y + h / 2
  // Glow circle
  ctx.fillStyle = `rgba(16, 185, 129, ${0.08 + pulse * 0.1})`
  ctx.beginPath(); ctx.arc(bx, by, 36 + pulse * 6, 0, Math.PI * 2); ctx.fill()
  // Solid circle
  ctx.fillStyle = `rgba(16, 185, 129, ${0.15 + pulse * 0.1})`
  ctx.beginPath(); ctx.arc(bx, by, 28, 0, Math.PI * 2); ctx.fill()
  // Checkmark
  ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath(); ctx.moveTo(bx - 12, by); ctx.lineTo(bx - 3, by + 10); ctx.lineTo(bx + 14, by - 10); ctx.stroke()
  ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'
  ctx.fillStyle = '#10b981'; ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
  ctx.fillText('Saved successfully', bx, by + 36)
}

function drawDragAction(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pulse: number) {
  const cx = x + 58, cw = w - 66
  const cols = 3, colW = (cw - (cols - 1) * 8) / cols
  const colNames = ['Stage 1', 'Stage 2', 'Stage 3']
  for (let i = 0; i < cols; i++) {
    const colX = cx + i * (colW + 8)
    fillRR(ctx, colX, y + 6, colW, h - 14, 6, '#f0f4fa')
    ctx.fillStyle = '#64748b'; ctx.font = 'bold 9px system-ui, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText(colNames[i], colX + colW / 2, y + 12)
    if (i < cols - 1) {
      fillRR(ctx, colX + 6, y + 28, colW - 12, 28, 4, '#fff')
      strokeRR(ctx, colX + 6, y + 28, colW - 12, 28, 4, '#e4ebf5', 1)
    }
  }
  // Animated card moving between col 0 and 1
  const cardOffset = pulse * (colW + 8)
  const cardX = cx + 6 + cardOffset
  fillRR(ctx, cardX, y + 28, colW - 12, 28, 4, '#eef3fb')
  strokeRR(ctx, cardX, y + 28, colW - 12, 28, 4, '#1a4a8a', 1.5)
  ctx.fillStyle = '#1a4a8a'; ctx.font = '500 9px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('Lead Card', cardX + (colW - 12) / 2, y + 42)
}

function drawUploadAction(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pulse: number) {
  const cx = x + 58, cw = w - 66
  const bx = cx + cw / 2, by = y + h / 2
  const bw = 120, bh = 32
  // Dashed drop zone
  ctx.strokeStyle = `rgba(26, 74, 138, ${0.3 + pulse * 0.4})`
  ctx.lineWidth = 1.5; ctx.setLineDash([6, 4])
  rrect(ctx, cx, y + 8, cw, h - 16, 8); ctx.stroke()
  ctx.setLineDash([])
  // Upload icon (arrow up)
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(bx, by - 20); ctx.lineTo(bx, by + 6); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(bx - 8, by - 12); ctx.lineTo(bx, by - 22); ctx.lineTo(bx + 8, by - 12); ctx.stroke()
  ctx.fillStyle = '#94a3b8'; ctx.font = '400 10px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
  ctx.fillText('Click or drag files here', bx, by + 10)
  // Button
  fillRR(ctx, bx - bw / 2, by + 28, bw, bh, 8, '#1a4a8a')
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textBaseline = 'middle'
  ctx.fillText('Browse Files', bx, by + 44)
}

function drawNavigateAction(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pulse: number) {
  const cx = x + 58, cw = w - 66
  const items = [['Dashboard', false], ['Applicants', false], ['Student Records', true], ['Treasury', false]]
  const itemH = 28, gap = 4
  for (let i = 0; i < Math.min(items.length, Math.floor(h / (itemH + gap))); i++) {
    const iy = y + 10 + i * (itemH + gap)
    const [label, active] = items[i]
    fillRR(ctx, cx, iy, cw, itemH, 6, active ? '#eef3fb' : '#f8fafd')
    if (active) strokeRR(ctx, cx, iy, cw, itemH, 6, `rgba(26,74,138,${0.3 + pulse * 0.5})`, 1.5)
    ctx.fillStyle = active ? '#1a4a8a' : '#94a3b8'
    ctx.font = `${active ? '600' : '400'} 11px system-ui, sans-serif`
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText(label as string, cx + 12, iy + itemH / 2)
    if (active) {
      ctx.fillStyle = `rgba(26,74,138,${0.6 + pulse * 0.4})`
      ctx.beginPath(); ctx.arc(cx + cw - 10, iy + itemH / 2, 3.5, 0, Math.PI * 2); ctx.fill()
    }
  }
}

// ── Main frame renderer ────────────────────────────────────────────────────────

export function drawStepFrame(
  ctx: CanvasRenderingContext2D,
  step: string,
  stepIndex: number,
  totalSteps: number,
  moduleLabel: string,
  slideX: number,
  globalTime: number   // seconds since animation started — drives pulse effects
) {
  const W = 640, H = 360
  ctx.clearRect(0, 0, W, H)

  // ── Background ──
  ctx.fillStyle = '#e8eef7'
  ctx.fillRect(0, 0, W, H)
  // Subtle grid
  ctx.strokeStyle = '#d8e4f0'
  ctx.lineWidth = 0.5
  for (let gx = 0; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, 44); ctx.lineTo(gx, H); ctx.stroke() }
  for (let gy = 44; gy < H; gy += 24) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke() }

  // ── Header bar ──
  ctx.fillStyle = '#0c1e3d'
  ctx.fillRect(0, 0, W, 44)

  // Logo mark
  fillRR(ctx, 10, 9, 26, 26, 6, '#1a4a8a')
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('SE', 23, 22)

  // App + module breadcrumb
  ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText('School Eco', 44, 22)
  ctx.fillStyle = '#475569'; ctx.font = '400 10px system-ui, sans-serif'
  ctx.fillText(' › ' + moduleLabel, 44 + ctx.measureText('School Eco').width, 22)

  // Step badge
  const badge = `${stepIndex + 1} / ${totalSteps}`
  const bW = 56
  fillRR(ctx, W - bW - 12, 12, bW, 20, 10, 'rgba(26,74,138,0.85)')
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(badge, W - bW / 2 - 12, 22)

  // ── Card (with slide offset applied) ──
  const C = { x: 28 + slideX, y: 54, w: W - 56, h: H - 70 }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.07)'
  fillRR(ctx, C.x + 3, C.y + 5, C.w, C.h, 14, 'rgba(0,0,0,0.07)')

  // Card background
  fillRR(ctx, C.x, C.y, C.w, C.h, 14, '#ffffff')

  // Progress bar (replaces card top border)
  ctx.fillStyle = '#e4ebf5'
  ctx.fillRect(C.x, C.y, C.w, 4)
  ctx.fillStyle = '#1a4a8a'
  ctx.fillRect(C.x, C.y, Math.max(C.w * (stepIndex + 1) / totalSteps, 6), 4)
  // Round the top corners of the card (overdraw)
  fillRR(ctx, C.x, C.y, 14, 14, 0, '#fff') // just corners
  // simpler: keep the rrect on the card itself which already clips the corners

  // ── Step header ──
  const pulse = 0.5 + 0.5 * Math.sin(globalTime * 3.5)  // 0-1, ~0.56Hz pulse

  // Step number circle
  fillRR(ctx, C.x + 14, C.y + 12, 32, 32, 16, '#eef3fb')
  strokeRR(ctx, C.x + 14, C.y + 12, 32, 32, 16, '#dce8f7', 1)
  ctx.fillStyle = '#1a4a8a'; ctx.font = 'bold 15px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(String(stepIndex + 1), C.x + 30, C.y + 28)

  // Step text
  ctx.fillStyle = '#0f172a'; ctx.font = '600 13px system-ui, sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  const maxTextW = C.w - 68
  const lines = wrapText(ctx, step, maxTextW, 3)
  lines.forEach((line, i) => ctx.fillText(line, C.x + 54, C.y + 14 + i * 19))

  // ── Action mockup ──
  const M = { x: C.x + 12, y: C.y + 58, w: C.w - 24, h: C.h - 80 }
  if (M.h > 40) {
    drawMockupShell(ctx, M.x, M.y, M.w, M.h)
    const action = detectAction(step)
    if      (action === 'click'    || action === 'view')   drawClickAction(ctx,    M.x, M.y, M.w, M.h, pulse)
    else if (action === 'type')                            drawTypeAction(ctx,     M.x, M.y, M.w, M.h, pulse)
    else if (action === 'search')                          drawSearchAction(ctx,   M.x, M.y, M.w, M.h, pulse)
    else if (action === 'save')                            drawSaveAction(ctx,     M.x, M.y, M.w, M.h, pulse)
    else if (action === 'drag')                            drawDragAction(ctx,     M.x, M.y, M.w, M.h, pulse)
    else if (action === 'upload')                          drawUploadAction(ctx,   M.x, M.y, M.w, M.h, pulse)
    else                                                   drawNavigateAction(ctx, M.x, M.y, M.w, M.h, pulse)
  }

  // ── Progress dots ──
  const dotY = H - 13
  const n = Math.min(totalSteps, 10)
  const dotSpacing = 13
  const dotsLeft = W / 2 - ((n - 1) * dotSpacing) / 2
  for (let i = 0; i < n; i++) {
    const active = i === stepIndex
    ctx.beginPath()
    ctx.arc(dotsLeft + i * dotSpacing, dotY, active ? 4.5 : 3, 0, Math.PI * 2)
    ctx.fillStyle = active ? '#1a4a8a' : '#c7d5e8'
    ctx.fill()
  }
}
