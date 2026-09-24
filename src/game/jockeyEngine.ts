import type { JockeyCareerState, MountOffer, BribeOffer, JockeyPalioRecord } from './types';
import { CONTRADE, CONTRADA_BY_ID, JOCKEYS, HORSES } from './data';

const SAVE_KEY = 'fantino-carriera-save-v1';

export function saveJockeyCareer(s: JockeyCareerState) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* */ }
}

export function loadJockeyCareer(): JockeyCareerState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JockeyCareerState;
  } catch { return null; }
}

export function clearJockeyCareer() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* */ }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function randInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Creazione del fantino ───────────────────────────────────────────────────

export function createJockeyCareer(nickname: string, killer: number): JockeyCareerState {
  const overall = randInt(55, 75);
  const mossa = randInt(3, 8);
  const grinta = randInt(4, 9);
  const fallRate = clamp(8 + (10 - grinta) * 1.5 + (10 - overall / 10) * 0.8, 4, 30);
  const independence = randInt(3, 8);
  const incorruptibility = clamp(randInt(3, 8), 1, 10);

  const contradaRelations: Record<string, number> = {};
  for (const c of CONTRADE) {
    contradaRelations[c.id] = randInt(-20, 20);
  }

  return {
    version: 1,
    mode: 'jockey',
    phase: 'attesa',
    turn: 1,
    year: 2025,
    palioIndex: 0,
    nickname: nickname.trim() || 'Il Fantino',
    overall,
    mossa,
    grinta,
    killer,
    fallRate,
    independence,
    incorruptibility,
    reputation: 15,
    wealth: 0,
    wins: 0,
    paliiRun: 0,
    cadute: 0,
    scosseVinte: 0,
    purghe: 0,
    currentContradaId: null,
    currentHorse: null,
    currentCanape: 0,
    currentFee: 0,
    racingContradeIds: [],
    allEntries: [],
    mountOffers: [],
    bribeOffers: [],
    acceptedBribe: null,
    contradaRelations,
    injured: false,
    injuryTurns: 0,
    history: [],
    lastRaceLog: [],
    lastRaceResult: [],
    lastWinnerContradaId: null,
    lastPlayerFinished: 0,
    lastPlayerFallen: false,
    gameOver: false,
    gameOverReason: '',
  };
}

// ── Estrazione 10 contrade ──────────────────────────────────────────────────

function drawContrade(): string[] {
  return shuffle(CONTRADE.map((c) => c.id)).slice(0, 10);
}

// ── Generazione proposte di monta ───────────────────────────────────────────
// In base a reputazione e overall, alcune contrade ti offrono la monta.
// A volte molte, a volte una sola, a volte nessuna (improbile ma possibile).

function jockeyFee(overall: number, reputation: number, horseOverall: number): number {
  const base = 2000 + overall * 100;
  const repBonus = reputation * 150;
  const horseFactor = horseOverall * 50;
  return Math.round((base + repBonus + horseFactor) / 100) * 100;
}

