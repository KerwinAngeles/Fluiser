import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'
import { useConfirm } from '@/composables/useConfirm'

// Canvas size mirrors the "1a" design option from the Claude Design mockup
// (dark HUD card, 420x230) — the floating window intentionally keeps its own
// fixed dark look regardless of the app's light/dark theme, the same way
// Spotify's mini player and OS media overlays stay legible over anything.
const PIP_WIDTH = 420
const PIP_HEIGHT = 230
const FONT = 'system-ui, -apple-system, "SF Pro Text", "Inter", sans-serif'

// This window's own <style> can't resolve var(--token) — Document PiP opens
// a blank document with no inherited stylesheet, and the canvas is drawn
// with plain JS color strings anyway — so the Noche palette's *resolved*
// values are read once from the opener's :root and baked in as literals.
function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

const PALETTE = {
  bgTop: cssVar('--noche', '#15162B'),
  bgBottom: cssVar('--noche-3', '#1C1D38'),
  track: cssVar('--noche-2', '#24264A'),
  divider: 'rgba(236, 235, 255, 0.12)',
  textPrimary: cssVar('--sobre-noche', '#ECEBFF'),
  textSecondary: cssVar('--noche-suave', '#A3A2D3'),
  textTertiary: cssVar('--noche-suave', '#A3A2D3'),
} as const

// Lavanda is the only accent while a session is active (same rule as
// TimerView's Noche screen) — no more per-habit tone in the PiP.
const ACCENT = cssVar('--lilac', '#A09DF0')
const FLUI_FOCO_TOP = '#D2D0FF'
const FLUI_FOCO_BOTTOM = '#7E7BDA'
const FLUI_INK = '#123332'

// Document PiP gives us a real window with real DOM — the canvas above still
// draws the ring/status exactly as before, this just adds a strip of actual
// clickable buttons underneath it so pause/skip/finish/continue work without
// switching back to the tab. Classic video PiP (the fallback for browsers
// without documentPictureInPicture) can't host real controls at all — a
// <video> only exposes whatever the browser's own overlay chooses to render.
const DOC_PIP_CONTROLS_HEIGHT = 48

// Document PiP windows are freely resizable by the OS window chrome — the
// user shrinking the window (which reads as "minimizing" it) must never clip
// the controls out of view. The body is a flex column with the canvas as the
// only *shrinkable* region (CSS-scaled, never scrolled/hidden) and the
// button bar pinned at a fixed height, so the buttons stay visible and
// clickable at any window size instead of overflowing past `overflow:hidden`.
const PIP_DOC_STYLES = `
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: ${PALETTE.bgBottom}; }
  body { display: flex; flex-direction: column; }
  .fpc-canvas-wrap {
    position: relative;
    flex: 1 1 auto; min-height: 0; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .fpc-canvas-wrap canvas { display: block; width: auto; height: auto; max-width: 100%; max-height: 100%; }
  .fpc-bar {
    flex: 0 0 auto;
    display: flex; align-items: center; justify-content: center; gap: 14px;
    height: ${DOC_PIP_CONTROLS_HEIGHT}px; padding: 0 12px; box-sizing: border-box;
    background: ${PALETTE.bgBottom}; border-top: 1px solid rgba(255,255,255,0.08);
    font-family: ${FONT};
  }
  /* Compact icon buttons (pause/skip/finish) — tooltip carries the label */
  .fpc-btn {
    flex: 0 0 auto; width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.05); color: #fff;
    cursor: pointer; padding: 0;
  }
  .fpc-btn:hover { background: rgba(255,255,255,0.1); }
  .fpc-btn-primary { background: var(--fpc-accent, ${ACCENT}); border-color: transparent; color: ${PALETTE.bgTop}; }
  .fpc-btn-primary:hover { filter: brightness(0.94); }
  .fpc-btn svg { width: 13px; height: 13px; }
  /* Wide labeled button — only used where a single action needs to stay
     unambiguous (gate/review), so there's no crowding to solve there. */
  .fpc-btn-wide {
    flex: 1 1 auto; width: auto; height: 30px; padding: 0 14px; gap: 5px;
    border-radius: 8px; font: 600 11.5px ${FONT}; white-space: nowrap;
  }
  .fpc-btn-wide svg { width: 12px; height: 12px; flex-shrink: 0; }

  /* Flui — breathing companion, overlaid on the canvas right under the
     habit name/status text (matches the reference mockup). A trimmed port
     of Flui.vue's 'enfoque' state only (this window never shows any other
     mood), since this is vanilla DOM with no access to the main app's Vue
     components or :root custom properties. */
  .fpc-flui-wrap { position: absolute; left: 54%; top: 56%; width: 40px; pointer-events: none; }
  .fpc-flui { display: block; width: 100%; overflow: visible; }
  .fpc-flui .f-shape { fill: url(#fpcFluiFoco); }
  .fpc-flui .f-shadow { fill: #000; opacity: .14; }
  .fpc-flui .f-stroke { fill: none; stroke: ${FLUI_INK}; stroke-width: 4.5; stroke-linecap: round; }
  .fpc-flui .f-cheek { fill: #FF9D8A; opacity: .45; }
  .fpc-flui .f-leaf { fill: #5E9E6B; }
  .fpc-flui .f-leaf2 { fill: #9FD39B; }
  .fpc-flui .f-stem { fill: none; stroke: #5E9E6B; stroke-width: 4; stroke-linecap: round; }
  .fpc-flui .f-body { transform-box: view-box; transform-origin: 100px 190px; animation: fpc-f-breathe 8s ease-in-out infinite; }
  .fpc-flui .f-sprout { transform-box: view-box; transform-origin: 100px 40px; animation: fpc-f-sway 4s ease-in-out infinite; }
  @keyframes fpc-f-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
  @keyframes fpc-f-sway { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(7deg); } }
  @media (prefers-reduced-motion: reduce) {
    .fpc-flui .f-body, .fpc-flui .f-sprout { animation: none; }
  }
`

