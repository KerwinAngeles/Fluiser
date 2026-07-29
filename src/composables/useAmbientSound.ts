import { ref } from 'vue'

export type SoundId = 'rain' | 'forest' | 'coffee' | 'white' | 'deep'

export interface AmbientSound {
  id: SoundId
  es: string
  en: string
  emoji: string
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: 'rain',   es: 'Lluvia',    en: 'Rain',       emoji: '🌧' },
  { id: 'forest', es: 'Bosque',    en: 'Forest',     emoji: '🌿' },
  { id: 'coffee', es: 'Café',      en: 'Café',       emoji: '☕' },
  { id: 'white',  es: 'Blanco',    en: 'White',      emoji: '🌫' },
  { id: 'deep',   es: 'Profundo',  en: 'Deep',       emoji: '🧠' },
]

// ── Singleton state (persists across component mounts) ──────────────────────
let _ctx: AudioContext | null = null
let _masterGain: GainNode | null = null
type Cleanup = () => void
let _cleanup: Cleanup | null = null

const _current = ref<SoundId | null>(null)
const _volume = ref(0.35)

// ── Audio helpers ────────────────────────────────────────────────────────────

function _getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext()
    _masterGain = _ctx.createGain()
    _masterGain.gain.value = _volume.value
    _masterGain.connect(_ctx.destination)
  }
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function _noise(ctx: AudioContext, durationSec = 3): AudioBufferSourceNode {
  const n = ctx.sampleRate * durationSec
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}

// ── Sound builders ───────────────────────────────────────────────────────────

function _buildRain(ctx: AudioContext, out: AudioNode): Cleanup {
  // High-freq drops
  const s1 = _noise(ctx)
  const hi = ctx.createBiquadFilter()
  hi.type = 'highpass'; hi.frequency.value = 2800
  const g1 = ctx.createGain(); g1.gain.value = 0.65
  s1.connect(hi); hi.connect(g1); g1.connect(out)

  // Low rumble
  const s2 = _noise(ctx)
  const lo = ctx.createBiquadFilter()
  lo.type = 'lowpass'; lo.frequency.value = 260
  const g2 = ctx.createGain(); g2.gain.value = 0.28
  s2.connect(lo); lo.connect(g2); g2.connect(out)

  // Mid texture
  const s3 = _noise(ctx)
  const mid = ctx.createBiquadFilter()
  mid.type = 'bandpass'; mid.frequency.value = 1100; mid.Q.value = 0.6
  const g3 = ctx.createGain(); g3.gain.value = 0.18
  s3.connect(mid); mid.connect(g3); g3.connect(out)

  s1.start(); s2.start(); s3.start()
  return () => { try { s1.stop(); s2.stop(); s3.stop() } catch {} }
}

function _buildForest(ctx: AudioContext, out: AudioNode): Cleanup {
  // Wind through leaves
  const s1 = _noise(ctx)
  const wind = ctx.createBiquadFilter()
  wind.type = 'bandpass'; wind.frequency.value = 650; wind.Q.value = 0.35
  const g1 = ctx.createGain(); g1.gain.value = 0.18
  s1.connect(wind); wind.connect(g1); g1.connect(out)
  s1.start()

  // Bird chirps
  let _stopped = false
  let _t: ReturnType<typeof setTimeout> | null = null

  function chirp() {
    if (_stopped) return
    try {
      const o = ctx.createOscillator()
      const cg = ctx.createGain()
      o.type = 'sine'
      const base = 2600 + Math.random() * 1800
      o.frequency.setValueAtTime(base, ctx.currentTime)
      o.frequency.linearRampToValueAtTime(base * 1.15, ctx.currentTime + 0.08)
      o.frequency.setValueAtTime(base, ctx.currentTime + 0.12)
      cg.gain.setValueAtTime(0, ctx.currentTime)
      cg.gain.linearRampToValueAtTime(0.065, ctx.currentTime + 0.04)
      cg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28)
      o.connect(cg); cg.connect(out)
      o.start(); o.stop(ctx.currentTime + 0.32)
    } catch {}

    // Occasional double-chirp
    if (Math.random() > 0.6) {
      _t = setTimeout(() => {
        if (!_stopped) chirp()
        _t = setTimeout(chirp, 2500 + Math.random() * 4500)
      }, 140)
    } else {
      _t = setTimeout(chirp, 2500 + Math.random() * 4500)
    }
  }
  _t = setTimeout(chirp, 800 + Math.random() * 1500)

  return () => {
    _stopped = true
    if (_t) clearTimeout(_t)
    try { s1.stop() } catch {}
  }
}

