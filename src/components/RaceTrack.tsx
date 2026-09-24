import { useEffect, useRef, useState, useCallback } from 'react';
import imgPiazza from '@/assets/IMG_7481.jpg';
import type { RaceEntry, GameState } from '@/game/types';
import { CONTRADA_BY_ID, JOCKEY_BY_ID } from '@/game/data';
import { FastForward, Volume2, VolumeX } from 'lucide-react';

interface TrackPos { x: number; y: number }

// ─────────────────────────────────────────────────────────────────────────────
// Piazza del Campo — real fan/shell shape
//
// Aerial view orientation (matching the new top-down illustration):
//   • Palazzo Pubblico + Torre del Mangia  → TOP CENTER
//   • San Martino tight curve             → LEFT
//   • Casato tight curve                  → TOP-RIGHT
//   • Canape (start/mossa, diagonal)      → BOTTOM-RIGHT notch
//   • Wide arc (bottom of piazza)         → BOTTOM
//
// The track is a strip along the outer edge.
// We define the OUTER boundary and INNER boundary using cubic bezier segments,
// then sample them to get the track center line for horse positioning.
//
// Counterclockwise direction (as in the real Palio):
//   Canape (bottom-right diagonal) →
//   bottom arc (leftward) →
//   San Martino curve (left side, up) →
//   top straight (Palazzo Pubblico) →
//   Casato curve (top-right) →
//   right side (down) →
//   back to Canape
// ─────────────────────────────────────────────────────────────────────────────

// SVG viewBox: 0 0 560 480
// We trace the OUTER edge of the running track as a closed cubic-bezier path.
// Points chosen by overlaying the reference image.

// Outer boundary — counterclockwise, starting at the Canape (bottom-right diagonal notch).
// Calibrated to IMG_7481.jpg: Palazzo at top-center, wide left track, narrow right track,
// D-shaped inner crowd (flat top, semicircular bottom), Canape notch at bottom-right.
const OUTER_D =
  'M 470,350 ' +                           // Canape / mossa on the lower right
  'C 430,368 350,380 280,380 ' +           // bottom arc going left
  'C 190,380 110,368 58,345 ' +            // bottom-left arc
  'C 30,330 18,295 18,255 ' +              // San Martino lower curve
  'C 18,205 24,150 48,108 ' +              // left side upper
  'C 130,88 300,88 430,105 ' +              // top straight below Palazzo
  'C 470,112 496,140 500,180 ' +           // Casato entrance
  'C 505,225 500,275 485,315 ' +            // right side down
  'C 478,332 474,343 470,350 Z';           // close to Canape

// Inner boundary — the D-shape:
//   flat top along the Palazzo side, semicircular curve on the remaining 3/4.
//   9 segments matching the same parametric positions as OUTER_D.
const INNER_D =
  'M 450,330 ' +                           // Canape inner
  'C 405,342 350,350 280,350 ' +           // inner bottom arc
  'C 205,350 145,340 100,320 ' +            // inner bottom-left
  'C 72,306 60,280 60,248 ' +               // inner left curve
  'C 60,205 70,165 100,130 ' +              // inner top-left
  'C 210,126 320,128 420,140 ' +            // flat top of the crowd
  'C 448,146 462,165 465,195 ' +             // inner Casato curve
  'C 468,235 462,275 450,305 ' +             // inner right side
  'C 447,316 448,325 450,330 Z';             // close to Canape inner

// ── Parametric sampling of the track center line ───────────────────────────
// We pre-sample N points along the center of the track strip.
// Center = midpoint between outer and inner boundary at equal t.

function evalCubicBezier(pts: number[][], t: number): TrackPos {
  // pts: array of [x,y] control points (4 points per segment)
  const [p0, p1, p2, p3] = pts;
  const u = 1 - t;
  return {
    x: u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
    y: u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1],
  };
}

// Parse the bezier segments from path strings
// Each C command: current point + 3 control points
// Segments for both sides of the real running strip in the reference image.
const OUTER_SEGS: [number,number][][][] = [
  [[470,350],[430,368],[350,378],[280,378]],
  [[280,360],[190,360],[110,355],[58,344]],
  [[58,344],[50,330],[50,300],[50,258]],
  [[50,258],[50,205],[52,155],[55,112]],
  [[55,112],[135,92],[300,92],[430,108]],
  [[430,108],[470,116],[498,145],[505,185]],
  [[505,185],[510,230],[505,280],[488,320]],
  [[488,320],[480,338],[474,347],[470,350]],
  [[470,350],[470,350],[470,350],[470,350]],
];

