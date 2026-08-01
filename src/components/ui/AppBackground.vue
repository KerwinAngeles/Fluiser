<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { bg, reduceMotion } = useTheme()
const reduced = computed(() => reduceMotion.value)
const ap = (s: string) => reduced.value ? 'paused' : s

// ── Fireflies ────────────────────────────────────────────────────
const fireflies = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left:     Math.random() * 100,
  top:      Math.random() * 100,
  dx:       (Math.random() - 0.5) * 280,
  dy:       (Math.random() - 0.5) * 280,
  dur:      10 + Math.random() * 14,
  delay:    -(Math.random() * 16),
  glowDur:  2  + Math.random() * 3,
  size:     3  + Math.random() * 3,
  opacity:  0.55 + Math.random() * 0.45,
}))

// ── Stars (existing ambient) ─────────────────────────────────────
const stars = Array.from({ length: 140 }, (_, i) => ({
  id: i,
  left:    Math.random() * 100,
  top:     Math.random() * 100,
  size:    0.8 + Math.random() * 2.4,
  dur:     2.5 + Math.random() * 4,
  delay:   -(Math.random() * 6),
  minOp:   0.08 + Math.random() * 0.2,
  maxOp:   0.5  + Math.random() * 0.5,
}))

// ── Aurora Boreal (new) ───────────────────────────────────────────
const auroraParticles = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left:  Math.random() * 100,
  size:  1.5 + Math.random() * 2,
  dur:   9 + Math.random() * 14,
  delay: -(Math.random() * 18),
  hue:   i % 3, // 0=emerald, 1=sapphire, 2=violet
}))

// ── Cosmos ────────────────────────────────────────────────────────
const cosmosStars = Array.from({ length: 130 }, (_, i) => ({
  id: i,
  left:  Math.random() * 100,
  top:   Math.random() * 100,
  size:  0.6 + Math.random() * 1.6,
  dur:   2 + Math.random() * 4,
  delay: -(Math.random() * 6),
  gold:  Math.random() > 0.6,
}))

const constellations = [
  { stars: [[8,8],[13,7],[17,8.5],[21,8],[26,6],[30,7],[33,5]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },
  { stars: [[48,18],[52,21],[56,18],[52,26],[47,31],[57,31],[51,34],[53,34]],
    lines: [[0,1],[1,2],[0,3],[2,3],[3,5],[3,4],[4,6],[5,7]] },
  { stars: [[68,6],[72,9],[76,6],[80,9],[84,6]],
    lines: [[0,1],[1,2],[2,3],[3,4]] },
  { stars: [[18,72],[23,68],[28,73]],
    lines: [[0,1],[1,2],[2,0]] },
  { stars: [[78,62],[84,56],[90,62],[87,70]],
    lines: [[0,1],[1,2],[2,3],[3,0]] },
  { stars: [[40,80],[46,75],[52,80],[49,88]],
    lines: [[0,1],[1,2],[1,3]] },
]

// ── Watercolor blobs ──────────────────────────────────────────────
const wcBlobs = [
  { id:0, left: -8,  top: -18, w: 58, h: 50, color: 'rgba(255,165,115,.30)', dur: 16, delay: 0    },
  { id:1, left: 55,  top: -12, w: 50, h: 45, color: 'rgba(195,168,240,.26)', dur: 20, delay: -5   },
  { id:2, left: 30,  top: 38,  w: 44, h: 44, color: 'rgba(248,228,140,.20)', dur: 18, delay: -10  },
  { id:3, left: -10, top: 55,  w: 54, h: 50, color: 'rgba(242,178,198,.22)', dur: 22, delay: -7   },
  { id:4, left: 66,  top: 52,  w: 48, h: 46, color: 'rgba(162,224,196,.18)', dur: 14, delay: -3   },
  { id:5, left: 20,  top: 15,  w: 36, h: 36, color: 'rgba(255,200,140,.16)', dur: 25, delay: -14  },
]

// ── Terrario leaves ───────────────────────────────────────────────
const leaves = [
  { id:0, left: -6, top: 52, w: 34, h: 24, rotate:  30, blur: 30, opacity: .14 },
  { id:1, left: 70, top: -6, w: 28, h: 42, rotate: -20, blur: 25, opacity: .11 },
  { id:2, left: 40, top: 65, w: 24, h: 36, rotate:  18, blur: 28, opacity: .12 },
  { id:3, left: 80, top: 48, w: 32, h: 22, rotate: -38, blur: 22, opacity: .10 },
  { id:4, left: 12, top: 12, w: 22, h: 30, rotate:  55, blur: 20, opacity: .09 },
  { id:5, left: 58, top: 22, w: 18, h: 28, rotate: -10, blur: 18, opacity: .08 },
]
const neonDots = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left:  Math.random() * 100,
  top:   Math.random() * 100,
  size:  1.5 + Math.random() * 2.5,
  teal:  i % 2 === 0,
  dur:   1.5 + Math.random() * 3,
  delay: -(Math.random() * 5),
}))

