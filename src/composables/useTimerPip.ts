import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'

// Canvas size mirrors the "1a" design option from the Claude Design mockup
// (dark HUD card, 420x230) — the floating window intentionally keeps its own
// fixed dark look regardless of the app's light/dark theme, the same way
// Spotify's mini player and OS media overlays stay legible over anything.
const PIP_WIDTH = 420
const PIP_HEIGHT = 230
const AMBIENCE_KEY = 'fluiser.ambienceEnabled'
const AMBIENCE_VOLUME = 0.16
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

// ── Ambient loop (brown noise) ──
// Chrome only grants "automatic picture-in-picture" (popping the PiP window
// when the user switches tabs, with no click required) to pages that have an
// actually-audible <audio>/<video> element playing. A silent timer doesn't
// qualify, so we loop a very low-volume ambient noise track while a session
// is running — this doubles as a soft focus sound and helps unlock the
// Chrome auto-PiP behavior via the Media Session API below.
function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const blockAlign = numChannels * 2
  const dataLength = buffer.length * blockAlign
  const arrayBuffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(arrayBuffer)
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataLength, true)

  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c))
  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function buildAmbienceBuffer(sampleRate: number, seconds: number): AudioBuffer {
  const length = sampleRate * seconds
  const ctx = new OfflineAudioContext(1, length, sampleRate)
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  let lastOut = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + 0.02 * white) / 1.02
    data[i] = lastOut * 3.5
  }
  return buffer
}

let ambienceAudio: HTMLAudioElement | null = null

function ensureAmbienceAudio(): HTMLAudioElement {
  if (ambienceAudio) return ambienceAudio
  const buffer = buildAmbienceBuffer(44100, 6)
  const url = URL.createObjectURL(encodeWav(buffer))
  const el = new Audio(url)
  el.loop = true
  el.preload = 'auto'
  el.volume = AMBIENCE_VOLUME
  ambienceAudio = el
  return el
}

function loadAmbienceEnabled(): boolean {
  try { return localStorage.getItem(AMBIENCE_KEY) !== 'off' } catch { return true }
}
function saveAmbienceEnabled(v: boolean) {
  try { localStorage.setItem(AMBIENCE_KEY, v ? 'on' : 'off') } catch { /* ignore */ }
}