// Only the 'enfoque' pose (closed eyes, soft smile) — the PiP never shows
// Flui in any other mood.
const FLUI_SVG = `
  <svg class="fpc-flui" viewBox="0 0 200 205" aria-hidden="true">
    <defs>
      <linearGradient id="fpcFluiFoco" x1="0.3" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="${FLUI_FOCO_TOP}"/><stop offset="1" stop-color="${FLUI_FOCO_BOTTOM}"/>
      </linearGradient>
    </defs>
    <ellipse class="f-shadow" cx="100" cy="196" rx="44" ry="6"/>
    <g class="f-body">
      <g class="f-sprout">
        <path class="f-stem" d="M100 42 C98 30 100 20 106 12"/>
        <path class="f-leaf" d="M105 14 C112 0 132 1 138 8 C129 19 114 22 105 14Z"/>
        <path class="f-leaf2" d="M101 27 C93 16 80 17 76 23 C84 31 95 31 101 27Z"/>
      </g>
      <path class="f-shape" d="M100 36 C118 60 158 94 158 134 C158 168 132 190 100 190 C68 190 42 168 42 134 C42 94 82 60 100 36Z"/>
      <ellipse cx="74" cy="106" rx="8" ry="16" transform="rotate(-26 74 106)" fill="#fff" opacity=".55"/>
      <circle cx="67" cy="152" r="9" class="f-cheek"/><circle cx="133" cy="152" r="9" class="f-cheek"/>
      <path class="f-stroke" d="M72 134 Q81 143 90 134"/>
      <path class="f-stroke" d="M110 134 Q119 143 128 134"/>
      <path class="f-stroke" d="M92 155 Q100 162 108 155"/>
    </g>
  </svg>
`

function svgIcon(inner: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
}

// Mirrors the paths used by PlayIcon/PauseIcon/SkipFwdIcon/CheckIcon in
// AppIcons.ts — duplicated here as raw markup since this window's DOM is
// built with vanilla JS, outside Vue's render tree.
const ICON = {
  play: svgIcon('<polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>'),
  pause: svgIcon('<rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none"/>'),
  skip: svgIcon('<polygon points="5 4 15 12 5 20 5 4" fill="currentColor" stroke="none"/><line x1="19" y1="5" x2="19" y2="19"/>'),
  check: svgIcon('<path d="M5 12.5l4.5 4.5L19 7"/>'),
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let s = text
  while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1)
  return s + '…'
}