// ── Sacred Geometry circles ───────────────────────────────────────
// Flower of Life: center (400,250), R=80
const R = 80, CX = 400, CY = 250
const angles6 = [0,60,120,180,240,300].map(a => a * Math.PI / 180)
const geoCircles = [
  { cx: CX,              cy: CY,              r: R,    op: .22 },
  ...angles6.map(a => ({ cx: CX + R*Math.cos(a),        cy: CY + R*Math.sin(a),        r: R,    op: .18 })),
  ...angles6.map(a => ({ cx: CX + 2*R*Math.cos(a),      cy: CY + 2*R*Math.sin(a),      r: R,    op: .10 })),
  ...angles6.map(a => ({ cx: CX + R*Math.sqrt(3)*Math.cos(a+Math.PI/6), cy: CY + R*Math.sqrt(3)*Math.sin(a+Math.PI/6), r: R, op: .07 })),
  { cx: CX, cy: CY, r: 2*R,    op: .08 },
  { cx: CX, cy: CY, r: 3*R,    op: .05 },
  { cx: CX, cy: CY, r: 4*R,    op: .03 },
]
const geoSpokes = angles6.flatMap(a => [
  { x1: CX, y1: CY, x2: CX + 4*R*Math.cos(a), y2: CY + 4*R*Math.sin(a) }
])

// ── Código (programming) ───────────────────────────────────────────
const CODE_CHARS = '01{}<>/;=+-*#[]().'.split('')
const codeGlyphs = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left:  Math.random() * 100,
  char:  CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
  size:  10 + Math.random() * 6,
  dur:   7 + Math.random() * 11,
  delay: -(Math.random() * 16),
  op:    0.35 + Math.random() * 0.45,
}))

// ── Gym (fitness) ─────────────────────────────────────────────────
const pulseRings = [0, 1, 2].map((i) => ({ id: i, delay: i * 1.6 }))
const barbells = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  left:   Math.random() * 100,
  top:    Math.random() * 100,
  rotate: Math.random() * 360,
  scale:  0.7 + Math.random() * 0.6,
  dur:    12 + Math.random() * 10,
  delay:  -(Math.random() * 16),
}))
</script>

