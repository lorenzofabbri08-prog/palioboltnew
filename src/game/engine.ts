import type {
  GameState,
  NewsItem,
  PendingDeal,
  IncomingOffer,
  Jockey,
} from './types';
import {
  CONTRADE,
  CONTRADA_BY_ID,
  JOCKEYS,
  JOCKEY_BY_ID,
  HORSES,
  ALLIANCES,
  FIXED_VETOS,
  OFFICE_JOCKEY_FEE,
  CONTRADA_JOCKEY_AFFINITY,
  AFFINITY_VALUES,
} from './data';

const SAVE_KEY = 'capitano-palio-save-v2';

// ===== RNG helpers =====
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// Pick a random office jockey for a contrada: overall ≤ 76, no veto, not injured/suspended/taken
function pickOfficeJockey(s: GameState, contradaId: string, taken: Set<string>): Jockey | undefined {
  const pool = JOCKEYS.filter((j) =>
    j.overall <= 76 &&
    !taken.has(j.id) &&
    !s.jockeyInjured[j.id] &&
    !s.jockeySuspensions[j.id] &&
    s.contradaJockey[contradaId][j.id] > -100,
  );
  if (pool.length === 0) {
    const fallback = JOCKEYS.filter((j) =>
      j.overall <= 76 &&
      !taken.has(j.id) &&
      !s.jockeyInjured[j.id] &&
      !s.jockeySuspensions[j.id],
    );
    return fallback.length > 0 ? pick(fallback) : undefined;
  }
  return pick(pool);
}

// ===== Relation matrix init (real alliances + rivalries) =====
function initContradeRelations(playerId: string): Record<string, Record<string, number>> {
  const m: Record<string, Record<string, number>> = {};
  for (const a of CONTRADE) {
    m[a.id] = {};
    for (const b of CONTRADE) {
      if (a.id === b.id) {
        m[a.id][b.id] = 100; // self
        continue;
      }
      if (b.id === a.rivalId) {
        m[a.id][b.id] = -100; // rivalità ufficiale
      } else if (ALLIANCES[a.id]?.includes(b.id)) {
        m[a.id][b.id] = 60; // alleanza storica (aggregate)
      } else {
        m[a.id][b.id] = 0; // neutrale di base
      }
    }
  }
  // Add nuanced real-world relations on top of alliances/rivalries
  const nuances: [string, string, number][] = [
    // Civetta alleata di Aquila (+60 already), ma anche simpatia con Giraffa
    // Nicchio spesso fa accordi con Leocorno (+60 already) ma teso con Civetta
    ['nicchio', 'civetta', -15],
    ['civetta', 'nicchio', -15],
    // Chiocciola spesso fa accordi con Civetta (simpatia leggera)
    ['chiocciola', 'civetta', 20],
    ['civetta', 'chiocciola', 20],
    // Onda tesa con Aquila (non alleata)
    ['onda', 'aquila', -10],
    ['aquila', 'onda', -10],
    // Torre e Drago: tesi
    ['torre', 'drago', -20],
    ['drago', 'torre', -20],
    // Lupa tesa con Pantera
    ['lupa', 'pantera', -15],
    ['pantera', 'lupa', -15],
    // Selva simpatia con Oca
    ['selva', 'oca', 25],
    ['oca', 'selva', 25],
    // Bruco teso con Nicchio
    ['bruco', 'nicchio', -10],
    ['nicchio', 'bruco', -10],
    // Tartuca simpatia con Selva
    ['tartuca', 'selva', 15],
    ['selva', 'tartuca', 15],
    // Montone teso con Pantera
    ['montone', 'pantera', -10],
    ['pantera', 'montone', -10],
    // Leocorno teso con Aquila (alleata di Civetta rivale)
    ['leocorno', 'aquila', -20],
    ['aquila', 'leocorno', -20],
    // Oca simpatia con Civetta
    ['oca', 'civetta', 15],
    ['civetta', 'oca', 15],
  ];
  for (const [a, b, v] of nuances) {
    if (m[a]?.[b] !== undefined && m[a][b] !== -100 && m[a][b] !== 60) {
      m[a][b] = v;
    }
    if (m[b]?.[a] !== undefined && m[b][a] !== -100 && m[b][a] !== 60) {
      m[b][a] = v;
    }
  }
  return m;
}

function initJockeyRelations(): Record<string, Record<string, number>> {
  const m: Record<string, Record<string, number>> = {};
  for (const a of JOCKEYS) {
    m[a.id] = {};
    for (const b of JOCKEYS) {
      if (a.id === b.id) {
        m[a.id][b.id] = 0;
        continue;
      }
      m[a.id][b.id] = randInt(-30, 30);
    }
  }
  // Faide storiche tra fantini (rivalità accese)
  // Due schieramenti: Tittia vs Velluto, con i rispettivi alleati
  const feuds: [string, string][] = [
    ['j01', 'j02'], // Tittia vs Velluto (rivalità principale)
    ['j01', 'j03'], // Tittia vs Gingillo
    ['j01', 'j05'], // Tittia vs Scompiglio
    ['j02', 'j04'], // Velluto vs Brigante
    ['j01', 'j07'], // Tittia vs Carburo
    ['j02', 'j08'], // Velluto vs Turbine
    ['j01', 'j10'], // Tittia vs Tremendo
    ['j02', 'j11'], // Velluto vs Amsicora
    ['j02', 'j13'], // Velluto vs Grandine
    ['j01', 'j14'], // Tittia vs Nappa II
    ['j01', 'j17'], // Tittia vs Shardana
    ['j01', 'j18'], // Tittia vs Lesto
    ['j01', 'j20'], // Tittia vs Bighino
    ['j01', 'j25'], // Tittia vs Veleno II
    ['j01', 'j26'], // Tittia vs Girolamo
    ['j01', 'j27'], // Tittia vs Voglia
  ];
  for (const [a, b] of feuds) {
    m[a][b] = -100;
    m[b][a] = -100;
  }
  // Intese segrete (amicizie di scuderia)
  const pacts: [string, string][] = [
    ['j01', 'j04'], // Tittia & Brigante
    ['j02', 'j03'], // Velluto & Gingillo
    ['j03', 'j05'], // Gingillo & Scompiglio
    ['j02', 'j07'], // Velluto & Carburo
    ['j01', 'j08'], // Tittia & Turbine
    ['j02', 'j10'], // Velluto & Tremendo
    ['j01', 'j11'], // Tittia & Amsicora
    ['j01', 'j13'], // Tittia & Grandine
    ['j02', 'j14'], // Velluto & Nappa II
    ['j07', 'j17'], // Carburo & Shardana
    ['j03', 'j18'], // Gingillo & Lesto
    ['j05', 'j20'], // Scompiglio & Bighino
    ['j07', 'j25'], // Carburo & Veleno II
    ['j05', 'j26'], // Scompiglio & Girolamo
    ['j03', 'j27'], // Gingillo & Voglia
  ];
  for (const [a, b] of pacts) {
    m[a][b] = 80;
    m[b][a] = 80;
  }
  return m;
}

function initContradaJockey(playerId: string): Record<string, Record<string, number>> {
  const m: Record<string, Record<string, number>> = {};
  for (const c of CONTRADE) {
    m[c.id] = {};
    for (const j of JOCKEYS) {
      m[c.id][j.id] = 0;
    }
    // Apply affinity: three most loyal jockeys per contrada
    const loyal = CONTRADA_JOCKEY_AFFINITY[c.id] || [];
    for (let i = 0; i < loyal.length; i++) {
      const jid = loyal[i];
      if (m[c.id][jid] !== undefined && m[c.id][jid] > -100) {
        m[c.id][jid] = AFFINITY_VALUES[i] ?? 0;
      }
    }
    // Apply fixed vetoes (override affinity if needed)
    const vetos = FIXED_VETOS[c.id] || [];
    for (const nickname of vetos) {
      const j = JOCKEYS.find((jj) => jj.nickname === nickname);
      if (j) m[c.id][j.id] = -100;
    }
  }
  return m;
}

// ===== New game =====
export function createNewGame(playerContradaId: string): GameState {
  const s: GameState = {
    version: 2,
    phase: 'estrazione',
    turn: 1,
    year: 2025,
    palioIndex: 0,
    playerContradaId,
    budget: 65000,
    morale: 70,
    credibility: 75,
    purgaActive: false,
    purgaRemaining: 0,
    racingContradeIds: [],
    contradeRelations: initContradeRelations(playerContradaId),
    jockeyRelations: initJockeyRelations(),
    contradaJockey: initContradaJockey(playerContradaId),
    jockeyContracts: {},
    jockeyGuarded: {},
    jockeyBonus: {},
    pendingDeals: [],
    debts: [],
    news: [
      {
        id: 'n0',
        text: `Assumi la carica di Capitano della ${CONTRADA_BY_ID[playerContradaId].name}. La Piazza rumoreggia in attesa dell'estrazione.`,
        tone: 'epic',
        turn: 1,
      },
    ],
    raceEntries: [],
    raceLog: [],
    raceResult: null,
    lastWinnerContradaId: null,
    scudisciato: false,
    gameOver: false,
    history: [],
    incomingOffers: [],
    raceAnimating: false,
    provaCanape: {},
    jockeyInjured: {},
    jockeyFormPenalty: {},
    scratchedContrade: [],
    pendingScare: null,
    provaEvents: [],
    messaDone: false,
    protectorsCooldown: 0,
    jockeySuspensions: {},
    killerOrder: null,
  };
  return s;
}

// ===== Persistence =====
export function saveGame(s: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    // migrate v1 saves: if no racingContradeIds, restart at estrazione
    if (s.version !== 2) return null;
    return s;
  } catch {
    return null;
  }
}
export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem('capitano-palio-save-v1');
}

// ===== News helper =====
let newsCounter = 0;
export function addNews(s: GameState, text: string, tone: NewsItem['tone']): void {
  newsCounter += 1;
  s.news.unshift({ id: `n${Date.now()}_${newsCounter}`, text, tone, turn: s.turn });
  if (s.news.length > 60) s.news.pop();
}

// ===== Phase advance =====
const PHASE_ORDER: GameState['phase'][] = [
  'estrazione', 'cavalli', 'tratta', 'provafinale',
  'prova1', 'prova2', 'prova3', 'prova4', 'provagenerale',
  'messadelfantino', 'provaccia', 'palio',
];

