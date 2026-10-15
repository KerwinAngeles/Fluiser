import { ref, watch } from 'vue'

const LS_KEY = 'fluiser.theme'

export type BgEffect = 'ambient' | 'fireflies' | 'stars' | 'aurora' | 'none' | 'aurora-boreal' | 'cosmos' | 'zen' | 'terrario' | 'watercolor' | 'geometry' | 'code' | 'gym' | 'focus'
export type AccentColor = 'sky' | 'lilac' | 'mint' | 'rose' | 'amber'
export type FluiPresence = 'guia' | 'icono' | 'oculto'

interface ThemeSettings {
  dark: boolean
  lang: 'es' | 'en'
  heatmap: 'sky' | 'warm' | 'mono'
  density: 'compact' | 'regular' | 'spacious'
  typeSize: 'small' | 'regular' | 'large'
  bg: BgEffect
  accent: AccentColor
  reduceMotion: boolean
  fluiPresence: FluiPresence
  fluiConsejos: boolean
  fluiCelebra: boolean
}

function loadTheme(): ThemeSettings {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { ...defaults(), ...JSON.parse(raw) }
  } catch {}
  return defaults()
}

function defaults(): ThemeSettings {
  return {
    dark: true, lang: 'es', heatmap: 'sky', density: 'regular', typeSize: 'regular', bg: 'ambient', accent: 'sky', reduceMotion: false,
    fluiPresence: 'guia', fluiConsejos: true, fluiCelebra: true,
  }
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
  const fluiPresence = ref<FluiPresence>(saved.fluiPresence)
  const fluiConsejos = ref(saved.fluiConsejos)
  const fluiCelebra  = ref(saved.fluiCelebra)

  function applyTheme() {
    const root = document.documentElement
    root.setAttribute('data-theme', dark.value ? 'dark' : 'light')
    root.setAttribute('data-heatmap', heatmap.value)
    const densityVal = density.value === 'compact' ? 0.85 : density.value === 'spacious' ? 1.12 : 1
    const typeVal = typeSize.value === 'small' ? 0.94 : typeSize.value === 'large' ? 1.08 : 1
    root.style.setProperty('--density', String(densityVal))
    root.style.setProperty('--type-scale', String(typeVal))
    // 'sky' (laguna) is the palette's default accent, so it needs no
    // override — anything else points --accent at that tone's own token,
    // and --accent-soft/--accent-glow (both color-mix'd from --accent)
    // follow automatically.
    if (accent.value === 'sky') root.style.removeProperty('--accent')
    else root.style.setProperty('--accent', `var(--${accent.value})`)
    if (reduceMotion.value) root.setAttribute('data-motion', 'reduce')
    else root.removeAttribute('data-motion')
  }

  function saveTheme() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        dark: dark.value, lang: lang.value, heatmap: heatmap.value,
        density: density.value, typeSize: typeSize.value,
        bg: bg.value, accent: accent.value, reduceMotion: reduceMotion.value,
        fluiPresence: fluiPresence.value, fluiConsejos: fluiConsejos.value, fluiCelebra: fluiCelebra.value,
      }))
    } catch {}
  }

  watch([dark, lang, heatmap, density, typeSize, bg, accent, reduceMotion, fluiPresence, fluiConsejos, fluiCelebra], () => {
    applyTheme()
    saveTheme()
  }, { immediate: true })

  return { dark, lang, heatmap, density, typeSize, bg, accent, reduceMotion, fluiPresence, fluiConsejos, fluiCelebra }
}

export function useTheme() {
  if (!_instance) _instance = createTheme()
  return _instance
}
