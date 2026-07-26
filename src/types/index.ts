export type Mood = 'great' | 'good' | 'okay' | 'low' | 'rough'
export type Energy = 'easy' | 'auto' | 'effort'
export type Tone = 'sky' | 'mint' | 'amber' | 'rose' | 'lilac'
export type CategoryId = 'cuerpo' | 'mente' | 'creacion' | 'conexion' | 'descanso'
export type HabitIcon = 'Brain' | 'Run' | 'Book' | 'Water' | 'Pen' | 'Heart' | 'Leaf' | 'Bolt' | 'Wave' | 'Moon' | 'Sun' | 'Habits'
export type FreqPreset = 'daily' | 'mon,tue,wed,thu,fri' | 'mon,wed,fri' | 'sat,sun' | string

export interface HabitTimer {
  enabled: boolean
  duration: number
  sessions: number
  breakDuration: number
}

export interface Habit {
  id: string
  name: string
  category: CategoryId
  icon: HabitIcon
  tone: Tone
  time: string
  freq: FreqPreset
  timer: HabitTimer
  createdAt: string
}

export interface Completion {
  energy: Energy
  note: string
  ts: number
}

export interface JournalEntry {
  mood: Mood
  text: string
  ts: number
}

export interface MorningCheckin {
  energy: number
  intention: string
  ts: number
}

export interface EveningCheckin {
  reflection: string
  gratitude: string
  ts: number
}

export type Checkin = MorningCheckin | EveningCheckin

export interface AppSettings {
  onboarded: boolean
  name?: string
}

export type MetaStatus = 'active' | 'achieved' | 'paused'
export type VisionCategory = 'carrera' | 'salud' | 'relaciones' | 'finanzas' | 'personal' | 'viajes'

export interface MetaMetric {
  label: string
  target: number
  current: number
  unit: string
}

export interface Meta {
  id: string
  title: string
  deadline?: string
  tone: Tone
  icon: HabitIcon
  metric?: MetaMetric
  habitIds: string[]
  status: MetaStatus
  createdAt: string
}

export interface VisionItem {
  id: string
  title: string
  description?: string
  emoji: string
  category: VisionCategory
  tone: Tone
  createdAt: string
}

export interface WeeklyReview {
  weekKey: string
  wins: string[]
  challenges: string[]
  gratitude: string
  nextWeekFocus: string
  mood: Mood
  ts: number
}

export interface StoreData {
  habits: Habit[]
  completions: Record<string, Completion>
  journal: Record<string, JournalEntry | undefined>
  checkins: Record<string, Checkin>
  settings: AppSettings
  focusOn: boolean
  metas: Meta[]
  visionItems: VisionItem[]
  weeklyReviews: Record<string, WeeklyReview>
}

export interface StreakInfo {
  current: number
  best: number
  lastBreak: string | null
}

export interface HeatmapCell {
  date: string
  level: 0 | 1 | 2 | 3 | 4
  count: number
  due: number
}

export interface CategoryDef {
  id: CategoryId
  label: string
  tone: Tone
  prompt: string
  icon: HabitIcon
  desc: string
}

export interface MoodDef {
  id: Mood
  label: string
  tone: Tone
  desc: string
}

export interface EnergyDef {
  id: Energy
  label: string
  icon: string
  tone: Tone
}

export const MOODS: MoodDef[] = [
  { id: 'great', label: 'Muy bien',  tone: 'mint',  desc: 'Lúcido, abierto' },
  { id: 'good',  label: 'Bien',      tone: 'sky',   desc: 'Estable, presente' },
  { id: 'okay',  label: 'Regular',   tone: 'lilac', desc: 'Algo nublado' },
  { id: 'low',   label: 'Bajo',      tone: 'amber', desc: 'Pesado, cansado' },
  { id: 'rough', label: 'Difícil',   tone: 'rose',  desc: 'Tormenta interna' },
]

export const ENERGY: EnergyDef[] = [
  { id: 'easy',   label: 'Fluyó',      icon: 'Wave',  tone: 'mint' },
  { id: 'auto',   label: 'Automático', icon: 'Check', tone: 'sky' },
  { id: 'effort', label: 'Costó',      icon: 'Flame', tone: 'amber' },
]

export const CATEGORIES: CategoryDef[] = [
  { id: 'cuerpo',   label: 'Cuerpo',   tone: 'amber', prompt: 'Mover el cuerpo, comer con atención, dormir mejor', icon: 'Run',   desc: 'Ejercicio, nutrición, sueño' },
  { id: 'mente',    label: 'Mente',    tone: 'sky',   prompt: 'Calma, foco, claridad mental',                      icon: 'Brain', desc: 'Meditación, foco, claridad' },
  { id: 'creacion', label: 'Creación', tone: 'lilac', prompt: 'Escribir, hacer, construir algo propio',             icon: 'Pen',   desc: 'Escribir, aprender, crear' },
  { id: 'conexion', label: 'Conexión', tone: 'rose',  prompt: 'Vínculos, presencia con otros',                     icon: 'Heart', desc: 'Relaciones, presencia, amor' },
  { id: 'descanso', label: 'Descanso', tone: 'mint',  prompt: 'Pausa, silencio, naturaleza',                       icon: 'Leaf',  desc: 'Pausa, silencio, naturaleza' },
]

export interface SuggestedHabit {
  id: string
  name: string
  icon: HabitIcon
  tone: Tone
  freq: FreqPreset
  time: string
}

export const SUGGESTED: Record<CategoryId, SuggestedHabit[]> = {
  cuerpo: [
    { id: 'sug-run',   name: 'Correr 20 min',      icon: 'Run',   tone: 'amber', freq: 'daily', time: '07:00' },
    { id: 'sug-water', name: 'Beber 2L de agua',   icon: 'Water', tone: 'sky',   freq: 'daily', time: '08:00' },
    { id: 'sug-yoga',  name: 'Yoga al despertar',  icon: 'Leaf',  tone: 'mint',  freq: 'daily', time: '06:30' },
  ],
  mente: [
    { id: 'sug-med',   name: 'Meditar 10 min',     icon: 'Brain', tone: 'sky',   freq: 'daily', time: '07:00' },
    { id: 'sug-nosc',  name: 'Sin pantallas 1h',   icon: 'Moon',  tone: 'lilac', freq: 'daily', time: '22:00' },
    { id: 'sug-read',  name: 'Lectura profunda',   icon: 'Book',  tone: 'sky',   freq: 'daily', time: '21:00' },
  ],
  creacion: [
    { id: 'sug-write', name: 'Escribir 200 palabras', icon: 'Pen',  tone: 'lilac', freq: 'daily',               time: '09:00' },
    { id: 'sug-study', name: 'Estudiar 30 min',        icon: 'Book', tone: 'sky',   freq: 'mon,tue,wed,thu,fri', time: '19:00' },
  ],
  conexion: [
    { id: 'sug-msg',  name: 'Mensaje a alguien querido', icon: 'Heart', tone: 'rose', freq: 'daily',               time: '12:00' },
    { id: 'sug-call', name: 'Llamada honesta',            icon: 'Heart', tone: 'rose', freq: 'mon,wed,fri',         time: '18:00' },
  ],
  descanso: [
    { id: 'sug-walk', name: 'Caminata sin teléfono',   icon: 'Leaf', tone: 'mint', freq: 'daily', time: '17:00' },
    { id: 'sug-jour', name: 'Diario al cerrar el día', icon: 'Pen',  tone: 'mint', freq: 'daily', time: '22:00' },
  ],
}
