import { useState } from 'react';
import type { GameState, PendingDeal } from '@/game/types';
import { CONTRADA_BY_ID, JOCKEY_BY_ID, CONTRADE } from '@/game/data';
import { SectionTitle, Modal, euro } from './ui';
import { ContradaFlag } from './ContradaFlag';
import { RaceTrack } from './RaceTrack';
import type { useGame } from '@/game/useGame';
import {
  Flag,
  Play,
  Trophy,
  Skull,
  Shield,
  Ban,
  RotateCcw,
  ScrollText,
  PartyPopper,
  Sparkles,
  Zap,
  Handshake,
  Coins,
  Swords,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

export function TabCorsa({ state, game }: { state: GameState; game: ReturnType<typeof useGame> }) {
  const [racing, setRacing] = useState(false);
  const [showLastMinute, setShowLastMinute] = useState(false);

  const entries = state.raceEntries;
  const provaPhaseIds = ['prova1', 'prova2', 'prova3', 'prova4', 'provagenerale', 'provaccia'];
  const isProvaPhase = provaPhaseIds.includes(state.phase);
  const provaTitles: Record<string, string> = {
    prova1: 'Prima Prova',
    prova2: 'Seconda Prova',
    prova3: 'Terza Prova',
    prova4: 'Quarta Prova',
    provagenerale: 'Prova Generale',
    provaccia: 'Provaccia',
  };
  const provaTitle = provaTitles[state.phase] || '';
  const result = state.raceResult;
  const player = state.playerContradaId;
  const rivalId = CONTRADA_BY_ID[player].rivalId;

  const startRace = () => {
    game.doSimulate();
    setRacing(true);
  };

  const handleTrackDone = () => {
    setRacing(false);
  };

  const canRace = state.phase === 'palio' && entries.length > 0 && !result && !racing;
  const pendingOffers = state.incomingOffers.filter((o) => !o.accepted && !o.rejected);

  return (
    <div className="space-y-6">
      <SectionTitle icon={<Flag className="text-amber-400" />}>La Mossa e la Corsa</SectionTitle>

      {/* Estrazione */}
      {state.phase === 'estrazione' && (
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-6 text-center text-sm text-stone-400">
          Fase di Estrazione. Avanza dall'Ufficio del Capitano per sorteggiare le 10 contrade che correranno.
        </div>
      )}

      {/* Cavalli */}
      {state.phase === 'cavalli' && (
        <div className="rounded-2xl border border-amber-800/30 bg-stone-900/50 p-5">
          <h3 className="mb-3 font-serif text-lg font-bold text-amber-100">Sorteggio dei Barberi</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {state.raceEntries.map((e) => (
              <div key={e.contradaId} className={`flex items-center gap-3 rounded-lg border p-2 ${e.contradaId === player ? 'border-amber-500/50 bg-amber-950/20' : 'border-stone-700'}`}>
                <ContradaFlag contradaId={e.contradaId} size={28} />
                <div className="flex-1">
                  <div className="font-serif text-sm font-bold text-amber-100">{CONTRADA_BY_ID[e.contradaId].name}</div>
                  <div className="text-xs text-stone-400">{e.horse.name} · Overall <span className="font-bold text-amber-300/90 text-sm">{e.horse.overall}</span></div>
                </div>
                <div className="flex gap-px">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className={`h-3 w-1 rounded-full ${(i + 1) * 5 <= e.horse.overall ? 'bg-amber-400' : 'bg-stone-700'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-500">Avanza per la tratta dei fantini.</p>
        </div>
      )}

      {/* Tratta */}
      {state.phase === 'tratta' && (
        <div className="rounded-2xl border border-amber-800/30 bg-stone-900/50 p-5">
          <h3 className="mb-3 font-serif text-lg font-bold text-amber-100">Tratta dei Fantini</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {state.raceEntries.map((e) => (
              <div key={e.contradaId} className={`flex items-center gap-3 rounded-lg border p-2 ${e.contradaId === player ? 'border-amber-500/50 bg-amber-950/20' : 'border-stone-700'}`}>
                <ContradaFlag contradaId={e.contradaId} size={28} />
                <div className="flex-1">
                  <div className="font-serif text-sm font-bold text-amber-100">{CONTRADA_BY_ID[e.contradaId].name}</div>
                  <div className="text-xs text-stone-400">
                    {e.horse.name} <span className="font-bold text-amber-300/90 text-sm">{e.horse.overall}</span>
                    {e.jockeyId ? <> · {JOCKEY_BY_ID[e.jockeyId].nickname} <span className="font-bold text-amber-300/90 text-sm">{JOCKEY_BY_ID[e.jockeyId].overall}</span></> : ' · fantino da ingaggiare'}
                  </div>
                </div>
                {e.contradaId === player && !e.jockeyId && <span className="text-xs font-bold text-amber-300">INGAGGIA!</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Six prove phases */}
      {isProvaPhase && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-800/30 bg-stone-900/50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-amber-100">{provaTitle}</h3>
              <span className="text-xs text-stone-400">Ordine al canape sorteggiato a caso</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[...entries].sort((a, b) => (state.provaCanape[a.contradaId] ?? 99) - (state.provaCanape[b.contradaId] ?? 99)).map((e) => {
                const jName = e.jockeyId ? JOCKEY_BY_ID[e.jockeyId]?.nickname : '—';
                const isInjured = e.jockeyId && state.jockeyInjured[e.jockeyId];
                const formPenalty = e.jockeyId ? (state.jockeyFormPenalty[e.jockeyId] || 0) : 0;
                return (
                  <div
                    key={e.contradaId}
                    className={`flex items-center gap-3 rounded-lg border p-2 ${
                      e.contradaId === player ? 'border-amber-500/50 bg-amber-950/20' : isInjured ? 'border-red-700/50 bg-red-950/20' : 'border-stone-700'
                    }`}
                  >
                    <div className="w-8 text-center font-serif text-lg font-black text-amber-300">
                      {(state.provaCanape[e.contradaId] ?? 0) + 1}
                    </div>
                    <ContradaFlag contradaId={e.contradaId} size={28} />
                    <div className="flex-1">
                      <div className="font-serif text-sm font-bold text-amber-100">{CONTRADA_BY_ID[e.contradaId].name}</div>
                      <div className="text-xs text-stone-400">
                        {jName} · {e.horse.name}
                        {isInjured && <span className="ml-1 text-red-400 font-bold">· INFORTUNIO</span>}
                        {formPenalty > 0 && <span className="ml-1 text-orange-400">· forma -{formPenalty}</span>}
                      </div>
                    </div>
                    {e.contradaId === player && <span className="text-xs font-bold text-amber-300">TU</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prova winner + events */}
          {state.provaEvents.length > 0 && (() => {
            const winnerEv = state.provaEvents.find((e) => e.includes('vince '));
            const otherEv = state.provaEvents.filter((e) => !e.includes('vince '));
            return (
              <>
                {winnerEv && (
                  <div className="rounded-2xl border border-amber-600/50 bg-amber-950/30 p-4">
                    <h4 className="flex items-center gap-2 font-serif text-base font-bold text-amber-200">
                      <Trophy size={16} className="text-amber-400" /> {winnerEv}
                    </h4>
                  </div>
                )}
                {otherEv.length > 0 && (
                  <div className="rounded-2xl border border-orange-800/30 bg-orange-950/10 p-4">
                    <h4 className="mb-2 flex items-center gap-2 font-serif text-sm font-bold text-orange-200">
                      <AlertTriangle size={14} className="text-orange-400" /> Imprevisti della {provaTitle}
                    </h4>
                    <div className="space-y-1.5">
                      {otherEv.map((ev, i) => (
                        <div key={i} className="border-l-2 border-orange-700/50 pl-2 text-xs text-stone-300">{ev}</div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Scratched contrade warning */}
          {state.scratchedContrade.length > 0 && (
            <div className="rounded-xl border border-red-700 bg-red-950/30 p-4 text-sm text-red-200">
              <strong>Palio in {entries.length}:</strong> {state.scratchedContrade.map((id) => CONTRADA_BY_ID[id].name).join(', ')} non può correre per infortunio alla provaccia.
            </div>
          )}

          <p className="text-center text-xs text-stone-500">
            Avanza le fasi dall'Ufficio del Capitano. Alla <strong>Messa del Fantino</strong> i monti saranno definitivi.
          </p>
        </div>
      )}

      {/* Messa del Fantino */}
      {state.phase === 'messadelfantino' && (
        <div className="rounded-2xl border border-amber-700/40 bg-amber-950/20 p-6 text-center">
          <h3 className="font-serif text-xl font-bold text-amber-200">Messa del Fantino</h3>
          <p className="mt-2 text-sm text-stone-300">
            I fantini sono "messi" (confermati). Da questo momento <strong className="text-amber-300">non puoi più cambiare monta</strong>.
            Se il tuo fantino si infortuna alla provaccia o alla mossa, la contrada non correrà e il Palio si disputerà in 9.
          </p>
        </div>
      )}

      {/* Palio: pre-race */}
      {state.phase === 'palio' && !result && !racing && (
        <>
          {/* Incoming offers */}
          {pendingOffers.length > 0 && (
            <div className="rounded-2xl border border-sky-700/40 bg-sky-950/20 p-5">
              <h3 className="mb-3 flex items-center gap-2 font-serif text-lg font-bold text-sky-200">
                <Zap className="text-sky-400" /> Offerte Ricevute
              </h3>
              <p className="mb-3 text-xs text-stone-400">Altre contrade ti cercano. Accetta per guadagnare, o rifiuta per lealtà.</p>
              <div className="space-y-2">
                {pendingOffers.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-lg border border-sky-800/40 bg-sky-950/30 p-3">
                    <ContradaFlag contradaId={o.fromContradaId} size={28} />
                    <div className="flex-1">
                      <div className="font-serif text-sm font-bold text-sky-100">{CONTRADA_BY_ID[o.fromContradaId].name}</div>
                      <div className="text-xs text-stone-300">
                        {o.type === 'compra_ostacolo' && `Vuole che tu ostacoli ${o.targetContradaId ? CONTRADA_BY_ID[o.targetContradaId].name : ''}`}
                        {o.type === 'compra_neutralita' && 'Vuole comprare la tua neutralità'}
                        {o.type === 'compra_aiuto' && 'Vuole il tuo aiuto in pista'}
                        {o.type === 'compra_mossa' && `Vuole che tu dia la mossa a favore di ${o.targetContradaId ? CONTRADA_BY_ID[o.targetContradaId].name : ''}`}
                      </div>
                    </div>
                    <span className="font-bold text-emerald-300">+{euro(o.askingPrice)}</span>
                    <button onClick={() => game.doAcceptOffer(o.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">Accetta</button>
                    <button onClick={() => game.doRejectOffer(o.id)} className="rounded-lg bg-stone-700 px-3 py-1.5 text-xs font-bold text-stone-200 hover:bg-stone-600">Rifiuta</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canapi order */}
          <div className="rounded-2xl border border-amber-800/30 bg-stone-900/50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-amber-100">Ordine ai Canapi</h3>
              <button
                onClick={() => setShowLastMinute(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-700/50 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/40"
              >
                <Zap size={14} /> Accordi dell'ultimo minuto
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {entries.map((e) => (
                <div key={e.contradaId} className={`flex items-center gap-3 rounded-lg border p-2 ${e.contradaId === player ? 'border-amber-500/50 bg-amber-950/20' : 'border-stone-700'}`}>
                  <div className="w-8 text-center font-serif text-lg font-black text-amber-300">
                    {e.canape === 0 ? 'R' : e.canape}
                  </div>
                  <ContradaFlag contradaId={e.contradaId} size={28} />
                  <div className="flex-1">
                    <div className="font-serif text-sm font-bold text-amber-100">{CONTRADA_BY_ID[e.contradaId].name}</div>
                    <div className="text-xs text-stone-400">{JOCKEY_BY_ID[e.jockeyId]?.nickname} <span className="font-bold text-amber-300/90 text-sm">{JOCKEY_BY_ID[e.jockeyId]?.overall}</span> · {e.horse.name} <span className="font-bold text-amber-300/90 text-sm">{e.horse.overall}</span></div>
                  </div>
                  {e.guarded && <Shield size={14} className="text-sky-400" />}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-500">R = Rincorsa (penalità alla mossa). Gli accordi dell'ultimo minuto costano il doppio e sono meno affidabili.</p>
          </div>

          {/* Killer action: pay a killer jockey to obstruct the rival */}
          <KillerActionPanel state={state} game={game} />

          <button
            onClick={startRace}
            disabled={!canRace}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 py-4 font-serif text-xl font-black text-white shadow-lg shadow-red-900/30 transition hover:bg-red-600 disabled:opacity-40"
          >
            <Play size={22} /> DÀ LA MOSSA!
          </button>
        </>
      )}

      {/* Race track animation */}
      {racing && (
        <RaceTrack state={state} onDone={handleTrackDone} />
      )}

      {/* Race log + results */}
      {result && !racing && (
        <>
          <div className="rounded-2xl border border-stone-800 bg-stone-950 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-serif text-lg font-bold text-amber-100">
              <ScrollText className="text-amber-400" /> Cronaca della Corsa
            </h3>
            <div className="h-64 space-y-1 overflow-y-auto pr-2 text-sm">
              {state.raceLog.map((line, i) => (
                <div
                  key={i}
                  className={`border-l-2 pl-2 ${
                    line.startsWith('---') ? 'border-amber-500 font-bold text-amber-300' : 'border-stone-700 text-stone-300'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-700/40 bg-stone-900/50 p-5">
              <h3 className="mb-3 font-serif text-lg font-bold text-amber-100">Classifica Finale</h3>
              <div className="space-y-1.5">
                {[...result].sort((a, b) => a.finished - b.finished).map((e, i) => {
                  const c = CONTRADA_BY_ID[e.contradaId];
                  const isPlayer = e.contradaId === player;
                  const isRival = e.contradaId === rivalId;
                  const isWinner = i === 0;
                  return (
                    <div
                      key={e.contradaId}
                      className={`flex items-center gap-3 rounded-lg border p-2 ${
                        isWinner ? 'border-amber-500 bg-amber-950/30' : isPlayer ? 'border-amber-700/40' : 'border-stone-700'
                      }`}
                    >
                      <div className="w-6 text-center font-serif text-lg font-black text-amber-300">{i + 1}°</div>
                      <ContradaFlag contradaId={e.contradaId} size={28} />
                      <div className="flex-1">
                        <span className="font-serif font-bold text-amber-100">{c.name}</span>
                        <span className="ml-2 text-xs text-stone-400">
                          {JOCKEY_BY_ID[e.jockeyId]?.nickname} · {e.horse?.name || '—'}
                        </span>
                      </div>
                      {e.fallen && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-900/60 px-2 py-0.5 text-[10px] font-bold text-red-300">
                          <TrendingDown size={10} /> CADUTO
                        </span>
                      )}
                      {isPlayer && <span className="text-xs font-bold text-amber-300">TU</span>}
                      {isRival && <span className="text-xs font-bold text-red-400">RIVALE</span>}
                      {e.betrayed && <SkillBadge />}
                      {isWinner && <Trophy className="text-amber-400" size={18} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <ResultBanner state={state} />

            <button
              onClick={game.doEndPalio}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 font-serif text-lg font-bold text-stone-950 shadow-lg shadow-amber-900/30 transition hover:bg-amber-400"
            >
              <RotateCcw size={20} /> Continua la Carriera
            </button>
          </div>
        </>
      )}

      {/* Last-minute deals modal */}
      <LastMinuteModal state={state} game={game} open={showLastMinute} onClose={() => setShowLastMinute(false)} />
    </div>
  );
}

function LastMinuteModal({ state, game, open, onClose }: { state: GameState; game: ReturnType<typeof useGame>; open: boolean; onClose: () => void }) {
  const [target, setTarget] = useState<string | null>(null);
  const [dealType, setDealType] = useState<PendingDeal['type']>('aiuto');
  const [ostacoloTarget, setOstacoloTarget] = useState<string | undefined>(undefined);
  const [payment, setPayment] = useState<'cash' | 'favore'>('cash');
  const [amount, setAmount] = useState(8000);
  const [toast, setToast] = useState<string | null>(null);

  const player = state.playerContradaId;
  const racing = state.racingContradeIds.filter((id) => id !== player);

  const submit = () => {
    if (!target) return;
    const r = game.doPropose(target, dealType, dealType === 'ostacolo' ? ostacoloTarget : undefined, payment, amount, true);
    setToast(r.ok ? 'Accordo stretto!' : r.reason || 'Rifiutato');
    setTimeout(() => { setToast(null); if (r.ok) onClose(); }, 2500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Accordi dell'Ultimo Minuto" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="rounded-lg border border-red-800/40 bg-red-950/20 p-3 text-xs text-red-200">
          <Zap size={14} className="mb-1 inline text-red-400" />
          <strong> Attenzione:</strong> gli accordi dell'ultimo minuto costano il doppio e hanno una probabilità di successo molto minore. La disperazione ha un prezzo.
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-stone-400">Con quale contrada?</label>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {racing.map((cid) => {
              const c = CONTRADA_BY_ID[cid];
              const rel = state.contradeRelations[player][cid];
              return (
                <button
                  key={cid}
                  onClick={() => setTarget(cid)}
                  disabled={rel <= -100}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition ${
                    target === cid ? 'border-amber-400 bg-amber-500/20' : 'border-stone-700 hover:border-stone-500'
                  } ${rel <= -100 ? 'opacity-30' : ''}`}
                >
                  <ContradaFlag contradaId={cid} size={24} />
                  <span className="text-[10px] font-semibold text-stone-200">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {target && (
          <>
            <div>
              <label className="text-xs uppercase tracking-wide text-stone-400">Tipo di accordo</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {([
                  { k: 'aiuto', label: 'Aiuto in pista', icon: <Handshake size={14} /> },
                  { k: 'neutralita', label: 'Neutralità', icon: <Coins size={14} /> },
                  { k: 'ostacolo', label: 'Ostacola rivale', icon: <Swords size={14} /> },
                  { k: 'strada', label: 'Lascia strada', icon: <Flag size={14} /> },
                ] as const).map((o) => (
                  <button
                    key={o.k}
                    onClick={() => setDealType(o.k)}
                    className={`flex items-center gap-1.5 rounded-lg border p-2.5 text-sm font-semibold transition ${
                      dealType === o.k ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-stone-700 text-stone-300'
                    }`}
                  >
                    {o.icon} {o.label}
                  </button>
                ))}
              </div>
            </div>

            {dealType === 'ostacolo' && (
              <div>
                <label className="text-xs uppercase tracking-wide text-stone-400">Contrada da ostacolare</label>
                <select
                  value={ostacoloTarget || ''}
                  onChange={(e) => setOstacoloTarget(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-700 bg-stone-800 p-2 text-sm text-stone-100"
                >
                  <option value="">Seleziona...</option>
                  {CONTRADE.filter((c) => c.id !== player && c.id !== target).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs uppercase tracking-wide text-stone-400">Pagamento</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => setPayment('cash')} className={`rounded-lg border p-2.5 text-sm font-semibold ${payment === 'cash' ? 'border-amber-400 bg-amber-500/20' : 'border-stone-700'}`}>
                  <Coins size={14} className="inline" /> Contanti (2x)
                </button>
                <button onClick={() => setPayment('favore')} className={`rounded-lg border p-2.5 text-sm font-semibold ${payment === 'favore' ? 'border-amber-400 bg-amber-500/20' : 'border-stone-700'}`}>
                  Favore futuro
                </button>
              </div>
            </div>

            {payment === 'cash' && (
              <div>
                <label className="text-xs uppercase tracking-wide text-stone-400">Offerta base (€) — verrà raddoppiata</label>
                <input
                  type="number"
                  value={amount}
                  min={1000}
                  step={1000}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-2 w-full rounded-lg border border-stone-700 bg-stone-800 p-2 text-sm text-stone-100"
                />
                <p className="mt-1 text-xs text-red-300">Costo reale: {euro(amount * 2)} · Budget: {euro(state.budget)}</p>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-800/30 p-3 text-xs text-stone-400">
              <TrendingUp size={14} className="text-amber-400" />
              <span>Probabilità di successo molto bassa (-25% rispetto al normale). Le contrade sanno che sei disperato.</span>
            </div>

            <button
              onClick={submit}
              disabled={dealType === 'ostacolo' && !ostacoloTarget}
              className="w-full rounded-xl bg-red-600 py-3 font-serif font-bold text-white hover:bg-red-500 disabled:opacity-40"
            >
              Proponi Accordo dell'Ultimo Minuto
            </button>
            {toast && <p className="text-center text-sm text-amber-300">{toast}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}

function SkillBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-red-900 px-2 py-0.5 text-[10px] text-red-200"><Ban size={10} /> TRADIMENTO</span>;
}

function ResultBanner({ state }: { state: GameState }) {
  const player = state.playerContradaId;
  const rivalId = CONTRADA_BY_ID[player].rivalId;
  const winner = state.lastWinnerContradaId;
  if (!winner) return null;
  const wc = CONTRADA_BY_ID[winner];

  if (winner === player) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500 bg-gradient-to-br from-amber-900/50 via-amber-800/30 to-amber-600/20 p-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <Sparkles
              key={i}
              size={16 + (i % 3) * 6}
              className="absolute text-amber-300/60 animate-fade-in-up"
              style={{
                left: `${(i * 8.3) % 100}%`,
                top: `${(i * 13) % 100}%`,
                animationDelay: `${i * 0.15}s`,
                animationIterationCount: 'infinite',
              }}
            />
          ))}
        </div>
        <div className="relative flex items-center gap-4">
          <PartyPopper size={48} className="animate-pulse text-amber-300" />
          <div>
            <h3 className="font-serif text-3xl font-black text-amber-200">VITTORIA!</h3>
            <p className="mt-1 text-sm text-amber-100/90">
              La tua Contrada conquista il Cencio! La Piazza esplode di gioia, il Morale tocca il 100%.
              Cena della Vittoria stasera, donazioni dei protettori in arrivo.
            </p>
          </div>
          <ContradaFlag contradaId={winner} size={56} />
        </div>
      </div>
    );
  }
  if (winner === rivalId) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border-2 border-red-700 bg-gradient-to-r from-red-950/60 to-red-900/20 p-6">
        <Skull size={48} className="text-red-400" />
        <div>
          <h3 className="font-serif text-3xl font-black text-red-300">PURGA!</h3>
          <p className="mt-1 text-sm text-red-200/90">
            La tua rivale {wc.name} ha vinto il Palio. Lutto cittadino: il Morale crolla del 50%,
            il Budget viene ridotto del 35% per i prossimi 2 Palii.
          </p>
        </div>
        <ContradaFlag contradaId={winner} size={56} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-stone-700 bg-stone-900/50 p-6">
      <Flag size={36} className="text-stone-400" />
      <div>
        <h3 className="font-serif text-xl font-bold text-stone-200">Palio vinto da {wc.name}</h3>
        <p className="text-sm text-stone-400">Nessuna gioia, nessuna purga. La carriera continua.</p>
      </div>
      <ContradaFlag contradaId={winner} size={48} />
    </div>
  );
}

function KillerActionPanel({ state, game }: { state: GameState; game: ReturnType<typeof useGame> }) {
  if (state.phase !== 'palio' || state.raceResult) return null;
  if (state.killerOrder) return null;
  const rivalId = CONTRADA_BY_ID[state.playerContradaId].rivalId;
  if (!state.racingContradeIds.includes(rivalId)) return null;
  if (state.budget < 30000) return null;

  // Only the player's own jockey can be ordered to do the killer action
  const myJockeyId = Object.entries(state.jockeyContracts).find(
    ([, cid]) => cid === state.playerContradaId,
  )?.[0];
  if (!myJockeyId) return null;
  const myJockey = JOCKEY_BY_ID[myJockeyId];
  if (!myJockey || myJockey.killer < 8) return null;
  if (state.jockeySuspensions[myJockeyId] > 0) return null;

  const rivalName = CONTRADA_BY_ID[rivalId].name;

  return (
    <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Skull className="text-red-400" size={18} />
        <h3 className="font-serif text-sm font-bold text-red-300">Azione Killer</h3>
      </div>
      <p className="mb-3 text-xs text-stone-400">
        Il tuo fantino <span className="font-semibold text-stone-200">{myJockey.nickname}</span> ha l'istinto killer ({myJockey.killer}/10).
        Pagalo €30.000 per ostacolare estremamente <span className="font-semibold text-red-300">{rivalName}</span>.
        Il fantino rischia la squalifica.
      </p>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-stone-900/50 p-2.5">
        <div className="flex items-center gap-2">
          <ContradaFlag contradaId={state.playerContradaId} size={20} />
          <div>
            <div className="font-serif text-xs font-bold text-stone-200">{myJockey.nickname}</div>
            <div className="text-[10px] text-stone-500">Killer {myJockey.killer}/10 · {CONTRADA_BY_ID[state.playerContradaId].name}</div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => game.doOrderKiller(myJockeyId, 'nerbata')}
            className="rounded-lg bg-orange-700 px-2.5 py-1.5 text-[11px] font-semibold text-stone-50 transition hover:bg-orange-600"
            title="Nerbata intensa alla partenza. Rischio squalifica: 2 Palii (60%)"
          >
            Nerba (2 Palii)
          </button>
          <button
            onClick={() => game.doOrderKiller(myJockeyId, 'caduta')}
            className="rounded-lg bg-red-700 px-2.5 py-1.5 text-[11px] font-semibold text-stone-50 transition hover:bg-red-600"
            title="Far cadere il fantino avversario. Rischio squalifica: 3 Palii (75%)"
          >
            Caduta (3 Palii)
          </button>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-stone-500">
        La squalifica non è certa. Se il fantino viene scoperto, non sarà disponibile per i prossimi Palii.
      </p>
    </div>
  );
}