<template>
  <!-- ── Ambient ── -->
  <div v-if="bg === 'ambient'" class="bg-ambient" />

  <!-- ── Fireflies ── -->
  <div v-else-if="bg === 'fireflies'" class="bg-layer">
    <div
      v-for="f in fireflies" :key="f.id"
      class="firefly"
      :style="{
        left: f.left + '%', top: f.top + '%',
        width: f.size + 'px', height: f.size + 'px',
        '--dx': f.dx + 'px', '--dy': f.dy + 'px',
        '--dur': f.dur + 's', '--delay': f.delay + 's',
        '--glow-dur': f.glowDur + 's', '--max-op': f.opacity,
        animationPlayState: ap('running'),
      }"
    />
  </div>

  <!-- ── Stars ── -->
  <div v-else-if="bg === 'stars'" class="bg-layer">
    <div
      v-for="s in stars" :key="s.id"
      class="star"
      :style="{
        left: s.left + '%', top: s.top + '%',
        width: s.size + 'px', height: s.size + 'px',
        '--dur': s.dur + 's', '--delay': s.delay + 's',
        '--min-op': s.minOp, '--max-op': s.maxOp,
        animationPlayState: ap('running'),
      }"
    />
  </div>

  <!-- ── Aurora (original) ── -->
  <div v-else-if="bg === 'aurora'" class="bg-layer">
    <div class="aurora a1" :style="{ animationPlayState: ap('running') }" />
    <div class="aurora a2" :style="{ animationPlayState: ap('running') }" />
    <div class="aurora a3" :style="{ animationPlayState: ap('running') }" />
  </div>

  <!-- ── Aurora Boreal (enhanced) ── -->
  <div v-else-if="bg === 'aurora-boreal'" class="bg-layer">
    <div class="ab ab1" :style="{ animationPlayState: ap('running') }" />
    <div class="ab ab2" :style="{ animationPlayState: ap('running') }" />
    <div class="ab ab3" :style="{ animationPlayState: ap('running') }" />
    <div class="ab ab4" :style="{ animationPlayState: ap('running') }" />
    <div
      v-for="p in auroraParticles" :key="p.id"
      class="ab-particle"
      :class="'ab-p' + p.hue"
      :style="{
        left: p.left + '%',
        width: p.size + 'px', height: p.size + 'px',
        '--dur': p.dur + 's', '--delay': p.delay + 's',
        animationPlayState: ap('running'),
      }"
    />
  </div>

  <!-- ── Cosmos Minimalista ── -->
  <div v-else-if="bg === 'cosmos'" class="bg-layer bg-cosmos">
    <div
      v-for="s in cosmosStars" :key="s.id"
      class="cosmos-star"
      :class="{ gold: s.gold }"
      :style="{
        left: s.left + '%', top: s.top + '%',
        width: s.size + 'px', height: s.size + 'px',
        '--dur': s.dur + 's', '--delay': s.delay + 's',
        animationPlayState: ap('running'),
      }"
    />
    <svg class="cosmos-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <g v-for="(c, ci) in constellations" :key="ci">
        <line
          v-for="([si, ei], li) in c.lines" :key="li"
          :x1="c.stars[si][0]" :y1="c.stars[si][1]"
          :x2="c.stars[ei][0]" :y2="c.stars[ei][1]"
          stroke="rgba(220,185,100,.22)" stroke-width="0.12"
        />
        <circle
          v-for="([sx, sy], si2) in c.stars" :key="'s'+si2"
          :cx="sx" :cy="sy"
          :r="si2 % 4 === 0 ? 0.45 : 0.28"
          fill="rgba(220,185,100,.85)"
        />
      </g>
    </svg>
  </div>

  <!-- ── Japonés Zen ── -->
  <div v-else-if="bg === 'zen'" class="bg-layer bg-zen">
    <div class="zen-glow" :style="{ animationPlayState: ap('running') }" />
  </div>

  <!-- ── Terrario Neon ── -->
  <div v-else-if="bg === 'terrario'" class="bg-layer bg-terrario">
    <div
      v-for="l in leaves" :key="l.id"
      class="leaf"
      :style="{
        left: l.left + '%', top: l.top + '%',
        width: l.w + '%', height: l.h + '%',
        transform: `rotate(${l.rotate}deg)`,
        filter: `blur(${l.blur}px)`,
        opacity: l.opacity,
      }"
    />
    <div
      v-for="d in neonDots" :key="d.id"
      class="neon-dot"
      :class="d.teal ? 'teal' : 'coral'"
      :style="{
        left: d.left + '%', top: d.top + '%',
        width: d.size + 'px', height: d.size + 'px',
        '--dur': d.dur + 's', '--delay': d.delay + 's',
        animationPlayState: ap('running'),
      }"
    />
  </div>

  <!-- ── Amanecer Acuarela ── -->
  <div v-else-if="bg === 'watercolor'" class="bg-layer">
    <div
      v-for="b in wcBlobs" :key="b.id"
      class="wc-blob"
      :style="{
        left: b.left + '%', top: b.top + '%',
        width: b.w + '%', height: b.h + '%',
        background: `radial-gradient(ellipse, ${b.color} 0%, transparent 70%)`,
        '--dur': b.dur + 's', '--delay': b.delay + 's',
        animationPlayState: ap('running'),
      }"
    />
  </div>

  <!-- ── Geometría Sagrada ── -->
  <div v-else-if="bg === 'geometry'" class="bg-layer bg-geometry">
    <div class="geo-wrap" :style="{ animationPlayState: ap('running') }">
      <svg class="geo-svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
        <g v-for="(spoke, si) in geoSpokes" :key="'sp'+si">
          <line
            :x1="spoke.x1" :y1="spoke.y1"
            :x2="spoke.x2" :y2="spoke.y2"
            stroke="rgba(200,165,55,.08)" stroke-width="0.4"
          />
        </g>
        <circle
          v-for="(c, ci) in geoCircles" :key="'c'+ci"
          :cx="c.cx" :cy="c.cy" :r="c.r"
          fill="none"
          :stroke="`rgba(200,165,55,${c.op})`"
          stroke-width="0.6"
        />
      </svg>
    </div>
    <div class="geo-pulse" :style="{ animationPlayState: ap('running') }" />
  </div>

  <!-- ── Código ── -->
  <div v-else-if="bg === 'code'" class="bg-layer bg-code">
    <span
      v-for="g in codeGlyphs" :key="g.id"
      class="code-glyph"
      :style="{
        left: g.left + '%',
        fontSize: g.size + 'px',
        '--dur': g.dur + 's', '--delay': g.delay + 's', '--max-op': g.op,
        animationPlayState: ap('running'),
      }"
    >{{ g.char }}</span>
    <div class="code-scanline" :style="{ animationPlayState: ap('running') }" />
  </div>

  <!-- ── Gym ── -->
  <div v-else-if="bg === 'gym'" class="bg-layer bg-gym">
    <div class="gym-glow" :style="{ animationPlayState: ap('running') }" />
    <div
      v-for="r in pulseRings" :key="r.id"
      class="gym-ring"
      :style="{ '--delay': r.delay + 's', animationPlayState: ap('running') }"
    />
    <svg class="gym-ekg" viewBox="0 0 400 60" preserveAspectRatio="none">
      <polyline
        class="gym-ekg-line"
        points="0,30 40,30 55,10 70,50 85,30 130,30 145,15 160,45 175,30 400,30"
        fill="none" stroke="rgba(232,155,90,.65)" stroke-width="2"
        :style="{ animationPlayState: ap('running') }"
      />
    </svg>
    <div
      v-for="b in barbells" :key="b.id"
      class="gym-barbell"
      :style="{
        left: b.left + '%', top: b.top + '%',
        '--rot': b.rotate + 'deg', '--scale': b.scale,
        '--dur': b.dur + 's', '--delay': b.delay + 's',
        animationPlayState: ap('running'),
      }"
    >
      <span class="gym-plate" /><span class="gym-bar" /><span class="gym-plate" />
    </div>
  </div>

  <!-- ── Enfoque ── -->
  <div v-else-if="bg === 'focus'" class="bg-layer bg-focus">
    <div class="focus-vignette" />
    <div class="focus-glow" :style="{ animationPlayState: ap('running') }" />
    <div class="focus-ring focus-ring-1" :style="{ animationPlayState: ap('running') }" />
    <div class="focus-ring focus-ring-2" :style="{ animationPlayState: ap('running') }" />
    <div class="focus-dot" />
  </div>

  <!-- ── None ── renders nothing -->