export function generateMountOffers(s: JockeyCareerState): void {
  s.mountOffers = [];
  s.bribeOffers = [];
  s.acceptedBribe = null;
  s.currentContradaId = null;
  s.currentHorse = null;
  s.currentCanape = 0;
  s.currentFee = 0;

  // Estrai 10 contrade
  s.racingContradeIds = drawContrade();

  // Assegna cavalli random alle 10 contrade
  const horses = shuffle(HORSES).slice(0, 10);

  // Probabilità di ricevere offerte basata su reputazione
  // reputazione alta → quasi sempre offerte; bassa → spesso zero
  const offerChance = clamp(0.25 + s.reputation / 100 * 0.65 + s.overall / 100 * 0.15, 0.15, 0.95);

  const offers: MountOffer[] = [];
  for (let i = 0; i < s.racingContradeIds.length; i++) {
    const cid = s.racingContradeIds[i];
    const horse = horses[i];
    const rel = s.contradaRelations[cid] ?? 0;

    // Se la contrada ti ha in antipatia (relazione molto negativa), non ti offre
    if (rel <= -80) continue;

    // Roll per vedere se questa contrada ti fa un'offerta
    const chance = offerChance * (1 + rel / 200);
    if (Math.random() > chance) continue;

    const fee = jockeyFee(s.overall, s.reputation, horse.overall);
    const canape = randInt(0, 9);

    // Controlla se è un'offerta "provocatoria" dalla rivale di una contrada
    // con cui hai buon rapporto
    const isRivalOffer = CONTRADE.some((c) => {
      if (c.id !== cid) return false;
      const rivalId = c.rivalId;
      if (!rivalId) return false;
      const rivalRel = s.contradaRelations[rivalId] ?? 0;
      return rivalRel >= 50;
    });

    offers.push({
      id: uid(),
      contradaId: cid,
      horseName: horse.name,
      horseOverall: horse.overall,
      canape,
      fee,
      isRivalOffer,
    });
  }

  // Se non ci sono offerte ma la reputazione è decente, forzane almeno una
  if (offers.length === 0 && s.reputation >= 10 && Math.random() < 0.6) {
    const cid = pick(s.racingContradeIds);
    const idx = s.racingContradeIds.indexOf(cid);
    const horse = horses[idx];
    offers.push({
      id: uid(),
      contradaId: cid,
      horseName: horse.name,
      horseOverall: horse.overall,
      canape: randInt(0, 9),
      fee: jockeyFee(s.overall, s.reputation, horse.overall),
      isRivalOffer: false,
    });
  }

  s.mountOffers = offers;
  s.phase = 'scelta';
}

// ── Accetta una proposta di monta ───────────────────────────────────────────

export function acceptMount(s: JockeyCareerState, offerId: string): { ok: boolean; reason?: string } {
  const offer = s.mountOffers.find((o) => o.id === offerId);
  if (!offer) return { ok: false, reason: 'Offerta non trovata' };

  s.currentContradaId = offer.contradaId;
  s.currentHorse = offer.horseName;
  s.currentCanape = offer.canape;
  s.currentFee = offer.fee;
  s.wealth += offer.fee;
  s.mountOffers = [];

  // Genera tutte le entry della gara (AI jockeys per le altre 9 contrade)
  generateRaceEntries(s);

  // Genera eventuali offerte di corruzione
  generateBribeOffers(s);

  s.phase = 'corse';
  return { ok: true };
}

// ── Rifiuta tutte le proposte (salta il palio) ──────────────────────────────

export function refuseAllMounts(s: JockeyCareerState): void {
  s.mountOffers = [];
  s.currentContradaId = null;
  // Riposo: la reputazione si alza un po' quando non corri
  s.reputation = clamp(s.reputation + 3, 0, 100);
  s.phase = 'fuori';
}

// ── Genera entry gara per tutte le 10 contrade ──────────────────────────────

function generateRaceEntries(s: JockeyCareerState): void {
  const horses = shuffle(HORSES).slice(0, 10);
  const availableJockeys = shuffle(JOCKEYS.filter((j) => j.id !== 'player'));
  let jIdx = 0;

  s.allEntries = s.racingContradeIds.map((cid, i) => {
    const horse = horses[i];
    if (cid === s.currentContradaId) {
      return {
        contradaId: cid,
        jockeyId: 'player',
        horseName: s.currentHorse || horse.name,
        horseOverall: horse.overall,
        canape: s.currentCanape,
      };
    }
    const j = availableJockeys[jIdx % availableJockeys.length];
    jIdx++;
    return {
      contradaId: cid,
      jockeyId: j.id,
      horseName: horse.name,
      horseOverall: horse.overall,
      canape: randInt(0, 9),
    };
  });
}

// ── Genera offerte di corruzione ─────────────────────────────────────────────
// Contrade che vogliono che tu ti venda contro un loro rivale

