import { ref, watch } from 'vue'

const LS_KEY = 'fluiser.theme'

export type BgEffect = 'ambient' | 'fireflies' | 'stars' | 'aurora' | 'none' | 'aurora-boreal' | 'cosmos' | 'zen' | 'terrario' | 'watercolor' | 'geometry'
export type AccentColor = 'sky' | 'lilac' | 'mint' | 'rose' | 'amber'

interface ThemeSettings {
  dark: boolean
  lang: 'es' | 'en'
  heatmap: 'sky' | 'warm' | 'mono'
  density: 'compact' | 'regular' | 'spacious'
  typeSize: 'small' | 'regular' | 'large'
  bg: BgEffect
  accent: AccentColor
  reduceMotion: boolean
}

function loadTheme(): ThemeSettings {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { ...defaults(), ...JSON.parse(raw) }
  } catch {}
  return defaults()
}

function defaults(): ThemeSettings {
  return { dark: true, lang: 'es', heatmap: 'sky', density: 'regular', typeSize: 'regular', bg: 'ambient', accent: 'sky', reduceMotion: false }
}

let _instance: ReturnType<typeof createTheme> | null = null

function createTheme() {
  const saved = loadTheme()
  const dark        = ref(saved.dark)
  const lang        = ref<'es' | 'en'>(saved.lang)
  const heatmap     = ref<'sky' | 'warm' | 'mono'>(saved.heatmap)
  const density     = ref<'compact' | 'regular' | 'spacious'>(saved.density)
  const typeSize    = ref<'small' | 'regular' | 'large'>(saved.typeSize)
  const bg          = ref<BgEffect>(saved.bg)
  const accent      = ref<AccentColor>(saved.accent)
  const reduceMotion = ref(saved.reduceMotion)

  const ACCENT_VARS: Record<AccentColor, string> = {
    sky:   '#5b9cf6',
    lilac: '#b8a8e0',
    mint:  '#6fcf97',
    rose:  '#f29090',
    amber: '#e8b575',
  }

  function applyTheme() {
    const root = document.documentElement
    root.setAttribute('data-theme', dark.value ? 'dark' : 'light')
    root.setAttribute('data-heatmap', heatmap.value)
    const densityVal = density.value === 'compact' ? 0.85 : density.value === 'spacious' ? 1.12 : 1
    const typeVal = typeSize.value === 'small' ? 0.94 : typeSize.value === 'large' ? 1.08 : 1
    root.style.setProperty('--density', String(densityVal))
    root.style.setProperty('--type-scale', String(typeVal))
    root.style.setProperty('--accent-custom', ACCENT_VARS[accent.value])
  }

  function saveTheme() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        dark: dark.value, lang: lang.value, heatmap: heatmap.value,
        density: density.value, typeSize: typeSize.value,
        bg: bg.value, accent: accent.value, reduceMotion: reduceMotion.value,
      }))
    } catch {}
  }

  watch([dark, lang, heatmap, density, typeSize, bg, accent, reduceMotion], () => {
    applyTheme()
    saveTheme()
  }, { immediate: true })

  return { dark, lang, heatmap, density, typeSize, bg, accent, reduceMotion }
}

export function useTheme() {
  if (!_instance) _instance = createTheme()
  return _instance
}