</template>

<style scoped>
/* ── Base layer ── */
.bg-layer,
.bg-ambient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

/* ── Ambient ── */
.bg-ambient::before,
.bg-ambient::after {
  content: "";
  position: absolute;
  width: 720px;
  height: 720px;
  border-radius: 50%;
  filter: blur(140px);
  opacity: 0.30;
}
.bg-ambient::before {
  background: radial-gradient(circle, var(--accent) 0%, transparent 60%);
  top: -260px; left: -180px;
}
.bg-ambient::after {
  background: radial-gradient(circle, var(--mint) 0%, transparent 60%);
  bottom: -260px; right: -180px;
  opacity: 0.18;
}
[data-theme="light"] .bg-ambient::before { opacity: 0.16; }
[data-theme="light"] .bg-ambient::after  { opacity: 0.10; }

/* ── Fireflies ── */
.firefly {
  position: absolute;
  border-radius: 50%;
  background: rgba(110, 220, 160, 0.9);
  box-shadow: 0 0 8px 3px rgba(110, 220, 160, 0.5);
  opacity: 0;
  animation:
    ff-move var(--dur) ease-in-out var(--delay) infinite,
    ff-glow var(--glow-dur) ease-in-out infinite alternate;
}
@keyframes ff-move {
  0%   { transform: translate(0,0); opacity: 0; }
  15%  { opacity: var(--max-op); }
  85%  { opacity: var(--max-op); }
  100% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
}
@keyframes ff-glow {
  from { box-shadow: 0 0 6px 2px rgba(110, 220, 160, 0.35); }
  to   { box-shadow: 0 0 16px 6px rgba(110, 220, 160, 0.65); }
}

