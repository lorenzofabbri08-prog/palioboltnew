import type { GameState } from '@/game/types';
import { CONTRADA_BY_ID } from '@/game/data';
import { StatBar, SectionTitle, euro } from './ui';
import { ContradaFlag } from './ContradaFlag';
import {
  Wallet,
  Heart,
  Shield,
  TrendingUp,
  Newspaper,
  ArrowRight,
  Swords,
  AlertTriangle,
  WifiOff,
  Handshake,
  Coins,
} from 'lucide-react';
import type { useGame } from '@/game/useGame';

const PHASE_LABELS: Record<string, string> = {
  estrazione: 'Estrazione',
  cavalli: 'Sorteggio Cavalli',
  tratta: 'Tratta Fantini',
  provafinale: 'Fine Tratta',
  prova1: 'Prima Prova',
  prova2: 'Seconda Prova',
  prova3: 'Terza Prova',
  prova4: 'Quarta Prova',
  provagenerale: 'Prova Generale',
  messadelfantino: 'Messa del Fantino',
  provaccia: 'Provaccia',
  palio: 'Il Palio',
};

const PHASE_ORDER = [
  'estrazione', 'cavalli', 'tratta', 'provafinale',
  'prova1', 'prova2', 'prova3', 'prova4', 'provagenerale',
  'messadelfantino', 'provaccia', 'palio',
];

const SHORT_LABELS: Record<string, string> = {
  estrazione: 'Estraz.',
  cavalli: 'Cavalli',
  tratta: 'Tratta',
  provafinale: 'Fine',
  prova1: '1ª Prova',
  prova2: '2ª Prova',
  prova3: '3ª Prova',
  prova4: '4ª Prova',
  provagenerale: 'Gen.',
  messadelfantino: 'Messa',
  provaccia: 'Provaccia',
  palio: 'Palio',
};

