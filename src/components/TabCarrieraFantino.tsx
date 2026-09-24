import { useState, useEffect, useCallback } from 'react';
import type { JockeyCareerState, MountOffer } from '@/game/types';
import {
  createJockeyCareer, saveJockeyCareer, loadJockeyCareer, clearJockeyCareer,
  generateMountOffers, acceptMount, refuseAllMounts,
  acceptBribe, refuseBribe, simulateJockeyRace, advanceToNextPalio,
} from '@/game/jockeyEngine';
import { CONTRADA_BY_ID, JOCKEY_BY_ID, CONTRADE } from '@/game/data';
import { ContradaFlag } from './ContradaFlag';
import { SectionTitle, StatBar, Pill, euro, Modal } from './ui';
import {
  Trophy, Skull, Heart, DollarSign, Swords, Shield, Sparkles, Flag,
  TrendingDown, Crown, AlertTriangle, Check, X, ChevronRight, Zap, User,
  ScrollText,
} from 'lucide-react';

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ── Schermata di creazione ─────────────────────────────────────────────────

function JockeyCreation({ onCreate }: { onCreate: (nickname: string, killer: number) => void }) {
  const [nickname, setNickname] = useState('');
  const [killer, setKiller] = useState(5);
  const [step, setStep] = useState<'name' | 'stats'>('name');
  const [previewOverall] = useState(() => clamp(Math.floor(55 + Math.random() * 20), 55, 75));
  const [previewMossa] = useState(() => Math.floor(Math.random() * 6) + 3);
  const [previewGrinta] = useState(() => Math.floor(Math.random() * 6) + 4);
  const [previewFall] = useState(() => clamp(8 + (10 - (Math.floor(Math.random() * 6) + 4)) * 1.5, 4, 30).toFixed(1));
  const [previewIndep] = useState(() => Math.floor(Math.random() * 6) + 3);
  const [previewIncorr] = useState(() => Math.floor(Math.random() * 6) + 3);

  if (step === 'name') {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <User className="mx-auto mb-3 text-amber-400" size={48} />
          <h2 className="font-serif text-2xl font-bold text-amber-100">Crea il tuo Fantino</h2>
          <p className="mt-1 text-sm text-stone-400">Scegli il tuo soprannome da fantino</p>
        </div>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          placeholder="es. Il Branco, Struscio, Bighino..."
          className="w-full rounded-xl border border-amber-700/40 bg-stone-900 px-4 py-3 text-center font-serif text-lg text-amber-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && nickname.trim()) setStep('stats');
          }}
        />
        <button
          disabled={!nickname.trim()}
          onClick={() => setStep('stats')}
          className="w-full rounded-xl bg-amber-500 py-3 font-bold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continua
        </button>
      </div>
    );
  }

  // Step stats: scegli solo il killer, le altre sono casuali
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-2xl font-bold text-amber-100">"{nickname}"</h2>
        <p className="mt-1 text-sm text-stone-400">Scegli il tuo indice Killer. Le altre stats sono casuali.</p>
      </div>

      <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-4 space-y-3">
        <div className="text-xs uppercase text-stone-500">Statistiche generate</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-stone-800/50 px-3 py-2">
            <span className="text-stone-400">Overall</span>
            <span className="font-bold text-amber-300">{previewOverall}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-stone-800/50 px-3 py-2">
            <span className="text-stone-400">Mossa</span>
            <span className="font-bold text-amber-300">{previewMossa}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-stone-800/50 px-3 py-2">
            <span className="text-stone-400">Grinta</span>
            <span className="font-bold text-amber-300">{previewGrinta}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-stone-800/50 px-3 py-2">
            <span className="text-stone-400">Caduta %</span>
            <span className="font-bold text-red-300">{previewFall}%</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-stone-800/50 px-3 py-2">
            <span className="text-stone-400">Indipendenza</span>
            <span className="font-bold text-sky-300">{previewIndep}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-stone-800/50 px-3 py-2">
            <span className="text-stone-400">Incorruttibilità</span>
            <span className="font-bold text-emerald-300">{previewIncorr}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Swords className="text-red-400" size={18} />
          <span className="font-bold text-red-300">Indice Killer: {killer}</span>
        </div>
        <p className="text-xs text-stone-400">
          Determina quanto sei aggressivo in gara. Alto = ostacoli la rivale, ma più rischi di squalifica e cadute.
        </p>
        <input
          type="range" min={1} max={10} value={killer}
          onChange={(e) => setKiller(Number(e.target.value))}
          className="w-full accent-red-500"
        />
        <div className="flex justify-between text-[10px] text-stone-500">
          <span>Pacifico (1)</span><span>Freddo (5)</span><span>Assassino (10)</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('name')}
          className="flex-1 rounded-xl border border-stone-700 bg-stone-800 py-3 font-bold text-stone-300 transition hover:bg-stone-700"
        >
          Indietro
        </button>
        <button
          onClick={() => onCreate(nickname, killer)}
          className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-stone-950 transition hover:bg-amber-400"
        >
          Inizia la Carriera
        </button>
      </div>
    </div>
  );
}

