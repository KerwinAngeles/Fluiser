import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'

const PIP_WIDTH = 320
const PIP_HEIGHT = 180
const AMBIENCE_KEY = 'fluiser.ambienceEnabled'
const AMBIENCE_VOLUME = 0.16

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
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

  function ensureCanvas() {
    if (canvas) return
    canvas = document.createElement('canvas')
    canvas.width = PIP_WIDTH
    canvas.height = PIP_HEIGHT
    ctx2d = canvas.getContext('2d')
  }

  function draw() {
    if (!ctx2d || !canvas) return
    const W = canvas.width
    const H = canvas.height
    ctx2d.clearRect(0, 0, W, H)
    ctx2d.fillStyle = cssVar('--bg-base', '#0b0c0f')
    ctx2d.fillRect(0, 0, W, H)

    const ts = store.timerState
    const habit = store.activeTimer
    if (!ts || !habit) return

    const isBreak = ts.phase === 'break'
    const color = isBreak ? cssVar('--mint', '#5eead4') : cssVar(`--${habit.tone}`, '#5b9bf5')

    ctx2d.textBaseline = 'top'
    ctx2d.fillStyle = cssVar('--text-1', '#f5f5f7')
    ctx2d.font = '600 16px system-ui, sans-serif'
    ctx2d.fillText(habit.name, 148, 20, W - 168)

    const phaseLabel = ts.phase === 'review'
      ? t('Listo', 'Done')
      : isBreak ? t('Pausa', 'Break') : t('Enfoque', 'Focus')
    ctx2d.fillStyle = color
    ctx2d.font = '600 12px system-ui, sans-serif'
    ctx2d.fillText(phaseLabel.toUpperCase(), 148, 44)

    // Ring
    const cx = 70
    const cy = H / 2
    const r = 50
    const total = isBreak ? ts.breakSec : ts.workSec
    const remaining = ts.remaining ?? 0
    const progress = total ? 1 - remaining / total : 1
    ctx2d.strokeStyle = cssVar('--border-subtle', '#2a2d33')
    ctx2d.lineWidth = 7
    ctx2d.beginPath()
    ctx2d.arc(cx, cy, r, 0, Math.PI * 2)
    ctx2d.stroke()
    ctx2d.strokeStyle = color
    ctx2d.lineCap = 'round'
    ctx2d.beginPath()
    ctx2d.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, progress)))
    ctx2d.stroke()

    const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
    const ss = String(remaining % 60).padStart(2, '0')
    ctx2d.fillStyle = cssVar('--text-1', '#f5f5f7')
    ctx2d.font = '600 15px system-ui, sans-serif'
    ctx2d.textAlign = 'center'
    ctx2d.textBaseline = 'middle'
    ctx2d.fillText(`${mm}:${ss}`, cx, cy)
    ctx2d.textAlign = 'left'
    ctx2d.textBaseline = 'alphabetic'

    ctx2d.fillStyle = ts.paused ? cssVar('--text-3', '#8a8f98') : color
    ctx2d.font = '500 13px system-ui, sans-serif'
    ctx2d.textBaseline = 'top'
    ctx2d.fillText(ts.paused ? t('Pausado', 'Paused') : t('En marcha', 'Running'), 148, H - 40)
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
