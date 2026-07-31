import { h, type VNode, type FunctionalComponent } from 'vue'

interface IconProps {
  size?: number
  style?: Record<string, string>
  class?: string | string[]
}

function mkIcon(pathsFn: () => VNode | VNode[]): FunctionalComponent<IconProps> {
  const comp: FunctionalComponent<IconProps> = (props) =>
    h('svg', {
      width: props.size ?? 16,
      height: props.size ?? 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      style: props.style,
      class: ['icon', ...(Array.isArray(props.class) ? props.class : props.class ? [props.class] : [])],
    }, Array.isArray(pathsFn()) ? pathsFn() as VNode[] : [pathsFn()])
  return comp
}

export const HomeIcon = mkIcon(() => h('path', { d: 'M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z' }))

export const TimelineIcon = mkIcon(() => [
  h('path', { d: 'M6 4v16' }),
  h('circle', { cx: '6', cy: '7', r: '1.6', fill: 'currentColor', stroke: 'none' }),
  h('circle', { cx: '6', cy: '13', r: '1.6', fill: 'currentColor', stroke: 'none' }),
  h('circle', { cx: '6', cy: '19', r: '1.6', fill: 'currentColor', stroke: 'none' }),
  h('path', { d: 'M11 7h9M11 13h7M11 19h8' }),
])

export const HabitsIcon = mkIcon(() => [
  h('rect', { x: '4', y: '5', width: '16', height: '14', rx: '3' }),
  h('path', { d: 'M8 10l2 2 4-4' }),
  h('path', { d: 'M15 15h2' }),
])

export const HeatmapIcon = mkIcon(() => [
  h('rect', { x: '3', y: '3', width: '6', height: '6', rx: '1.2' }),
  h('rect', { x: '11', y: '3', width: '6', height: '6', rx: '1.2' }),
  h('rect', { x: '3', y: '11', width: '6', height: '6', rx: '1.2', fill: 'currentColor', opacity: '0.5', stroke: 'none' }),
  h('rect', { x: '11', y: '11', width: '6', height: '6', rx: '1.2', fill: 'currentColor', stroke: 'none' }),
  h('rect', { x: '3', y: '19', width: '6', height: '2', rx: '1' }),
  h('rect', { x: '11', y: '19', width: '6', height: '2', rx: '1' }),
])