const INNER_SEGS: [number,number][][][] = [
  [[450,330],[405,340],[350,348],[280,348]],
  [[280,335],[205,335],[145,330],[100,315]],
  [[100,315],[88,304],[82,278],[82,248]],
  [[82,248],[82,205],[82,165],[100,130]],
  [[100,130],[210,126],[320,128],[420,140]],
  [[420,140],[448,146],[462,165],[465,195]],
  [[465,195],[468,235],[462,275],[450,305]],
  [[450,305],[447,316],[448,325],[450,330]],
  [[450,330],[450,330],[450,330],[450,330]],
];

const N_SAMPLES = 360;

function buildCenterLine(): TrackPos[] {
  const pts: TrackPos[] = [];
  const nSegs = OUTER_SEGS.length;
  for (let i = 0; i < N_SAMPLES; i++) {
    const globalT = i / N_SAMPLES;
    const segF = globalT * nSegs;
    const seg = Math.min(Math.floor(segF), nSegs - 1);
    const t = segF - seg;
    const outer = evalCubicBezier(OUTER_SEGS[seg] as [number,number][], t);
    const inner = evalCubicBezier(INNER_SEGS[seg] as [number,number][], t);
    pts.push({ x: (outer.x + inner.x) / 2, y: (outer.y + inner.y) / 2 });
  }
  return pts;
}

const CENTER_LINE = buildCenterLine();

function trackCenter(t: number): TrackPos {
  // t in [0,1)
  const idx = ((t % 1) + 1) % 1 * N_SAMPLES;
  const i0 = Math.floor(idx) % N_SAMPLES;
  const i1 = (i0 + 1) % N_SAMPLES;
  const frac = idx - Math.floor(idx);
  const p0 = CENTER_LINE[i0];
  const p1 = CENTER_LINE[i1];
  return { x: p0.x + (p1.x - p0.x) * frac, y: p0.y + (p1.y - p0.y) * frac };
}

// Tangent (forward direction) at t for perpendicular offset
function trackTangent(t: number): TrackPos {
  const idx = ((t % 1) + 1) % 1 * N_SAMPLES;
  const i0 = Math.floor(idx) % N_SAMPLES;
  const i1 = (i0 + 1) % N_SAMPLES;
  const p0 = CENTER_LINE[i0];
  const p1 = CENTER_LINE[i1];
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  return { x: dx/len, y: dy/len };
}

// ─────────────────────────────────────────────────────────────────────────────

interface HorseAnim {
  entry: RaceEntry;
  progress: number;
  lap: number;
  finished: boolean;
  finishTime: number;
  baseSpeed: number;
  speed: number;
  pos: TrackPos;
  overtakeCooldown: number;
}

const RACE_DURATION_MS = 70000;
const TOTAL_PROGRESS = 3;