function generateBribeOffers(s: JockeyCareerState): void {
  s.bribeOffers = [];
  s.acceptedBribe = null;

  if (!s.currentContradaId) return;

  const myContrada = CONTRADA_BY_ID[s.currentContradaId];
  if (!myContrada) return;

  // Al massimo 2 offerte di corruzione
  const numOffers = Math.random() < 0.35 ? 0 : Math.random() < 0.6 ? 1 : 2;

  const otherRacing = s.racingContradeIds.filter((id) => id !== s.currentContradaId);

  for (let i = 0; i < numOffers; i++) {
    const fromCid = pick(otherRacing);
    const fromContrada = CONTRADA_BY_ID[fromCid];
    if (!fromContrada) continue;

    // Il bersaglio è il rivale di chi ti corrompe, se è in gara
    const targetId = fromContrada.rivalId;
    if (!targetId || !s.racingContradeIds.includes(targetId)) continue;
    if (targetId === s.currentContradaId) continue; // non ti chiedono di farti del male

    const type = pick(['ostacolo', 'mossa', 'caduta']) as BribeOffer['type'];
    const baseAmount = type === 'caduta' ? 15000 : type === 'ostacolo' ? 8000 : 5000;
    const amount = baseAmount + randInt(0, 5) * 1000;

    s.bribeOffers.push({
      id: uid(),
      fromContradaId: fromCid,
      targetContradaId: targetId,
      amount,
      type,
    });
  }
}

// ── Accetta o rifiuta una corruzione ────────────────────────────────────────

export function acceptBribe(s: JockeyCareerState, bribeId: string): { ok: boolean; reason?: string } {
  const bribe = s.bribeOffers.find((b) => b.id === bribeId);
  if (!bribe) return { ok: false, reason: 'Offerta non trovata' };

  // Se sei incorruttibile, potresti rifiutare anche se accetti
  const resistChance = clamp(s.incorruptibility / 12, 0, 0.7);
  if (Math.random() < resistChance) {
    s.bribeOffers = [];
    return { ok: false, reason: 'La tua coscienza ha avuto la meglio. Rifiuti istintivamente.' };
  }

  s.acceptedBribe = bribe;
  s.wealth += bribe.amount;
  s.bribeOffers = [];
  return { ok: true };
}

export function refuseBribe(s: JockeyCareerState): void {
  s.bribeOffers = [];
}

// ── Simulazione del Palio ───────────────────────────────────────────────────

interface SimHorse {
  contradaId: string;
  jockeyId: string;
  horseName: string;
  horseOverall: number;
  canape: number;
  baseSpeed: number;
  progress: number;
  fallen: boolean;
  finished: number;
  isPlayer: boolean;
}