function _buildCoffee(ctx: AudioContext, out: AudioNode): Cleanup {
  // Low ambient rumble
  const s1 = _noise(ctx)
  const lo = ctx.createBiquadFilter(); lo.type = 'lowpass'; lo.frequency.value = 550
  const g1 = ctx.createGain(); g1.gain.value = 0.32
  s1.connect(lo); lo.connect(g1); g1.connect(out)

  // Conversational mid
  const s2 = _noise(ctx)
  const m1 = ctx.createBiquadFilter(); m1.type = 'bandpass'; m1.frequency.value = 1300; m1.Q.value = 2.8
  const g2 = ctx.createGain(); g2.gain.value = 0.11
  s2.connect(m1); m1.connect(g2); g2.connect(out)

  // High clatter
  const s3 = _noise(ctx)
  const hi = ctx.createBiquadFilter(); hi.type = 'highpass'; hi.frequency.value = 3500
  const g3 = ctx.createGain(); g3.gain.value = 0.04
  s3.connect(hi); hi.connect(g3); g3.connect(out)

  s1.start(); s2.start(); s3.start()
  return () => { try { s1.stop(); s2.stop(); s3.stop() } catch {} }
}

function _buildWhite(ctx: AudioContext, out: AudioNode): Cleanup {
  const s = _noise(ctx)
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1000; f.Q.value = 0.08
  const g = ctx.createGain(); g.gain.value = 0.48
  s.connect(f); f.connect(g); g.connect(out)
  s.start()
  return () => { try { s.stop() } catch {} }
}

function _buildDeep(ctx: AudioContext, out: AudioNode): Cleanup {
  // Brown-ish noise for deep focus
  const s = _noise(ctx)
  const lo = ctx.createBiquadFilter(); lo.type = 'lowpass'; lo.frequency.value = 380
  const g = ctx.createGain(); g.gain.value = 0.52
  s.connect(lo); lo.connect(g); g.connect(out)
  s.start()

  // Very subtle 40Hz binaural-like pulse
  const osc = ctx.createOscillator()
  osc.frequency.value = 40; osc.type = 'sine'
  const og = ctx.createGain(); og.gain.value = 0.022
  osc.connect(og); og.connect(out)
  osc.start()

  return () => { try { s.stop(); osc.stop() } catch {} }
}

// ── Public API ───────────────────────────────────────────────────────────────

function _stopInternal() {
  if (_cleanup) { _cleanup(); _cleanup = null }
  _current.value = null
}

function play(id: SoundId) {
  _stopInternal()
  try {
    const ctx = _getCtx()
    const out = _masterGain!
    let c: Cleanup
    if      (id === 'rain')   c = _buildRain(ctx, out)
    else if (id === 'forest') c = _buildForest(ctx, out)
    else if (id === 'coffee') c = _buildCoffee(ctx, out)
    else if (id === 'white')  c = _buildWhite(ctx, out)
    else                      c = _buildDeep(ctx, out)
    _cleanup = c
    _current.value = id
  } catch (e) { console.error('ambient:', e) }
}

function stop() { _stopInternal() }

function toggle(id: SoundId) {
  if (_current.value === id) stop()
  else play(id)
}

function setVolume(v: number) {
  _volume.value = v
  if (_masterGain) _masterGain.gain.value = v
}

export function useAmbientSound() {
  return {
    current: _current,
    volume: _volume,
    sounds: AMBIENT_SOUNDS,
    play,
    stop,
    toggle,
    setVolume,
  }
}
