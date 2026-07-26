import type { Mood } from '@/types'
import { ymd } from './useDateUtils'

const MORNING_PHRASES_ES = [
  'El día recién empieza. Hay espacio para lo que más importa.',
  'Cada mañana trae consigo la posibilidad de ser quien quieres ser.',
  'Pequeños pasos, sostenidos en el tiempo, construyen vidas enteras.',
  'Hoy no tienes que ser perfecto. Solo tienes que estar presente.',
  'El silencio de la mañana guarda todas las intenciones del día.',
  'Lo que cultivas hoy es lo que cosecharás mañana.',
  'Un día a la vez. Eso siempre ha sido suficiente.',
  'Hay algo hermoso en empezar de nuevo cada mañana.',
  'La consistencia no es rigidez. Es una conversación cotidiana contigo mismo.',
  'Hoy es un buen día para hacer lo que dijiste que harías.',
]

const MORNING_PHRASES_EN = [
  'The day is just beginning. There is room for what matters most.',
  'Each morning brings the possibility of becoming who you want to be.',
  'Small steps, sustained over time, build entire lives.',
  'Today you don\'t have to be perfect. You just have to be present.',
  'The quiet of the morning holds all the intentions of the day.',
  'What you cultivate today is what you\'ll harvest tomorrow.',
  'One day at a time. That has always been enough.',
  'There is something beautiful about starting again each morning.',
  'Consistency is not rigidity. It\'s a daily conversation with yourself.',
  'Today is a good day to do what you said you would.',
]

const HIGH_COMPLETION_ES = [
  'Llevas un ritmo que habla de quién estás siendo.',
  'La semana ha sido tuya. Eso se nota.',
  'Estás cumpliendo. No con alguien más, contigo.',
]

const HIGH_COMPLETION_EN = [
  'Your rhythm speaks to who you are becoming.',
  'This week has been yours. It shows.',
  'You are keeping your word — not to someone else, to yourself.',
]

const LOW_COMPLETION_ES = [
  'Las semanas difíciles también forman parte del camino.',
  'No toda semana será perfecta. Y eso está bien.',
  'El comienzo siempre es el más difícil. Ya empezaste.',
]

const LOW_COMPLETION_EN = [
  'Difficult weeks are also part of the journey.',
  'Not every week will be perfect. And that\'s okay.',
  'Starting is always the hardest part. You\'ve already done that.',
]

const EVENING_PHRASES_ES = [
  'El día terminó como pudo. Eso ya es algo.',
  'Lo que hiciste hoy importa, aunque no lo veas aún.',
  'Descanso merecido. Mañana sigue la conversación.',
]

const EVENING_PHRASES_EN = [
  'The day ended as it could. That is already something.',
  'What you did today matters, even if you can\'t see it yet.',
  'Well-earned rest. Tomorrow the conversation continues.',
]

function deterministicIndex(date: string, arrayLen: number): number {
  let hash = 0
  for (let i = 0; i < date.length; i++) hash = (hash * 31 + date.charCodeAt(i)) & 0xffffffff
  return Math.abs(hash) % arrayLen
}

export function getDashboardPhrase(opts: {
  hour: number
  pct: number
  mood?: Mood | null
  lang: 'es' | 'en'
}): string {
  const { hour, pct, lang } = opts
  const date = ymd()

  if (hour >= 20) {
    const arr = lang === 'en' ? EVENING_PHRASES_EN : EVENING_PHRASES_ES
    return arr[deterministicIndex(date, arr.length)]
  }

  if (pct >= 0.75) {
    const arr = lang === 'en' ? HIGH_COMPLETION_EN : HIGH_COMPLETION_ES
    return arr[deterministicIndex(date, arr.length)]
  }
  if (pct < 0.25 && pct >= 0) {
    const arr = lang === 'en' ? LOW_COMPLETION_EN : LOW_COMPLETION_ES
    return arr[deterministicIndex(date, arr.length)]
  }

  const arr = lang === 'en' ? MORNING_PHRASES_EN : MORNING_PHRASES_ES
  return arr[deterministicIndex(date, arr.length)]
}

const JOURNAL_PROMPTS_ES = [
  '¿Qué fue lo más significativo de hoy?',
  '¿En qué momento te sentiste más tú mismo/a?',
  '¿Qué aprendiste de ti hoy, aunque sea algo pequeño?',
  '¿Qué te sorprendió hoy?',
  '¿Qué harías diferente si pudieras repetir este día?',
  '¿Qué emoción estuvo más presente a lo largo del día?',
  '¿Hubo algo que evitaste hoy? ¿Por qué?',
  '¿Qué conversación quedó pendiente?',
  '¿Cuándo fue la última vez que te detuviste a respirar profundo?',
  '¿Qué pequeña victoria puedes reconocerte hoy?',
  '¿Qué te quitó energía y qué te la devolvió?',
  '¿Qué persona hizo tu día mejor?',
  '¿Hubo un momento de silencio genuino hoy?',
  '¿Qué hiciste por primera vez o de forma diferente?',
  '¿Cómo te tratas cuando nadie te observa?',
]

const JOURNAL_PROMPTS_EN = [
  'What was the most meaningful part of today?',
  'When did you feel most like yourself?',
  'What did you learn about yourself today, however small?',
  'What surprised you today?',
  'What would you do differently if you could repeat this day?',
  'What emotion was most present throughout the day?',
  'Was there something you avoided today? Why?',
  'What conversation is still pending?',
  'When was the last time you stopped to breathe deeply?',
  'What small victory can you acknowledge today?',
  'What drained your energy, and what restored it?',
  'What person made your day better?',
  'Was there a moment of genuine silence today?',
  'What did you do for the first time, or differently?',
  'How do you treat yourself when no one is watching?',
]

export function getJournalPrompt(date: string, lang: 'es' | 'en'): string {
  const arr = lang === 'en' ? JOURNAL_PROMPTS_EN : JOURNAL_PROMPTS_ES
  return arr[deterministicIndex(date, arr.length)]
}

export function getWeeklyInsight(opts: {
  bestHabitName: string
  bestStreak: number
  weeklyPct: number
  lang: 'es' | 'en'
}): string {
  const { bestHabitName, bestStreak, weeklyPct, lang } = opts
  const pctStr = Math.round(weeklyPct * 100)

  if (lang === 'en') {
    if (weeklyPct >= 0.8) {
      return `This was a strong week. "${bestHabitName}" was your anchor — ${bestStreak} consecutive days is a story worth keeping. You showed up consistently, and that compounds over time.`
    }
    if (weeklyPct >= 0.5) {
      return `A mixed week — and that's human. "${bestHabitName}" held steady at ${pctStr}% completion. The weeks where you show up despite friction are often the ones that matter most.`
    }
    return `A quieter week, ${pctStr}% overall. Even in low weeks, the fact that you're tracking means you haven't let go. "${bestHabitName}" is still there, waiting for you.`
  }

  if (weeklyPct >= 0.8) {
    return `Esta fue una semana sólida. "${bestHabitName}" fue tu ancla — ${bestStreak} días consecutivos es una historia que vale la pena conservar. La consistencia que construyes hoy se acumula silenciosamente.`
  }
  if (weeklyPct >= 0.5) {
    return `Una semana mixta — y eso es humano. "${bestHabitName}" se mantuvo con un ${pctStr}% de completado. Las semanas en que apareces a pesar del ruido suelen ser las que más importan.`
  }
  return `Una semana más tranquila, ${pctStr}% en total. Incluso en semanas bajas, el hecho de que sigas registrando significa que no soltaste. "${bestHabitName}" sigue ahí, esperándote.`
}
