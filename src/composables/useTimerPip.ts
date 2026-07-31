import { ref, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'

const PIP_WIDTH = 260
const PIP_HEIGHT = 150
const AMBIENCE_KEY = 'fluiser.ambienceEnabled'
const AMBIENCE_VOLUME = 0.16

interface PipEls {
  dot: HTMLElement
  name: HTMLElement
  phase: HTMLElement
  time: HTMLElement
  playBtn: HTMLButtonElement
  playIcon: HTMLElement
}

function copyStylesInto(doc: Document) {
  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      const css = Array.from(sheet.cssRules).map((r) => r.cssText).join('\n')
      const style = doc.createElement('style')
      style.textContent = css
      doc.head.appendChild(style)
    } catch {
      if (sheet.href) {
        const link = doc.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        doc.head.appendChild(link)
      }
    }
  })
  const root = document.documentElement
  doc.documentElement.setAttribute('data-theme', root.getAttribute('data-theme') ?? 'dark')
  const heatmap = root.getAttribute('data-heatmap')
  if (heatmap) doc.documentElement.setAttribute('data-heatmap', heatmap)
  doc.documentElement.style.cssText = root.style.cssText
  doc.body.style.margin = '0'
  doc.body.style.background = 'var(--bg-base)'
  doc.body.style.overflow = 'hidden'
}

function buildContent(doc: Document, onToggle: () => void): PipEls {
  const style = doc.createElement('style')
  style.textContent = `
    .pip-wrap { display:flex; flex-direction:column; gap:8px; padding:16px; height:100%; box-sizing:border-box;
      font-family: var(--font-text, system-ui, sans-serif); }
    .pip-head { display:flex; align-items:center; gap:8px; }
    .pip-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .pip-name { font-size:13px; font-weight:600; color: var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pip-phase { font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color: var(--text-3); }
    .pip-time { font-size:36px; font-weight:600; letter-spacing:-0.03em; font-variant-numeric: tabular-nums; }
    .pip-controls { margin-top:auto; }
    .pip-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px;
      border:1px solid var(--border-default); background: var(--bg-elevated); color: var(--text-1);
      font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; }
    .pip-btn:hover { background: var(--bg-glass-hi); }
  `
  doc.head.appendChild(style)

  const wrap = doc.createElement('div')
  wrap.className = 'pip-wrap'

  const head = doc.createElement('div')
  head.className = 'pip-head'
  const dot = doc.createElement('span')
  dot.className = 'pip-dot'
  const name = doc.createElement('span')
  name.className = 'pip-name'
  head.append(dot, name)

  const phase = doc.createElement('div')
  phase.className = 'pip-phase'

  const time = doc.createElement('div')
  time.className = 'pip-time'

  const controls = doc.createElement('div')
  controls.className = 'pip-controls'
  const playBtn = doc.createElement('button')
  playBtn.className = 'pip-btn'
  const playIcon = doc.createElement('span')
  playBtn.appendChild(playIcon)
  playBtn.addEventListener('click', onToggle)
  controls.appendChild(playBtn)

  wrap.append(head, phase, time, controls)
  doc.body.appendChild(wrap)

  return { dot, name, phase, time, playBtn, playIcon }
}

// ── Ambient loop (brown noise) ──
// Chrome only grants "automatic picture-in-picture" (popping the PiP window
// when the user switches tabs, with no click required) to pages that have an
// actually-audible <audio>/<video> element playing. A silent timer doesn't
// qualify, so we loop a very low-volume ambient noise track while a session
// is running — this doubles as a soft focus sound and unlocks the Chrome
// auto-PiP behavior via the Media Session API below.
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
  const supported = typeof window !== 'undefined'
    && typeof window.documentPictureInPicture?.requestPictureInPicture === 'function'
  const active = ref(false)
  const ambienceEnabled = ref(loadAmbienceEnabled())
  const store = useFluiserStore()
  const t = useT()

  let win: Window | null = null
  let els: PipEls | null = null
  let stopWatch: (() => void) | null = null

  function togglePause() {
    const ts = store.timerState
    if (!ts) return
    if (ts.paused) store.resumeTimer()
    else store.pauseTimer()
  }

  function close() {
    if (stopWatch) { stopWatch(); stopWatch = null }
    if (win && !win.closed) win.close()
    win = null
    els = null
    active.value = false
  }

  async function open() {
    if (!supported || active.value) return
    try {
      win = await window.documentPictureInPicture!.requestPictureInPicture({ width: PIP_WIDTH, height: PIP_HEIGHT })
    } catch {
      return // no transient user activation, or the browser refused — fall back to the manual button
    }
    copyStylesInto(win.document)
    els = buildContent(win.document, togglePause)
    active.value = true

    win.addEventListener('pagehide', () => close())

    stopWatch = watchEffect(() => {
      if (!els) return
      const ts = store.timerState
      const habit = store.activeTimer
      if (!ts || !habit) return
      const isBreak = ts.phase === 'break'
      const color = isBreak ? 'var(--mint)' : `var(--${habit.tone})`
      els.dot.style.background = color
      els.name.textContent = habit.name
      els.phase.textContent = ts.phase === 'review'
        ? t('Listo', 'Done')
        : isBreak ? t('Pausa', 'Break') : t('Enfoque', 'Focus')
      const remaining = ts.remaining ?? 0
      const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
      const ss = String(remaining % 60).padStart(2, '0')
      els.time.textContent = `${mm}:${ss}`
      els.time.style.color = color
      els.playIcon.textContent = ts.paused ? t('▶ Reanudar', '▶ Resume') : t('⏸ Pausar', '⏸ Pause')
    })
  }

  async function toggle() {
    if (active.value) close()
    else await open()
  }

  // Chrome's "automatic" PiP-on-tab-switch (via the Media Session handler
  // below) only fires for pages it already trusts with a high Media
  // Engagement Index — brand-new/low-traffic origins usually don't qualify,
  // even with audible media playing. As a more reliable fallback, try to pop
  // the window ourselves the moment the tab is hidden: Document PiP only
  // needs a *recent* user gesture (transient activation lasts a few seconds
  // in Chromium), and switching tabs almost always follows some click/tap on
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
