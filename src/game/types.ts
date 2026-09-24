// ===== Core types for Capitano Simulator: Il Palio di Siena =====

export type Phase =
  | 'setup'
  | 'estrazione'   // draw 10 contrade that will race
  | 'cavalli'       // sorteggio cavalli (tratta dei barberi)
  | 'tratta'        // assegnazione fantini (monte)
  | 'provafinale'   // placeholder: set after tratta, immediately advances to prima prova
  | 'prova1'
  | 'prova2'
  | 'prova3'
  | 'prova4'
  | 'provagenerale'
  | 'messadelfantino'
  | 'provaccia'
  | 'palio'         // la corsa
  | 'postpalio';

export type CareerStage = 'giovane' | 'esperto' | 'a fine carriera';

export interface Contrada {
  id: string;
  name: string;
  title: string; // titolo onorifico (es. "Priora", "Nobile", "Imperiale")
  nickname: string;
  colors: { bg: string; fg: string; accent: string };
  rivalId: string;
}

export interface Jockey {
  id: string;
  nickname: string; // soprannome reale
  careerStage: CareerStage;
  mossa: number; // 1-10
  grinta: number; // 1-10
  avidity: number; // base fee requested €
  incorruptibility: number; // 1-10
  wins: number; // palii vinti (storici)
  overall: number; // bravura 0-100
  killer: number; // 1-10: ostilità verso la rivale della contrada che lo ingaggia
  fallRate: number; // probabilità di caduta in gara (%)
  independence: number; // 1-10: tendenza a correre per sé stesso anziché obbedire a strategie
}

export type RelationLevel =
  | 'veto' // -100
  | 'rival' // -50..-1
  | 'neutral' // 0
  | 'sympathy' // 1..50
  | 'ally'; // 51..100

export interface PendingDeal {
  id: string;
  contradaId: string;
  type: 'aiuto' | 'neutralita' | 'ostacolo' | 'strada';
  targetContradaId?: string;
  payment: 'cash' | 'favore';
  amount: number;
  active: boolean;
  fulfilled: boolean;
  lastMinute?: boolean;
}

export interface IncomingOffer {
  id: string;
  fromContradaId: string;
  type: 'compra_ostacolo' | 'compra_neutralita' | 'compra_aiuto' | 'compra_mossa';
  targetContradaId?: string;
  askingPrice: number;
  turn: number;
  accepted: boolean;
  rejected: boolean;
}

export interface DebtRecord {
  id: string;
  contradaId: string;
  direction: 'credito' | 'debito';
  description: string;
  year: number;
  palioIndex: number;
  resolved: boolean;
}

export interface RaceEntry {
  contradaId: string;
  jockeyId: string;
  horse: { name: string; strength: number; overall: number };
  canape: number;
  laps: number[];
  corrupted: boolean;
  guarded: boolean;
  betrayed: boolean;
  fallen: boolean;
  finished: number;
}

export interface NewsItem {
  id: string;
  text: string;
  tone: 'info' | 'rumor' | 'good' | 'bad' | 'epic';
  turn: number;
}

export interface PalioRecord {
  turn: number;
  year: number;
  palioIndex: number; // 0=luglio, 1=agosto
  playerContradaId: string;
  winnerContradaId: string;
  winnerJockeyId: string;
  winnerHorse: string;
  winnerScosso: boolean;
  playerJockeyId: string;
  playerHorse: string;
  playerFinished: number; // placement
  purga: boolean;
  scudisciato: boolean;
  budgetAfter: number;
  moraleAfter: number;
  fullResult: { contradaId: string; jockeyId: string; horse: string; finished: number; fallen: boolean }[];
}