export function useTimerPip() {
  // Classic <video> Picture-in-Picture instead of the newer Document PiP API:
  // it's supported far more broadly (Chrome, Edge and Safari, going back
  // years) than window.documentPictureInPicture, which is still Chrome/Edge
  // 116+ only and inconsistent in the wild. We draw the timer onto a canvas,
  // turn it into a live video via captureStream(), and PiP that video.
  const supported = typeof document !== 'undefined'
    && document.pictureInPictureEnabled === true
    && typeof HTMLVideoElement !== 'undefined'
    && 'requestPictureInPicture' in HTMLVideoElement.prototype

  const active = ref(false)
  const ambienceEnabled = ref(loadAmbienceEnabled())
  const store = useFluiserStore()
  const t = useT()

  let canvas: HTMLCanvasElement | null = null
  let ctx2d: CanvasRenderingContext2D | null = null
  let video: HTMLVideoElement | null = null
  let drawInterval: ReturnType<typeof setInterval> | null = null
  let bgGradient: CanvasGradient | null = null

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
    const toneKey = isBreak ? 'mint' : habit.tone
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
    else if (!isReview) {
      const total = isBreak ? ts.breakSec : ts.workSec
      progress = total ? 1 - (ts.remaining ?? 0) / total : 1
    }
    progress = Math.max(0, Math.min(1, progress))

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
    const letter = (habit.name.trim()[0] ?? '?').toUpperCase()
    drawBadge(ctx, rx, 62, 30, accent, letter)
    ctx.fillStyle = PALETTE.textPrimary
    ctx.font = `700 16px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.fillText(truncateText(ctx, habit.name, W - rx - 30 - 10 - 20), rx + 40, 62 + 15)
    ctx.textBaseline = 'alphabetic'

    let phaseLabel = t('Enfoque', 'Focus')
    if (isReview) phaseLabel = t('Sesión completa', 'Session complete')
    else if (isFlow) phaseLabel = t('¿Sigues en flujo?', 'Still in flow?')
    else if (isBreak) phaseLabel = t('Pausa', 'Break')
    ctx.fillStyle = accent
    ctx.font = `700 12px ${FONT}`
    ctx.fillText(truncateText(ctx, phaseLabel.toUpperCase(), W - rx - 20), rx, 106)

    const statusDotY = 130
    ctx.beginPath()
    ctx.arc(rx + 3.5, statusDotY, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = accent
    ctx.fill()

    let statusText = t('En marcha', 'Running')
    if (isReview) statusText = t('Guardado', 'Saved')
    else if (isFlow) statusText = t('Sesión terminada', 'Session ended')
    else if (ts.paused) statusText = t('Pausado', 'Paused')
    ctx.fillStyle = PALETTE.textSecondary
    ctx.font = `500 13px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.fillText(statusText, rx + 14, statusDotY + 1)
    ctx.textBaseline = 'alphabetic'

    if (!isFlow && ts.sessions > 1) {
      const sessionLabel = t(`Sesión ${ts.currentSession} de ${ts.sessions}`, `Session ${ts.currentSession} of ${ts.sessions}`)
      ctx.fillStyle = PALETTE.textQuaternary
      ctx.font = `500 12px ${FONT}`
      ctx.textBaseline = 'middle'
      ctx.fillText(sessionLabel, rx, 156)
      const labelWidth = ctx.measureText(sessionLabel).width
      drawSessionPills(ctx, rx + labelWidth + 8, 152, ts.sessions, ts.currentSession, accent)
      ctx.textBaseline = 'alphabetic'
    } else if (ts.flowExtensions > 0) {
      ctx.fillStyle = PALETTE.textQuaternary
      ctx.font = `500 12px ${FONT}`
      ctx.textBaseline = 'middle'
      ctx.fillText(`+${ts.flowExtensions * 5} ${t('min de flujo', 'min flow')}`, rx, 156)
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

  function close() {
    if (drawInterval) { clearInterval(drawInterval); drawInterval = null }
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => { /* already closed */ })
    }
    active.value = false
  }

  async function open() {
    if (!supported || active.value) return
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

  // Chrome's "automatic" PiP-on-tab-switch (via the Media Session handler
  // below) only fires for pages it already trusts with a high Media
  // Engagement Index — brand-new/low-traffic origins usually don't qualify,
  // even with audible media playing. As a more reliable fallback, try to pop
  // the window ourselves the moment the tab is hidden: PiP only needs a
  // *recent* user gesture (transient activation lasts a few seconds in
  // Chromium), and switching tabs almost always follows some click/tap on
  // the page (pause, drag, expand…), so this succeeds far more often in
  // practice than waiting on the browser's own heuristic.
  function onVisibilityChange() {
    if (!document.hidden || !supported || active.value || !store.activeTimer) return
    open().catch(() => { /* no transient activation left — user didn't touch the page recently enough */ })
  }
  onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
  onUnmounted(() => document.removeEventListener('visibilitychange', onVisibilityChange))

  function toggleAmbience() {
    ambienceEnabled.value = !ambienceEnabled.value
    saveAmbienceEnabled(ambienceEnabled.value)
    syncAmbience()
  }

  function syncAmbience() {
    const ts = store.timerState
    const running = !!ts && !ts.paused && ts.phase !== 'review'
    if ('mediaSession' in navigator) {
      const habit = store.activeTimer
      if (ts && habit) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: habit.name,
          artist: ts.phase === 'break' ? t('Pausa', 'Break') : t('Enfoque', 'Focus'),
          album: 'Fluiser',
        })
      } else {
        navigator.mediaSession.metadata = null
      }
      navigator.mediaSession.playbackState = running ? 'playing' : 'paused'
    }
    if (running && ambienceEnabled.value) {
      ensureAmbienceAudio().play().catch(() => { /* blocked until next user gesture */ })
    } else {
      ambienceAudio?.pause()
    }
  }

  watch(() => store.activeTimer, (h) => { if (!h) close() })
  watch(() => store.timerMinimized, (min) => { if (!min) close() })
  watch(() => [store.timerState?.phase, store.timerState?.paused, store.activeTimer?.id], syncAmbience, { immediate: true })

  if ('mediaSession' in navigator) {
    try { navigator.mediaSession.setActionHandler('enterpictureinpicture', () => { open().catch(() => {}) }) } catch { /* unsupported */ }
    try { navigator.mediaSession.setActionHandler('play', () => store.resumeTimer()) } catch { /* unsupported */ }
    try { navigator.mediaSession.setActionHandler('pause', () => store.pauseTimer()) } catch { /* unsupported */ }
  }

  return { supported, active, toggle, ambienceEnabled, toggleAmbience }
}
