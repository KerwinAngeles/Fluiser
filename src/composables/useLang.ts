import { inject, provide, type Ref } from 'vue'
import type { Mood, Energy, CategoryId } from '@/types'
import { MOODS, ENERGY, CATEGORIES } from '@/types'

const LangKey = Symbol('lang')

export const provideLang = (lang: Ref<'es' | 'en'>) => provide(LangKey, lang)
export const useLang = () => inject<Ref<'es' | 'en'>>(LangKey)!

export function useT() {
  const lang = useLang()
  return (es: string, en: string) => (lang.value === 'en' ? en : es)
}

export function useMonths() {
  const lang = useLang()
  const es = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const en = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return { get: (i: number) => (lang.value === 'en' ? en[i] : es[i]), es, en }
}

export function useDays() {
  const lang = useLang()
  const es = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const en = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  return { get: (i: number) => (lang.value === 'en' ? en[i] : es[i]), es, en }
}

export function useMoodLabel() {
  const lang = useLang()
  const enLabels: Record<Mood, { label: string; desc: string }> = {
    great: { label: 'Very well',  desc: 'Lucid, open' },
    good:  { label: 'Good',      desc: 'Stable, present' },
    okay:  { label: 'Okay',      desc: 'A bit cloudy' },
    low:   { label: 'Low',       desc: 'Heavy, tired' },
    rough: { label: 'Rough',     desc: 'Inner storm' },
  }
  return (mood: Mood) => {
    const def = MOODS.find((m) => m.id === mood)!
    return lang.value === 'en' ? enLabels[mood] : { label: def.label, desc: def.desc }
  }
}

export function useEnergyLabel() {
  const lang = useLang()
  const enLabels: Record<string, string> = { easy: 'Flowed', auto: 'Automatic', effort: 'Effort' }
  return (id: Energy) => {
    const def = ENERGY.find((e) => e.id === id)!
    return lang.value === 'en' ? enLabels[id] : def.label
  }
}

export function useCatLabel() {
  const lang = useLang()
  const enLabels: Record<CategoryId, string> = {
    cuerpo: 'Body', mente: 'Mind', creacion: 'Creation', conexion: 'Connection', descanso: 'Rest',
  }
  return (id: CategoryId) => {
    const def = CATEGORIES.find((c) => c.id === id)!
    return { label: lang.value === 'en' ? enLabels[id] : def.label, tone: def.tone }
  }
}

export function useFmtDate() {
  const lang = useLang()
  return (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(lang.value === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric', year: 'numeric' })
  }
}