export function advancePhase(s: GameState): { s: GameState; advanced: boolean } {
  const idx = PHASE_ORDER.indexOf(s.phase);
  if (idx < 0 || idx === PHASE_ORDER.length - 1) return { s, advanced: false };
  const next = PHASE_ORDER[idx + 1];
  s.phase = next;
  if (next === 'cavalli') {
    runEstrazione(s);
  }
  if (next === 'tratta') {
    runCavalli(s);
  }
  if (next === 'provafinale') {
    runTrattaJockeys(s);
    addNews(s, 'Tratta conclusa. Iniziano le sei prove del Palio.', 'info');
  }
  // Six prove: run a prova simulation for each
  if (next === 'prova1' || next === 'prova2' || next === 'prova3' || next === 'prova4' || next === 'provagenerale' || next === 'provaccia') {
    runProva(s, next);
  }
  if (next === 'messadelfantino') {
    runMessaDelFantino(s);
  }
  if (next === 'palio') {
    setupRace(s);
    generateIncomingOffers(s);
  }
  return { s, advanced: true };
}

// ===== Fase 1: Estrazione delle 10 contrade =====
export function runEstrazione(s: GameState): GameState {
  // 7 contrade corrono di diritto (ruotano), 3 estratte. Semplifichiamo:
  // estrai 10 a sorte tra le 17, garantendo che la contrada del giocatore sia inclusa.
  const pool = shuffle(CONTRADE);
  let racing = pool.slice(0, 10).map((c) => c.id);
  if (!racing.includes(s.playerContradaId)) {
    racing[0] = s.playerContradaId;
  }
  s.racingContradeIds = racing;
  addNews(s, `Estrazione completata: ${racing.map((id) => CONTRADA_BY_ID[id].name).join(', ')}.`, 'epic');
  return s;
}

// ===== Fase 2: Sorteggio cavalli (tratta dei barberi) =====
export function runCavalli(s: GameState): GameState {
  // assegna un cavallo a ciascuna delle 10 contrade
  const horses = shuffle(HORSES).slice(0, s.racingContradeIds.length);
  // store on state via raceEntries preliminari
  s.raceEntries = s.racingContradeIds.map((cid, i) => ({
    contradaId: cid,
    jockeyId: '',
    horse: horses[i],
    canape: 0,
    laps: [],
    corrupted: false,
    guarded: false,
    betrayed: false,
    fallen: false,
    finished: 0,
  }));
  addNews(s, 'Sorteggio dei barberi: i cavalli sono stati abbinati alle contrade.', 'info');
  return s;
}

// ===== Fase 3: Tratta dei fantini (monte) =====
// Le altre 9 contrade assegnano i fantini; il giocatore ingaggia nel Mercato.

// Un fantino forte rifiuta di montare un cavallo mediocre se esistono cavalli
// sensibilmente migliori in altre contrade dove non ha il veto.
// Restituisce true se il fantino accetta di montare quel cavallo.
function jockeyAcceptsHorse(
  s: GameState,
  jockey: Jockey,
  contradaId: string,
): boolean {
  const entry = s.raceEntries.find((e) => e.contradaId === contradaId);
  if (!entry) return true;
  const myHorse = entry.horse.overall;

  // Più il fantino è forte, più è esigente. Soglia di tolleranza in punti overall.
  // Assoluto overall>=85 -> tolleranza 8; >=80 -> 12; Esperto -> 18; Giovane -> 25.
  const tol = jockey.overall >= 85 ? 8 : jockey.overall >= 80 ? 12 : jockey.overall >= 75 ? 18 : 25;

  // Cerca il cavallo migliore disponibile in altre contrade (senza veto).
  let bestOther = -1;
  for (const e of s.raceEntries) {
    if (e.contradaId === contradaId) continue;
    if (s.contradaJockey[e.contradaId][jockey.id] <= -100) continue;
    if (e.horse.overall > bestOther) bestOther = e.horse.overall;
  }

  // Se non ci sono altri cavalli (improbabile), accetta.
  if (bestOther < 0) return true;

  // Se il mio cavallo è troppo peggiore del migliore disponibile, rifiuta (con una piccola randomica).
  if (bestOther - myHorse > tol) {
    // Più il fantino è forte, più è probabile che rifiuti. Ma c'è sempre una piccola chance di accettare.
    const refuseChance = clamp((jockey.overall - 60) / 40, 0.3, 0.92);
    return Math.random() > refuseChance;
  }
  return true;
}

export function runTrattaJockeys(s: GameState): GameState {
  const player = s.playerContradaId;
  // reset per-palio (clear stale contracts so no jockey appears twice)
  s.jockeyGuarded = {};
  s.jockeyBonus = {};
  s.jockeyContracts = {};
  s.raceLog = [];
  s.raceResult = null;
  s.scudisciato = false;

  const taken = new Set<string>();
  // other racing contrade pick jockeys
  const others = shuffle(s.racingContradeIds.filter((id) => id !== player));
  for (const cid of others) {
    const candidates = JOCKEYS.filter((j) => !taken.has(j.id) && !s.jockeyContracts[j.id] && !s.jockeySuspensions[j.id] && s.contradaJockey[cid][j.id] > -100);
    candidates.sort((a, b) => {
      const sa = (a.mossa + a.grinta) + s.contradaJockey[cid][a.id] / 10 + a.wins * 0.3;
      const sb = (b.mossa + b.grinta) + s.contradaJockey[cid][b.id] / 10 + b.wins * 0.3;
      return sb - sa;
    });
    // Un fantino forte può rifiutare un cavallo mediocre se ci sono cavalli migliori altrove.
    // Scorri i candidati in ordine e prendi il primo che accetta la monta.
    let chosen: Jockey | undefined;
    for (const c of candidates) {
      if (jockeyAcceptsHorse(s, c, cid)) {
        chosen = c;
        break;
      }
    }
    if (!chosen) {
      // fallback: all jockeys vetoed, taken, or refused — assign best remaining regardless of veto
      const remaining = JOCKEYS.filter((j) => !taken.has(j.id) && !s.jockeyContracts[j.id] && !s.jockeySuspensions[j.id]);
      remaining.sort((a, b) => (a.mossa + a.grinta) - (b.mossa + b.grinta));
      chosen = remaining[0];
    }
    if (chosen) {
      s.jockeyContracts[chosen.id] = cid;
      taken.add(chosen.id);
      const entry = s.raceEntries.find((e) => e.contradaId === cid);
      if (entry) entry.jockeyId = chosen.id;
    }
  }
  addNews(s, 'Le contrade hanno assegnato i fantini. Ora tocca a te ingaggiare nel Mercato.', 'info');
  return s;
}

// ===== Hire jockey (player) =====
export function hireJockey(s: GameState, jockeyId: string): { ok: boolean; reason?: string; s: GameState } {
  const j = JOCKEY_BY_ID[jockeyId];
  if (!j) return { ok: false, reason: 'Fantino inesistente', s };
  if (s.messaDone) return { ok: false, reason: 'Messa del fantino già fatta: non puoi più cambiare monta', s };
  if (s.jockeyInjured[jockeyId]) return { ok: false, reason: 'Fantino infortunato nelle prove', s };
  if (s.jockeySuspensions[jockeyId] > 0) return { ok: false, reason: `Fantino squalificato per ${s.jockeySuspensions[jockeyId]} Palii`, s };
  // Un fantino già ingaggiato da un'altra contrada NON può essere scippato:
  // resta con la sua contrada fino a fine Palio (salvo infortunio o decisione della contrada).
  const currentOwner = s.jockeyContracts[jockeyId];
  if (currentOwner && currentOwner !== s.playerContradaId) {
    return { ok: false, reason: `"${j.nickname}" è già ingaggiato da ${CONTRADA_BY_ID[currentOwner].name}`, s };
  }
  if (s.contradaJockey[s.playerContradaId][jockeyId] <= -100) {
    return { ok: false, reason: 'Veto di Contrada: legato alla tua rivale.', s };
  }
  const fee = j.avidity;
  if (s.budget < fee) return { ok: false, reason: 'Budget insufficiente', s };
  // Un fantino forte può rifiutare di montare un cavallo mediocre se ci sono cavalli
  // migliori nelle altre contrade. Il giocatore lo scopre al momento dell'ingaggio.
  if (!jockeyAcceptsHorse(s, j, s.playerContradaId)) {
    addNews(s, `${j.nickname} rifiuta la monta: il tuo cavallo non è all'altezza del suo nome. Cerca un cavallo migliore.`, 'bad');
    return { ok: false, reason: `${j.nickname} rifiuta: cavallo non all'altezza`, s };
  }
  // release previous player jockey
  for (const [jid, cid] of Object.entries(s.jockeyContracts)) {
    if (cid === s.playerContradaId) {
      delete s.jockeyContracts[jid];
      const e = s.raceEntries.find((re) => re.jockeyId === jid);
      if (e) e.jockeyId = '';
    }
  }
  s.budget -= fee;
  s.jockeyContracts[jockeyId] = s.playerContradaId;
  const entry = s.raceEntries.find((e) => e.contradaId === s.playerContradaId);
  if (entry) entry.jockeyId = jockeyId;
  addNews(s, `Hai ingaggiato "${j.nickname}" per €${fee.toLocaleString('it-IT')}.`, 'good');
  return { ok: true, s };
}

// ===== Ask protectors for extra funding (every 15 palii) =====
export function askProtectors(s: GameState): { ok: boolean; reason?: string; s: GameState } {
  if (s.protectorsCooldown > 0) {
    return { ok: false, reason: `I protettori ti hanno già aiutato. Prossima richiesta tra ${s.protectorsCooldown} ${s.protectorsCooldown === 1 ? 'Palio' : 'Palii'}.`, s };
  }
  const funding = 25000;
  s.budget += funding;
  // Credibilità drammaticamente ridotta: i protettori non donano gratis,
  // la contrada perde prestigio e le altre contrade si fidano meno.
  const credibilityLoss = 30;
  const before = s.credibility;
  s.credibility = clamp(s.credibility - credibilityLoss, 0, 100);
  s.protectorsCooldown = 15;
  addNews(s, `I protettori ti hanno concesso €${funding.toLocaleString('it-IT')}. La credibilità della contrada crolla da ${before}% a ${s.credibility}%: le altre contrade ora ti temono e ti fidano meno.`, 'bad');
  return { ok: true, s };
}