export const JournalIcon = mkIcon(() => [
  h('path', { d: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z' }),
  h('path', { d: 'M5 4v13' }),
  h('path', { d: 'M9 9h6M9 13h4' }),
])

export const AnalyticsIcon = mkIcon(() => [
  h('path', { d: 'M4 19V5' }),
  h('path', { d: 'M4 19h16' }),
  h('path', { d: 'M8 15v-3' }),
  h('path', { d: 'M12 15V9' }),
  h('path', { d: 'M16 15v-7' }),
])

export const FocusIcon = mkIcon(() => [
  h('circle', { cx: '12', cy: '12', r: '8' }),
  h('circle', { cx: '12', cy: '12', r: '3.5', fill: 'currentColor', stroke: 'none' }),
])

export const SunIcon = mkIcon(() => [
  h('circle', { cx: '12', cy: '12', r: '4' }),
  h('path', { d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41' }),
])

export const MoonIcon = mkIcon(() => h('path', { d: 'M21 12.5A9 9 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z' }))

export const PlusIcon = mkIcon(() => h('path', { d: 'M12 5v14M5 12h14' }))

export const SparkleIcon = mkIcon(() => [
  h('path', { d: 'M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z' }),
  h('path', { d: 'M18 15l.7 1.8L20.5 17.5l-1.8.7L18 20l-.7-1.8L15.5 17.5l1.8-.7L18 15z' }),
])

export const ChevronIcon = mkIcon(() => h('path', { d: 'M9 6l6 6-6 6' }))
export const ChevronDownIcon = mkIcon(() => h('path', { d: 'M6 9l6 6 6-6' }))
export const ArrowRightIcon = mkIcon(() => h('path', { d: 'M5 12h14M13 6l6 6-6 6' }))
export const ArrowLeftIcon = mkIcon(() => h('path', { d: 'M19 12H5M11 18l-6-6 6-6' }))

export const SearchIcon = mkIcon(() => [
  h('circle', { cx: '11', cy: '11', r: '6.5' }),
  h('path', { d: 'M16 16l4 4' }),
])

export const CheckIcon = mkIcon(() => h('path', { d: 'M5 12.5l4.5 4.5L19 7' }))

export const XIcon = mkIcon(() => h('path', { d: 'M6 6l12 12M18 6L6 18' }))

export const SettingsIcon = mkIcon(() => [
  h('circle', { cx: '12', cy: '12', r: '3' }),
  h('path', { d: 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z' }),
])

export const FlameIcon = mkIcon(() => h('path', { d: 'M12 3c1.5 3 4 4.5 4 8a4 4 0 1 1-8 0c0-1.5 1-2.5 1.5-3.5C10 6 11 4.5 12 3z' }))

export const BoltIcon = mkIcon(() => h('path', { d: 'M13 3L4 14h7l-1 7 9-11h-7l1-7z' }))

export const WaveIcon = mkIcon(() => h('path', { d: 'M3 12s2-4 5-4 4 4 8 4 5-4 5-4' }))

export const LeafIcon = mkIcon(() => [
  h('path', { d: 'M4 20s2-9 8-13c5-3 9-3 9-3s0 4-3 9c-4 6-13 8-13 8z' }),
  h('path', { d: 'M4 20l8-8' }),
])

export const HeartIcon = mkIcon(() => h('path', { d: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z' }))

export const BookIcon = mkIcon(() => [
  h('path', { d: 'M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5z' }),
  h('path', { d: 'M4 19a2 2 0 0 1 2-2h12' }),
])

export const RunIcon = mkIcon(() => [
  h('circle', { cx: '15', cy: '4.5', r: '1.5' }),
  h('path', { d: 'M9.5 21l2-5.5-2.5-2 3-4.5' }),
  h('path', { d: 'M12 7.5l1.5 2.5 3.5 1-1 2.5' }),
])

export const BrainIcon = mkIcon(() => [
  h('path', { d: 'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z' }),
  h('path', { d: 'M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z' }),
])

export const WaterIcon = mkIcon(() => [
  h('path', { d: 'M12 2l6 8a6 6 0 1 1-12 0l6-8z' }),
])

export const PenIcon = mkIcon(() => [
  h('path', { d: 'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' }),
])

export const ExportIcon = mkIcon(() => [
  h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
  h('polyline', { points: '7 10 12 15 17 10' }),
  h('line', { x1: '12', y1: '15', x2: '12', y2: '3' }),
])

export const ClockIcon = mkIcon(() => [
  h('circle', { cx: '12', cy: '12', r: '9' }),
  h('path', { d: 'M12 7v5l3 3' }),
])

export const CompassIcon = mkIcon(() => [
  h('circle', { cx: '12', cy: '12', r: '9' }),
  h('polygon', { points: '16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' }),
])

export const PlayIcon = mkIcon(() => h('polygon', { points: '5 3 19 12 5 21 5 3' }))

export const PauseIcon = mkIcon(() => [
  h('rect', { x: '6', y: '4', width: '4', height: '16' }),
  h('rect', { x: '14', y: '4', width: '4', height: '16' }),
])

export const SkipFwdIcon = mkIcon(() => [
  h('polygon', { points: '5 4 15 12 5 20 5 4' }),
  h('line', { x1: '19', y1: '5', x2: '19', y2: '19' }),
])

export const StopCircleIcon = mkIcon(() => [
  h('circle', { cx: '12', cy: '12', r: '9' }),
  h('rect', { x: '9', y: '9', width: '6', height: '6' }),
])

export const GoalsIcon = mkIcon(() => [
  h('circle', { cx: '12', cy: '12', r: '9' }),
  h('circle', { cx: '12', cy: '12', r: '5' }),
  h('circle', { cx: '12', cy: '12', r: '1.8', fill: 'currentColor', stroke: 'none' }),
])

export const AlertTriangleIcon = mkIcon(() => [
  h('path', { d: 'M12 3.5L2.5 20h19L12 3.5z' }),
  h('path', { d: 'M12 10v4' }),
  h('circle', { cx: '12', cy: '17.2', r: '0.9', fill: 'currentColor', stroke: 'none' }),
])

export const PipIcon = mkIcon(() => [
  h('rect', { x: '3', y: '5', width: '18', height: '14', rx: '2' }),
  h('rect', { x: '12.5', y: '11', width: '7', height: '5', rx: '1', fill: 'currentColor', stroke: 'none' }),
])

export const SpeakerIcon = mkIcon(() => [
  h('path', { d: 'M4 9v6h4l5 4V5L8 9H4z' }),
  h('path', { d: 'M16.5 8.5a5 5 0 0 1 0 7' }),
  h('path', { d: 'M19 6a8 8 0 0 1 0 12' }),
])

export const SpeakerMuteIcon = mkIcon(() => [
  h('path', { d: 'M4 9v6h4l5 4V5L8 9H4z' }),
  h('path', { d: 'M16 9l5 6M21 9l-5 6' }),
])

export const ICON_MAP: Record<string, ReturnType<typeof mkIcon>> = {
  Home: HomeIcon, Timeline: TimelineIcon, Habits: HabitsIcon, Heatmap: HeatmapIcon,
  Journal: JournalIcon, Analytics: AnalyticsIcon, Focus: FocusIcon,
  Sun: SunIcon, Moon: MoonIcon, Plus: PlusIcon, Sparkle: SparkleIcon,
  Chevron: ChevronIcon, ChevronD: ChevronDownIcon, ArrowR: ArrowRightIcon, ArrowL: ArrowLeftIcon,
  Search: SearchIcon, Check: CheckIcon, X: XIcon, Settings: SettingsIcon,
  Flame: FlameIcon, Bolt: BoltIcon, Wave: WaveIcon, Leaf: LeafIcon,
  Heart: HeartIcon, Book: BookIcon, Run: RunIcon, Brain: BrainIcon,
  Water: WaterIcon, Pen: PenIcon, Export: ExportIcon,
  Clock: ClockIcon, Compass: CompassIcon, Play: PlayIcon, Pause: PauseIcon,
  SkipFwd: SkipFwdIcon, StopCircle: StopCircleIcon,
}