// Agua — the water-fill progress circle, drawn on canvas instead of a
// stroked ring (mirrors Agua.vue's clipped-circle + animated wave fill).
function drawAgua(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, progress: number, accent: string, track: string) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  ctx.fillStyle = track
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

  const levelY = cy + r - progress * (2 * r)
  const waveAmp = 3
  const waveLen = r * 0.9
  const t = Date.now() / 1000
  ctx.beginPath()
  ctx.moveTo(cx - r - 4, levelY)
  for (let x = cx - r - 4; x <= cx + r + 4; x += 4) {
    const y = levelY + Math.sin((x / waveLen) * Math.PI * 2 + t * 1.6) * waveAmp
    ctx.lineTo(x, y)
  }
  ctx.lineTo(cx + r + 4, cy + r + 4)
  ctx.lineTo(cx - r - 4, cy + r + 4)
  ctx.closePath()
  ctx.fillStyle = hexToRgba(accent, 0.45)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = hexToRgba(accent, 0.5)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function useTimerPip() {
  // Prefer Document PiP when it's genuinely available — it's the only way to
  // get real, clickable controls (pause, skip, finish, continue) in the
  // floating window instead of just a picture. It was previously dropped in
  // favor of classic video PiP for reliability (Chrome/Edge 116+ only, and
  // inconsistent even there), so it's used here as a progressive enhancement
  // only: any failure at any point falls straight through to the classic
  // <video> PiP below, which stays exactly as reliable as before.
  const documentPipSupported = typeof window !== 'undefined'
    && 'documentPictureInPicture' in window
    && typeof (window as unknown as { documentPictureInPicture?: DocumentPictureInPicture })
      .documentPictureInPicture?.requestWindow === 'function'

  // Classic <video> Picture-in-Picture — supported far more broadly (Chrome,
  // Edge and Safari, going back years). We draw the timer onto a canvas,
  // turn it into a live video via captureStream(), and PiP that video. Only
  // the browser's own minimal overlay controls (play/pause, and whatever
  // Media Session actions are registered below) are available in this mode.
  const videoPipSupported = typeof document !== 'undefined'
    && document.pictureInPictureEnabled === true
    && typeof HTMLVideoElement !== 'undefined'
    && 'requestPictureInPicture' in HTMLVideoElement.prototype

  const supported = documentPipSupported || videoPipSupported

  const active = ref(false)
  const store = useFluiserStore()
  const t = useT()
  const { confirm } = useConfirm()

  // The confirm modal lives in the main app document (ConfirmDialog.vue,
  // mounted once in App.vue) — Document PiP shares the same JS realm as the
  // opener, so the shared useConfirm() state reaches it fine, but the dialog
  // itself can only render where that component actually is: the main tab,
  // not the floating window. Bring that tab forward so the alert isn't
  // silently missed while the user is looking at the PiP window instead.
  async function finishWithConfirm() {
    try { window.focus() } catch { /* best effort */ }
    const confirmed = await confirm({
      title: t('¿Terminar la sesión?', 'End the session?'),
      message: t(
        'Vas a cerrarla antes de tiempo. Vas a poder revisar y guardar tu progreso igual.',
        "You're ending it early. You'll still be able to review and save your progress.",
      ),
      confirmLabel: t('Terminar', 'End'),
      cancelLabel: t('Seguir', 'Keep going'),
    })
    if (confirmed) store.finishTimerNow()
  }

  let canvas: HTMLCanvasElement | null = null
  let ctx2d: CanvasRenderingContext2D | null = null
  let video: HTMLVideoElement | null = null
  let drawInterval: ReturnType<typeof setInterval> | null = null
  let bgGradient: CanvasGradient | null = null
  let pipWindow: Window | null = null
  let controlsEl: HTMLDivElement | null = null

  function ensureCanvas() {
    if (canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas = document.createElement('canvas')
    canvas.width = Math.round(PIP_WIDTH * dpr)
    canvas.height = Math.round(PIP_HEIGHT * dpr)
    ctx2d = canvas.getContext('2d')
    ctx2d?.scale(dpr, dpr)
  }

  function draw() {
    if (!ctx2d) return
    const ctx = ctx2d
    const W = PIP_WIDTH
    const H = PIP_HEIGHT
    ctx.clearRect(0, 0, W, H)

    if (!bgGradient) {
      bgGradient = ctx.createLinearGradient(0, 0, 0, H)
      bgGradient.addColorStop(0, PALETTE.bgTop)
      bgGradient.addColorStop(1, PALETTE.bgBottom)
    }
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, W, H)

    // Soft violet/lilac washes — the reference mockup's card isn't a flat
    // gradient, it has a diagonal wavy tint. Two oversized, low-opacity
    // radial gradients fake that without needing an actual blur filter.
    const washTL = ctx.createRadialGradient(W * 0.1, H * 0.05, 0, W * 0.1, H * 0.05, W * 0.6)
    washTL.addColorStop(0, hexToRgba(ACCENT, 0.14))
    washTL.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = washTL
    ctx.fillRect(0, 0, W, H)

    const washBR = ctx.createRadialGradient(W * 0.92, H, 0, W * 0.92, H, W * 0.55)
    washBR.addColorStop(0, hexToRgba('#6D5BD0', 0.22))
    washBR.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = washBR
    ctx.fillRect(0, 0, W, H)

    const ts = store.timerState
    const habit = store.activeTimer
    if (!ts || !habit) {
      ctx.fillStyle = PALETTE.textTertiary
      ctx.font = `500 13px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(t('Sin sesión activa', 'No active session'), W / 2, H / 2)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      return
    }

    const isBreak = ts.phase === 'break'
    const isFlow = ts.phase === 'flow-check'
    const isReview = ts.phase === 'review'
    const isGate = ts.phase === 'gate'
    const gateIsBreak = ts.pendingPhase === 'break'
    const accent = ACCENT

    // ── Left: Agua ──
    const cx = 101
    const cy = 115
    const r = 64

    let progress = 1
    if (isFlow) progress = (ts.remaining ?? 0) / 12
    else if (!isReview && !isGate) {
      const total = isBreak ? ts.breakSec : ts.workSec
      progress = total ? 1 - (ts.remaining ?? 0) / total : 1
    }
    progress = Math.max(0, Math.min(1, progress))

    drawAgua(ctx, cx, cy, r, isGate ? 0.5 : progress, accent, PALETTE.track)

    if (isReview) {
      ctx.strokeStyle = accent
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(cx - 20, cy)
      ctx.lineTo(cx - 6, cy + 14)
      ctx.lineTo(cx + 22, cy - 16)
      ctx.stroke()
    } else if (isGate) {
      // Waiting for the user — a paused glyph instead of a countdown, since
      // nothing is actively running until they act.
      ctx.fillStyle = accent
      roundRect(ctx, cx - 13, cy - 16, 8, 32, 3)
      ctx.fill()
      roundRect(ctx, cx + 5, cy - 16, 8, 32, 3)
      ctx.fill()
      ctx.fillStyle = PALETTE.textTertiary
      ctx.font = `500 11px ${FONT}`
      ctx.textAlign = 'center'
      ctx.fillText(t('en espera', 'waiting'), cx, cy + 34)
      ctx.textAlign = 'left'
    } else {
      const remaining = ts.remaining ?? 0
      ctx.fillStyle = PALETTE.textPrimary
      ctx.font = `700 34px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (isFlow) {
        ctx.fillText(`${Math.max(0, remaining)}s`, cx, cy - 6)
      } else {
        const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
        const ss = String(remaining % 60).padStart(2, '0')
        ctx.fillText(`${mm}:${ss}`, cx, cy - 6)
      }
      ctx.fillStyle = PALETTE.textTertiary
      ctx.font = `500 11px ${FONT}`
      ctx.fillText(isFlow ? t('extra', 'bonus') : t('restantes', 'left'), cx, cy + 18)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }

    // ── Divider ──
    const rx = 229
    ctx.strokeStyle = PALETTE.divider
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(rx - 27, 24)
    ctx.lineTo(rx - 27, H - 24)
    ctx.stroke()

    // ── Right: info column ──
    // Just the habit name and one combined status line underneath it —
    // matches the reference mockup (no avatar badge, no separate phase
    // label, no session-pill row; Flui sits below, overlaid by the DOM
    // wrap in Document PiP mode).
    const titleY = 88
    const subtitleY = 118

    ctx.fillStyle = PALETTE.textPrimary
    ctx.font = `700 19px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.fillText(truncateText(ctx, habit.name, W - rx - 16), rx, titleY)
    ctx.textBaseline = 'alphabetic'

    let statusText = t('En marcha', 'Running')
    if (isReview) statusText = t('Guardado', 'Saved')
    else if (isFlow) statusText = t('Sesión terminada', 'Session ended')
    else if (isGate) statusText = gateIsBreak ? t('Lista para la pausa', 'Ready for a break') : t('Lista la siguiente', 'Next one ready')
    else if (ts.paused) statusText = t('Pausado', 'Paused')
    else if (isBreak) statusText = t('En pausa', 'On a break')

    let subtitle = statusText
    if (!isFlow && !isGate && ts.sessions > 1) {
      subtitle += t(`, sesión ${ts.currentSession} de ${ts.sessions}`, `, session ${ts.currentSession} of ${ts.sessions}`)
    } else if (isGate) {
      subtitle = t('Toca continuar en la app', 'Tap continue in the app')
    } else if (ts.flowExtensions > 0) {
      subtitle += ` · +${ts.flowExtensions * 5} ${t('min', 'min')}`
    }
    ctx.fillStyle = PALETTE.textSecondary
    ctx.font = `500 13px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.fillText(truncateText(ctx, subtitle, W - rx - 16), rx, subtitleY)
    ctx.textBaseline = 'alphabetic'
  }

  function ensureVideo(): HTMLVideoElement {
    if (video) return video
    ensureCanvas()
    draw()
    const stream = canvas!.captureStream(2)
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.srcObject = stream
    video = v
    return v
  }

  // Compact square icon button — used wherever multiple controls sit side by
  // side (the crowded case), so the label lives in the tooltip/aria-label
  // instead of taking up width.
  function iconBtn(icon: string, label: string, onClick: () => void, primary = false): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = primary ? 'fpc-btn fpc-btn-primary' : 'fpc-btn'
    btn.title = label
    btn.setAttribute('aria-label', label)
    btn.innerHTML = icon
    btn.addEventListener('click', onClick)
    return btn
  }

  // Wide labeled button — only ever the sole control on screen (gate/review),
  // so there's room for text and it's worth keeping since which action
  // applies (start break vs. start session N) isn't obvious from an icon.
  function wideBtn(icon: string, label: string, onClick: () => void, primary = false): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = primary ? 'fpc-btn fpc-btn-wide fpc-btn-primary' : 'fpc-btn fpc-btn-wide'
    btn.innerHTML = icon + `<span>${label}</span>`
    btn.addEventListener('click', onClick)
    return btn
  }

  // Mirrors TimerView's in-app controls per phase. Review is the one
  // exception — saving needs the energy picker/note field, too much for a
  // button strip, so it just offers a way back into the app instead.
  function renderControls() {
    if (!controlsEl) return
    controlsEl.innerHTML = ''
    const ts = store.timerState
    const habit = store.activeTimer
    if (!ts || !habit) return

    controlsEl.style.setProperty('--fpc-accent', ACCENT)

    if (ts.phase === 'gate') {
      const label = ts.pendingPhase === 'break'
        ? t('Comenzar pausa', 'Start break')
        : t(`Comenzar sesión ${ts.currentSession + 1}`, `Start session ${ts.currentSession + 1}`)
      controlsEl.append(wideBtn(ICON.play, label, () => store.continueGate(), true))
    } else if (ts.phase === 'flow-check') {
      controlsEl.append(
        wideBtn('🌊', t('+5 min', '+5 min'), () => store.continueFlow(), true),
        iconBtn(ICON.check, t('Terminar', 'Finish'), () => finishWithConfirm()),
      )
    } else if (ts.phase === 'review') {
      controlsEl.append(wideBtn('→', t('Revisar y guardar en la app', 'Review and save in the app'), () => store.expandTimer(), true))
    } else {
      controlsEl.append(
        iconBtn(
          ts.paused ? ICON.play : ICON.pause,
          ts.paused ? t('Reanudar', 'Resume') : t('Pausar', 'Pause'),
          () => (ts.paused ? store.resumeTimer() : store.pauseTimer()),
          true,
        ),
        iconBtn(ICON.skip, t('Saltar', 'Skip'), () => store.skipTimerSession()),
        iconBtn(ICON.check, t('Terminar', 'Finish'), () => finishWithConfirm()),
      )
    }
  }

  function close() {
    if (drawInterval) { clearInterval(drawInterval); drawInterval = null }
    if (pipWindow) {
      const w = pipWindow
      pipWindow = null
      controlsEl = null
      try { w.close() } catch { /* already closed */ }
    }
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => { /* already closed */ })
    }
    active.value = false
  }

  async function open() {
    if (!supported || active.value) return

    if (documentPipSupported) {
      let win: Window | null = null
      try {
        ensureCanvas()
        draw()
        const dpip = (window as unknown as { documentPictureInPicture: DocumentPictureInPicture }).documentPictureInPicture
        win = await dpip.requestWindow({ width: PIP_WIDTH, height: PIP_HEIGHT + DOC_PIP_CONTROLS_HEIGHT })
        const style = win.document.createElement('style')
        style.textContent = PIP_DOC_STYLES
        win.document.head.append(style)
        const canvasWrap = win.document.createElement('div')
        canvasWrap.className = 'fpc-canvas-wrap'
        canvasWrap.append(canvas!)
        const fluiWrap = win.document.createElement('div')
        fluiWrap.className = 'fpc-flui-wrap'
        fluiWrap.innerHTML = FLUI_SVG
        canvasWrap.append(fluiWrap)
        win.document.body.append(canvasWrap)
        controlsEl = win.document.createElement('div')
        controlsEl.className = 'fpc-bar'
        win.document.body.append(controlsEl)
        renderControls()
        pipWindow = win
        win.addEventListener('pagehide', () => close(), { once: true })
        active.value = true
        if (!drawInterval) drawInterval = setInterval(draw, 500)
        return
      } catch {
        pipWindow = null
        controlsEl = null
        if (win) { try { win.close() } catch { /* ignore */ } }
        // The canvas may have been moved into the failed window's document —
        // rebuild it fresh so the classic PiP fallback below starts clean.
        canvas = null
        ctx2d = null
        bgGradient = null
      }
    }

    if (!videoPipSupported) return
    try {
      const v = ensureVideo()
      await v.play()
      await v.requestPictureInPicture()
    } catch {
      return // no transient activation, or the browser refused — fall back to the manual button
    }
    active.value = true
    if (!drawInterval) drawInterval = setInterval(draw, 500)
    video!.addEventListener('leavepictureinpicture', () => close(), { once: true })
  }

  async function toggle() {
    if (active.value) close()
    else await open()
  }

  // Document PiP has a real "automatic" trigger (via the Media Session
  // handler below) that pops the window with no click needed, but it only
  // fires for origins Chrome already trusts — brand-new/low-traffic sites
  // rarely qualify. As a more reliable fallback, try to pop the window
  // ourselves the moment the tab is hidden: PiP only needs a *recent* user
  // gesture (transient activation lasts a few seconds in Chromium), and
  // switching tabs almost always follows some click/tap on the page (pause,
  // drag, expand…), so this succeeds far more often in practice.
  function onVisibilityChange() {
    if (!document.hidden || !supported || active.value || !store.activeTimer) return
    open().catch(() => { /* no transient activation left — user didn't touch the page recently enough */ })
  }
  onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
  onUnmounted(() => document.removeEventListener('visibilitychange', onVisibilityChange))

  function syncMediaSession() {
    if (!('mediaSession' in navigator)) return
    const ts = store.timerState
    const habit = store.activeTimer
    if (ts && habit) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: habit.name,
        artist: ts.phase === 'break' ? t('Pausa', 'Break') : t('Enfoque', 'Focus'),
        album: 'Fluiser',
      })
      navigator.mediaSession.playbackState = !ts.paused && ts.phase !== 'review' ? 'playing' : 'paused'
    } else {
      navigator.mediaSession.metadata = null
      navigator.mediaSession.playbackState = 'none'
    }
  }

  watch(() => store.activeTimer, (h) => { if (!h) close() })
  watch(() => store.timerMinimized, (min) => { if (!min) close() })
  watch(() => [store.timerState?.phase, store.timerState?.paused, store.activeTimer?.id], syncMediaSession, { immediate: true })

  // Rebuild the Document PiP button strip whenever the state it depends on
  // changes — the 500ms draw() interval only repaints the canvas, this keeps
  // the real buttons (label, which ones show) in sync with the phase.
  watch(
    () => [store.timerState?.phase, store.timerState?.paused, store.timerState?.pendingPhase, store.timerState?.currentSession],
    () => { if (controlsEl) renderControls() },
  )

  if ('mediaSession' in navigator) {
    try { navigator.mediaSession.setActionHandler('enterpictureinpicture', () => { open().catch(() => {}) }) } catch { /* unsupported */ }
    // Best-effort controls for classic video PiP, which only exposes
    // whatever Media Session actions the browser chooses to render (usually
    // play/pause plus a next/previous pair) — Document PiP above gets real
    // labeled buttons instead and doesn't rely on any of this.
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (store.timerState?.phase === 'gate') store.continueGate()
        else store.resumeTimer()
      })
    } catch { /* unsupported */ }
    try { navigator.mediaSession.setActionHandler('pause', () => store.pauseTimer()) } catch { /* unsupported */ }
    try {
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        const ts = store.timerState
        if (!ts) return
        if (ts.phase === 'gate') store.continueGate()
        else if (ts.phase === 'flow-check') finishWithConfirm()
        else store.skipTimerSession()
      })
    } catch { /* unsupported */ }
  }

  return { supported, active, toggle }
}