// ===== Killer action: pay a killer jockey to extremely obstruct the rival =====
export function orderKillerAction(
  s: GameState,
  jockeyId: string,
  mode: 'nerbata' | 'caduta',
): { ok: boolean; reason?: string; s: GameState } {
  if (s.phase !== 'palio') return { ok: false, reason: 'Puoi ordinare l\'azione killer solo al Palio', s };
  if (s.raceResult) return { ok: false, reason: 'La corsa è già disputata', s };
  const j = JOCKEY_BY_ID[jockeyId];
  if (!j) return { ok: false, reason: 'Fantino inesistente', s };
  if (j.killer < 8) return { ok: false, reason: `${j.nickname} non ha l'istinto killer (indice ${j.killer}/10)`, s };
  if (s.jockeySuspensions[jockeyId] > 0) return { ok: false, reason: `${j.nickname} è squalificato`, s };
  // Il fantino deve essere quello ingaggiato dalla contrada del giocatore
  const ownerContrada = s.jockeyContracts[jockeyId];
  if (ownerContrada !== s.playerContradaId) {
    return { ok: false, reason: `${j.nickname} non è il tuo fantino`, s };
  }
  if (!s.racingContradeIds.includes(s.playerContradaId)) {
    return { ok: false, reason: 'La tua contrada non corre in questo Palio', s };
  }
  const rivalId = CONTRADA_BY_ID[s.playerContradaId].rivalId;
  if (!s.racingContradeIds.includes(rivalId)) {
    return { ok: false, reason: 'La tua rivale non corre in questo Palio', s };
  }
  const cost = 30000;
  if (s.budget < cost) return { ok: false, reason: 'Budget insufficiente (€30.000)', s };
  s.budget -= cost;
  s.killerOrder = { jockeyId, targetContradaId: rivalId, mode };
  const modeLabel = mode === 'nerbata' ? 'nerbata intensa alla partenza' : 'far cadere il fantino avversario';
  addNews(s, `Hai pagato €${cost.toLocaleString('it-IT')} a "${j.nickname}" (killer ${j.killer}/10) per: ${modeLabel} su ${CONTRADA_BY_ID[rivalId].name}. Rischio squalifica: ${mode === 'nerbata' ? 2 : 3} Palii.`, 'bad');
  return { ok: true, s };
}

export function releaseJockey(s: GameState, jockeyId: string): GameState {
  if (s.messaDone) {
    addNews(s, 'Messa del fantino già fatta: non puoi più cambiare monta.', 'bad');
    return s;
  }
  if (s.jockeyContracts[jockeyId] === s.playerContradaId) {
    delete s.jockeyContracts[jockeyId];
    const e = s.raceEntries.find((re) => re.jockeyId === jockeyId);
    if (e) e.jockeyId = '';
    addNews(s, `Hai liberato "${JOCKEY_BY_ID[jockeyId].nickname}".`, 'info');
  }
  return s;
}

export function promiseBonus(s: GameState, jockeyId: string, amount: number): { ok: boolean; reason?: string; s: GameState } {
  if (s.jockeyContracts[jockeyId] !== s.playerContradaId) return { ok: false, reason: 'Non è il tuo fantino', s };
  if (amount <= 0) return { ok: false, reason: 'Importo non valido', s };
  s.jockeyBonus[jockeyId] = (s.jockeyBonus[jockeyId] || 0) + amount;
  addNews(s, `Promessa bonus vittoria a ${JOCKEY_BY_ID[jockeyId].nickname}: €${amount.toLocaleString('it-IT')}.`, 'info');
  return { ok: true, s };
}

export function guardJockey(s: GameState, jockeyId: string): { ok: boolean; reason?: string; s: GameState } {
  if (s.jockeyContracts[jockeyId] !== s.playerContradaId) return { ok: false, reason: 'Non è il tuo fantino', s };
  const cost = 3000;
  if (s.budget < cost) return { ok: false, reason: 'Budget insufficiente (€3.000)', s };
  s.budget -= cost;
  s.jockeyGuarded[jockeyId] = true;
  addNews(s, `Guardia armata posta a difesa di ${JOCKEY_BY_ID[jockeyId].nickname}.`, 'good');
  return { ok: true, s };
}

export function bribeJockey(s: GameState, jockeyId: string, amount: number): { ok: boolean; reason?: string; s: GameState; success?: boolean } {
  const j = JOCKEY_BY_ID[jockeyId];
  if (!j) return { ok: false, reason: 'Fantino inesistente', s };
  if (s.jockeyContracts[jockeyId] === s.playerContradaId) return { ok: false, reason: 'È il tuo fantino', s };
  if (amount <= 0) return { ok: false, reason: 'Importo non valido', s };
  if (s.budget < amount) return { ok: false, reason: 'Budget insufficiente', s };
  s.budget -= amount;
  const chance = clamp((amount / (j.incorruptibility * 4000)) * 0.7, 0.05, 0.85);
  const success = Math.random() < chance;
  if (success) {
    (s as GameState & { _bribes: Record<string, boolean> })._bribes = (s as GameState & { _bribes: Record<string, boolean> })._bribes || {};
    (s as GameState & { _bribes: Record<string, boolean> })._bribes[jockeyId] = true;
    addNews(s, `Mazzetta consegnata a ${j.nickname}. L'accordo è siglato nell'ombra.`, 'rumor');
  } else {
    addNews(s, `${j.nickname} ha rifiutato la mazzetta. Soldi persi.`, 'bad');
  }
  return { ok: true, s, success };
}

export function spyJockey(s: GameState, jockeyId: string): { ok: boolean; reason?: string; s: GameState; info?: string } {
  const cost = 2500;
  if (s.budget < cost) return { ok: false, reason: 'Budget insufficiente (€2.500)', s };
  s.budget -= cost;
  const bribes = (s as GameState & { _bribes?: Record<string, boolean> })._bribes || {};
  const playerJ = Object.keys(s.jockeyContracts).find((jid) => s.jockeyContracts[jid] === s.playerContradaId);
  let info = '';
  if (bribes[jockeyId]) {
    info = `${JOCKEY_BY_ID[jockeyId].nickname} è stato comprato: andrà di traverso per ordine tuo.`;
  } else {
    info = `${JOCKEY_BY_ID[jockeyId].nickname} sembra pulito... per ora.`;
  }
  if (playerJ) {
    const enemyBribe = checkEnemyBribe(s, playerJ);
    if (enemyBribe) {
      info += ` ATTENZIONE: il tuo fantino ${JOCKEY_BY_ID[playerJ].nickname} è stato avvicinato da una contrada rivale!`;
    }
  }
  addNews(s, `Rapporto spionaggio: ${info}`, 'rumor');
  return { ok: true, s, info };
}

function checkEnemyBribe(s: GameState, playerJockeyId: string): boolean {
  const enemyBribes = (s as GameState & { _enemyBribes?: Record<string, boolean> })._enemyBribes || {};
  return !!enemyBribes[playerJockeyId];
}