export interface GameState {
  version: number;
  phase: Phase;
  turn: number;
  year: number;
  palioIndex: number;
  playerContradaId: string;
  budget: number;
  morale: number;
  credibility: number;
  purgaActive: boolean;
  purgaRemaining: number;
  racingContradeIds: string[]; // 10 contrade estratte per questo palio
  contradeRelations: Record<string, Record<string, number>>;
  jockeyRelations: Record<string, Record<string, number>>;
  contradaJockey: Record<string, Record<string, number>>;
  jockeyContracts: Record<string, string>;
  jockeyGuarded: Record<string, boolean>;
  jockeyBonus: Record<string, number>;
  pendingDeals: PendingDeal[];
  debts: DebtRecord[];
  news: NewsItem[];
  raceEntries: RaceEntry[];
  raceLog: string[];
  raceResult: RaceEntry[] | null;
  lastWinnerContradaId: string | null;
  scudisciato: boolean;
  gameOver: boolean;
  history: PalioRecord[];
  incomingOffers: IncomingOffer[];
  raceAnimating: boolean;
  // === Prove (six trials) ===
  provaCanape: Record<string, number>; // contradaId -> canape position for current prova (random each prova)
  jockeyInjured: Record<string, boolean>; // jockeyId -> injured (cannot race)
  jockeyFormPenalty: Record<string, number>; // jockeyId -> penalty to race power (from scares)
  scratchedContrade: string[]; // contrade that cannot run (injury after messa) -> palio in 9
  pendingScare: { contradaId: string; jockeyId: string } | null; // player must confirm/replace after a scare
  provaEvents: string[]; // log of events from the current prova
  messaDone: boolean; // messa del fantino completed (no more jockey changes)
  protectorsCooldown: number; // palii rimasti prima di poter chiedere soldi ai protettori
  jockeySuspensions: Record<string, number>; // jockeyId -> palii di squalifica rimanenti
  killerOrder: { jockeyId: string; targetContradaId: string; mode: 'nerbata' | 'caduta' } | null;
}

// ===== Modalità Carriera Fantino =====

export type JockeyCareerPhase =
  | 'creation'      // scelta soprannome e stats
  | 'attesa'        // in attesa di proposte di monta
  | 'scelta'        // scegli quale proposta accettare
  | 'corse'         // palio in corso (animazione)
  | 'risultato'     // risultato del palio
  | 'fuori'         // infortunato, salta il palio
  | 'fine';         // carriera finita

export interface MountOffer {
  id: string;
  contradaId: string;
  horseName: string;
  horseOverall: number;
  canape: number;       // posizione alla mossa
  fee: number;          // compenso offerto
  isRivalOffer: boolean; // offerta dalla rivale di chi ti ingaggia di solito
}

export interface BribeOffer {
  id: string;
  fromContradaId: string;  // chi ti corrompe
  targetContradaId: string; // chi devi ostacolare
  amount: number;
  type: 'ostacolo' | 'mossa' | 'caduta'; // cosa ti chiedono
}

export interface JockeyPalioRecord {
  year: number;
  palioIndex: number;
  contradaId: string;
  horseName: string;
  canape: number;
  finished: number;     // posizione arrivo (0 = caduto)
  fallen: boolean;
  won: boolean;
  fee: number;
  bribeTaken: boolean;
  bribeAmount: number;
}

export interface JockeyCareerState {
  version: number;
  mode: 'jockey';
  phase: JockeyCareerPhase;
  turn: number;
  year: number;
  palioIndex: number; // 0=luglio, 1=agosto

  // Identità del fantino
  nickname: string;
  overall: number;      // bravura 0-100
  mossa: number;        // 1-10
  grinta: number;       // 1-10
  killer: number;       // 1-10 (scelto dal giocatore)
  fallRate: number;     // % caduta per giro
  independence: number; // 1-10
  incorruptibility: number; // 1-10

  // Carriera
  reputation: number;   // 0-100, cresce con le vittorie
  wealth: number;       // soldi accumulati
  wins: number;
  paliiRun: number;
  cadute: number;
  scosseVinte: number;
  purghe: number;       // volte che la rivale ha vinto mentre correvi

  // Stato corrente
  currentContradaId: string | null;  // contrada per cui corri questo palio
  currentHorse: string | null;
  currentCanape: number;
  currentFee: number;
  racingContradeIds: string[]; // 10 contrade in gara
  allEntries: { contradaId: string; jockeyId: string; horseName: string; horseOverall: number; canape: number }[];

  // Offerte
  mountOffers: MountOffer[];
  bribeOffers: BribeOffer[];
  acceptedBribe: BribeOffer | null;

  // Relazioni dinamiche con le contrade
  contradaRelations: Record<string, number>; // -100 a 100

  // Infortunio
  injured: boolean;
  injuryTurns: number; // palii da saltare

  // Storico
  history: JockeyPalioRecord[];

  // Log dell'ultimo palio
  lastRaceLog: string[];
  lastRaceResult: { contradaId: string; jockeyId: string; horseName: string; finished: number; fallen: boolean }[];
  lastWinnerContradaId: string | null;
  lastPlayerFinished: number;
  lastPlayerFallen: boolean;

  gameOver: boolean;
  gameOverReason: string;
}