/* ── Stars ── */
.star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  opacity: var(--min-op);
  animation: twinkle var(--dur) ease-in-out var(--delay) infinite;
}
@keyframes twinkle {
  0%, 100% { opacity: var(--min-op); transform: scale(1); }
  50%       { opacity: var(--max-op); transform: scale(1.4); }
}

/* ── Aurora (original) ── */
.aurora {
  position: absolute;
  width: 200%; height: 55%;
  left: -50%;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0;
}
.a1 {
  background: linear-gradient(90deg, transparent 0%, var(--mint) 30%, var(--accent) 60%, transparent 100%);
  top: -20%;
  animation: aurora 14s ease-in-out infinite alternate;
}
.a2 {
  background: linear-gradient(90deg, transparent 0%, var(--lilac) 40%, var(--mint) 70%, transparent 100%);
  top: -5%;
  animation: aurora 18s ease-in-out 3s infinite alternate-reverse;
}
.a3 {
  background: linear-gradient(90deg, transparent 0%, var(--accent) 50%, var(--lilac) 75%, transparent 100%);
  top: 5%;
  animation: aurora 22s ease-in-out 6s infinite alternate;
}
@keyframes aurora {
  0%   { transform: translateX(-15%) scaleY(0.7) rotate(-3deg); opacity: 0.12; }
  40%  { opacity: 0.28; }
  60%  { transform: translateX(5%) scaleY(1.2) rotate(2deg); opacity: 0.30; }
  100% { transform: translateX(15%) scaleY(0.8) rotate(-1deg); opacity: 0.15; }
}

/* ── Aurora Boreal (enhanced) ── */
.ab {
  position: absolute;
  width: 200%; height: 50%;
  left: -50%;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0;
}
.ab1 {
  background: linear-gradient(90deg, transparent 0%, rgba(16,210,140,.7) 25%, rgba(60,160,255,.6) 55%, transparent 100%);
  top: -18%;
  animation: ab-wave 12s ease-in-out infinite alternate;
}
.ab2 {
  background: linear-gradient(90deg, transparent 0%, rgba(100,80,255,.5) 30%, rgba(16,210,140,.5) 60%, transparent 100%);
  top: -4%;
  animation: ab-wave 17s ease-in-out 2s infinite alternate-reverse;
}
.ab3 {
  background: linear-gradient(90deg, transparent 0%, rgba(60,160,255,.45) 40%, rgba(160,90,255,.45) 70%, transparent 100%);
  top: 8%;
  animation: ab-wave 21s ease-in-out 5s infinite alternate;
}
.ab4 {
  background: linear-gradient(90deg, transparent 0%, rgba(16,210,140,.3) 20%, rgba(100,80,255,.3) 50%, rgba(60,160,255,.25) 80%, transparent 100%);
  top: 18%;
  animation: ab-wave 25s ease-in-out 8s infinite alternate-reverse;
}
@keyframes ab-wave {
  0%   { transform: translateX(-18%) scaleY(0.65) rotate(-4deg); opacity: 0.14; }
  35%  { opacity: 0.35; }
  65%  { transform: translateX(8%)  scaleY(1.3)  rotate(3deg);  opacity: 0.38; }
  100% { transform: translateX(18%) scaleY(0.75) rotate(-2deg); opacity: 0.18; }
}

