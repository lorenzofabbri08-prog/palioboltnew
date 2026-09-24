import type { Contrada, Jockey } from './types';

// ===== Le 17 Contrade di Siena =====
// Titoli, colori e rivalità ufficiali.
export const CONTRADE: Contrada[] = [
  { id: 'aquila', name: 'Aquila', title: 'Nobile', nickname: '', colors: { bg: '#fde047', fg: '#1e3a8a', accent: '#1e3a8a' }, rivalId: 'pantera' },
  { id: 'bruco', name: 'Bruco', title: 'Nobile', nickname: '', colors: { bg: '#14532d', fg: '#fde047', accent: '#facc15' }, rivalId: '' },
  { id: 'chiocciola', name: 'Chiocciola', title: '', nickname: '', colors: { bg: '#b91c1c', fg: '#fde047', accent: '#fde047' }, rivalId: 'tartuca' },
  { id: 'civetta', name: 'Civetta', title: 'Priora', nickname: '', colors: { bg: '#0c0a09', fg: '#ffffff', accent: '#dc2626' }, rivalId: 'leocorno' },
  { id: 'drago', name: 'Drago', title: '', nickname: '', colors: { bg: '#15803d', fg: '#dc2626', accent: '#dc2626' }, rivalId: '' },
  { id: 'giraffa', name: 'Giraffa', title: 'Imperiale', nickname: '', colors: { bg: '#dc2626', fg: '#ffffff', accent: '#ffffff' }, rivalId: '' },
  { id: 'istrice', name: 'Istrice', title: 'Sovrana', nickname: '', colors: { bg: '#ffffff', fg: '#1e3a8a', accent: '#1e3a8a' }, rivalId: 'lupa' },
  { id: 'leocorno', name: 'Leocorno', title: '', nickname: '', colors: { bg: '#f97316', fg: '#1e3a8a', accent: '#1e3a8a' }, rivalId: 'civetta' },
  { id: 'lupa', name: 'Lupa', title: '', nickname: '', colors: { bg: '#0c0a09', fg: '#f97316', accent: '#f97316' }, rivalId: 'istrice' },
  { id: 'montone', name: 'Valdimontone', title: '', nickname: '', colors: { bg: '#f9a8d4', fg: '#fde047', accent: '#fde047' }, rivalId: 'nicchio' },
  { id: 'nicchio', name: 'Nicchio', title: 'Nobile', nickname: '', colors: { bg: '#1e3a8a', fg: '#dc2626', accent: '#dc2626' }, rivalId: 'montone' },
  { id: 'oca', name: 'Oca', title: 'Nobile', nickname: '', colors: { bg: '#15803d', fg: '#ffffff', accent: '#ffffff' }, rivalId: 'torre' },
  { id: 'onda', name: 'Onda', title: 'Capitana', nickname: '', colors: { bg: '#38bdf8', fg: '#ffffff', accent: '#ffffff' }, rivalId: 'torre' },
  { id: 'pantera', name: 'Pantera', title: '', nickname: '', colors: { bg: '#dc2626', fg: '#0ea5e9', accent: '#0ea5e9' }, rivalId: 'aquila' },
  { id: 'selva', name: 'Selva', title: '', nickname: '', colors: { bg: '#f97316', fg: '#15803d', accent: '#15803d' }, rivalId: '' },
  { id: 'tartuca', name: 'Tartuca', title: '', nickname: '', colors: { bg: '#1e3a8a', fg: '#fde047', accent: '#fde047' }, rivalId: 'chiocciola' },
  { id: 'torre', name: 'Torre', title: '', nickname: '', colors: { bg: '#7f1d1d', fg: '#ffffff', accent: '#ffffff' }, rivalId: 'oca' },
];

export const CONTRADA_BY_ID: Record<string, Contrada> = Object.fromEntries(
  CONTRADE.map((c) => [c.id, c]),
);

export function contradaDisplayName(c: Contrada): string {
  const article = c.name.startsWith('O') ? 'dell\'' : 'd\'';
  return c.title ? `${c.title} ${article}${c.name}` : `Contrada ${article}${c.name}`;
}

