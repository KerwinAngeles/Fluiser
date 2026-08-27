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

const PALETTE = {
  bgTop: 'oklch(0.19 0.01 260)',
  bgBottom: 'oklch(0.14 0.012 260)',
  track: 'oklch(0.3 0.01 260)',
  divider: 'oklch(0.3 0.01 260 / 0.6)',
  textPrimary: '#ffffff',
  textSecondary: 'oklch(0.85 0.01 260)',
  textTertiary: 'oklch(0.65 0.02 260)',
  textQuaternary: 'oklch(0.6 0.02 260)',
  textFooter: 'oklch(0.55 0.02 260)',
  pillOff: 'oklch(0.35 0.01 260)',
} as const

const TONE_ACCENT: Record<string, string> = {
  sky: '#7BB6FF',
  mint: '#86D6B0',
  amber: '#E8B575',
  rose: '#E89B95',
  lilac: '#B8A8E0',
}

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
    flex: 1 1 auto; min-height: 0; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .fpc-canvas-wrap canvas { display: block; width: auto; height: auto; max-width: 100%; max-height: 100%; }
  .fpc-bar {
    flex: 0 0 auto;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    height: ${DOC_PIP_CONTROLS_HEIGHT}px; padding: 0 12px; box-sizing: border-box;
    background: ${PALETTE.bgBottom}; border-top: 1px solid rgba(255,255,255,0.08);
    font-family: ${FONT};
  }
  /* Compact icon buttons (pause/skip/finish) — tooltip carries the label */
  .fpc-btn {
    flex: 0 0 auto; width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 9px; border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.05); color: #fff;
    cursor: pointer; padding: 0;
  }
  .fpc-btn:hover { background: rgba(255,255,255,0.1); }
  .fpc-btn-primary { background: var(--fpc-accent, ${TONE_ACCENT.sky}); border-color: transparent; color: #0A0B0D; }
  .fpc-btn-primary:hover { filter: brightness(0.94); }
  .fpc-btn svg { width: 13px; height: 13px; }
  /* Wide labeled button — only used where a single action needs to stay
     unambiguous (gate/review), so there's no crowding to solve there. */
  .fpc-btn-wide {
    flex: 1 1 auto; width: auto; height: 30px; padding: 0 14px; gap: 5px;
    border-radius: 8px; font: 600 11.5px ${FONT}; white-space: nowrap;
  }
  .fpc-btn-wide svg { width: 12px; height: 12px; flex-shrink: 0; }
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

function darken(hex: string, factor: number): string {
  const h = hex.replace('#', '')
  const r = Math.round(parseInt(h.substring(0, 2), 16) * factor)
  const g = Math.round(parseInt(h.substring(2, 4), 16) * factor)
  const b = Math.round(parseInt(h.substring(4, 6), 16) * factor)
  return `rgb(${r}, ${g}, ${b})`
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawBadge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, accent: string, letter: string) {
  roundRect(ctx, x, y, size, size, size * 0.3)
  ctx.fillStyle = darken(accent, 0.78)
  ctx.fill()
  ctx.fillStyle = PALETTE.textPrimary
  ctx.font = `700 ${Math.round(size * 0.44)}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter, x + size / 2, y + size / 2 + 1)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function drawSessionPills(ctx: CanvasRenderingContext2D, x: number, y: number, sessions: number, current: number, accent: string) {
  const w = 14
  const h = 4
  const gap = 4
  for (let i = 1; i <= sessions; i++) {
    roundRect(ctx, x, y, w, h, 2)
    ctx.fillStyle = i <= current ? accent : PALETTE.pillOff
    ctx.fill()
    x += w + gap
  }
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
    const toneKey = isBreak || (isGate && gateIsBreak) ? 'mint' : habit.tone
    const accent = TONE_ACCENT[toneKey] ?? TONE_ACCENT.sky

    // ── Left: ring ──
    const cx = 101
    const cy = 115
    const r = 64

    ctx.strokeStyle = PALETTE.track
    ctx.lineWidth = 9
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()

    let progress = 1
    if (isFlow) progress = (ts.remaining ?? 0) / 12
    else if (!isReview && !isGate) {
      const total = isBreak ? ts.breakSec : ts.workSec
      progress = total ? 1 - (ts.remaining ?? 0) / total : 1
    }
    progress = Math.max(0, Math.min(1, progress))

    if (!isGate) {
      ctx.save()
      ctx.shadowColor = hexToRgba(accent, 0.7)
      ctx.shadowBlur = 10
      ctx.strokeStyle = accent
      ctx.lineWidth = 9
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
      ctx.stroke()
      ctx.restore()
    }

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
    // Rows are spaced with generous, explicit gaps (badge/name → phase →
    // status → session) so labels never read as visually stuck together.
    const nameY = 50
    const phaseY = 100
    const statusDotY = 134
    const sessionY = 166

    const letter = (habit.name.trim()[0] ?? '?').toUpperCase()
    drawBadge(ctx, rx, nameY, 30, accent, letter)
    ctx.fillStyle = PALETTE.textPrimary
    ctx.font = `700 16px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.fillText(truncateText(ctx, habit.name, W - rx - 30 - 10 - 20), rx + 40, nameY + 15)
    ctx.textBaseline = 'alphabetic'

    let phaseLabel = t('Enfoque', 'Focus')
    if (isReview) phaseLabel = t('Sesión completa', 'Session complete')
    else if (isFlow) phaseLabel = t('¿Sigues en flujo?', 'Still in flow?')
    else if (isGate) phaseLabel = gateIsBreak ? t('Lista para la pausa', 'Ready for a break') : t('Lista la siguiente', 'Next one ready')
    else if (isBreak) phaseLabel = t('Pausa', 'Break')
    ctx.fillStyle = accent
    ctx.font = `700 12px ${FONT}`
    ctx.fillText(truncateText(ctx, phaseLabel.toUpperCase(), W - rx - 20), rx, phaseY)

    ctx.beginPath()
    ctx.arc(rx + 3.5, statusDotY, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = accent
    ctx.fill()

    let statusText = t('En marcha', 'Running')
    if (isReview) statusText = t('Guardado', 'Saved')
    else if (isFlow) statusText = t('Sesión terminada', 'Session ended')
    else if (isGate) statusText = t('Continúa manualmente', 'Continue manually')
    else if (ts.paused) statusText = t('Pausado', 'Paused')
    ctx.fillStyle = PALETTE.textSecondary
    ctx.font = `500 13px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.fillText(statusText, rx + 14, statusDotY + 1)
    ctx.textBaseline = 'alphabetic'

    if (!isFlow && !isGate && ts.sessions > 1) {
      const sessionLabel = t(`Sesión ${ts.currentSession} de ${ts.sessions}`, `Session ${ts.currentSession} of ${ts.sessions}`)
      ctx.fillStyle = PALETTE.textQuaternary
      ctx.font = `500 12px ${FONT}`
      ctx.textBaseline = 'middle'
      ctx.fillText(sessionLabel, rx, sessionY)
      const labelWidth = ctx.measureText(sessionLabel).width
      drawSessionPills(ctx, rx + labelWidth + 8, sessionY - 4, ts.sessions, ts.currentSession, accent)
      ctx.textBaseline = 'alphabetic'
    } else if (isGate) {
      ctx.fillStyle = PALETTE.textQuaternary
      ctx.font = `500 12px ${FONT}`
      ctx.textBaseline = 'middle'
      ctx.fillText(t('Toca continuar en la app', 'Tap continue in the app'), rx, sessionY)
      ctx.textBaseline = 'alphabetic'
    } else if (ts.flowExtensions > 0) {
      ctx.fillStyle = PALETTE.textQuaternary
      ctx.font = `500 12px ${FONT}`
      ctx.textBaseline = 'middle'
      ctx.fillText(`+${ts.flowExtensions * 5} ${t('min de flujo', 'min flow')}`, rx, sessionY)
      ctx.textBaseline = 'alphabetic'
    }

    ctx.fillStyle = PALETTE.textFooter
    ctx.font = `500 11px ${FONT}`
    ctx.textAlign = 'right'
    ctx.fillText('Fluiser', W - 18, H - 14)
    ctx.textAlign = 'left'
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

    const toneKey = ts.phase === 'break' || (ts.phase === 'gate' && ts.pendingPhase === 'break') ? 'mint' : habit.tone
    controlsEl.style.setProperty('--fpc-accent', TONE_ACCENT[toneKey] ?? TONE_ACCENT.sky)

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
