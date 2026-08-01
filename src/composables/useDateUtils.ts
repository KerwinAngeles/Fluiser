export const ymd = (d?: Date | string): string => {
  const dt = d instanceof Date ? d : d ? new Date(d) : new Date()
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000)

export const startOfWeek = (d: Date): Date => {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

export function timeAgo(iso: string, lang: 'es' | 'en'): string {
  const diffSec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSec < 60) return lang === 'en' ? 'just now' : 'ahora'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} ${lang === 'en' ? 'min ago' : 'min'}`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ${lang === 'en' ? 'h ago' : 'h'}`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} ${lang === 'en' ? 'd ago' : 'd'}`
  const d = new Date(iso)
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric' })
}

export const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
export const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const DAYS_ES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
export const DAYS_EN   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