// ===== Alleanze storiche (aggregate) =====
export const ALLIANCES: Record<string, string[]> = {
  aquila: ['civetta', 'giraffa', 'istrice', 'pantera'],
  bruco: ['chiocciola', 'selva'],
  chiocciola: ['bruco', 'civetta', 'pantera', 'selva'],
  civetta: ['aquila', 'chiocciola', 'giraffa', 'pantera'],
  drago: ['giraffa', 'selva'],
  giraffa: ['aquila', 'civetta', 'drago', 'istrice', 'pantera'],
  istrice: ['aquila', 'giraffa', 'lupa'],
  leocorno: ['montone', 'nicchio', 'tartuca'],
  lupa: ['istrice', 'selva'],
  montone: ['leocorno', 'nicchio', 'onda'],
  nicchio: ['leocorno', 'montone', 'tartuca', 'onda'],
  oca: ['aquila', 'civetta', 'lupa', 'selva'],
  onda: ['montone', 'nicchio'],
  pantera: ['aquila', 'chiocciola', 'civetta', 'giraffa', 'selva'],
  selva: ['bruco', 'chiocciola', 'drago', 'lupa', 'oca', 'pantera'],
  tartuca: ['leocorno', 'nicchio'],
  torre: ['bruco', 'chiocciola', 'selva'],
};