.ab-particle {
  position: absolute;
  bottom: -4%;
  border-radius: 50%;
  opacity: 0;
  animation: ab-float var(--dur) ease-in var(--delay) infinite;
}
.ab-p0 { background: rgba(16,210,140,.9); box-shadow: 0 0 6px 2px rgba(16,210,140,.5); }
.ab-p1 { background: rgba(60,160,255,.9); box-shadow: 0 0 6px 2px rgba(60,160,255,.5); }
.ab-p2 { background: rgba(160,90,255,.9); box-shadow: 0 0 6px 2px rgba(160,90,255,.5); }
@keyframes ab-float {
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  10%  { opacity: 0.7; }
  90%  { opacity: 0.5; }
  100% { transform: translateY(-110vh) scale(0.4); opacity: 0; }
}

/* ── Cosmos ── */
.bg-cosmos { background: #020308; }
.cosmos-star {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,.7);
  animation: twinkle var(--dur) ease-in-out var(--delay) infinite;
  --min-op: 0.08;
  --max-op: 0.55;
}
.cosmos-star.gold { background: rgba(220,185,100,.8); --max-op: 0.75; }
.cosmos-svg {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
}

/* ── Japonés Zen ── */
.bg-zen {
  background-color: #080d20;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='48'%3E%3Cpath d='M0 48 Q40 0 80 48' fill='none' stroke='rgba(200,188,135,0.11)' stroke-width='0.8'/%3E%3Cpath d='M-40 24 Q0 -24 40 24' fill='none' stroke='rgba(200,188,135,0.07)' stroke-width='0.6'/%3E%3Cpath d='M40 24 Q80 -24 120 24' fill='none' stroke='rgba(200,188,135,0.07)' stroke-width='0.6'/%3E%3C/svg%3E");
  background-size: 80px 48px;
}
.zen-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 20% 30%, rgba(80,90,160,.18) 0%, transparent 70%),
    radial-gradient(ellipse 50% 35% at 80% 70%, rgba(60,110,140,.14) 0%, transparent 70%);
  animation: zen-breathe 10s ease-in-out infinite alternate;
}
@keyframes zen-breathe {
  from { opacity: 0.6; }
  to   { opacity: 1; }
}

/* ── Terrario Neon ── */
.bg-terrario { background: #060d0c; }
.leaf {
  position: absolute;
  background: rgba(14, 180, 140, 1);
  border-radius: 0 80% 0 80%;
}
.neon-dot {
  position: absolute;
  border-radius: 50%;
  animation: neon-pulse var(--dur) ease-in-out var(--delay) infinite alternate;
}
.neon-dot.teal {
  background: rgba(0,230,200,.85);
  box-shadow: 0 0 8px 3px rgba(0,230,200,.5), 0 0 20px 8px rgba(0,230,200,.2);
}
.neon-dot.coral {
  background: rgba(255,90,110,.85);
  box-shadow: 0 0 8px 3px rgba(255,90,110,.5), 0 0 20px 8px rgba(255,90,110,.2);
}
@keyframes neon-pulse {
  from { opacity: 0.2; transform: scale(0.8); }
  to   { opacity: 0.9; transform: scale(1.2); }
}

/* ── Amanecer Acuarela ── */
.wc-blob {
  position: absolute;
  filter: blur(70px);
  animation: wc-drift var(--dur) ease-in-out var(--delay) infinite alternate;
}
@keyframes wc-drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(2%, 2%) scale(1.06); }
}

/* ── Geometría Sagrada ── */
.bg-geometry { background: #030308; }
.geo-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: geo-spin 90s linear infinite;
}
.geo-svg {
  width: 100%; height: 100%;
  max-width: 900px; max-height: 600px;
}
@keyframes geo-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.geo-pulse {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 50% 50% at 50% 50%, rgba(200,165,55,.06) 0%, transparent 60%);
  animation: geo-breathe 8s ease-in-out infinite alternate;
}
@keyframes geo-breathe {
  from { opacity: 0.5; }
  to   { opacity: 1; }
}