export function simulateJockeyRace(s: JockeyCareerState): void {
  const log: string[] = [];
  const TOTAL_LAPS = 3;

  const horses: SimHorse[] = s.allEntries.map((e) => {
    let baseSpeed = 1.0 + e.horseOverall * 0.008;

    if (e.jockeyId === 'player') {
      baseSpeed += s.overall * 0.006 + s.mossa * 0.02 + s.grinta * 0.015 + s.wins * 0.01;
      if (s.injured) baseSpeed *= 0.85;
    } else {
      const j = JOCKEYS.find((jj) => jj.id === e.jockeyId);
      if (j) {
        baseSpeed += j.overall * 0.006 + j.mossa * 0.015 + j.grinta * 0.01 + j.wins * 0.008;
      }
    }

    // Canape penalty: posizione 0 (rincorsa) è svantaggiata
    if (e.canape === 0) baseSpeed *= 0.93;
    else if (e.canape >= 7) baseSpeed *= 0.97;

    // Corruzione: se il giocatore ha accettato un ostacolo/caduta contro un bersaglio
    if (s.acceptedBribe && e.contradaId === s.acceptedBribe.targetContradaId) {
      if (s.acceptedBribe.type === 'ostacolo') baseSpeed *= 0.82;
      else if (s.acceptedBribe.type === 'caduta') baseSpeed *= 0.70;
      else if (s.acceptedBribe.type === 'mossa') baseSpeed *= 0.90;
    }

    // Killer: se il giocatore ha killer alto, ostacola la rivale
    if (e.jockeyId === 'player' && s.killer >= 7) {
      const myContrada = CONTRADA_BY_ID[e.contradaId];
      if (myContrada?.rivalId) {
        // bonus ostacolo implicito
      }
    }

    // Random day form
    baseSpeed *= 0.88 + Math.random() * 0.24;

    return {
      contradaId: e.contradaId,
      jockeyId: e.jockeyId,
      horseName: e.horseName,
      horseOverall: e.horseOverall,
      canape: e.canape,
      baseSpeed,
      progress: 0,
      fallen: false,
      finished: 0,
      isPlayer: e.jockeyId === 'player',
    };
  });

  // Simulazione giro per giro
  const finishOrder: SimHorse[] = [];
  let fallenThisRace: SimHorse[] = [];

  for (let lap = 0; lap < TOTAL_LAPS; lap++) {
    const lapFallMultiplier = lap === 0 ? 1.0 : lap === 1 ? 0.7 : 0.5;

    for (const h of horses) {
      if (h.fallen || h.finished > 0) continue;

      // Roll caduta
      let fallChance = 0;
      if (h.isPlayer) {
        fallChance = (s.fallRate / 100) * lapFallMultiplier;
        // Se incaricato di cadere (corruzione caduta su te stesso non ha senso, ma se infortunato)
        if (s.injured) fallChance *= 1.5;
      } else {
        const j = JOCKEYS.find((jj) => jj.id === h.jockeyId);
        fallChance = ((j?.fallRate ?? 15) / 100) * lapFallMultiplier;
      }

      // Corruzione caduta: il bersaglio ha più probabilità di cadere
      if (s.acceptedBribe?.type === 'caduta' && h.contradaId === s.acceptedBribe.targetContradaId) {
        fallChance = Math.max(fallChance, 0.45);
      }

      if (Math.random() < fallChance) {
        h.fallen = true;
        fallenThisRace.push(h);
        const cName = CONTRADA_BY_ID[h.contradaId]?.name ?? h.contradaId;
        if (h.isPlayer) {
          log.push(`Caduta al ${lap + 1}° giro! Sei disarcionato!`);
        } else {
          log.push(`${cName}: caduto al ${lap + 1}° giro`);
        }
      }
    }

    // Avanza progressi
    let leaderProgress = 0;
    for (const h of horses) {
      if (h.fallen || h.finished > 0) continue;
      if (h.progress > leaderProgress) leaderProgress = h.progress;
    }
    for (const h of horses) {
      if (h.fallen || h.finished > 0) continue;
      const jitter = 1 + Math.sin(lap * 1.7 + h.contradaId.charCodeAt(0)) * 0.04;
      let speed = h.baseSpeed * jitter;
      const gap = leaderProgress - h.progress;
      if (gap > 0.15) speed *= 1 + Math.min(gap * 0.03, 0.09);
      h.progress += speed * 0.34;
    }
  }

  // Ordina per progresso
  const stillRunning = horses.filter((h) => !h.fallen);
  stillRunning.sort((a, b) => b.progress - a.progress);
  const fallenSorted = fallenThisRace.sort((a, b) => b.progress - a.progress);

  let pos = 1;
  for (const h of stillRunning) {
    h.finished = pos;
    finishOrder.push(h);
    pos++;
  }
  for (const h of fallenSorted) {
    h.finished = pos;
    pos++;
  }

  // Risultati
  const winner = finishOrder[0];
  s.lastWinnerContradaId = winner?.contradaId ?? null;
  s.lastRaceResult = horses.map((h) => ({
    contradaId: h.contradaId,
    jockeyId: h.jockeyId,
    horseName: h.horseName,
    finished: h.fallen ? 0 : h.finished,
    fallen: h.fallen,
  }));

  const playerHorse = horses.find((h) => h.isPlayer);
  s.lastPlayerFinished = playerHorse?.fallen ? 0 : playerHorse?.finished ?? 0;
  s.lastPlayerFallen = playerHorse?.fallen ?? false;
  s.lastRaceLog = log;

  // Aggiorna statistiche
  s.paliiRun++;
  const won = s.lastPlayerFinished === 1;
  const fallen = s.lastPlayerFallen;

  if (won) {
    s.wins++;
    s.reputation = clamp(s.reputation + 15, 0, 100);
    s.overall = clamp(s.overall + 1, 0, 99);
    if (fallen) s.scosseVinte++;
  } else {
    s.reputation = clamp(s.reputation - 3, 0, 100);
  }

  if (fallen) {
    s.cadute++;
    // Probabilità di infortunio dopo caduta
    if (Math.random() < 0.35) {
      s.injured = true;
      s.injuryTurns = 1;
    }
  }

  // Purga: se la rivale della mia contrada ha vinto
  if (s.currentContradaId) {
    const myContrada = CONTRADA_BY_ID[s.currentContradaId];
    if (myContrada?.rivalId && s.lastWinnerContradaId === myContrada.rivalId) {
      s.purghe++;
      s.reputation = clamp(s.reputation - 5, 0, 100);
      log.push(`Purga! La rivale ${CONTRADA_BY_ID[myContrada.rivalId]?.name} ha vinto il Palio!`);
    }
  }

  // Aggiorna relazioni con le contrade
  if (s.currentContradaId) {
    if (won) {
      s.contradaRelations[s.currentContradaId] = clamp(
        (s.contradaRelations[s.currentContradaId] ?? 0) + 20, -100, 100
      );
    } else if (fallen) {
      s.contradaRelations[s.currentContradaId] = clamp(
        (s.contradaRelations[s.currentContradaId] ?? 0) - 10, -100, 100
      );
    }

    // Se hai accettato una corruzione, la contrada bersaglio peggiora
    if (s.acceptedBribe) {
      s.contradaRelations[s.acceptedBribe.targetContradaId] = clamp(
        (s.contradaRelations[s.acceptedBribe.targetContradaId] ?? 0) - 30, -100, 100
      );
      s.contradaRelations[s.acceptedBribe.fromContradaId] = clamp(
        (s.contradaRelations[s.acceptedBribe.fromContradaId] ?? 0) + 15, -100, 100
      );
      // Reputazione cala se si scopre
      if (Math.random() < 0.3) {
        s.reputation = clamp(s.reputation - 8, 0, 100);
        log.push('Si mormora che tu ti sia venduto...');
      }
    }
  }

  // Record storico
  const record: JockeyPalioRecord = {
    year: s.year,
    palioIndex: s.palioIndex,
    contradaId: s.currentContradaId ?? '',
    horseName: s.currentHorse ?? '',
    canape: s.currentCanape,
    finished: s.lastPlayerFinished,
    fallen: s.lastPlayerFallen,
    won,
    fee: s.currentFee,
    bribeTaken: !!s.acceptedBribe,
    bribeAmount: s.acceptedBribe?.amount ?? 0,
  };
  s.history.push(record);

  s.phase = 'risultato';
}