export function RaceTrack({ state, onDone }: { state: GameState; onDone?: () => void }) {
  const [horses, setHorses] = useState<HorseAnim[]>([]);
  const [displayLap, setDisplayLap] = useState(0);
  const [finished, setFinished] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [muted, setMuted] = useState(false);
  const horsesRef = useRef<HorseAnim[]>([]);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const doneRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const crowdNoiseRef = useRef<{ gain: GainNode; noise: AudioBufferSourceNode } | null>(null);
  const entries = state.raceEntries.filter((e) => e.jockeyId);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 500;
      filter.Q.value = 0.5;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      crowdNoiseRef.current = { gain, noise };
    } catch { /* */ }
  }, []);

  const playMortaretto = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
    const bufSize = ctx.sampleRate * 0.15;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const n = ctx.createBufferSource();
    n.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.value = 0.4;
    n.connect(ng);
    ng.connect(ctx.destination);
    n.start(now);
  }, [muted]);

  const setCrowdVolume = useCallback((vol: number) => {
    const ctx = audioCtxRef.current;
    const cn = crowdNoiseRef.current;
    if (!ctx || !cn) return;
    cn.gain.gain.linearRampToValueAtTime(muted ? 0 : vol, ctx.currentTime + 0.3);
  }, [muted]);

  useEffect(() => {
    const player = state.playerContradaId;
    const anims: HorseAnim[] = entries.map((e) => {
      const j = JOCKEY_BY_ID[e.jockeyId];
      let baseSpeed = 1.0 + e.horse.overall * 0.008 + j.overall * 0.006 + j.wins * 0.01;
      if (e.canape === 0) baseSpeed *= 0.93;
      else if (e.canape >= 6) baseSpeed *= 0.97;
      if (state.jockeyBonus[e.jockeyId]) baseSpeed *= 1.05;
      if (e.betrayed) baseSpeed *= 0.55;
      const deals = state.pendingDeals.filter((d) => d.active && !d.fulfilled);
      for (const d of deals) {
        if (d.type === 'ostacolo' && d.targetContradaId === e.contradaId) baseSpeed *= 0.88;
        if ((d.type === 'aiuto' || d.type === 'strada') && e.contradaId === player) baseSpeed *= 1.04;
        if (d.type === 'aiuto' && d.targetContradaId === e.contradaId) baseSpeed *= 1.04;
      }
      for (const other of entries) {
        if (other.contradaId === e.contradaId) continue;
        const rel = state.jockeyRelations[e.jockeyId]?.[other.jockeyId] ?? 0;
        if (rel <= -80) baseSpeed *= 0.97;
      }
      // Day form: favorites are consistent, outsiders swing wider.
      const consistency = 0.75 + (j.overall / 100) * 0.23;
      const dayForm = 0.88 + Math.random() * 0.24;
      baseSpeed *= dayForm * consistency + (1 - consistency);
      return {
        entry: e, progress: 0, lap: 0, finished: false, finishTime: 0,
        baseSpeed, speed: baseSpeed, pos: trackCenter(0),
        overtakeCooldown: Math.random() * 2000,
      };
    });
    horsesRef.current = anims;
    setHorses(anims);
    setDisplayLap(0);
    setFinished(false);
    doneRef.current = false;
    startRef.current = 0;
    setCountdown(3);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (countdown === null) return;
    initAudio();
    if (countdown <= 0) {
      playMortaretto();
      setCrowdVolume(0.15);
      setCountdown(null);
      startRef.current = performance.now();
      startAnimationLoop();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const startAnimationLoop = useCallback(() => {
    let lastTime = performance.now();
    let lastMortarettoLap = 0;
    let crowdSwelled = false;

    const tick = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      const elapsed = now - startRef.current;
      const cur = horsesRef.current;
      let allDone = true;
      let maxLap = 0;
      // Compute leader progress BEFORE the update loop so chase boost works
      // for every horse, not just those after the first in array order.
      let leaderProgress = 0;
      for (const h of cur) {
        if (!h.finished && h.progress > leaderProgress) leaderProgress = h.progress;
      }

      const next = cur.map((h) => {
        if (h.finished) return h;
        // Smooth, organic speed variation: two overlapping sine waves
        const speedJitter = 1
          + Math.sin(elapsed * 0.002 + h.entry.contradaId.charCodeAt(0)) * 0.03
          + Math.sin(elapsed * 0.007 + h.entry.contradaId.charCodeAt(2)) * 0.02;
        let speed = h.baseSpeed * speedJitter;
        // Chase boost: horses behind the leader get a small draft bonus
        const gapToLeader = leaderProgress - h.progress;
        if (gapToLeader > 0.15) speed *= 1 + Math.min(gapToLeader * 0.03, 0.09);
        h.overtakeCooldown -= dt;
        if (h.overtakeCooldown <= 0) {
          // Back-markers get bigger but rarer surges; front-runners get smaller ones
          const posRank = cur.filter((x) => !x.finished && x.progress > h.progress).length;
          const surgeStrength = 0.04 + Math.min(posRank * 0.012, 0.09);
          speed *= 1 + Math.random() * surgeStrength;
          h.overtakeCooldown = 1500 + Math.random() * 4000;
        }
        const progressRate = (speed / 1.0) * (TOTAL_PROGRESS / RACE_DURATION_MS);
        const prog = h.progress + progressRate * dt;
        const lap = Math.floor(prog);
        if (lap >= TOTAL_PROGRESS) {
          return { ...h, progress: TOTAL_PROGRESS, lap: TOTAL_PROGRESS, finished: true, finishTime: now - startRef.current, speed };
        }
        allDone = false;
        if (lap > maxLap) maxLap = lap;
        const pos = trackCenter(prog % 1);
        return { ...h, progress: prog, lap, speed, pos };
      });

      horsesRef.current = next;
      setHorses(next);
      setDisplayLap(maxLap);

      if (!crowdSwelled && elapsed > 5000) { setCrowdVolume(0.25); crowdSwelled = true; }
      if (maxLap > lastMortarettoLap) { playMortaretto(); setCrowdVolume(0.35); lastMortarettoLap = maxLap; }
      if (leaderProgress > TOTAL_PROGRESS - 0.3) setCrowdVolume(0.4);

      if (!allDone) {
        animRef.current = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        setFinished(true);
        setCrowdVolume(0.3);
        setTimeout(() => playMortaretto(), 100);
        setTimeout(() => onDone?.(), 1500);
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      const ctx = audioCtxRef.current;
      const cn = crowdNoiseRef.current;
      if (cn) {
        try { cn.gain.gain.linearRampToValueAtTime(0, ctx!.currentTime + 0.5); } catch { /* */ }
        try { cn.noise.stop(ctx!.currentTime + 0.6); } catch { /* */ }
      }
      if (ctx) setTimeout(() => { try { ctx.close(); } catch { /* */ } }, 800);
    };
  }, []);

  const skip = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setFinished(true);
    setCrowdVolume(0);
    onDone?.();
  };

  const toggleMute = () => {
    setMuted((m) => {
      const newMuted = !m;
      const ctx = audioCtxRef.current;
      const cn = crowdNoiseRef.current;
      if (ctx && cn) cn.gain.gain.linearRampToValueAtTime(newMuted ? 0 : 0.2, ctx.currentTime + 0.2);
      return newMuted;
    });
  };

  const sortedHorses = [...horses].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });

  return (
    <div className="rounded-2xl border border-amber-800/40 bg-gradient-to-b from-stone-900 to-stone-950 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-amber-100">Piazza del Campo</h3>
        <div className="flex items-center gap-3">
          {countdown !== null && countdown > 0 ? (
            <span className="font-serif text-2xl font-black text-red-400 animate-pulse">{countdown}</span>
          ) : (
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${finished ? 'bg-emerald-600/30 text-emerald-300' : 'bg-red-600/30 text-red-300 animate-pulse'}`}>
              {finished ? 'ARRIVO' : `Giro ${Math.min(displayLap + 1, 3)}/3`}
            </span>
          )}
          <button onClick={toggleMute} className="rounded-lg bg-stone-800 p-1.5 text-stone-300 hover:bg-stone-700">
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          {!finished && countdown === null && (
            <button onClick={skip} className="flex items-center gap-1 rounded-lg bg-stone-800 px-2.5 py-1 text-xs font-semibold text-stone-300 hover:bg-stone-700">
              <FastForward size={12} /> Salta
            </button>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl shadow-inner" style={{ background: '#2a1e0e' }}>
        <svg viewBox="0 0 560 420" className="w-full">
          <defs>
            <clipPath id="trackClip">
              <path d={OUTER_D} />
            </clipPath>
          </defs>

          {/* Background photo */}
          <image href={imgPiazza} x="0" y="0" width="560" height="420" preserveAspectRatio="none" />

          {/* ── Start/finish line (Canape) — diagonal strip, bottom-right ── */}
          {(() => {
            const pO0 = { x: 473, y: 346 }, pO1 = { x: 467, y: 354 };
            const pI0 = { x: 453, y: 326 }, pI1 = { x: 447, y: 334 };
            return (
              <polygon
                points={`${pO0.x},${pO0.y} ${pO1.x},${pO1.y} ${pI1.x},${pI1.y} ${pI0.x},${pI0.y}`}
                fill="#fff" opacity="0.85" stroke="#888" strokeWidth="0.5"
              />
            );
          })()}

          {/* ── Horses ── */}
          {horses.map((h) => {
            const c = CONTRADA_BY_ID[h.entry.contradaId];
            const isPlayer = h.entry.contradaId === state.playerContradaId;
            const t = h.progress % 1;
            const pos = trackCenter(t);
            const tang = trackTangent(t);
            // Keep each barbero in a stable, narrow lane instead of moving it
            // according to the changing order of the ranking list.
            const laneSeed = [...h.entry.contradaId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
            const laneOffset = (laneSeed % 5 - 2) * 1.8;
            const perpX = -tang.y * laneOffset;
            const perpY = tang.x * laneOffset;
            const px = pos.x + perpX;
            const py = pos.y + perpY;
            return (
              <g key={h.entry.contradaId}>
                <ellipse cx={px} cy={py + 3} rx={isPlayer ? 7 : 5} ry={2} fill="#000" opacity="0.3" />
                <circle cx={px} cy={py} r={isPlayer ? 8 : 6}
                  fill={c.colors.bg} stroke={c.colors.accent} strokeWidth={isPlayer ? 3 : 1.5} />
                <circle cx={px} cy={py - 1.5} r={isPlayer ? 4 : 3} fill={c.colors.fg} opacity="0.9" />
                {isPlayer && (
                  <text x={px} y={py - 11} textAnchor="middle" fontSize="10" fill="#fde047">★</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 space-y-1">
        {sortedHorses.slice(0, 5).map((h, i) => {
          const c = CONTRADA_BY_ID[h.entry.contradaId];
          const j = JOCKEY_BY_ID[h.entry.jockeyId];
          const isPlayer = h.entry.contradaId === state.playerContradaId;
          return (
            <div key={h.entry.contradaId} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${isPlayer ? 'bg-amber-950/30' : ''}`}>
              <span className="w-4 text-center font-bold text-amber-400">{i + 1}°</span>
              <div className="h-4 w-4 rounded border" style={{ borderColor: c.colors.accent, backgroundColor: c.colors.bg }} />
              <span className="flex-1 text-stone-200">{c.name} · {j.nickname}</span>
              {h.finished
                ? <span className="text-emerald-400">arrivato</span>
                : <span className="text-stone-500">giro {h.lap + 1}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