// ===== I Fantini (soprannomi reali, statistiche ispirate alle carriere) =====
// Solo fantini attivi/recenti del panorama del Palio.
export const JOCKEYS: Jockey[] = [
  { id: 'j01', nickname: 'Tittia', careerStage: 'esperto', mossa: 9, grinta: 9, avidity: 25000, incorruptibility: 5, wins: 12, overall: 92, killer: 1, fallRate: 13, independence: 10 },
  { id: 'j02', nickname: 'Velluto', careerStage: 'a fine carriera', mossa: 7, grinta: 8, avidity: 22000, incorruptibility: 7, wins: 3, overall: 87, killer: 9, fallRate: 21, independence: 10 },
  { id: 'j03', nickname: 'Gingillo', careerStage: 'esperto', mossa: 8, grinta: 8, avidity: 21000, incorruptibility: 6, wins: 4, overall: 89, killer: 4, fallRate: 8.5, independence: 9 },
  { id: 'j04', nickname: 'Brigante', careerStage: 'esperto', mossa: 8, grinta: 10, avidity: 19000, incorruptibility: 4, wins: 7, overall: 83, killer: 2, fallRate: 21, independence: 2 },
  { id: 'j05', nickname: 'Scompiglio', careerStage: 'a fine carriera', mossa: 8, grinta: 9, avidity: 18000, incorruptibility: 5, wins: 5, overall: 83, killer: 6, fallRate: 7.5, independence: 10 },
  { id: 'j06', nickname: 'Bellocchio', careerStage: 'giovane', mossa: 7, grinta: 8, avidity: 13000, incorruptibility: 5, wins: 3, overall: 80, killer: 5, fallRate: 27.5, independence: 5 },
  { id: 'j07', nickname: 'Carburo', careerStage: 'esperto', mossa: 6, grinta: 8, avidity: 14000, incorruptibility: 6, wins: 1, overall: 79, killer: 10, fallRate: 22, independence: 6 },
  { id: 'j08', nickname: 'Turbine', careerStage: 'giovane', mossa: 6, grinta: 7, avidity: 10000, incorruptibility: 8, wins: 0, overall: 76, killer: 6, fallRate: 18, independence: 3 },
  { id: 'j09', nickname: 'Virgola', careerStage: 'giovane', mossa: 6, grinta: 7, avidity: 10000, incorruptibility: 7, wins: 2, overall: 76, killer: 7, fallRate: 12.5, independence: 3 },
  { id: 'j10', nickname: 'Tremendo', careerStage: 'esperto', mossa: 6, grinta: 7, avidity: 9000, incorruptibility: 9, wins: 0, overall: 76, killer: 5, fallRate: 8.5, independence: 5 },
  { id: 'j11', nickname: 'Amsicora', careerStage: 'esperto', mossa: 5, grinta: 6, avidity: 8000, incorruptibility: 7, wins: 1, overall: 76, killer: 8, fallRate: 19, independence: 5 },
  { id: 'j12', nickname: 'Scangeo', careerStage: 'esperto', mossa: 6, grinta: 8, avidity: 9000, incorruptibility: 5, wins: 2, overall: 76, killer: 6, fallRate: 16.5, independence: 5 },
  { id: 'j13', nickname: 'Grandine', careerStage: 'esperto', mossa: 6, grinta: 7, avidity: 9000, incorruptibility: 7, wins: 1, overall: 77, killer: 7, fallRate: 13.5, independence: 1 },
  { id: 'j14', nickname: 'Nappa II', careerStage: 'esperto', mossa: 5, grinta: 7, avidity: 9000, incorruptibility: 7, wins: 0, overall: 75, killer: 10, fallRate: 33.5, independence: 4 },
  { id: 'j15', nickname: 'Tempesta', careerStage: 'esperto', mossa: 6, grinta: 7, avidity: 7000, incorruptibility: 6, wins: 1, overall: 74, killer: 3, fallRate: 5.5, independence: 5 },
  { id: 'j16', nickname: 'Tamurè', careerStage: 'giovane', mossa: 7, grinta: 7, avidity: 8000, incorruptibility: 7, wins: 2, overall: 75, killer: 8, fallRate: 33.5, independence: 4 },
  { id: 'j17', nickname: 'Shardana', careerStage: 'giovane', mossa: 5, grinta: 7, avidity: 7500, incorruptibility: 7, wins: 1, overall: 73, killer: 4, fallRate: 33.5, independence: 5 },
  { id: 'j18', nickname: 'Lesto', careerStage: 'giovane', mossa: 7, grinta: 7, avidity: 6500, incorruptibility: 6, wins: 1, overall: 75, killer: 4, fallRate: 12.5, independence: 8 },
  { id: 'j19', nickname: 'Ares', careerStage: 'giovane', mossa: 8, grinta: 9, avidity: 7000, incorruptibility: 5, wins: 4, overall: 72, killer: 2, fallRate: 30, independence: 7 },
  { id: 'j20', nickname: 'Bighino', careerStage: 'a fine carriera', mossa: 5, grinta: 7, avidity: 6000, incorruptibility: 6, wins: 2, overall: 71, killer: 8, fallRate: 9, independence: 5 },
  { id: 'j21', nickname: 'Tambani', careerStage: 'giovane', mossa: 6, grinta: 7, avidity: 6500, incorruptibility: 8, wins: 0, overall: 70, killer: 4, fallRate: 22.5, independence: 4 },
  { id: 'j22', nickname: 'Granito', careerStage: 'giovane', mossa: 5, grinta: 7, avidity: 6000, incorruptibility: 7, wins: 1, overall: 69, killer: 5, fallRate: 12.5, independence: 7 },
  { id: 'j23', nickname: 'Spago', careerStage: 'giovane', mossa: 5, grinta: 6, avidity: 6000, incorruptibility: 8, wins: 0, overall: 71, killer: 4, fallRate: 22.5, independence: 4 },
  { id: 'j24', nickname: 'Fastidio', careerStage: 'giovane', mossa: 6, grinta: 8, avidity: 6000, incorruptibility: 4, wins: 2, overall: 72, killer: 2, fallRate: 25, independence: 6 },
  { id: 'j25', nickname: 'Veleno II', careerStage: 'a fine carriera', mossa: 5, grinta: 6, avidity: 8000, incorruptibility: 8, wins: 0, overall: 66, killer: 10, fallRate: 21.5, independence: 5 },
  { id: 'j26', nickname: 'Girolamo', careerStage: 'a fine carriera', mossa: 6, grinta: 6, avidity: 7000, incorruptibility: 6, wins: 1, overall: 71, killer: 4, fallRate: 12.5, independence: 5 },
  { id: 'j27', nickname: 'Voglia', careerStage: 'a fine carriera', mossa: 6, grinta: 7, avidity: 7500, incorruptibility: 6, wins: 2, overall: 73, killer: 6, fallRate: 15, independence: 5 },
  { id: 'j28', nickname: 'Filuferru', careerStage: 'a fine carriera', mossa: 5, grinta: 6, avidity: 5500, incorruptibility: 7, wins: 0, overall: 66, killer: 7, fallRate: 10, independence: 5 },
  { id: 'j29', nickname: 'Strappo', careerStage: 'a fine carriera', mossa: 5, grinta: 6, avidity: 6000, incorruptibility: 6, wins: 0, overall: 67, killer: 7, fallRate: 12, independence: 5 },
  { id: 'j30', nickname: 'Smarrancio', careerStage: 'a fine carriera', mossa: 5, grinta: 5, avidity: 6000, incorruptibility: 7, wins: 0, overall: 66, killer: 5, fallRate: 8, independence: 5 },
  { id: 'j31', nickname: 'Tiburzi', careerStage: 'a fine carriera', mossa: 5, grinta: 6, avidity: 6000, incorruptibility: 7, wins: 0, overall: 66, killer: 6, fallRate: 8, independence: 5 },
  { id: 'j32', nickname: 'Salasso', careerStage: 'a fine carriera', mossa: 5, grinta: 6, avidity: 6000, incorruptibility: 6, wins: 1, overall: 70, killer: 4, fallRate: 13, independence: 5 },
  { id: 'j33', nickname: 'Vittorio', careerStage: 'a fine carriera', mossa: 4, grinta: 5, avidity: 5500, incorruptibility: 7, wins: 0, overall: 65, killer: 3, fallRate: 15, independence: 5 },
  { id: 'j34', nickname: 'Dè', careerStage: 'a fine carriera', mossa: 5, grinta: 6, avidity: 6500, incorruptibility: 6, wins: 0, overall: 68, killer: 4, fallRate: 12.5, independence: 5 },
];

