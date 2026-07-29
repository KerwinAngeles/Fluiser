import { ref, watch, watchEffect } from 'vue'
import { useFluiserStore } from '@/stores/fluiser'
import { useT } from '@/composables/useLang'

const PIP_WIDTH = 260
const PIP_HEIGHT = 150

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

export function useTimerPip() {
  const supported = typeof window !== 'undefined' && 'documentPictureInPicture' in window
  const active = ref(false)
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
    if (!supported || active.value || !window.documentPictureInPicture) return
    win = await window.documentPictureInPicture.requestPictureInPicture({ width: PIP_WIDTH, height: PIP_HEIGHT })
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

  watch(() => store.activeTimer, (h) => { if (!h) close() })
  watch(() => store.timerMinimized, (min) => { if (!min) close() })

  return { supported, active, toggle }
}