/* ── Código ── */
.bg-code { background: #050807; }
.code-glyph {
  position: absolute;
  top: -8%;
  font-family: var(--font-mono, monospace);
  font-weight: 600;
  color: rgba(110, 220, 160, 0.9);
  text-shadow: 0 0 6px rgba(110, 220, 160, 0.5);
  opacity: 0;
  animation: code-fall var(--dur) linear var(--delay) infinite;
}
@keyframes code-fall {
  0%   { transform: translateY(0); opacity: 0; }
  8%   { opacity: var(--max-op); }
  92%  { opacity: var(--max-op); }
  100% { transform: translateY(112vh); opacity: 0; }
}
.code-scanline {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(110,220,160,.06) 50%, transparent 100%);
  background-size: 100% 240%;
  animation: code-scan 9s ease-in-out infinite;
}
@keyframes code-scan {
  0%   { background-position: 0 -120%; }
  100% { background-position: 0 220%; }
}

/* ── Gym ── */
.bg-gym { background: #0e0806; }
.gym-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,155,90,.16) 0%, transparent 70%);
  animation: gym-pulse 3.2s ease-in-out infinite;
}
@keyframes gym-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}
.gym-ring {
  position: absolute;
  top: 50%; left: 50%;
  width: 40px; height: 40px;
  margin: -20px 0 0 -20px;
  border-radius: 50%;
  border: 1.5px solid rgba(232,155,90,.5);
  animation: gym-ring-out 4.8s ease-out var(--delay) infinite;
}
@keyframes gym-ring-out {
  0%   { transform: scale(0.3); opacity: 0.7; }
  100% { transform: scale(9); opacity: 0; }
}
.gym-ekg {
  position: absolute;
  left: 0; top: 62%;
  width: 100%; height: 60px;
  opacity: 0.5;
}
.gym-ekg-line {
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
  animation: gym-ekg-draw 3.6s linear infinite;
}
@keyframes gym-ekg-draw {
  0%   { stroke-dashoffset: 400; }
  70%  { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -400; }
}
.gym-barbell {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 3px;
  transform: rotate(var(--rot)) scale(var(--scale));
  opacity: 0.16;
  animation: gym-drift var(--dur) ease-in-out var(--delay) infinite alternate;
}
.gym-bar   { width: 26px; height: 3px;  background: rgba(232,155,90,.7); border-radius: 2px; }
.gym-plate { width: 10px; height: 18px; background: rgba(232,155,90,.6); border-radius: 3px; }
@keyframes gym-drift {
  from { transform: rotate(var(--rot)) scale(var(--scale)) translateY(0); }
  to   { transform: rotate(calc(var(--rot) + 8deg)) scale(var(--scale)) translateY(-14px); }
}

/* ── Enfoque ── */
.bg-focus { background: #0a0d12; }
.focus-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 65% at 50% 50%, transparent 40%, rgba(0,0,0,.55) 100%);
}
.focus-glow {
  position: absolute;
  top: 50%; left: 50%;
  width: 46vmin; height: 46vmin;
  margin: -23vmin 0 0 -23vmin;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(91,156,246,.18) 0%, transparent 70%);
  animation: focus-breathe 6s ease-in-out infinite alternate;
}
@keyframes focus-breathe {
  from { transform: scale(0.92); opacity: 0.6; }
  to   { transform: scale(1.08); opacity: 1; }
}
.focus-ring {
  position: absolute;
  top: 50%; left: 50%;
  border-radius: 50%;
  border: 1px solid rgba(91,156,246,.28);
  transform: translate(-50%, -50%);
}
.focus-ring-1 { width: 18vmin; height: 18vmin; animation: focus-ring-pulse 5s ease-in-out infinite; }
.focus-ring-2 { width: 26vmin; height: 26vmin; animation: focus-ring-pulse 5s ease-in-out 1.2s infinite; }
@keyframes focus-ring-pulse {
  0%, 100%  { opacity: 0.25; transform: translate(-50%, -50%) scale(1); }
  50%       { opacity: 0.55; transform: translate(-50%, -50%) scale(1.04); }
}
.focus-dot {
  position: absolute;
  top: 50%; left: 50%;
  width: 6px; height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: rgba(91,156,246,.9);
  box-shadow: 0 0 12px 4px rgba(91,156,246,.4);
}
</style>