export const JOCKEY_BY_ID: Record<string, Jockey> = Object.fromEntries(
  JOCKEYS.map((j) => [j.id, j]),
);

// ===== Fantini d'ufficio =====
// Se una contrada non ingaggia un fantino, le viene assegnato d'ufficio un fantino
// randomizzato tra quelli con overall ≤ 76, senza veto per quella contrada.
// Costo: €2.000 per il giocatore.
export const OFFICE_JOCKEY_FEE = 2000;

// ===== Cavalli (sorteggiati ogni Palio) =====
export const HORSES = [
  { name: 'Diodoro', strength: 10, overall: 90 },
  { name: 'Anda e Bola', strength: 9, overall: 89 },
  { name: 'Benitos', strength: 9, overall: 87 },
  { name: 'Tale e Quale', strength: 8, overall: 83 },
  { name: 'Viso d\'Angelo', strength: 8, overall: 82 },
  { name: 'Zio Frac', strength: 6, overall: 85 },
  { name: 'Comancio', strength: 6, overall: 84 },
  { name: 'Tabacco', strength: 7, overall: 84 },
  { name: 'Ares Elce', strength: 8, overall: 83 },
  { name: 'Veranu', strength: 7, overall: 80 },
  { name: 'Diamante Grigio', strength: 8, overall: 77 },
  { name: 'Ungaros', strength: 6, overall: 78 },
  { name: 'Arestetulesu', strength: 5, overall: 78 },
  { name: 'Diosu de Campeda', strength: 7, overall: 80 },
  { name: 'Zenis', strength: 8, overall: 75 },
  { name: 'Entu de Pedra Ulpu', strength: 6, overall: 72 },
  { name: 'Donrodrigo', strength: 9, overall: 80 },
  { name: 'Eberardo', strength: 7, overall: 72 },
  { name: 'Dorotea Dimmonia', strength: 7, overall: 71 },
  { name: 'Canarinu', strength: 6, overall: 83 },
  { name: 'Volpino', strength: 6, overall: 73 },
  { name: 'Brivido Sardo', strength: 5, overall: 69 },
  { name: 'Zentiles', strength: 7, overall: 68 },
  { name: 'Criptha', strength: 7, overall: 71 },
  { name: 'Ardeglina', strength: 6, overall: 69 },
  { name: 'Vitzichesu', strength: 7, overall: 71 },
  { name: 'Antine Day', strength: 7, overall: 69 },
  { name: 'Schietta', strength: 9, overall: 80 },
  { name: 'Reo Confesso', strength: 7, overall: 69 },
  { name: 'Abbasantesa', strength: 10, overall: 82 },
  { name: 'Remorex', strength: 10, overall: 83 },
  { name: 'Vankook', strength: 6, overall: 72 },
  { name: 'Uragano Rosso', strength: 8, overall: 77 },
  { name: 'Euskaldi', strength: 6, overall: 76 },
  { name: 'Diamante Sauro', strength: 6, overall: 75 },
];