// ===== Diplomacy =====
export function proposeDeal(
  s: GameState,
  contradaId: string,
  type: PendingDeal['type'],
  targetContradaId: string | undefined,
  payment: 'cash' | 'favore',
  amount: number,
  lastMinute = false,
): { ok: boolean; reason?: string; s: GameState } {
  if (contradaId === s.playerContradaId) return { ok: false, reason: 'Non puoi con te stesso', s };
  const rel = s.contradeRelations[s.playerContradaId][contradaId];
  if (rel <= -100) return { ok: false, reason: 'Veto totale: nessun accordo possibile', s };
  if (s.credibility <= 0) return { ok: false, reason: 'Credibilità a zero: nessuno ti ascolta', s };
  // Last-minute deals cost double and are less reliable
  const effectiveAmount = lastMinute ? amount * 2 : amount;
  if (payment === 'cash') {
    if (amount <= 0) return { ok: false, reason: 'Importo non valido', s };
    if (s.budget < effectiveAmount) return { ok: false, reason: 'Budget insufficiente', s };
  }
  // Last-minute deals have lower success chance
  const baseChance = clamp(0.2 + rel / 200 + s.credibility / 200 - (lastMinute ? 0.25 : 0), 0.03, 0.95);
  const accepts = Math.random() < baseChance;
  if (!accepts) {
    addNews(s, `${CONTRADA_BY_ID[contradaId].name} ha rifiutato la tua proposta${lastMinute ? " dell'ultimo minuto" : ''}.`, 'bad');
    s.contradeRelations[s.playerContradaId][contradaId] = clamp(rel - 5, -100, 100);
    s.contradeRelations[contradaId][s.playerContradaId] = s.contradeRelations[s.playerContradaId][contradaId];
    return { ok: false, reason: 'Proposta rifiutata', s };
  }
  if (payment === 'cash') {
    s.budget -= effectiveAmount;
  } else {
    s.debts.push({
      id: `d${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      contradaId,
      direction: 'debito',
      description: `Favore futuro: ${dealLabel(type, targetContradaId)}`,
      year: s.year,
      palioIndex: s.palioIndex,
      resolved: false,
    });
  }
  const deal: PendingDeal = {
    id: `p${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    contradaId,
    type,
    targetContradaId,
    payment,
    amount: effectiveAmount,
    active: true,
    fulfilled: false,
    lastMinute,
  };
  s.pendingDeals.push(deal);
  s.contradeRelations[s.playerContradaId][contradaId] = clamp(rel + (lastMinute ? 8 : 15), -100, 100);
  s.contradeRelations[contradaId][s.playerContradaId] = s.contradeRelations[s.playerContradaId][contradaId];
  addNews(s, `${CONTRADA_BY_ID[contradaId].name} accetta${lastMinute ? " all'ultimo minuto" : ''}: ${dealLabel(type, targetContradaId)} (${payment === 'cash' ? `€${effectiveAmount}` : 'favore futuro'}).`, 'good');
  return { ok: true, s };
}

// ===== Incoming offers from other contrade =====
export function generateIncomingOffers(s: GameState): GameState {
  s.incomingOffers = [];
  if (s.credibility <= 0) return s;
  const player = s.playerContradaId;
  const racing = s.racingContradeIds.filter((id) => id !== player);
  // Check if the player's contrada is in rincorsa (canape position 0 = back of grid)
  const playerEntry = s.raceEntries.find((e) => e.contradaId === player);
  const playerInRincorsa = playerEntry?.canape === 0;
  // Rincorsa: many more offers (up to 4), with more varied types including "compra_mossa"
  const maxOffers = playerInRincorsa ? 4 : 2;
  const candidates = shuffle(racing).slice(0, maxOffers);
  for (const cid of candidates) {
    const rel = s.contradeRelations[player][cid];
    if (rel <= -100) continue;
    // Higher relation = more likely to offer. Rincorsa boosts the chance.
    const baseChance = clamp(0.3 + rel / 200, 0.1, 0.7);
    const rincorsaBoost = playerInRincorsa ? 0.2 : 0;
    if (Math.random() > baseChance + rincorsaBoost) continue;
    // Rincorsa: more varied offer types, including "compra_mossa" (give the start favor)
    let offerTypes: IncomingOffer['type'][];
    if (playerInRincorsa) {
      offerTypes = ['compra_ostacolo', 'compra_neutralita', 'compra_aiuto', 'compra_mossa', 'compra_mossa', 'compra_ostacolo'];
    } else {
      offerTypes = ['compra_ostacolo', 'compra_neutralita', 'compra_aiuto'];
    }
    const type = pick(offerTypes);
    const askingPrice = randInt(3000, 12000) + (type === 'compra_ostacolo' ? 3000 : 0) + (type === 'compra_mossa' ? 2000 : 0);
    // Pick a target contrada (usually the player's rival or a strong contrada)
    let targetId: string | undefined;
    if (type === 'compra_ostacolo') {
      const possibleTargets = racing.filter((id) => id !== cid);
      targetId = pick(possibleTargets);
    }
    if (type === 'compra_mossa') {
      // The offering contrada wants the player to give them the mossa (favor at start)
      targetId = cid;
    }
    s.incomingOffers.push({
      id: `o${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fromContradaId: cid,
      type,
      targetContradaId: targetId,
      askingPrice,
      turn: s.turn,
      accepted: false,
      rejected: false,
    });
    addNews(s, `${CONTRADA_BY_ID[cid].name} ti cerca: vuole ${offerLabel(type, targetId)} per €${askingPrice.toLocaleString('it-IT')}.`, 'rumor');
  }
  return s;
}

function offerLabel(type: IncomingOffer['type'], target?: string): string {
  const t = target ? CONTRADA_BY_ID[target]?.name : '';
  switch (type) {
    case 'compra_ostacolo': return `che tu ostacoli ${t}`;
    case 'compra_neutralita': return 'la tua neutralità';
    case 'compra_aiuto': return 'il tuo aiuto in pista';
    case 'compra_mossa': return `che tu dia la mossa a favore di ${t}`;
  }
}

export function acceptIncomingOffer(s: GameState, offerId: string): { ok: boolean; reason?: string; s: GameState } {
  const offer = s.incomingOffers.find((o) => o.id === offerId);
  if (!offer || offer.accepted || offer.rejected) return { ok: false, reason: 'Offerta non disponibile', s };
  offer.accepted = true;
  const fromName = CONTRADA_BY_ID[offer.fromContradaId].name;
  // 35% chance the contrada pays with a "favore futuro" instead of cash upfront
  const paysWithFavore = Math.random() < 0.35;
  if (paysWithFavore) {
    s.debts.push({
      id: `d${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      contradaId: offer.fromContradaId,
      direction: 'credito',
      description: `Favore dovuto: ${offerLabel(offer.type, offer.targetContradaId)}`,
      year: s.year,
      palioIndex: s.palioIndex,
      resolved: false,
    });
    addNews(s, `${fromName} paga con un FAVORE FUTURO invece di contanti. Vedremo se manterra'...`, 'rumor');
  } else {
    s.budget += offer.askingPrice;
  }
  // Create a deal FROM the other contrada TO the player (reversed perspective)
  // The player agreed to help/obstruct, so we create a deal that affects the race
  if (offer.type === 'compra_ostacolo' && offer.targetContradaId) {
    // Player must obstruct the target
    const deal: PendingDeal = {
      id: `p${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      contradaId: s.playerContradaId,
      type: 'ostacolo',
      targetContradaId: offer.targetContradaId,
      payment: 'cash',
      amount: 0,
      active: true,
      fulfilled: false,
      lastMinute: true,
    };
    s.pendingDeals.push(deal);
    addNews(s, `Accordi stretti con ${fromName}: ostacolerai ${CONTRADA_BY_ID[offer.targetContradaId].name} in pista. +€${offer.askingPrice.toLocaleString('it-IT')}`, 'good');
  } else if (offer.type === 'compra_neutralita') {
    // Player agrees not to interfere with the offering contrada
    const deal: PendingDeal = {
      id: `p${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      contradaId: s.playerContradaId,
      type: 'neutralita',
      payment: 'cash',
      amount: 0,
      active: true,
      fulfilled: false,
      lastMinute: true,
    };
    s.pendingDeals.push(deal);
    addNews(s, `${fromName} ti paga per la tua neutralità. +€${offer.askingPrice.toLocaleString('it-IT')}`, 'good');
  } else if (offer.type === 'compra_aiuto') {
    // Player agrees to help the offering contrada
    const deal: PendingDeal = {
      id: `p${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      contradaId: s.playerContradaId,
      type: 'aiuto',
      targetContradaId: offer.fromContradaId,
      payment: 'cash',
      amount: 0,
      active: true,
      fulfilled: false,
      lastMinute: true,
    };
    s.pendingDeals.push(deal);
    addNews(s, `${fromName} ti paga per il tuo aiuto in pista. +€${offer.askingPrice.toLocaleString('it-IT')}`, 'good');
  } else if (offer.type === 'compra_mossa') {
    // Player agrees to give the mossa (start favor) to the offering contrada
    const deal: PendingDeal = {
      id: `p${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      contradaId: offer.fromContradaId,
      type: 'strada',
      targetContradaId: offer.fromContradaId,
      payment: 'cash',
      amount: 0,
      active: true,
      fulfilled: false,
      lastMinute: true,
    };
    s.pendingDeals.push(deal);
    addNews(s, `${fromName} ti paga per avere la mossa a favore. +€${offer.askingPrice.toLocaleString('it-IT')}`, 'good');
  }
  s.contradeRelations[s.playerContradaId][offer.fromContradaId] = clamp(s.contradeRelations[s.playerContradaId][offer.fromContradaId] + 10, -100, 100);
  s.contradeRelations[offer.fromContradaId][s.playerContradaId] = s.contradeRelations[s.playerContradaId][offer.fromContradaId];
  return { ok: true, s };
}

export function rejectIncomingOffer(s: GameState, offerId: string): GameState {
  const offer = s.incomingOffers.find((o) => o.id === offerId);
  if (!offer || offer.accepted || offer.rejected) return s;
  offer.rejected = true;
  addNews(s, `Hai rifiutato l'offerta di ${CONTRADA_BY_ID[offer.fromContradaId].name}.`, 'info');
  return s;
}

function dealLabel(type: PendingDeal['type'], target?: string): string {
  const t = target ? CONTRADA_BY_ID[target]?.name : '';
  switch (type) {
    case 'aiuto': return 'aiuto in pista';
    case 'neutralita': return 'neutralità';
    case 'ostacolo': return `ostacolare ${t}`;
    case 'strada': return `lasciar strada alla mossa`;
  }
}

export function resolveDebt(s: GameState, debtId: string, accept: boolean): GameState {
  const d = s.debts.find((x) => x.id === debtId);
  if (!d || d.resolved) return s;
  d.resolved = true;
  if (d.direction === 'credito') {
    if (accept) {
      const amount = randInt(3000, 10000);
      s.budget += amount;
      addNews(s, `${CONTRADA_BY_ID[d.contradaId].name} onora il debito: +€${amount.toLocaleString('it-IT')}. La parola data vale.`, 'good');
      s.contradeRelations[s.playerContradaId][d.contradaId] = clamp(s.contradeRelations[s.playerContradaId][d.contradaId] + 10, -100, 100);
    } else {
      addNews(s, `Hai lasciato cadere il credito verso ${CONTRADA_BY_ID[d.contradaId].name}.`, 'info');
    }
  } else {
    if (accept) {
      addNews(s, `Onori il debito con ${CONTRADA_BY_ID[d.contradaId].name}. Credibilità preservata.`, 'good');
    } else {
      addNews(s, `Ti RIFIUTI di onorare il debito con ${CONTRADA_BY_ID[d.contradaId].name}. SCANDALO IN PIAZZA!`, 'bad');
      s.credibility = 0;
      s.contradeRelations[s.playerContradaId][d.contradaId] = -100;
      s.contradeRelations[d.contradaId][s.playerContradaId] = -100;
      (s as GameState & { _diplomaticBan: number })._diplomaticBan = 3;
      addNews(s, 'La tua credibilità crolla a zero. Nessuna contrada tratterà con te per 3 anni.', 'bad');
    }
  }
  s.contradeRelations[d.contradaId][s.playerContradaId] = s.contradeRelations[s.playerContradaId][d.contradaId];
  return s;
}

// ===== Setup race: ordine ai canapi =====
export function setupRace(s: GameState): GameState {
  // Remove scratched contrade (injury after messa) — palio in 9
  if (s.scratchedContrade.length > 0) {
    s.raceEntries = s.raceEntries.filter((e) => !s.scratchedContrade.includes(e.contradaId));
    addNews(s, `Palio disputato in ${s.raceEntries.length} contrade per infortunio alla provaccia.`, 'bad');
  }
  // Auto-assign a jockey to ANY entry missing one (player + AI contrade)
  // Se una contrada non ha ingaggiato un fantino, le viene assegnato d'ufficio un
  // fantino randomizzato tra quelli con overall ≤ 76, senza veto per quella contrada,
  // non infortunati e non squalificati. Costo: €2.000 per il giocatore.
  // Build taken from BOTH contracts and actual race entries — a jockey already
  // mounted by a contrada (even with a stale/missing contract) can never be
  // assigned to another. This is the core contract-lock guarantee.
  const taken = new Set(Object.keys(s.jockeyContracts));
  for (const e of s.raceEntries) { if (e.jockeyId) taken.add(e.jockeyId); }
  for (const e of s.raceEntries) {
    if (!e.jockeyId) {
      const chosen = pickOfficeJockey(s, e.contradaId, taken);
      if (chosen) {
        e.jockeyId = chosen.id;
        s.jockeyContracts[chosen.id] = e.contradaId;
        taken.add(chosen.id);
        if (e.contradaId === s.playerContradaId) {
          s.budget -= OFFICE_JOCKEY_FEE;
          addNews(s, `Senza ingaggio, la tua contrada monta "${chosen.nickname}" d'ufficio (€${OFFICE_JOCKEY_FEE.toLocaleString('it-IT')}).`, 'info');
        }
      }
    }
  }

  // Ensure no jockey races twice: reassign duplicates instead of dropping entries.
  // A jockey already contracted to a contrada CANNOT be taken away — only the
  // DUPLICATE (second occurrence, no valid contract) gets replaced.
  const seen = new Set<string>();
  for (const e of s.raceEntries) {
    if (!e.jockeyId) continue;
    if (seen.has(e.jockeyId)) {
      // This is the duplicate entry — it has no real claim on the jockey.
      // Pick a replacement from jockeys that are truly free (no contract, not injured,
      // not suspended, not vetoed by this contrada).
      const available = JOCKEYS.filter((j) => !seen.has(j.id) && !taken.has(j.id) && !s.jockeyInjured[j.id] && !s.jockeySuspensions[j.id] && s.contradaJockey[e.contradaId][j.id] > -100);
      available.sort((a, b) => b.overall - a.overall);
      let replacement = available[0];
      if (!replacement) {
        const remaining = JOCKEYS.filter((j) => !seen.has(j.id) && !taken.has(j.id) && !s.jockeyInjured[j.id] && !s.jockeySuspensions[j.id]);
        remaining.sort((a, b) => b.overall - a.overall);
        replacement = remaining[0];
      }
      if (replacement) {
        // Only clear the duplicate's entry — never touch the original contract
        e.jockeyId = replacement.id;
        s.jockeyContracts[replacement.id] = e.contradaId;
        taken.add(replacement.id);
        seen.add(replacement.id);
        addNews(s, `${CONTRADA_BY_ID[e.contradaId].name} riassegna fantino d'ufficio: "${replacement.nickname}".`, 'info');
      }
    } else {
      seen.add(e.jockeyId);
    }
  }
  const entries = s.raceEntries.filter((e) => e.jockeyId);
  const order = shuffle(entries);
  order.forEach((e, i) => {
    e.canape = i === 0 ? 0 : i; // rincorsa al primo
  });
  s.raceEntries = order;
  addNews(s, 'Ordine ai canapi sorteggiato. La mossa è imminente.', 'info');
  return s;
}

// ===== Simulate the race =====
export function simulateRace(s: GameState): GameState {
  // Safety net: auto-assign jockeys to any entry missing one, using fixed office jockeys.
  // Never assign a jockey that is already contracted to or mounted by another contrada.
  const taken = new Set(Object.keys(s.jockeyContracts));
  for (const e of s.raceEntries) { if (e.jockeyId) taken.add(e.jockeyId); }
  for (const e of s.raceEntries) {
    if (!e.jockeyId) {
      const chosen = pickOfficeJockey(s, e.contradaId, taken);
      if (chosen) {
        e.jockeyId = chosen.id;
        s.jockeyContracts[chosen.id] = e.contradaId;
        taken.add(chosen.id);
        if (e.contradaId === s.playerContradaId) {
          s.budget -= OFFICE_JOCKEY_FEE;
          addNews(s, `Senza ingaggio, la tua contrada monta "${chosen.nickname}" d'ufficio (€${OFFICE_JOCKEY_FEE.toLocaleString('it-IT')}).`, 'info');
        }
      }
    }
  }
  const entries = s.raceEntries.filter((e) => e.jockeyId);
  if (entries.length === 0) return s;
  const log: string[] = [];
  s.raceLog = [];
  const player = s.playerContradaId;
  const rivalId = CONTRADA_BY_ID[player].rivalId;

  const power = entries.map((e) => {
    const j = JOCKEY_BY_ID[e.jockeyId];
    let p = e.horse.overall * 0.5 + j.overall * 0.5 + j.wins * 0.2;
    if (e.canape === 0) p -= 3;
    else if (e.canape >= 6) p -= 1;
    if (s.jockeyBonus[e.jockeyId]) p += 2;
    // Form penalty from scares during prove
    const formPenalty = s.jockeyFormPenalty[e.jockeyId] || 0;
    if (formPenalty > 0) p -= formPenalty;
    return { e, p };
  });

  const enemyBribes = (s as GameState & { _enemyBribes?: Record<string, boolean> })._enemyBribes || {};
  for (const e of entries) {
    if (enemyBribes[e.jockeyId] && !e.guarded) {
      e.betrayed = true;
      log.push(`${JOCKEY_BY_ID[e.jockeyId].nickname} (${CONTRADA_BY_ID[e.contradaId].name}) tradisce: va di traverso per una mazzetta nemica!`);
    }
  }
  for (const e of entries) {
    if (e.corrupted && !e.betrayed) {
      e.betrayed = true;
      log.push(`${JOCKEY_BY_ID[e.jockeyId].nickname} (${CONTRADA_BY_ID[e.contradaId].name}) trattiene il cavallo: obbedisce al tuo oro.`);
    }
  }

  const activeDeals = s.pendingDeals.filter((d) => d.active && !d.fulfilled);
  for (const d of activeDeals) {
    // Contrade may renege on deals — take the money but not fulfill
    const rel = s.contradeRelations[d.contradaId][s.playerContradaId];
    const renegeChance = clamp(0.08 - rel / 250, 0.02, 0.45);
    const reneges = Math.random() < renegeChance;
    if (reneges) {
      log.push(`${CONTRADA_BY_ID[d.contradaId].name} RINNEGIA l'accordo! Soldi presi, parola non mantenuta.`);
      d.fulfilled = true;
      s.contradeRelations[s.playerContradaId][d.contradaId] = clamp(rel - 20, -100, 100);
      s.contradeRelations[d.contradaId][s.playerContradaId] = s.contradeRelations[s.playerContradaId][d.contradaId];
      continue;
    }
    if (d.type === 'ostacolo' && d.targetContradaId) {
      const target = entries.find((e) => e.contradaId === d.targetContradaId);
      if (target) {
        const idx = power.findIndex((x) => x.e === target);
        if (idx >= 0) power[idx].p -= 4;
        log.push(`${CONTRADA_BY_ID[d.contradaId].name} ostacola ${CONTRADA_BY_ID[d.targetContradaId].name} come pattuito.`);
      }
    }
    if (d.type === 'aiuto') {
      const pe = entries.find((e) => e.contradaId === player);
      if (pe) {
        const idx = power.findIndex((x) => x.e === pe);
        if (idx >= 0) power[idx].p += 3;
        log.push(`${CONTRADA_BY_ID[d.contradaId].name} aiuta la tua contrada in pista.`);
      }
    }
    if (d.type === 'strada') {
      // compra_mossa: the player gives the mossa to the offering contrada (targetContradaId === contradaId)
      // normal strada: another contrada leaves road to the player
      if (d.targetContradaId && d.targetContradaId === d.contradaId) {
        const target = entries.find((e) => e.contradaId === d.contradaId);
        if (target) {
          const idx = power.findIndex((x) => x.e === target);
          if (idx >= 0) power[idx].p += 3;
          log.push(`${CONTRADA_BY_ID[d.contradaId].name} ottiene la mossa a favore dal giocatore.`);
        }
      } else {
        const pe = entries.find((e) => e.contradaId === player);
        if (pe) {
          const idx = power.findIndex((x) => x.e === pe);
          if (idx >= 0) power[idx].p += 2;
          log.push(`${CONTRADA_BY_ID[d.contradaId].name} lascia strada alla mossa.`);
        }
      }
    }
    d.fulfilled = true;
  }

  // jockey feuds
  for (let i = 0; i < entries.length; i++) {
    for (let k = 0; k < entries.length; k++) {
      if (i === k) continue;
      const rel = s.jockeyRelations[entries[i].jockeyId][entries[k].jockeyId];
      if (rel <= -80) {
        const idx = power.findIndex((x) => x.e === entries[k]);
        if (idx >= 0) power[idx].p -= 2;
        log.push(`${JOCKEY_BY_ID[entries[i].jockeyId].nickname} nerba il rivale ${JOCKEY_BY_ID[entries[k].jockeyId].nickname} al San Martino!`);
      } else if (rel >= 70) {
        const idx = power.findIndex((x) => x.e === entries[k]);
        if (idx >= 0) power[idx].p += 1;
      }
    }
  }

  // killer index: fantini ostacolano la rivale della loro contrada
  // Effetto realistico: il killer non garantisce la sconfitta della rivale.
  // La penalità è probabilistica per ogni giro e proporzionale al punteggio killer,
  // ma la rivale forte può resistere e vincere comunque.
  for (const { e } of power) {
    const j = JOCKEY_BY_ID[e.jockeyId];
    if (j.killer <= 0) continue;
    const contrada = CONTRADA_BY_ID[e.contradaId];
    const rivalId = contrada.rivalId;
    if (!rivalId) continue;
    const rivalEntry = entries.find((re) => re.contradaId === rivalId);
    if (!rivalEntry) continue;
    const rivalIdx = power.findIndex((x) => x.e === rivalEntry);
    if (rivalIdx < 0) continue;
    const rivalJockey = JOCKEY_BY_ID[rivalEntry.jockeyId];
    const rivalStrength = rivalEntry.horse.overall * 0.5 + rivalJockey.overall * 0.5;
    const killerStrength = j.overall * 0.5 + j.killer * 3;
    // La rivale più forte del killer riduce la penalità effettiva.
    const ratio = killerStrength / (rivalStrength + 1);
    // Penalità base limitata: mai più di ~6 punti, così la rivale resta in gara.
    const basePenalty = j.killer * 0.6;
    const penalty = basePenalty * clamp(ratio, 0.2, 1.2);
    power[rivalIdx].p -= penalty;
    if (j.killer >= 7) {
      log.push(`${j.nickname} (${contrada.name}) gioca da killer: ostacola ${CONTRADA_BY_ID[rivalId].name} con duri colpi di nerba! (Killer ${j.killer}/10)`);
    }
  }

  // ===== Killer order: azione estrema pagata dal giocatore =====
  if (s.killerOrder) {
    const ko = s.killerOrder;
    const killerJockey = JOCKEY_BY_ID[ko.jockeyId];
    const targetEntry = entries.find((re) => re.contradaId === ko.targetContradaId);
    if (targetEntry) {
      const targetIdx = power.findIndex((x) => x.e === targetEntry);
      if (targetIdx >= 0) {
        if (ko.mode === 'nerbata') {
          // Nerbata intensa alla partenza: forte penalità iniziale ma non letale
          power[targetIdx].p -= 12;
          log.push(`💀 AZIONE KILLER! ${killerJockey.nickname} nerba selvaggiamente ${JOCKEY_BY_ID[targetEntry.jockeyId].nickname} (${CONTRADA_BY_ID[ko.targetContradaId].name}) alla partenza! Partenza compromessa!`);
        } else if (ko.mode === 'caduta') {
          // Far cadere il fantino avversario: probabilità di caduta molto alta al primo giro
          // Il fantino avversario non cade automaticamente: la caduta è probabilistica
          // ma molto più probabile del normale (circa 60% al primo giro).
          const targetJockey = JOCKEY_BY_ID[targetEntry.jockeyId];
          const fallRoll = Math.random();
          const forcedFallChance = 0.60 + (killerJockey.killer - 8) * 0.05 - (targetJockey.overall - 70) * 0.005;
          if (fallRoll < Math.max(0.30, Math.min(0.85, forcedFallChance))) {
            targetEntry.fallen = true;
            power[targetIdx].p *= 0.70;
            log.push(`💀 AZIONE KILLER! ${killerJockey.nickname} colpisce brutalmente ${targetJockey.nickname} (${CONTRADA_BY_ID[ko.targetContradaId].name}) al San Martino: CADE!`);
          } else {
            // Non cade ma subisce una penalità pesante
            power[targetIdx].p -= 10;
            log.push(`💀 AZIONE KILLER! ${killerJockey.nickname} colpisce ${targetJockey.nickname} (${CONTRADA_BY_ID[ko.targetContradaId].name}) al San Martino: non cade ma perde terreno!`);
          }
        }
      }
    }
    // Roll suspension: the killer jockey risks disqualification
    // nerbata: 60% chance of 2-palii suspension
    // caduta: 75% chance of 3-palii suspension (more violent, more visible)
    const suspensionChance = ko.mode === 'nerbata' ? 0.60 : 0.75;
    const suspensionLength = ko.mode === 'nerbata' ? 2 : 3;
    if (Math.random() < suspensionChance) {
      s.jockeySuspensions[ko.jockeyId] = suspensionLength;
      log.push(`⚖️ SQUALIFICA! ${killerJockey.nickname} viene squalificato per ${suspensionLength} Palii per condotta antisportiva!`);
      addNews(s, `${killerJockey.nickname} squalificato per ${suspensionLength} Palii per l'azione killer su ${CONTRADA_BY_ID[ko.targetContradaId].name}.`, 'bad');
    } else {
      log.push(` ${killerJockey.nickname} la fa franca: i giudici non hanno visto l'azione.`);
    }
    // Clear the order after processing
    s.killerOrder = null;
  }

  for (const e of entries) {
    if (e.betrayed) {
      const idx = power.findIndex((x) => x.e === e);
      if (idx >= 0) power[idx].p -= 8;
    }
  }

  // ===== Cadute in pista =====
  // Ogni fantino ha un indice di probabilità di caduta (fallRate %).
  // Le cadute avvengono prevalentemente al San Martino o al Casato.
  // Un cavallo scosso (senza fantino) può comunque vincere il Palio.
  const CURVE_NAMES = ['San Martino', 'Casato'];
  const NERBATE_PHRASES = [
    'calza la coscia con una nerbata secca',
    'frusta il fianco del cavallo avversario',
    'stende il nerbo sul collo del rivale',
    'picchia duro con il nerbo sulle spalle',
    'incalza con una nerbata tremenda',
    'colpisce di taglio con il nerbo',
  ];
  const SOPRASSALTO_PHRASES = [
    'perde il bilanciamento in curva e sbanda',
    'tocca il canape e rischia di cadere',
    'scivola sulla terra battuta al San Martino',
    'ha un soprassalto al Casato e si impenna',
    'frena tardi e finisce largo sulla curva',
    'sbanda pericolosamente al passaggio della curva',
  ];
  const POS_PHRASES = [
    'scatta in testa e prende la mossa',
    'si porta al comando con un allungo',
    'guadagna posizioni sul rettilineo',
    'resiste al comando tenendo la distanza',
    'rimonta dall\'esterno con un gran recupero',
    'si infila all\'interno superando due contrade',
    'controlla la corsa in prima posizione',
    'accelera sul rettilineo verso il bandierone',
  ];
  const MID_PHRASES = [
    'tiene la scia del battistrada',
    'resta nel gruppo a metà classifica',
    'naviga in zona centrale senza forzare',
    'si mantiene a ridosso della testa',
    'galoppa in mezzo al plotone',
    'resta nel pacco senza tentare il sorpasso',
  ];
  const REAR_PHRASES = [
    'resta staccato in fondo al gruppo',
    'fatica a tenere il ritmo del plotone',
    'rimane indietro tra le ultime posizioni',
    'non trova lo spunto e resta in coda',
    'galoppa in retroguardia',
  ];
  const FALL_PHRASES = [
    'CADE al {CURVE}! Il fantino viene disarcionato e rotola sulla sabbia!',
    'perde il cavallo al {CURVE} e finisce a terra! Cavallo scosso!',
    'scivola rovinosamente al {CURVE}: caduta! Il barbero continua senza fantino!',
    'viene sbalzato di sella al {CURVE}: caduta secca, il cavallo resta scosso!',
    'perde l\'equilibrio al {CURVE} e va giù: caduta!',
  ];

  // ===== Forma del giorno =====
  // Ogni accoppiata ha un fattore casuale che simula la "forma del giorno".
  // I fantini migliori (overall alto) sono molto più consistenti: la loro forma oscilla poco,
  // quindi le accoppiate forti tendono a confermare il loro valore gara dopo gara.
  // Un outsider può comunque avere la giornata perfetta, ma è più raro.
  for (const pw of power) {
    const j = JOCKEY_BY_ID[pw.e.jockeyId];
    const consistency = 0.70 + (j.overall / 100) * 0.28; // 0.70–0.98: fantini forti quasi non oscillano
    const dayForm = 0.90 + Math.random() * 0.20; // 0.90–1.10
    pw.p *= dayForm * consistency + (1 - consistency);
  }

  // Frasi per i sorpassi
  const OVERTAKE_PHRASES = [
    'brucia le concorrenti sul rettilineo verso il bandierone',
    'si infila all\'interno al San Martino e sorpassa',
    'rimonta dall\'esterno e supera di prepotenza',
    'scatta fulmineo al Casato e prende la posizione',
    'allunga sul rettilineo e passa in testa',
    'sfrutta la scia e scatta al momento giusto',
    'taglia la traiettoria e si mette davanti',
    'recupera con un gran finale e sorprende il battistrada',
  ];

  let prevOrder: string[] = [];

  // Determina le cadute: una per fantino, con probabilità fallRate per lap,
  // ma solo se non è già caduto. Le cadute avvengono al San Martino o al Casato.
  for (let lap = 1; lap <= 3; lap++) {
    const curve = CURVE_NAMES[randInt(0, 1)];
    log.push('');
    log.push(`═══ GIRO ${lap} di 3 ═══`);

    // Check falls for this lap
    for (const { e } of power) {
      if (e.fallen) continue;
      const j = JOCKEY_BY_ID[e.jockeyId];
      // La probabilità di caduta è fallRate% per giro, ma si riduce nei giri successivi
      const lapMod = lap === 1 ? 1.0 : lap === 2 ? 0.7 : 0.5;
      const fallChance = (j.fallRate / 100) * lapMod;
      if (Math.random() < fallChance) {
        e.fallen = true;
        const fallCurve = CURVE_NAMES[randInt(0, 1)];
        const phrase = FALL_PHRASES[randInt(0, FALL_PHRASES.length - 1)].replace('{CURVE}', fallCurve);
        log.push(`💥 ${j.nickname} (${CONTRADA_BY_ID[e.contradaId].name}) ${phrase}`);
        // Un cavallo scosso perde potenza ma può comunque vincere il Palio (raramente)
        const idx = power.findIndex((x) => x.e === e);
        if (idx >= 0) power[idx].p *= 0.88;
      }
    }

    // ===== Meccanica di gara: caos crescente + pressione posizionale =====
    // La casualità cresce a ogni giro: il primo giro è più prevedibile,
    // l'ultimo è caotico (i sorpassi al Casato possono cambiare tutto).
    // I fantini forti riducono la varianza: restano consistenti ma non immuni.
    // I cavalli scossi hanno varianza più alta: possono compiere rimonte improbabili.
    const baseChaos = [3.5, 5.5, 8][lap - 1]; // ±3.5, ±5.5, ±8
    const scored = power.map((x) => {
      const j = JOCKEY_BY_ID[x.e.jockeyId];
      // Fantini con overall alto riducono il caos fino al ~45%
      const jConsistency = 1 - (j.overall / 100) * 0.45; // 0.55–1.0
      // Cavallo scosso: niente fantino a controllare, più caos ma può rimontare
      const scossoBoost = x.e.fallen ? 1.5 : 1.0;
      const chaos = baseChaos * jConsistency * scossoBoost;
      // Pressione posizionale: chi è in testa subisce una piccola penalità
      // (deve controllare la corsa), chi rincorre guadagna (scia).
      let pressure = 0;
      if (lap > 1) {
        const prevPos = prevOrder.indexOf(x.e.contradaId);
        if (prevPos === 0) pressure = -1.0; // il leader è sotto pressione
        else if (prevPos > 0 && prevPos < power.length) pressure = 1.0 * (1 - prevPos / power.length); // i rincorrenti spingono
      }
      const jitter = (Math.random() - 0.5) * 2 * chaos;
      // Un cavallo scosso ha una piccola probabilità (0.7%) di trovare la traiettoria perfetta
      const scossoMagic = x.e.fallen && Math.random() < 0.007 ? 15 : 0;
      return { e: x.e, score: x.p + jitter + pressure + scossoMagic };
    });
    scored.sort((a, b) => b.score - a.score);
    scored.forEach((x, i) => x.e.laps.push(i + 1));

    // ===== Sorpassi: confronta con l'ordine del giro precedente =====
    const curOrder = scored.map((x) => x.e.contradaId);
    if (prevOrder.length > 0) {
      for (let i = 0; i < curOrder.length; i++) {
        const prevPos = prevOrder.indexOf(curOrder[i]);
        if (prevPos > i) {
          const gain = prevPos - i;
          const jName = JOCKEY_BY_ID[scored[i].e.jockeyId].nickname;
          const cName = CONTRADA_BY_ID[curOrder[i]].name;
          if (i === 0) {
            log.push(`🔥 SORPASSO! ${jName} (${cName}) ${OVERTAKE_PHRASES[randInt(0, OVERTAKE_PHRASES.length - 1)]} e prende la testa!`);
          } else if (gain >= 3) {
            log.push(`⚡ Rimonta di ${gain} posizioni per ${jName} (${cName}): ora è ${i + 1}°!`);
          } else {
            log.push(`${jName} (${cName}) ${OVERTAKE_PHRASES[randInt(0, OVERTAKE_PHRASES.length - 1)]}, ora ${i + 1}°.`);
          }
        }
      }
    }
    prevOrder = curOrder;

    // Cronaca dettagliata e varia per ogni giro
    const leadContrada = CONTRADA_BY_ID[scored[0].e.contradaId].name;
    const leadJockey = JOCKEY_BY_ID[scored[0].e.jockeyId].nickname;
    const leadScosso = scored[0].e.fallen ? ' (CAVALLO SCOSSO!)' : '';
    log.push(`In testa al giro ${lap}: ${leadContrada} con ${leadJockey}${leadScosso}.`);

    // Top 3 con commento vario
    for (let i = 0; i < Math.min(3, scored.length); i++) {
      const x = scored[i];
      const cName = CONTRADA_BY_ID[x.e.contradaId].name;
      const jName = JOCKEY_BY_ID[x.e.jockeyId].nickname;
      const scosso = x.e.fallen ? ' [SCOSSO]' : '';
      if (i === 0) {
        log.push(`${i + 1}° ${cName} (${jName})${scosso} — ${POS_PHRASES[randInt(0, POS_PHRASES.length - 1)]}.`);
      } else {
        log.push(`${i + 1}° ${cName} (${jName})${scosso} — ${MID_PHRASES[randInt(0, MID_PHRASES.length - 1)]}.`);
      }
    }

    // Commento per le retrovie
    if (scored.length > 3) {
      const rear = scored[scored.length - 1];
      const rearName = CONTRADA_BY_ID[rear.e.contradaId].name;
      const rearJockey = JOCKEY_BY_ID[rear.e.jockeyId].nickname;
      const rearScosso = rear.e.fallen ? ' [SCOSSO]' : '';
      log.push(`...in coda ${rearName} (${rearJockey})${rearScosso} — ${REAR_PHRASES[randInt(0, REAR_PHRASES.length - 1)]}.`);
    }

    // Nerbate random tra fantini (se non sono scossi)
    const mounted = scored.filter((x) => !x.e.fallen);
    if (mounted.length >= 2) {
      const a = randInt(0, mounted.length - 1);
      let b = randInt(0, mounted.length - 1);
      while (b === a) b = randInt(0, mounted.length - 1);
      const ja = JOCKEY_BY_ID[mounted[a].e.jockeyId].nickname;
      const jb = JOCKEY_BY_ID[mounted[b].e.jockeyId].nickname;
      const ca = CONTRADA_BY_ID[mounted[a].e.contradaId].name;
      log.push(`${ja} (${ca}) ${NERBATE_PHRASES[randInt(0, NERBATE_PHRASES.length - 1)]} su ${jb}!`);
    }

    // Soprassalti random
    if (Math.random() < 0.4 && mounted.length > 0) {
      const r = randInt(0, mounted.length - 1);
      const jName = JOCKEY_BY_ID[mounted[r].e.jockeyId].nickname;
      const cName = CONTRADA_BY_ID[mounted[r].e.contradaId].name;
      log.push(`${jName} (${cName}) ${SOPRASSALTO_PHRASES[randInt(0, SOPRASSALTO_PHRASES.length - 1)]}.`);
    }

    // Riepilogo cadute del giro
    const fallenThisLap = entries.filter((e) => e.fallen);
    if (fallenThisLap.length > 0) {
      log.push(`Cadute in questo giro: ${fallenThisLap.map((e) => `${JOCKEY_BY_ID[e.jockeyId].nickname} (${CONTRADA_BY_ID[e.contradaId].name})`).join(', ')}.`);
    } else {
      log.push('Nessuna caduta in questo giro: corsa pulita.');
    }
  }

  // ===== Photo finish: se i primi due sono vicini, si decide al fotofinish =====
  const finalScores = power.map((x) => ({ e: x.e, score: x.p }));
  finalScores.sort((a, b) => b.score - a.score);
  if (finalScores.length >= 2) {
    const gap = finalScores[0].score - finalScores[1].score;
    if (gap < 0.4) {
      const w0 = CONTRADA_BY_ID[finalScores[0].e.contradaId].name;
      const w1 = CONTRADA_BY_ID[finalScores[1].e.contradaId].name;
      const j0 = JOCKEY_BY_ID[finalScores[0].e.jockeyId].nickname;
      const j1 = JOCKEY_BY_ID[finalScores[1].e.jockeyId].nickname;
      log.push('');
      log.push('═══ FOTOFINISH ═══');
      log.push(`Fotofinish! ${w0} (${j0}) e ${w1} (${j1}) arrivano appaiati al bandierone!`);
      if (Math.random() < 0.5) {
        // swap the top two
        const tmp = finalScores[0];
        finalScores[0] = finalScores[1];
        finalScores[1] = tmp;
      }
      log.push(`Il giudice di gara dà ragione a ${CONTRADA_BY_ID[finalScores[0].e.contradaId].name} per un muso!`);
    }
  }

  // Build final order from the (possibly swapped) finalScores, then fill the rest
  const finalOrderMap = new Map<string, number>();
  finalScores.forEach((x, i) => finalOrderMap.set(x.e.contradaId, i + 1));
  const finalOrder = [...entries].sort((a, b) => {
    const ra = finalOrderMap.get(a.contradaId);
    const rb = finalOrderMap.get(b.contradaId);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return (a.laps[2] || 99) - (b.laps[2] || 99);
  });
  finalOrder.forEach((e, i) => (e.finished = i + 1));
  s.raceResult = finalOrder;
  s.raceLog = log;

  const winner = finalOrder[0];
  s.lastWinnerContradaId = winner.contradaId;
  const playerWon = winner.contradaId === player;
  const rivalWon = winner.contradaId === rivalId;
  const winnerScosso = winner.fallen;
  const winnerJockeyLabel = winnerScosso
    ? 'cavallo scosso (senza fantino)'
    : JOCKEY_BY_ID[winner.jockeyId].nickname;

  log.push('');
  log.push('═══ ARRIVO ═══');
  if (winnerScosso) {
    log.push(`🏆 ${CONTRADA_BY_ID[winner.contradaId].name} VINCE IL PALIO con un CAVALLO SCOSSO! ${winner.horse.name} taglia il bandierone senza fantino: storia del Palio!`);
  } else {
    log.push(`🏆 ${CONTRADA_BY_ID[winner.contradaId].name} VINCE IL PALIO! ${winnerJockeyLabel} su ${winner.horse.name} taglia il bandierone!`);
  }
  const totalFallen = entries.filter((e) => e.fallen).length;
  if (totalFallen > 0) {
    log.push(`Cadute totali: ${totalFallen} fantino/i. ${entries.filter((e) => e.fallen).map((e) => `${JOCKEY_BY_ID[e.jockeyId].nickname} (${CONTRADA_BY_ID[e.contradaId].name})`).join(', ')}.`);
  } else {
    log.push('Nessuna caduta in tutta la corsa: Palio pulito, raro e fortunato!');
  }

  if (playerWon) {
    s.morale = 100;
    const donation = randInt(15000, 30000);
    s.budget += donation;
    const bonus = s.jockeyBonus[winner.jockeyId] || 0;
    if (bonus) s.budget -= bonus;
    addNews(s, `VITTORIA! ${CONTRADA_BY_ID[player].name} vince il Palio! Cena della Vittoria, Morale al 100%. Donazioni protettori: +€${donation.toLocaleString('it-IT')}.`, 'epic');
  } else if (rivalWon) {
    s.scudisciato = true;
    s.purgaActive = true;
    s.purgaRemaining = 2;
    s.morale = clamp(s.morale - 50, 0, 100);
    addNews(s, `PURGA! La tua rivale ${CONTRADA_BY_ID[rivalId].name} vince il Palio. Lutto cittadino, morale crollato, budget penalizzato per 2 Palii.`, 'bad');
  } else {
    addNews(s, `Il Palio è vinto da ${CONTRADA_BY_ID[winner.contradaId].name}. Nessuna gioia, nessuna purga. Si riparte.`, 'info');
    s.morale = clamp(s.morale - 5, 0, 100);
  }

  (s as GameState & { _bribes?: Record<string, boolean> })._bribes = {};
  (s as GameState & { _enemyBribes?: Record<string, boolean> })._enemyBribes = {};
  return s;
}

// ===== End palio =====
export function endPalio(s: GameState): GameState {
  // Record this palio into history
  if (s.raceResult && s.raceResult.length > 0) {
    const playerEntry = s.raceResult.find((e) => e.contradaId === s.playerContradaId);
    const winnerEntry = s.raceResult[0];
    s.history.push({
      turn: s.turn,
      year: s.year,
      palioIndex: s.palioIndex,
      playerContradaId: s.playerContradaId,
      winnerContradaId: s.lastWinnerContradaId || winnerEntry.contradaId,
      winnerJockeyId: winnerEntry.jockeyId || '',
      winnerHorse: winnerEntry.horse.name || '',
      winnerScosso: winnerEntry.fallen,
      playerJockeyId: playerEntry?.jockeyId || '',
      playerHorse: playerEntry?.horse.name || '',
      playerFinished: playerEntry?.finished || 0,
      purga: s.purgaActive,
      scudisciato: s.scudisciato,
      budgetAfter: s.budget,
      moraleAfter: s.morale,
      fullResult: s.raceResult.map((e) => ({
        contradaId: e.contradaId,
        jockeyId: e.jockeyId || '',
        horse: e.horse.name,
        finished: e.finished,
        fallen: e.fallen,
      })),
    });
  }
  s.turn += 1;
  s.palioIndex = (s.palioIndex + 1) % 2;
  if (s.palioIndex === 0) s.year += 1;
  s.phase = 'estrazione';
  s.racingContradeIds = [];
  s.raceEntries = [];
  s.raceResult = null;
  s.incomingOffers = [];
  s.raceAnimating = false;
  s.jockeyContracts = {};
  s.jockeyInjured = {};
  s.jockeyFormPenalty = {};
  s.scratchedContrade = [];
  s.pendingScare = null;
  s.killerOrder = null;
  s.provaEvents = [];
  s.provaCanape = {};
  s.messaDone = false;
  if (s.purgaActive && s.purgaRemaining > 0) {
    s.budget = Math.round(s.budget * 0.65);
    s.purgaRemaining -= 1;
    if (s.purgaRemaining === 0) {
      s.purgaActive = false;
      addNews(s, 'La purga si placa. La città riprende a respirare.', 'info');
    }
  }
  const ban = (s as GameState & { _diplomaticBan?: number })._diplomaticBan;
  if (ban && ban > 0) {
    (s as GameState & { _diplomaticBan?: number })._diplomaticBan = ban - 1;
    if (ban - 1 === 0) {
      s.credibility = 50;
      addNews(s, 'Il bando diplomatico si scioglie. Le contrade tornano a parlarti.', 'good');
    }
  }
  s.morale = clamp(s.morale + 3, 0, 100);
  if (s.credibility > 0 && s.credibility < 100) s.credibility = clamp(s.credibility + 2, 0, 100);
  if (s.protectorsCooldown > 0) s.protectorsCooldown -= 1;
  // Decrement jockey suspensions
  for (const jid of Object.keys(s.jockeySuspensions)) {
    if (s.jockeySuspensions[jid] > 0) {
      s.jockeySuspensions[jid] -= 1;
      if (s.jockeySuspensions[jid] === 0) {
        delete s.jockeySuspensions[jid];
        addNews(s, `${JOCKEY_BY_ID[jid]?.nickname || 'Un fantino'} ha scontato la squalifica ed è di nuovo disponibile.`, 'info');
      }
    }
  }
  // Jockey loyalty: if a jockey won for a contrada, his affinity with that
  // contrada's rival drops. Repeated wins make it increasingly improbable
  // (but never impossible) for him to mount the rival in future Palii.
  if (s.raceResult && s.raceResult.length > 0) {
    const winnerEntry = s.raceResult[0];
    const winnerJockeyId = winnerEntry.jockeyId;
    const winnerContradaId = winnerEntry.contradaId;
    if (winnerJockeyId && winnerContradaId) {
      const rivalId = CONTRADA_BY_ID[winnerContradaId]?.rivalId;
      if (rivalId && s.contradaJockey[rivalId] && s.contradaJockey[rivalId][winnerJockeyId] !== undefined) {
        const current = s.contradaJockey[rivalId][winnerJockeyId];
        // Each win for the rival's enemy pushes affinity down by 18, clamped to -90
        // (never -100: a hard veto. Tradimenti restano possibili.)
        const newVal = clamp(current - 18, -90, 100);
        if (newVal !== current) {
          s.contradaJockey[rivalId][winnerJockeyId] = newVal;
          const jName = JOCKEY_BY_ID[winnerJockeyId]?.nickname || 'Il fantino';
          if (newVal <= -70) {
            addNews(s, `${jName} ha vinto ancora per ${CONTRADA_BY_ID[winnerContradaId].name}: ${CONTRADA_BY_ID[rivalId].name} quasi non lo vuole più vedere. Tradimento improbabile, ma non impossibile.`, 'rumor');
          }
        }
      }
    }
  }
  s.pendingDeals = s.pendingDeals.filter((d) => !d.fulfilled);
  // Auto-resolve credits: contrade may honor or renege on favors they owe the player
  const openCredits = s.debts.filter((d) => !d.resolved && d.direction === 'credito');
  for (const d of openCredits) {
    const rel = s.contradeRelations[d.contradaId][s.playerContradaId];
    const honorChance = clamp(0.55 + rel / 250, 0.1, 0.92);
    if (Math.random() < honorChance) {
      const amount = randInt(3000, 10000);
      s.budget += amount;
      d.resolved = true;
      addNews(s, `${CONTRADA_BY_ID[d.contradaId].name} onora il favore dovuto: +€${amount.toLocaleString('it-IT')}.`, 'good');
      s.contradeRelations[s.playerContradaId][d.contradaId] = clamp(s.contradeRelations[s.playerContradaId][d.contradaId] + 10, -100, 100);
    } else {
      d.resolved = true;
      addNews(s, `${CONTRADA_BY_ID[d.contradaId].name} RINNEGIA il favore dovuto. Parola non mantenuta!`, 'bad');
      s.contradeRelations[s.playerContradaId][d.contradaId] = clamp(s.contradeRelations[s.playerContradaId][d.contradaId] - 20, -100, 100);
    }
    s.contradeRelations[d.contradaId][s.playerContradaId] = s.contradeRelations[s.playerContradaId][d.contradaId];
  }
  return s;
}

// ===== Prove (six trials) =====
const PROVA_NAMES: Record<string, string> = {
  prova1: 'Prima Prova',
  prova2: 'Seconda Prova',
  prova3: 'Terza Prova',
  prova4: 'Quarta Prova',
  provagenerale: 'Prova Generale',
  provaccia: 'Provaccia',
};

const CURVE_NAMES = [
  'curva di San Martino',
  'curva del Casato',
];

function randomCurve(): string {
  return CURVE_NAMES[Math.floor(Math.random() * CURVE_NAMES.length)];
}

function randomizeProvaCanape(s: GameState): void {
  const entries = s.raceEntries.filter((e) => e.jockeyId);
  const shuffled = shuffle([...entries]);
  s.provaCanape = {};
  shuffled.forEach((e, i) => {
    s.provaCanape[e.contradaId] = i;
  });
}

function simulateProvaWinner(s: GameState): { contradaId: string; jockeyId: string } | null {
  const entries = s.raceEntries.filter((e) => e.jockeyId && !s.jockeyInjured[e.jockeyId]);
  if (entries.length === 0) return null;
  const scored = entries.map((e) => {
    const j = JOCKEY_BY_ID[e.jockeyId];
    let p = e.horse.overall * 0.4 + j.overall * 0.4 + Math.random() * 20;
    const canape = s.provaCanape[e.contradaId] ?? 5;
    if (canape <= 1) p += 3;
    const formPenalty = s.jockeyFormPenalty[e.jockeyId] || 0;
    p -= formPenalty * 0.5;
    return { e, p };
  });
  scored.sort((a, b) => b.p - a.p);
  return { contradaId: scored[0].e.contradaId, jockeyId: scored[0].e.jockeyId };
}

export function runProva(s: GameState, phase: string): GameState {
  s.provaEvents = [];
  randomizeProvaCanape(s);
  const provaName = PROVA_NAMES[phase] || 'Prova';
  addNews(s, `${provaName}: ordine al canape sorteggiato, i fantini saggiano i barberi.`, 'info');

  const isAfterMessa = phase === 'provaccia';

  // Roll for imprevisti
  for (const e of s.raceEntries) {
    if (!e.jockeyId) continue;
    const j = JOCKEY_BY_ID[e.jockeyId];
    const r = Math.random();
    const curve = randomCurve();
    // 0.08% — injury after messa (provaccia): contrada cannot run
    if (isAfterMessa && r < 0.0008) {
      s.jockeyInjured[e.jockeyId] = true;
      if (!s.scratchedContrade.includes(e.contradaId)) s.scratchedContrade.push(e.contradaId);
      const msg = `${provaName}: ${j.nickname} (${CONTRADA_BY_ID[e.contradaId].name}) cade alla ${curve} e si infortuna gravemente! La contrada non può correre il Palio.`;
      s.provaEvents.push(msg);
      addNews(s, msg, 'bad');
      continue;
    }
    // 0.25% — injury during prove (before messa): must replace jockey
    if (!isAfterMessa && r < 0.0025) {
      s.jockeyInjured[e.jockeyId] = true;
      const msg = `${provaName}: ${j.nickname} (${CONTRADA_BY_ID[e.contradaId].name}) cade alla ${curve} e si infortuna! Va sostituito prima della messa.`;
      s.provaEvents.push(msg);
      addNews(s, msg, 'bad');
      if (e.contradaId !== s.playerContradaId) {
        replaceInjuredJockey(s, e.contradaId);
      }
      continue;
    }
    // 1% — scare (fall, no injury): form penalty, captain can confirm or replace (before messa only)
    if (!isAfterMessa && r < 0.01) {
      s.jockeyFormPenalty[e.jockeyId] = (s.jockeyFormPenalty[e.jockeyId] || 0) + 2;
      const msg = `${provaName}: ${j.nickname} (${CONTRADA_BY_ID[e.contradaId].name}) cade alla ${curve} ma non si fa nulla. Pericolo scampato, ma la forma ne risente.`;
      s.provaEvents.push(msg);
      addNews(s, msg, 'rumor');
      if (e.contradaId === s.playerContradaId && !s.messaDone) {
        s.pendingScare = { contradaId: e.contradaId, jockeyId: e.jockeyId };
      }
      continue;
    }
  }

  // Determine prova winner (light race simulation)
  const winner = simulateProvaWinner(s);
  if (winner) {
    const wContrada = CONTRADA_BY_ID[winner.contradaId];
    const wJockey = JOCKEY_BY_ID[winner.jockeyId];
    const winnerMsg = `${provaName}: vince ${wContrada.name} con "${wJockey.nickname}".`;
    s.provaEvents.push(winnerMsg);
    addNews(s, winnerMsg, wContrada.id === s.playerContradaId ? 'good' : 'info');
  }

  return s;
}

function replaceInjuredJockey(s: GameState, contradaId: string): void {
  const entry = s.raceEntries.find((e) => e.contradaId === contradaId);
  if (!entry || !entry.jockeyId) return;
  const oldJid = entry.jockeyId;
  delete s.jockeyContracts[oldJid];
  // Build taken from both contracts and actual race entries — the injured jockey
  // is still listed in entry.jockeyId until we replace him, but he's injured so
  // the filter below excludes him anyway. All other mounted jockeys are locked.
  const taken = new Set(Object.keys(s.jockeyContracts));
  for (const re of s.raceEntries) { if (re.jockeyId && re.contradaId !== contradaId) taken.add(re.jockeyId); }
  const available = JOCKEYS.filter((j) => !taken.has(j.id) && !s.jockeyInjured[j.id] && !s.jockeySuspensions[j.id] && s.contradaJockey[contradaId][j.id] > -100);
  available.sort((a, b) => b.overall - a.overall);
  const chosen = available[0];
  if (chosen) {
    entry.jockeyId = chosen.id;
    s.jockeyContracts[chosen.id] = contradaId;
    addNews(s, `${CONTRADA_BY_ID[contradaId].name} sostituisce il fantino infortunato con "${chosen.nickname}".`, 'info');
  } else {
    entry.jockeyId = undefined;
    addNews(s, `${CONTRADA_BY_ID[contradaId].name} non trova un fantino sostitutivo!`, 'bad');
  }
}

export function runMessaDelFantino(s: GameState): GameState {
  s.messaDone = true;
  s.provaEvents = [];
  addNews(s, 'Messa del Fantino: i fantini sono "messi" (confermati). Da ora non si possono più cambiare i monti.', 'epic');
  // Auto-replace any player jockey still injured (shouldn't happen, but safety)
  const playerEntry = s.raceEntries.find((e) => e.contradaId === s.playerContradaId);
  if (playerEntry && playerEntry.jockeyId && s.jockeyInjured[playerEntry.jockeyId]) {
    replaceInjuredJockey(s, s.playerContradaId);
  }
  return s;
}

// Player confirms a scared jockey (keeps him despite form penalty)
export function confirmScare(s: GameState, confirm: boolean): GameState {
  if (!s.pendingScare) return s;
  const { contradaId, jockeyId } = s.pendingScare;
  s.pendingScare = null;
  if (!confirm) {
    // Player wants to replace the jockey
    const entry = s.raceEntries.find((e) => e.contradaId === contradaId);
    if (entry) {
      delete s.jockeyContracts[jockeyId];
      entry.jockeyId = undefined;
      addNews(s, `Hai liberato "${JOCKEY_BY_ID[jockeyId].nickname}" dopo la caduta. Ingaggia un nuovo fantino dal Mercato.`, 'info');
    }
  } else {
    addNews(s, `Confermi "${JOCKEY_BY_ID[jockeyId].nickname}" nonostante la caduta. La forma ne risente ma la fiducia resta.`, 'info');
  }
  return s;
}

export { clamp };