// ── Avanza al palio successivo ───────────────────────────────────────────────

export function advanceToNextPalio(s: JockeyCareerState): void {
  s.turn++;
  s.palioIndex = (s.palioIndex + 1) % 2;
  if (s.palioIndex === 0) s.year++;

  // Reset stato palio
  s.currentContradaId = null;
  s.currentHorse = null;
  s.currentCanape = 0;
  s.currentFee = 0;
  s.mountOffers = [];
  s.bribeOffers = [];
  s.acceptedBribe = null;
  s.racingContradeIds = [];
  s.allEntries = [];
  s.lastRaceLog = [];
  s.lastRaceResult = [];
  s.lastWinnerContradaId = null;
  s.lastPlayerFinished = 0;
  s.lastPlayerFallen = false;

  // Infortunio
  if (s.injured && s.injuryTurns > 0) {
    s.injuryTurns--;
    if (s.injuryTurns <= 0) {
      s.injured = false;
    } else {
      s.phase = 'fuori';
      return;
    }
  }

  // La carriera non finisce mai. Se la reputazione è molto bassa, la si rialza un po'
  if (s.reputation < 10) {
    s.reputation = clamp(s.reputation + 5, 0, 100);
  }

  generateMountOffers(s);
}

// ── Salta il palio per infortunio ────────────────────────────────────────────

export function recoverFromInjury(s: JockeyCareerState): void {
  s.injuryTurns--;
  if (s.injuryTurns <= 0) {
    s.injured = false;
  }
  advanceToNextPalio(s);
}