// ── Schermata principale carriera ───────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${color}`}>
      <div className="mx-auto mb-1 flex justify-center">{icon}</div>
      <div className="font-serif text-xl font-black">{value}</div>
      <div className="text-[10px] uppercase text-stone-400">{label}</div>
    </div>
  );
}

function OfferCard({
  offer, relations, onAccept,
}: {
  offer: MountOffer;
  relations: Record<string, number>;
  onAccept: () => void;
}) {
  const c = CONTRADA_BY_ID[offer.contradaId];
  if (!c) return null;
  const rel = relations[offer.contradaId] ?? 0;
  const rivalId = c.rivalId;
  const rivalRacing = rivalId ? relations[rivalId] ?? 0 : 0;

  return (
    <div className={`rounded-xl border p-4 ${offer.isRivalOffer ? 'border-red-700/50 bg-red-950/20' : 'border-stone-700 bg-stone-900/60'}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ContradaFlag contradaId={offer.contradaId} size={24} />
          <span className="font-serif text-lg font-bold text-stone-100">{c.name}</span>
        </div>
        <span className="font-bold text-amber-300">{euro(offer.fee)}</span>
      </div>
      <div className="mb-2 flex items-center gap-3 text-xs">
        <span className="text-stone-400">Cavallo: <span className="font-bold text-stone-200">{offer.horseName}</span></span>
        <span className="text-stone-400">Overall: <span className="font-bold text-amber-300">{offer.horseOverall}</span></span>
      </div>
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="text-stone-500">Rapporto: </span>
        <span className={rel >= 50 ? 'text-emerald-400' : rel >= 0 ? 'text-stone-300' : 'text-red-400'}>
          {rel > 0 ? '+' : ''}{rel}
        </span>
        {rivalId && (
          <>
            <span className="text-stone-600">|</span>
            <span className="text-stone-500">Rivale ({CONTRADA_BY_ID[rivalId]?.name}): </span>
            <span className={rivalRacing >= 50 ? 'text-emerald-400' : rivalRacing >= 0 ? 'text-stone-300' : 'text-red-400'}>
              {rivalRacing > 0 ? '+' : ''}{rivalRacing}
            </span>
          </>
        )}
      </div>
      {offer.isRivalOffer && (
        <p className="mb-2 text-[10px] text-red-400">
          Attenzione: questa contrada è rivale di una con cui hai buon rapporto!
        </p>
      )}
      <button
        onClick={onAccept}
        className="w-full rounded-lg bg-amber-500 py-2 text-sm font-bold text-stone-950 transition hover:bg-amber-400"
      >
        Accetta la Monta
      </button>
    </div>
  );
}

function BribeModal({
  s, onAccept, onRefuse,
}: {
  s: JockeyCareerState;
  onAccept: (id: string) => void;
  onRefuse: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  if (s.bribeOffers.length === 0) return null;

  return (
    <Modal open onClose={onRefuse} title="Proposta di Corruzione" maxWidth="max-w-md">
      <div className="space-y-3">
        {s.bribeOffers.map((b) => {
          const from = CONTRADA_BY_ID[b.fromContradaId];
          const target = CONTRADA_BY_ID[b.targetContradaId];
          if (!from || !target) return null;
          const typeLabel = b.type === 'caduta' ? 'Fai cadere' : b.type === 'ostacolo' ? 'Ostacola' : 'Brucia alla mossa';
          return (
            <div
              key={b.id}
              className={`rounded-xl border p-3 cursor-pointer transition ${
                selected === b.id ? 'border-red-500 bg-red-950/30' : 'border-stone-700 bg-stone-900/50 hover:border-stone-600'
              }`}
              onClick={() => setSelected(b.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ContradaFlag contradaId={b.fromContradaId} size={18} />
                  <span className="font-bold text-stone-200">{from.name}</span>
                </div>
                <span className="font-bold text-amber-300">{euro(b.amount)}</span>
              </div>
              <p className="mt-1 text-xs text-stone-400">
                {typeLabel} <span className="font-bold text-red-300">{target.name}</span>
              </p>
            </div>
          );
        })}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onRefuse}
            className="flex-1 rounded-lg border border-stone-700 bg-stone-800 py-2 text-sm font-bold text-stone-300 hover:bg-stone-700"
          >
            Rifiuta
          </button>
          <button
            disabled={!selected}
            onClick={() => selected && onAccept(selected)}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-40"
          >
            Accetta
          </button>
        </div>
        <p className="text-center text-[10px] text-stone-500">
          Accettare ti dà soldi subito, ma se si scopre la tua reputazione cala.
        </p>
      </div>
    </Modal>
  );
}

function RaceResultView({
  s, onContinue,
}: {
  s: JockeyCareerState;
  onContinue: () => void;
}) {
  const won = s.lastPlayerFinished === 1;
  const fallen = s.lastPlayerFallen;
  const winnerC = s.lastWinnerContradaId ? CONTRADA_BY_ID[s.lastWinnerContradaId] : null;
  const myContrada = s.currentContradaId ? CONTRADA_BY_ID[s.currentContradaId] : null;
  const purga = myContrada?.rivalId && s.lastWinnerContradaId === myContrada.rivalId;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-6 text-center ${
        won ? 'border-amber-500 bg-amber-950/30' : purga ? 'border-red-700 bg-red-950/20' : 'border-stone-700 bg-stone-900/50'
      }`}>
        {won ? (
          <>
            <Crown className="mx-auto mb-2 text-amber-400" size={40} />
            <h3 className="font-serif text-2xl font-black text-amber-200">Hai vinto il Palio!</h3>
            <p className="mt-1 text-sm text-amber-300">Cappotto per {myContrada?.name}!</p>
          </>
        ) : purga ? (
          <>
            <Skull className="mx-auto mb-2 text-red-400" size={40} />
            <h3 className="font-serif text-2xl font-black text-red-300">Purga!</h3>
            <p className="mt-1 text-sm text-red-400">La rivale {winnerC?.name} ha vinto il Palio.</p>
          </>
        ) : fallen ? (
          <>
            <TrendingDown className="mx-auto mb-2 text-red-400" size={40} />
            <h3 className="font-serif text-2xl font-black text-red-300">Caduto</h3>
            <p className="mt-1 text-sm text-stone-400">Sei stato disarcionato durante la gara.</p>
          </>
        ) : (
          <>
            <Flag className="mx-auto mb-2 text-stone-400" size={40} />
            <h3 className="font-serif text-2xl font-black text-stone-200">{s.lastPlayerFinished}° classificato</h3>
            <p className="mt-1 text-sm text-stone-400">Vince {winnerC?.name}</p>
          </>
        )}
      </div>

      {s.lastRaceLog.length > 0 && (
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-3">
          <div className="mb-2 text-xs uppercase text-stone-500">Log gara</div>
          <div className="space-y-1 text-xs text-stone-300">
            {s.lastRaceLog.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-stone-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-900/80 text-xs text-stone-400">
            <tr>
              <th className="px-3 py-2 text-left">Pos.</th>
              <th className="px-3 py-2 text-left">Contrada</th>
              <th className="px-3 py-2 text-left">Fantino</th>
              <th className="px-3 py-2 text-left">Cavallo</th>
            </tr>
          </thead>
          <tbody>
            {[...s.lastRaceResult].sort((a, b) => {
              if (a.fallen && !b.fallen) return 1;
              if (!a.fallen && b.fallen) return -1;
              return a.finished - b.finished;
            }).map((r) => {
              const c = CONTRADA_BY_ID[r.contradaId];
              const isPlayer = r.jockeyId === 'player';
              const jName = isPlayer ? s.nickname : JOCKEY_BY_ID[r.jockeyId]?.nickname ?? '—';
              return (
                <tr
                  key={r.contradaId}
                  className={`border-t border-stone-800 ${r.finished === 1 ? 'bg-amber-950/20' : ''} ${isPlayer ? 'bg-sky-950/20' : ''}`}
                >
                  <td className="px-3 py-2 text-stone-400">
                    {r.fallen ? <span className="text-red-400">CAD</span> : r.finished}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <ContradaFlag contradaId={r.contradaId} size={14} />
                      <span className={`font-serif font-bold ${r.finished === 1 ? 'text-amber-300' : isPlayer ? 'text-sky-300' : 'text-stone-200'}`}>
                        {c?.name}
                      </span>
                      {isPlayer && <span className="text-[9px] text-sky-400">TU</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-stone-300">{jName}</td>
                  <td className="px-3 py-2 text-stone-400">{r.horseName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={onContinue}
        className="w-full rounded-xl bg-amber-500 py-3 font-bold text-stone-950 transition hover:bg-amber-400"
      >
        Continua la Carriera
      </button>
    </div>
  );
}

// ── Componente principale ──────────────────────────────────────────────────

export function TabCarrieraFantino({ state, setState }: {
  state: JockeyCareerState;
  setState: (s: JockeyCareerState) => void;
}) {
  const [showBribe, setShowBribe] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const update = useCallback((fn: (s: JockeyCareerState) => void) => {
    setState((() => {
      const clone = structuredClone(state);
      fn(clone);
      return clone;
    })());
  }, [state, setState]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ── Phase: creation ──
  if (state.phase === 'creation') {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <JockeyCreation onCreate={(nick, killer) => {
          const s = createJockeyCareer(nick, killer);
          generateMountOffers(s);
          setState(s);
        }} />
      </div>
    );
  }

  // ── Header comune ──
  const palioLabel = state.palioIndex === 0 ? 'Luglio' : 'Agosto';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-amber-800/40 bg-gradient-to-r from-stone-900 to-stone-950 p-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-amber-100">"{state.nickname}"</h2>
          <p className="text-xs text-stone-400">Palio di {palioLabel} {state.year} · Turno {state.turn}</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill color="bg-amber-900/40 border border-amber-700/50 text-amber-200">
            <Sparkles size={12} /> {state.reputation} rep
          </Pill>
          <Pill color="bg-emerald-900/40 border border-emerald-700/50 text-emerald-200">
            <DollarSign size={12} /> {euro(state.wealth)}
          </Pill>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <div className="rounded-lg bg-stone-900/60 p-2 text-center">
          <div className="text-[10px] uppercase text-stone-500">Overall</div>
          <div className="font-bold text-amber-300">{state.overall}</div>
        </div>
        <div className="rounded-lg bg-stone-900/60 p-2 text-center">
          <div className="text-[10px] uppercase text-stone-500">Mossa</div>
          <div className="font-bold text-amber-300">{state.mossa}</div>
        </div>
        <div className="rounded-lg bg-stone-900/60 p-2 text-center">
          <div className="text-[10px] uppercase text-stone-500">Grinta</div>
          <div className="font-bold text-amber-300">{state.grinta}</div>
        </div>
        <div className="rounded-lg bg-stone-900/60 p-2 text-center">
          <div className="text-[10px] uppercase text-stone-500">Killer</div>
          <div className="font-bold text-red-400">{state.killer}</div>
        </div>
        <div className="rounded-lg bg-stone-900/60 p-2 text-center">
          <div className="text-[10px] uppercase text-stone-500">Caduta</div>
          <div className="font-bold text-red-300">{state.fallRate.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg bg-stone-900/60 p-2 text-center">
          <div className="text-[10px] uppercase text-stone-500">Incarr.</div>
          <div className="font-bold text-emerald-300">{state.incorruptibility}</div>
        </div>
      </div>

      {/* Career stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Trophy size={18} className="text-amber-400" />} label="Vittorie" value={state.wins} color="border-amber-700/40 bg-amber-950/20" />
        <StatCard icon={<Flag size={18} className="text-stone-400" />} label="Palii" value={state.paliiRun} color="border-stone-700 bg-stone-900/40" />
        <StatCard icon={<TrendingDown size={18} className="text-red-400" />} label="Cadute" value={state.cadute} color="border-red-800/40 bg-red-950/20" />
        <StatCard icon={<Skull size={18} className="text-red-400" />} label="Purghe" value={state.purghe} color="border-red-800/40 bg-red-950/20" />
      </div>

      {/* Injured banner */}
      {state.injured && state.phase !== 'fuori' && state.phase !== 'risultato' && (
        <div className="flex items-center gap-2 rounded-xl border border-red-800/40 bg-red-950/20 p-3 text-sm text-red-300">
          <AlertTriangle size={16} /> Sei infortunato. Prestazione ridotta in gara.
        </div>
      )}

      {/* ── Phase: attesa → scelta offerte ── */}
      {state.phase === 'scelta' && (
        <div className="space-y-4">
          <SectionTitle icon={<Flag className="text-amber-400" />}>Proposte di Monta</SectionTitle>
          {state.mountOffers.length === 0 ? (
            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-6 text-center">
              <p className="text-stone-400">
                Nessuna contrada ti ha offerto una monta per questo Palio.
                {state.reputation < 20 && ' La tua reputazione è troppo bassa.'}
              </p>
              <button
                onClick={() => update((s) => { refuseAllMounts(s); })}
                className="mt-4 rounded-xl bg-stone-700 px-6 py-2 text-sm font-bold text-stone-200 hover:bg-stone-600"
              >
                Salta il Palio
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-500">
                {state.mountOffers.length} {state.mountOffers.length === 1 ? 'contrada ti ha offerto' : 'contrade ti hanno offerto'} una monta. Scegli quale accettare.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {state.mountOffers.map((o) => (
                  <OfferCard
                    key={o.id}
                    offer={o}
                    relations={state.contradaRelations}
                    onAccept={() => update((s) => {
                      const res = acceptMount(s, o.id);
                      if (!res.ok) setToast(res.reason ?? 'Errore');
                    })}
                  />
                ))}
              </div>
              <button
                onClick={() => update((s) => { refuseAllMounts(s); })}
                className="w-full rounded-xl border border-stone-700 bg-stone-800 py-2 text-sm font-bold text-stone-400 hover:bg-stone-700"
              >
                Rifiuta tutte e salta il Palio
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Phase: corse (pre-race: bribe offers) ── */}
      {state.phase === 'corse' && (
        <div className="space-y-4">
          <SectionTitle icon={<Flag className="text-amber-400" />}>Il Palio</SectionTitle>
          <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-4">
            <div className="mb-3 flex items-center gap-3">
              <ContradaFlag contradaId={state.currentContradaId ?? ''} size={28} />
              <div>
                <div className="font-serif text-lg font-bold text-amber-100">
                  {CONTRADA_BY_ID[state.currentContradaId ?? '']?.name}
                </div>
                <div className="text-xs text-stone-400">
                  {state.currentHorse} · Canape {state.currentCanape + 1}° · {euro(state.currentFee)}
                </div>
              </div>
            </div>
          </div>

          {/* Bribe offers */}
          {state.bribeOffers.length > 0 && !state.acceptedBribe && (
            <div className="flex items-center gap-2 rounded-xl border border-red-800/40 bg-red-950/20 p-3">
              <Swords className="text-red-400" size={16} />
              <span className="text-sm text-red-300">
                {state.bribeOffers.length} {state.bribeOffers.length === 1 ? 'proposta di corruzione' : 'proposte di corruzione'} in arrivo!
              </span>
              <button
                onClick={() => setShowBribe(true)}
                className="ml-auto rounded-lg bg-red-700 px-3 py-1 text-xs font-bold text-white hover:bg-red-600"
              >
                Guarda
              </button>
            </div>
          )}
          {state.acceptedBribe && (
            <div className="flex items-center gap-2 rounded-xl border border-red-800/40 bg-red-950/20 p-3 text-xs text-red-300">
              <Swords size={14} /> Ti sei venduto a {CONTRADA_BY_ID[state.acceptedBribe.fromContradaId]?.name} per {euro(state.acceptedBribe.amount)}.
              Devi {state.acceptedBribe.type === 'caduta' ? 'far cadere' : state.acceptedBribe.type === 'ostacolo' ? 'ostacolare' : 'bruciare alla mossa'} {CONTRADA_BY_ID[state.acceptedBribe.targetContradaId]?.name}.
            </div>
          )}

          {/* Grid partenza */}
          <div className="rounded-xl border border-stone-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-900/80 text-xs text-stone-400">
                <tr>
                  <th className="px-3 py-2 text-left">Canape</th>
                  <th className="px-3 py-2 text-left">Contrada</th>
                  <th className="px-3 py-2 text-left">Fantino</th>
                  <th className="px-3 py-2 text-left">Cavallo</th>
                </tr>
              </thead>
              <tbody>
                {[...state.allEntries].sort((a, b) => a.canape - b.canape).map((e) => {
                  const c = CONTRADA_BY_ID[e.contradaId];
                  const isPlayer = e.jockeyId === 'player';
                  const jName = isPlayer ? state.nickname : JOCKEY_BY_ID[e.jockeyId]?.nickname ?? '—';
                  return (
                    <tr key={e.contradaId} className={`border-t border-stone-800 ${isPlayer ? 'bg-sky-950/20' : ''}`}>
                      <td className="px-3 py-2 text-stone-400">{e.canape + 1}°</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <ContradaFlag contradaId={e.contradaId} size={14} />
                          <span className="font-serif font-bold text-stone-200">{c?.name}</span>
                          {isPlayer && <span className="text-[9px] text-sky-400">TU</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-stone-300">{jName}</td>
                      <td className="px-3 py-2 text-stone-400">{e.horseName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => update((s) => { simulateJockeyRace(s); })}
            className="w-full rounded-xl bg-red-600 py-4 font-serif text-lg font-black text-white transition hover:bg-red-500"
          >
            DÀ LA MOSSA!
          </button>
        </div>
      )}

      {/* ── Phase: risultato ── */}
      {state.phase === 'risultato' && (
        <RaceResultView s={state} onContinue={() => update((s) => { advanceToNextPalio(s); })} />
      )}

      {/* ── Phase: fuori (infortunato) ── */}
      {state.phase === 'fuori' && (
        <div className="mx-auto max-w-md space-y-4 text-center">
          <AlertTriangle className="mx-auto text-red-400" size={48} />
          <h3 className="font-serif text-xl font-bold text-red-300">
            {state.injured ? 'Infortunato' : 'A riposo'}
          </h3>
          <p className="text-sm text-stone-400">
            {state.injured
              ? `Devi saltare questo Palio per infortunio. Palii da saltare: ${state.injuryTurns}`
              : 'Hai deciso di non correre questo Palio. Il riposo ti ha fatto bene: reputazione +3.'}
          </p>
          <button
            onClick={() => update((s) => { advanceToNextPalio(s); })}
            className="w-full rounded-xl bg-amber-500 py-3 font-bold text-stone-950 transition hover:bg-amber-400"
          >
            Prossimo Palio
          </button>
        </div>
      )}

      {/* ── Storico carriera (stile modalità capitano) ── */}
      {state.history.length > 0 && (
        <div className="space-y-2">
          <SectionTitle icon={<ScrollText className="text-amber-400" />}>Resoconto Palii</SectionTitle>
          {state.history.slice().reverse().map((r, idx) => {
            const c = CONTRADA_BY_ID[r.contradaId];
            const winnerC = state.lastWinnerContradaId && idx === 0 ? CONTRADA_BY_ID[state.lastWinnerContradaId] : null;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  r.won
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : r.fallen
                    ? 'border-red-800/50 bg-red-950/20'
                    : 'border-stone-700 bg-stone-900/40'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-stone-400">{r.palioIndex === 0 ? 'Lug' : 'Ago'}</span>
                  <span className="font-serif text-sm font-bold text-amber-200">{r.year}</span>
                </div>
                <div className="h-8 w-1 rounded-full" style={{ backgroundColor: c?.colors.bg ?? '#78716c' }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {r.won
                      ? <Trophy size={14} className="text-amber-400" />
                      : r.fallen
                      ? <TrendingDown size={14} className="text-red-400" />
                      : null}
                    <span className="font-serif text-sm font-bold text-stone-100">
                      {r.won ? 'VITTORIA!' : r.fallen ? 'CADUTO' : `${r.finished}° classificato`}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400">
                    {c?.name} su {r.horseName} · {euro(r.fee)}
                    {r.bribeTaken && <span className="text-red-400"> · venduto ({euro(r.bribeAmount)})</span>}
                  </div>
                </div>
                {c && <ContradaFlag contradaId={r.contradaId} size={28} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Relazioni contrade ── */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-200">
          <Heart size={16} /> Rapporti con le Contrade
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {CONTRADE.map((c) => {
            const rel = state.contradaRelations[c.id] ?? 0;
            return (
              <div
                key={c.id}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${
                  rel >= 50 ? 'border-emerald-700/50 bg-emerald-950/30'
                  : rel >= 0 ? 'border-stone-700 bg-stone-800/40'
                  : rel >= -50 ? 'border-orange-800/50 bg-orange-950/20'
                  : 'border-red-800/50 bg-red-950/20'
                }`}
              >
                <ContradaFlag contradaId={c.id} size={14} />
                <span className="text-stone-300">{c.name}</span>
                <span className={`font-bold ${rel >= 50 ? 'text-emerald-400' : rel >= 0 ? 'text-stone-400' : 'text-red-400'}`}>
                  {rel > 0 ? '+' : ''}{rel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bribe modal */}
      {showBribe && state.bribeOffers.length > 0 && (
        <BribeModal
          s={state}
          onAccept={(id) => update((s) => {
            const res = acceptBribe(s, id);
            setShowBribe(false);
            setToast(res.ok ? 'Corruzione accettata' : res.reason ?? 'Rifiutato');
          })}
          onRefuse={() => update((s) => { refuseBribe(s); setShowBribe(false); })}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl border border-amber-700/40 bg-stone-950 px-4 py-2 text-sm text-amber-200 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
