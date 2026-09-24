import { useState } from 'react';
import type { GameState, PendingDeal } from '@/game/types';
import { CONTRADE, CONTRADA_BY_ID, relationLevel, RELATION_LABELS } from '@/game/data';
import { Modal, SectionTitle, euro } from './ui';
import { ContradaFlag } from './ContradaFlag';
import type { useGame } from '@/game/useGame';
import { Handshake, ScrollText, Ban, Coins, Gift, Swords, Flag, Info, Heart, X, Check } from 'lucide-react';

export function TabDiplomazia({ state, game }: { state: GameState; game: ReturnType<typeof useGame> }) {
  const [target, setTarget] = useState<string | null>(null);
  const [dealType, setDealType] = useState<PendingDeal['type']>('aiuto');
  const [payment, setPayment] = useState<'cash' | 'favore'>('cash');
  const [amount, setAmount] = useState(5000);
  const [ostacoloTarget, setOstacoloTarget] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const player = state.playerContradaId;
  const others = CONTRADE.filter((c) => c.id !== player);

  const openDeal = (contradaId: string) => {
    setTarget(contradaId);
    setDealType('aiuto');
    setPayment('cash');
    setAmount(5000);
    setOstacoloTarget(undefined);
  };

  const submit = () => {
    if (!target) return;
    const r = game.doPropose(target, dealType, dealType === 'ostacolo' ? ostacoloTarget : undefined, payment, payment === 'cash' ? amount : 0);
    setToast(r.ok ? 'Accordo stretto!' : r.reason || 'Rifiutato');
    setTimeout(() => setToast(null), 2500);
    if (r.ok) setTarget(null);
  };

  const openDebts = state.debts.filter((d) => !d.resolved);
  const activeDeals = state.pendingDeals.filter((d) => d.active && !d.fulfilled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Handshake className="text-amber-400" />}>Geopolitica & Partitini</SectionTitle>
        <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 rounded-lg border border-stone-700 px-3 py-1.5 text-xs text-stone-300 hover:border-amber-600 hover:text-amber-300">
          <Info size={14} /> Come funziona
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-stone-800 bg-stone-900/50 p-3">
        {Object.entries(RELATION_LABELS).map(([k, v]) => (
          <div key={k} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${v.bg}`}>
            <span className={`font-bold ${v.color}`}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Contrade grid — sorted by relation */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...others].sort((a, b) => state.contradeRelations[player][b.id] - state.contradeRelations[player][a.id]).map((c) => {
          const rel = state.contradeRelations[player][c.id];
          const lvl = relationLevel(rel);
          const meta = RELATION_LABELS[lvl];
          const isRival = c.id === CONTRADA_BY_ID[player].rivalId;
          return (
            <div
              key={c.id}
              className={`flex items-center justify-between rounded-xl border p-3 ${meta.bg}`}
            >
              <div className="flex items-center gap-3">
                <ContradaFlag contradaId={c.id} size={32} />
                <div>
                  <div className="font-serif font-bold text-amber-100">
                    {c.title ? `${c.title} ` : ''}{c.name}
                    {isRival && <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-red-900 px-1.5 py-0.5 text-[10px] font-bold text-red-200">RIVALE</span>}
                  </div>
                  <div className={`text-xs font-semibold ${meta.color}`}>
                    {meta.label} ({rel > 0 ? '+' : ''}{rel})
                  </div>
                </div>
              </div>
              <button
                disabled={rel <= -100 || state.credibility <= 0}
                onClick={() => openDeal(c.id)}
                className="rounded-lg bg-amber-600/80 px-3 py-1.5 text-xs font-semibold text-stone-950 transition hover:bg-amber-500 disabled:opacity-30"
              >
                {rel <= -100 ? <Ban size={14} /> : 'Tratta'}
              </button>
            </div>
          );
        })}
      </div>

      {state.credibility <= 0 && (
        <div className="rounded-xl border border-red-700 bg-red-950/30 p-4 text-sm text-red-200">
          La tua credibilità è a zero. Nessuna contrada tratterà con te finché non si ristabilisce.
        </div>
      )}

      {/* Active deals for this palio */}
      {activeDeals.length > 0 && (
        <div className="rounded-2xl border border-amber-800/30 bg-amber-950/10 p-5">
          <SectionTitle icon={<Flag className="text-amber-400" />}>Partitini Attivi per questo Palio</SectionTitle>
          <div className="mt-3 space-y-2">
            {activeDeals.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-lg border border-amber-800/30 bg-amber-950/20 p-2.5 text-sm text-amber-100">
                <ContradaFlag contradaId={d.contradaId} size={24} />
                <span><strong>{CONTRADA_BY_ID[d.contradaId].name}</strong>: {dealTypeLabel(d.type)}
                  {d.targetContradaId && <span> → <strong>{CONTRADA_BY_ID[d.targetContradaId].name}</strong></span>}
                </span>
                <span className="ml-auto text-xs text-amber-400">{d.payment === 'cash' ? euro(d.amount) : 'favore futuro'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debt registry */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5">
        <SectionTitle icon={<ScrollText className="text-amber-400" />}>Registro Debiti & Favori Pendenti</SectionTitle>
        {openDebts.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Nessun debito o credito aperto.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {openDebts.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-stone-700 bg-stone-800/40 p-3">
                <div className="flex items-center gap-2">
                  <ContradaFlag contradaId={d.contradaId} size={24} />
                  <div>
                    <span className={`text-xs font-bold ${d.direction === 'credito' ? 'text-emerald-300' : 'text-red-300'}`}>
                      {d.direction === 'credito' ? 'TI DEVE' : 'GLI DEVI'}
                    </span>
                    <span className="ml-2 text-sm text-stone-200">{CONTRADA_BY_ID[d.contradaId].name}</span>
                    <span className="ml-2 text-xs text-stone-400">{d.description}</span>
                  </div>
                </div>
                {d.direction === 'debito' && (
                  <div className="flex gap-2">
                    <button onClick={() => game.doResolveDebt(d.id, true)} className="flex items-center gap-1 rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600">
                      <Check size={12} /> Onora
                    </button>
                    <button onClick={() => game.doResolveDebt(d.id, false)} className="flex items-center gap-1 rounded bg-red-800 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700">
                      <X size={12} /> Rifiuta
                    </button>
                  </div>
                )}
                {d.direction === 'credito' && (
                  <div className="flex gap-2">
                    <button onClick={() => game.doResolveDebt(d.id, true)} className="rounded bg-amber-600 px-2 py-1 text-xs font-semibold text-stone-950 hover:bg-amber-500">
                      Riscuoti
                    </button>
                    <button onClick={() => game.doResolveDebt(d.id, false)} className="rounded bg-stone-700 px-2 py-1 text-xs text-stone-300 hover:bg-stone-600">
                      Lascia
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-stone-500">
          Rifiutarti di onorare un debito farà crollare la tua credibilità a zero: nessuna contrada tratterà con te per 3 anni.
        </p>
      </div>

      {/* Deal modal */}
      <Modal open={!!target} onClose={() => setTarget(null)} title={target ? `Trattativa con ${CONTRADA_BY_ID[target].title ? CONTRADA_BY_ID[target].title + ' ' : ''}${CONTRADA_BY_ID[target].name}` : ''}>
        {target && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-stone-700 bg-stone-800/40 p-3">
              <ContradaFlag contradaId={target} size={36} />
              <div>
                <div className="font-serif font-bold text-amber-100">{CONTRADA_BY_ID[target].title ? `${CONTRADA_BY_ID[target].title} ` : ''}{CONTRADA_BY_ID[target].name}</div>
                <div className={`text-xs ${RELATION_LABELS[relationLevel(state.contradeRelations[player][target])].color}`}>
                  Relazione attuale: {state.contradeRelations[player][target] > 0 ? '+' : ''}{state.contradeRelations[player][target]}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-stone-400">Tipo di accordo</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {([
                  { k: 'aiuto', label: 'Aiuto in pista', desc: 'Ti assiste durante la corsa', icon: <Handshake size={14} /> },
                  { k: 'neutralita', label: 'Compra neutralità', desc: 'Non ti ostacola', icon: <Coins size={14} /> },
                  { k: 'ostacolo', label: 'Ostacola rivale', desc: 'Blocca una contrada', icon: <Swords size={14} /> },
                  { k: 'strada', label: 'Lascia strada', desc: 'Ti favorisce alla mossa', icon: <Flag size={14} /> },
                ] as const).map((o) => (
                  <button
                    key={o.k}
                    onClick={() => setDealType(o.k)}
                    className={`flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left transition ${
                      dealType === o.k ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-stone-700 text-stone-300 hover:border-stone-500'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-semibold">{o.icon} {o.label}</span>
                    <span className="text-[10px] text-stone-400">{o.desc}</span>
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
                <button
                  onClick={() => setPayment('cash')}
                  className={`flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left ${payment === 'cash' ? 'border-amber-400 bg-amber-500/20' : 'border-stone-700'}`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold"><Coins size={14} /> Contanti</span>
                  <span className="text-[10px] text-stone-400">Paga subito dal budget</span>
                </button>
                <button
                  onClick={() => setPayment('favore')}
                  className={`flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left ${payment === 'favore' ? 'border-amber-400 bg-amber-500/20' : 'border-stone-700'}`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold"><Gift size={14} /> Favore Futuro</span>
                  <span className="text-[10px] text-stone-400">Debito d'onore: dovrai ricambiare</span>
                </button>
              </div>
            </div>

            {payment === 'cash' && (
              <div>
                <label className="text-xs uppercase tracking-wide text-stone-400">Offerta (€)</label>
                <input
                  type="number"
                  value={amount}
                  min={1000}
                  step={1000}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-2 w-full rounded-lg border border-stone-700 bg-stone-800 p-2 text-sm text-stone-100"
                />
                <p className="mt-1 text-xs text-stone-500">Budget disponibile: {euro(state.budget)}</p>
              </div>
            )}

            <div className="rounded-lg border border-stone-700 bg-stone-800/30 p-3 text-xs text-stone-400">
              <strong className="text-stone-300">Probabilità di successo:</strong> più alta è la relazione e la tua credibilità, più facile sarà ottenere l'accordo. Le contrade alleate accettano quasi sempre; quelle in veto rifiutano sempre.
            </div>

            <button
              onClick={submit}
              disabled={dealType === 'ostacolo' && !ostacoloTarget}
              className="w-full rounded-xl bg-amber-500 py-3 font-serif font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-40"
            >
              Proponi Accordo
            </button>
            {toast && <p className="text-center text-sm text-amber-300">{toast}</p>}
          </div>
        )}
      </Modal>

      {/* Help modal */}
      <Modal open={showHelp} onClose={() => setShowHelp(false)} title="Come funzionano le alleanze" maxWidth="max-w-xl">
        <div className="space-y-3 text-sm text-stone-300">
          <p><Heart size={14} className="mr-1 inline text-emerald-400" /> <strong className="text-amber-200">Alleata (+51/+100):</strong> Contrada aggregata storica. Accetta quasi sempre accordi e ti aiuta attivamente in pista.</p>
          <p><Handshake size={14} className="mr-1 inline text-sky-400" /> <strong className="text-amber-200">Simpatia (+1/+50):</strong> Rapporti amichevoli, accordi facili ma non garantiti.</p>
          <p><span className="mr-1 inline-block h-3 w-3 rounded-full bg-slate-500 align-middle" /> <strong className="text-amber-200">Neutra (0):</strong> Nessun rapporto. Trattative possibili ma incerte.</p>
          <p><Swords size={14} className="mr-1 inline text-orange-400" /> <strong className="text-amber-200">Tesa (-1/-50):</strong> Sospetto e diffidenza. Accordi difficili e costosi.</p>
          <p><Ban size={14} className="mr-1 inline text-red-400" /> <strong className="text-amber-200">Veto (-100):</strong> Rivalità ufficiale. Nessun accordo possibile, mai.</p>
          <div className="border-t border-stone-700 pt-3">
            <p><strong className="text-amber-200">Favori Futuri:</strong> Se paghi con un favore futuro invece di contanti, crei un debito d'onore. La contrada potrà tornare a riscuoterlo in un Palio successivo. Se ti rifiuti di onorarlo, la tua credibilità crolla a zero e nessuno tratterà con te per 3 anni.</p>
          </div>
          <div className="border-t border-stone-700 pt-3">
            <p><strong className="text-amber-200">Tipi di accordo:</strong></p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li><strong>Aiuto in pista:</strong> la contrada ti favorisce attivamente durante la corsa</li>
              <li><strong>Compra neutralità:</strong> la contrada non ti ostacolerà</li>
              <li><strong>Ostacola rivale:</strong> la contrada blocca fisicamente una contrada che tu indichi</li>
              <li><strong>Lascia strada alla mossa:</strong> ti favorisce alla partenza</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function dealTypeLabel(type: PendingDeal['type']): string {
  switch (type) {
    case 'aiuto': return 'aiuto in pista';
    case 'neutralita': return 'neutralità';
    case 'ostacolo': return 'ostacola';
    case 'strada': return 'lascia strada';
  }
}