// ===== Fantini fedeli per contrada (geopolitica fantino-contrada) =====
// I tre fantini più fedeli in ordine decrescente di rapporto con la contrada.
export const CONTRADA_JOCKEY_AFFINITY: Record<string, string[]> = {
  aquila: ['j04', 'j01', 'j12'],      // Brigante, Tittia, Scangeo
  bruco: ['j21', 'j04', 'j05'],       // Tambani, Brigante, Scompiglio
  chiocciola: ['j05', 'j03', 'j07'],  // Scompiglio, Gingillo, Carburo
  civetta: ['j07', 'j03', 'j20'],     // Carburo, Gingillo, Bighino
  drago: ['j24', 'j23', 'j01'],       // Fastidio, Spago, Tittia
  giraffa: ['j16', 'j22', 'j05'],     // Tamurè, Granito, Scompiglio
  istrice: ['j04', 'j08', 'j19'],     // Brigante, Turbine, Ares
  leocorno: ['j04', 'j13', 'j09'],    // Brigante, Grandine, Virgola
  lupa: ['j02', 'j03', 'j05'],        // Velluto, Gingillo, Scompiglio
  nicchio: ['j13', 'j16', 'j01'],     // Grandine, Tamurè, Tittia
  oca: ['j01', 'j04', 'j13'],         // Tittia, Brigante, Grandine
  onda: ['j04', 'j01', 'j13'],        // Brigante, Tittia, Grandine
  pantera: ['j05', 'j02', 'j07'],     // Scompiglio, Velluto, Carburo
  selva: ['j09', 'j01', 'j15'],       // Virgola, Tittia, Tempesta
  tartuca: ['j15', 'j19', 'j01'],     // Tempesta, Ares, Tittia
  torre: ['j07', 'j05', 'j03'],       // Carburo, Scompiglio, Gingillo
  montone: ['j05', 'j18', 'j03'],     // Scompiglio, Lesto, Gingillo
};

// Valori di affinità per i tre fantini fedeli (1°, 2°, 3°)
export const AFFINITY_VALUES = [80, 55, 35];

// ===== Veti fissi tra contrade e fantini =====
export const FIXED_VETOS: Record<string, string[]> = {
  aquila: ['Scompiglio', 'Velluto', 'Carburo'],
  bruco: [],
  chiocciola: ['Tittia', 'Brigante', 'Grandine'],
  civetta: ['Tittia', 'Brigante', 'Grandine'],
  drago: [],
  giraffa: [],
  istrice: ['Velluto', 'Scompiglio', 'Gingillo', 'Carburo'],
  leocorno: ['Carburo', 'Velluto'],
  lupa: ['Tittia', 'Brigante', 'Grandine'],
  nicchio: ['Scompiglio', 'Velluto', 'Gingillo', 'Carburo'],
  oca: ['Scompiglio', 'Velluto', 'Carburo'],
  onda: ['Carburo'],
  pantera: ['Tittia', 'Brigante', 'Grandine'],
  selva: [],
  tartuca: ['Scompiglio', 'Velluto', 'Gingillo', 'Carburo'],
  torre: ['Tittia', 'Brigante', 'Grandine'],
  montone: ['Tittia', 'Grandine'],
};

export const RELATION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  veto: { label: 'Veto', color: 'text-red-300', bg: 'bg-red-900/50 border-red-700' },
  rival: { label: 'Tesa', color: 'text-orange-300', bg: 'bg-orange-900/30 border-orange-700/50' },
  neutral: { label: 'Neutra', color: 'text-slate-300', bg: 'bg-slate-800/50 border-slate-600' },
  sympathy: { label: 'Simpatia', color: 'text-sky-300', bg: 'bg-sky-900/30 border-sky-700/50' },
  ally: { label: 'Alleata', color: 'text-emerald-300', bg: 'bg-emerald-900/30 border-emerald-700/50' },
};

export function relationLevel(v: number): 'veto' | 'rival' | 'neutral' | 'sympathy' | 'ally' {
  if (v <= -100) return 'veto';
  if (v < 0) return 'rival';
  if (v === 0) return 'neutral';
  if (v <= 50) return 'sympathy';
  return 'ally';
}