export function TabUfficio({ state, game, onGoToCorsa }: { state: GameState; game: ReturnType<typeof useGame>; onGoToCorsa?: () => void }) {
  const c = CONTRADA_BY_ID[state.playerContradaId];
  const rival = c.rivalId ? CONTRADA_BY_ID[c.rivalId] : null;
  const phaseIdx = PHASE_ORDER.indexOf(state.phase);

  const lastWinYear = (contradaId: string): number | null => {
    for (let i = state.history.length - 1; i >= 0; i--) {
      if (state.history[i].winnerContradaId === contradaId) return state.history[i].year;
    }
    return null;
  };
  const playerDrought = (() => {
    const y = lastWinYear(c.id);
    return y === null ? null : state.year - y;
  })();
  const rivalDrought = rival ? (() => {
    const y = lastWinYear(rival.id);
    return y === null ? null : state.year - y;
  })() : null;

  const isProvaPhase = ['prova1', 'prova2', 'prova3', 'prova4', 'provagenerale', 'provaccia'].includes(state.phase);

  return (
    <div className="space-y-6">
      {/* Contrada banner */}
      <div
        className="relative overflow-hidden rounded-2xl border border-amber-800/30 p-6"
        style={{ backgroundColor: c.colors.bg, color: c.colors.fg }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <ContradaFlag contradaId={c.id} size={48} />
            <div>
              <div className="text-xs uppercase tracking-widest opacity-70">Ufficio del Capitano</div>
              <h2 className="font-serif text-3xl font-black">{c.title ? `${c.title} ` : ''}{c.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-black/30 px-4 py-2">
            {rival ? (
              <>
                <ContradaFlag contradaId={rival.id} size={28} />
                <div>
                  <div className="text-[10px] uppercase opacity-70">Rivale Storica</div>
                  <div className="font-serif text-lg font-bold">{rival.name}</div>
                </div>
                <Swords size={18} className="text-red-300" />
              </>
            ) : (
              <div>
                <div className="text-[10px] uppercase opacity-70">Rivale Storica</div>
                <div className="font-serif text-lg font-bold opacity-50">Nessuna</div>
              </div>
            )}
          </div>
        </div>

        {/* Drought boxes: years since last win for player & rival contrade */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2">
            <ContradaFlag contradaId={c.id} size={22} />
            <div className="leading-tight">
              <div className="text-[9px] uppercase opacity-60">La tua Contrada</div>
              <div className="font-serif text-sm font-bold">
                {playerDrought === null ? 'Mai vinto' : `${playerDrought} ${playerDrought === 1 ? 'anno' : 'anni'} senza vincere`}
              </div>
            </div>
          </div>
          {rival && (
            <div className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2">
              <ContradaFlag contradaId={rival.id} size={22} />
              <div className="leading-tight">
                <div className="text-[9px] uppercase opacity-60">Rivale</div>
                <div className="font-serif text-sm font-bold">
                  {rivalDrought === null ? 'Mai vinto' : `${rivalDrought} ${rivalDrought === 1 ? 'anno' : 'anni'} senza vincere`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Wallet />} label="Budget" value={euro(state.budget)} sub={state.purgaActive ? `Purga -35% (${state.purgaRemaining})` : undefined} warn={state.purgaActive} />
        <StatCard icon={<Heart />} label="Morale del Popolo" value={`${state.morale}%`} bar={<StatBar value={state.morale} color={state.morale < 30 ? 'bg-red-500' : 'bg-amber-500'} />} />
        <StatCard icon={<Shield />} label="Credibilità" value={`${state.credibility}%`} bar={<StatBar value={state.credibility} color={state.credibility < 30 ? 'bg-red-500' : 'bg-emerald-500'} />} warn={state.credibility <= 0} />
        <StatCard icon={<TrendingUp />} label="Palio" value={state.palioIndex === 0 ? 'Luglio' : 'Agosto'} sub={`${state.year} · Turno ${state.turn}`} />
      </div>

      {/* Protettori: chiedi finanziamento extra (ogni 15 Palii) */}
      <div className={`rounded-2xl border p-5 ${state.protectorsCooldown > 0 ? 'border-stone-800 bg-stone-900/30' : 'border-amber-700/40 bg-amber-950/10'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Coins className={state.protectorsCooldown > 0 ? 'text-stone-600' : 'text-amber-400'} size={22} />
            <div>
              <h3 className="font-serif text-sm font-bold text-amber-200">I Protettori della Contrada</h3>
              <p className="text-xs text-stone-400">
                {state.protectorsCooldown > 0
                  ? `Hai già chiesto aiuto. Prossima richiesta tra ${state.protectorsCooldown} ${state.protectorsCooldown === 1 ? 'Palio' : 'Palii'}.`
                  : 'Puoi chiedere un finanziamento extra di €25.000. Credibilità -30%: le contrade si fideranno meno di te.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => game.doAskProtectors()}
            disabled={state.protectorsCooldown > 0}
            className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 font-serif text-xs font-bold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-500"
          >
            {state.protectorsCooldown > 0 ? 'Non disponibile' : 'Chiedi €25.000'}
          </button>
        </div>
        {state.protectorsCooldown === 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-red-300/80">
            <AlertTriangle size={12} />
            Attenzione: la credibilità della contrada crolla drasticamente. Meno accordi dell'ultimo minuto disponibili.
          </p>
        )}
      </div>

      {/* Phase progress */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5">
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle icon={<ArrowRight className="text-amber-400" />}>Fase Attuale</SectionTitle>
          <span className="font-serif text-amber-200">{PHASE_LABELS[state.phase]}</span>
        </div>
        <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-1">
          {PHASE_ORDER.map((p, i) => (
            <div key={p} className="flex-1 min-w-[40px]">
              <div
                className={`h-2 rounded-full transition-all ${
                  i < phaseIdx ? 'bg-amber-500' : i === phaseIdx ? 'bg-amber-400' : 'bg-stone-700'
                }`}
              />
              <div className={`mt-1 text-center text-[8px] sm:text-[10px] ${i === phaseIdx ? 'text-amber-300 font-bold' : 'text-stone-500'}`}>
                {SHORT_LABELS[p]}
              </div>
            </div>
          ))}
        </div>

        {/* Pending scare: must confirm or replace before advancing */}
        {state.pendingScare && (
          <div className="mb-3 rounded-xl border border-orange-700/50 bg-orange-950/30 p-4">
            <div className="flex items-center gap-2 text-orange-300">
              <AlertTriangle size={18} />
              <span className="font-serif font-bold">Il tuo fantino è caduto! Decidi ora:</span>
            </div>
            <p className="mt-1 text-xs text-stone-300">
              Confermi il fantino nonostante la caduta (forma ridotta) o lo liberi per ingaggiarne un altro?
              <strong className="text-orange-300"> Devi decidere prima di avanzare.</strong>
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => game.doConfirmScare(true)}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600"
              >
                Conferma Fantino
              </button>
              <button
                onClick={() => game.doConfirmScare(false)}
                className="rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-600"
              >
                Libera e Sostituisci
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            if (state.phase === 'palio') {
              onGoToCorsa?.();
            } else {
              game.doAdvancePhase();
            }
          }}
          disabled={!!state.pendingScare}
          className="w-full rounded-xl bg-amber-500 py-3 font-serif font-bold text-stone-950 transition hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state.pendingScare ? 'Decidi prima sulla caduta' : state.phase === 'palio' ? 'Vai alla Corsa →' : 'Avanza alla fase successiva →'}
        </button>
        {state.phase === 'tratta' && (
          <p className="mt-2 text-center text-xs text-stone-500">
            Ingaggia il tuo fantino nel Mercato prima di avanzare alle Prove.
          </p>
        )}
        {state.phase === 'estrazione' && (
          <p className="mt-2 text-center text-xs text-stone-500">
            Avanza per sorteggiare le 10 contrade che correranno questo Palio.
          </p>
        )}
        {state.phase === 'cavalli' && (
          <p className="mt-2 text-center text-xs text-stone-500">
            Avanza per il sorteggio dei cavalli (tratta dei barberi).
          </p>
        )}
        {isProvaPhase && (
          <p className="mt-2 text-center text-xs text-stone-500">
            Vai al tab <strong className="text-amber-300">La Corsa</strong> per vedere ordine al canape e imprevisti delle prove.
          </p>
        )}
        {state.phase === 'messadelfantino' && (
          <p className="mt-2 text-center text-xs text-amber-300">
            <strong>Messa del Fantino:</strong> da questo momento non puoi più cambiare fantino. Se si infortuna alla provaccia, la contrada non correrà.
          </p>
        )}
      </div>

      {/* News feed — PALIO NEWS newspaper */}
      <div className="overflow-hidden rounded-2xl border-2 border-stone-300 bg-stone-100 shadow-xl">
        {/* Masthead */}
        <div className="border-b-4 border-double border-stone-800 bg-stone-100 px-6 pt-5 pb-4 text-center">
          <div className="mb-1 flex items-center justify-center gap-2 text-stone-500">
            <div className="h-px flex-1 bg-stone-400" />
            <Newspaper size={20} className="text-stone-700" />
            <div className="h-px flex-1 bg-stone-400" />
          </div>
          <h2 className="font-serif text-5xl font-black tracking-tight text-stone-900" style={{ letterSpacing: '-0.02em' }}>
            PALIO NEWS
          </h2>
          <div className="mt-2 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em] text-stone-600">
            <span>Edizione Straordinaria</span>
            <span className="text-stone-400">·</span>
            <span>{state.year}</span>
            <span className="text-stone-400">·</span>
            <span>{state.palioIndex === 0 ? 'Palio di Luglio' : 'Palio di Agosto'}</span>
            <span className="text-stone-400">·</span>
            <span>Turno {state.turn}</span>
          </div>
        </div>

        {/* Sub-headline bar */}
        <div className="flex items-stretch border-b-2 border-stone-800 bg-stone-200 text-stone-800">
          <div className="flex-1 border-r border-stone-400 px-4 py-1.5 text-center text-[10px] uppercase tracking-widest">
            Notizie & Indiscrezioni di Piazza
          </div>
          <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest">N° {state.turn}</div>
        </div>

        {/* Articles */}
        <div className="bg-stone-100 px-5 py-4">
          {state.news.length === 0 ? (
            <p className="py-8 text-center font-serif text-lg italic text-stone-500">
              Nessuna notizia. La piazza tace… per ora.
            </p>
          ) : (
            <div className="divide-y divide-stone-300">
              {state.news.slice(0, 25).map((n, i) => {
                const isLead = i === 0;
                const toneMark: Record<string, string> = {
                  info: '◆',
                  rumor: '◇',
                  good: '★',
                  bad: '✦',
                  epic: '✪',
                };
                return (
                  <div
                    key={n.id}
                    className={`py-2.5 ${isLead ? 'pb-3' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-xs text-stone-400">
                        {toneMark[n.tone] || '◆'}
                      </span>
                      <p
                        className={`font-serif leading-snug text-stone-900 ${
                          isLead ? 'text-base font-bold' : 'text-sm'
                        }`}
                      >
                        {n.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-400 bg-stone-200 px-5 py-2 text-center text-[10px] uppercase tracking-widest text-stone-500">
          Stampato in Piazza del Campo · {state.palioIndex === 0 ? 'Luglio' : 'Agosto'} {state.year}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-emerald-800/30 bg-emerald-950/10 p-3 text-xs text-emerald-300/80">
        <WifiOff size={14} /> Partita salvata in locale. Puoi chiudere e riaprire quando vuoi: la carriera continua offline.
      </div>

      {state.scudisciato && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-700 bg-red-950/40 p-4">
          <AlertTriangle className="text-red-400" />
          <p className="text-sm text-red-200">
            <strong>PURGA in corso.</strong> La tua rivale ha vinto l'ultimo Palio. Morale al minimo, budget ridotto del 35% per {state.purgaRemaining} Palii.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  bar,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  bar?: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${warn ? 'border-red-700/50 bg-red-950/20' : 'border-stone-800 bg-stone-900/50'}`}>
      <div className="flex items-center gap-2 text-stone-400">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 font-serif text-2xl font-bold text-amber-100">{value}</div>
      {bar && <div className="mt-2">{bar}</div>}
      {sub && <div className={`mt-1 text-xs ${warn ? 'text-red-300' : 'text-stone-500'}`}>{sub}</div>}
    </div>
  );
}
