import { useState } from 'react';
import type { GameState } from '@/game/types';
import { JOCKEYS, JOCKEY_BY_ID, CONTRADA_BY_ID, CONTRADE } from '@/game/data';
import { Modal, SectionTitle, StatBar, euro } from './ui';
import { ContradaFlag } from './ContradaFlag';
import type { useGame } from '@/game/useGame';
import {
  User,
  Ban,
  Shield,
  Coins,
  Gift,
  Eye,
  Swords,
  Heart,
  Check,
  X,
  Users,
} from 'lucide-react';

export function TabMercato({ state, game }: { state: GameState; game: ReturnType<typeof useGame> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [bonusAmt, setBonusAmt] = useState(5000);
  const [bribeAmt, setBribeAmt] = useState(8000);
  const [toast, setToast] = useState<string | null>(null);

  const player = state.playerContradaId;
  const playerJockey = Object.keys(state.jockeyContracts).find((jid) => state.jockeyContracts[jid] === player);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const actHire = (jid: string) => {
    const r = game.doHire(jid);
    flash(r.ok ? 'Fantino ingaggiato!' : r.reason || 'Errore');
  };
  const actBonus = (jid: string) => {
    const r = game.doBonus(jid, bonusAmt);
    flash(r.ok ? `Bonus promesso: ${euro(bonusAmt)}` : r.reason || 'Errore');
  };
  const actGuard = (jid: string) => {
    const r = game.doGuard(jid);
    flash(r.ok ? 'Guardia armata posta!' : r.reason || 'Errore');
  };
  const actBribe = (jid: string) => {
    const r = game.doBribe(jid, bribeAmt);
    flash(r.ok ? (r.success ? 'Corruzione riuscita!' : 'Mazzetta rifiutata.') : r.reason || 'Errore');
  };
  const actSpy = (jid: string) => {
    const r = game.doSpy(jid);
    flash(r.ok ? r.info || 'Spionaggio completato.' : r.reason || 'Errore');
  };

  const sel = selected ? JOCKEY_BY_ID[selected] : null;

  return (
    <div className="space-y-6">
      <SectionTitle icon={<User className="text-amber-400" />}>Stalla & Mercato Fantini</SectionTitle>

      {playerJockey ? (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-200">
            <Check size={16} /> Il tuo fantino: <strong>"{JOCKEY_BY_ID[playerJockey].nickname}"</strong> ({JOCKEY_BY_ID[playerJockey].wins} Palii vinti)
            {state.jockeyInjured[playerJockey] && <span className="ml-2 inline-flex items-center gap-1 text-red-300 font-bold">· INFORTUNATO</span>}
            {state.jockeyFormPenalty[playerJockey] > 0 && <span className="ml-2 text-orange-400">· forma -{state.jockeyFormPenalty[playerJockey]}</span>}
            {state.jockeyGuarded[playerJockey] && <span className="ml-2 inline-flex items-center gap-1 text-sky-300"><Shield size={12} /> Guardia</span>}
            {state.jockeyBonus[playerJockey] ? <span className="ml-2 text-amber-300">Bonus: {euro(state.jockeyBonus[playerJockey])}</span> : null}
            {!state.messaDone && <button onClick={() => game.doRelease(playerJockey)} className="ml-auto rounded bg-stone-700 px-2 py-1 text-xs text-stone-200 hover:bg-stone-600">Libera</button>}
          </div>
          {state.messaDone && <p className="mt-2 text-xs text-amber-300">Messa del fantino già fata: non puoi più cambiare monta.</p>}
        </div>
      ) : state.messaDone ? (
        <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-4 text-sm text-red-200">
          Messa del fantino fatta senza ingaggio. Il fantino d'ufficio correrà per te.
        </div>
      ) : (
        <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 text-sm text-amber-200">
          Non hai ancora ingaggiato un fantino. Scegline uno libero qui sotto (senza veto).
        </div>
      )}

      {/* Jockey list */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {JOCKEYS.map((j) => {
          const hiredBy = state.jockeyContracts[j.id];
          const isMine = hiredBy === player;
          const rel = state.contradaJockey[player][j.id];
          const veto = rel <= -100;
          return (
            <div
              key={j.id}
              className={`rounded-xl border p-4 transition ${
                veto ? 'border-red-800/50 bg-red-950/10' : isMine ? 'border-emerald-700/50 bg-emerald-950/10' : 'border-stone-800 bg-stone-900/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-amber-100">"{j.nickname}"</span>
                    <span className="text-xs text-stone-400">{j.wins} Palii</span>
                  </div>
                  <div className="mt-0.5 text-xs text-stone-400">{j.careerStage}</div>
                </div>
                {veto && <span className="inline-flex items-center gap-1 rounded-full bg-red-900 px-2 py-0.5 text-xs text-red-200"><Ban size={12} /> VETO</span>}
                {!veto && isMine && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-800 px-2 py-0.5 text-xs text-emerald-100"><Check size={12} /> Tuo</span>}
                {!veto && hiredBy && !isMine && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-800 px-2 py-0.5 text-xs text-stone-400">
                    <ContradaFlag contradaId={hiredBy} size={16} /> {CONTRADA_BY_ID[hiredBy].name} · ingaggiato
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <Stat label="Overall" value={j.overall} max={100} />
                <Stat label="Mossa" value={j.mossa} />
                <Stat label="Grinta" value={j.grinta} />
                <Stat label="Killer" value={j.killer} />
                <Stat label="Caduta" value={j.fallRate} max={100} />
              </div>
              <div className="mt-2 text-xs text-stone-400">Ingaggio: {euro(j.avidity)}</div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  disabled={veto || isMine || !!state.jockeyInjured[j.id] || !!state.jockeySuspensions[j.id] || state.messaDone || !!hiredBy}
                  onClick={() => actHire(j.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-30 ${
                    state.jockeyInjured[j.id] ? 'bg-red-900 text-red-200' : state.jockeySuspensions[j.id] ? 'bg-red-950 text-red-300' : veto ? 'bg-red-900 text-red-200' : isMine ? 'bg-emerald-700 text-emerald-100' : hiredBy ? 'bg-stone-700 text-stone-400' : 'bg-amber-600 text-stone-950 hover:bg-amber-500'
                  }`}
                >
                  {state.jockeyInjured[j.id] ? 'Infortunato' : state.jockeySuspensions[j.id] ? `Squalificato (${state.jockeySuspensions[j.id]})` : veto ? 'Veto' : state.messaDone ? 'Messa fatta' : isMine ? 'Tuo' : hiredBy ? 'Ingaggiato' : 'Ingaggia'}
                </button>
                <button onClick={() => setSelected(j.id)} className="rounded-lg bg-stone-700 px-3 py-1.5 text-xs font-semibold text-stone-100 hover:bg-stone-600">
                  Scheda
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Jockey detail modal */}
      <Modal open={!!sel} onClose={() => setSelected(null)} title={sel ? `"${sel.nickname}"` : ''} maxWidth="max-w-2xl">
        {sel && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <Info label="Overall" value={`${sel.overall}`} />
              <Info label="Fase carriera" value={sel.careerStage} />
              <Info label="Ingaggio" value={euro(sel.avidity)} />
              <Info label="Incorruttibilità" value={`${sel.incorruptibility}/10`} />
              <Info label="Indice Killer" value={`${sel.killer}/10`} />
              <Info label="Prob. Caduta" value={`${sel.fallRate}%`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-stone-400">Overall</div>
                <StatBar value={sel.overall} max={100} color="bg-amber-400" />
              </div>
              <div>
                <div className="text-xs text-stone-400">Mossa</div>
                <StatBar value={sel.mossa} max={10} color="bg-amber-500" />
              </div>
              <div>
                <div className="text-xs text-stone-400">Grinta</div>
                <StatBar value={sel.grinta} max={10} color="bg-red-500" />
              </div>
              <div>
                <div className="text-xs text-stone-400">Incorruttibilità</div>
                <StatBar value={sel.incorruptibility} max={10} color="bg-emerald-500" />
              </div>
              <div>
                <div className="text-xs text-stone-400">Indice Killer</div>
                <StatBar value={sel.killer} max={10} color="bg-red-600" />
              </div>
              <div>
                <div className="text-xs text-stone-400">Probabilità di Caduta</div>
                <StatBar value={sel.fallRate} max={100} color="bg-orange-500" />
              </div>
            </div>

            {/* Jockey-jockey relations */}
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-200"><Swords size={14} /> Faide & Intese con altri fantini</h4>
              <div className="flex flex-wrap gap-2">
                {JOCKEYS.filter((o) => o.id !== sel.id).map((o) => {
                  const rel = state.jockeyRelations[sel.id][o.id];
                  const enemy = rel <= -80;
                  const friend = rel >= 70;
                  return (
                    <div
                      key={o.id}
                      className={`rounded-lg border px-2 py-1 text-xs ${
                        enemy ? 'border-red-700 bg-red-950/30 text-red-200' : friend ? 'border-emerald-700 bg-emerald-950/30 text-emerald-200' : 'border-stone-700 text-stone-300'
                      }`}
                    >
                      {o.nickname} ({rel > 0 ? '+' : ''}{rel})
                      {enemy && <span className="ml-1">· NEMICO</span>}
                      {friend && <span className="ml-1">· INTESA</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contrada-jockey relations */}
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-200"><Users size={14} /> Gradimento delle Contrade</h4>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {CONTRADE.map((c) => {
                  const rel = state.contradaJockey[c.id][sel.id];
                  const veto = rel <= -100;
                  return (
                    <div key={c.id} className={`flex flex-col items-center gap-1 rounded px-2 py-1 text-center text-[10px] ${veto ? 'bg-red-900/40 text-red-200' : 'bg-stone-800 text-stone-300'}`}>
                      <ContradaFlag contradaId={c.id} size={20} />
                      <div className="font-bold">{veto ? 'VETO' : rel > 0 ? `+${rel}` : rel}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 rounded-xl border border-stone-700 bg-stone-800/40 p-4">
              <h4 className="text-sm font-bold text-amber-200">Azioni</h4>
              {state.jockeyContracts[sel.id] === player ? (
                <>
                  <div className="flex items-center gap-2">
                    <input type="number" value={bonusAmt} min={1000} step={1000} onChange={(e) => setBonusAmt(Number(e.target.value))} className="w-32 rounded border border-stone-600 bg-stone-900 p-1.5 text-sm text-stone-100" />
                    <button onClick={() => actBonus(sel.id)} className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-500"><Gift size={14} /> Prometti Bonus Vittoria</button>
                  </div>
                  <button onClick={() => actGuard(sel.id)} disabled={!!state.jockeyGuarded[sel.id]} className="flex items-center gap-1 rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-40">
                    <Shield size={14} /> {state.jockeyGuarded[sel.id] ? 'Guardia già posta' : 'Metti la Guardia (€3.000)'}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <input type="number" value={bribeAmt} min={1000} step={1000} onChange={(e) => setBribeAmt(Number(e.target.value))} className="w-32 rounded border border-stone-600 bg-stone-900 p-1.5 text-sm text-stone-100" />
                    <button onClick={() => actBribe(sel.id)} disabled={state.budget < bribeAmt} className="flex items-center gap-1 rounded-lg bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40">
                      <Coins size={14} /> Tenta Corruzione
                    </button>
                  </div>
                  <button onClick={() => actSpy(sel.id)} disabled={state.budget < 2500} className="flex items-center gap-1 rounded-lg bg-stone-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-500 disabled:opacity-40">
                    <Eye size={14} /> Spia (€2.500)
                  </button>
                </>
              )}
            </div>
            {toast && <p className="text-center text-sm text-amber-300">{toast}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  return (
    <div className="rounded bg-stone-800/60 px-2 py-1 text-center">
      <div className="text-[10px] text-stone-500">{label}</div>
      <div className="font-bold text-stone-100">{value}/{max}</div>
    </div>
  );
}
function Info({ label, value, pill }: { label: string; value: string; pill?: string }) {
  return (
    <div className="rounded-lg bg-stone-800/50 p-2 text-center">
      <div className="text-[10px] uppercase text-stone-500">{label}</div>
      {pill ? <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${pill}`}>{value}</span> : <div className="mt-0.5 font-serif font-bold text-amber-100">{value}</div>}
    </div>
  );
}
