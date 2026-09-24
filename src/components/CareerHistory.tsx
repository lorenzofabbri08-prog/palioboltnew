import type { GameState } from '@/game/types';
import { CONTRADA_BY_ID, JOCKEY_BY_ID } from '@/game/data';
import { ContradaFlag } from './ContradaFlag';
import { SectionTitle, euro } from './ui';
import { ScrollText, Trophy, Skull, Award } from 'lucide-react';

export function CareerHistory({ state }: { state: GameState }) {
  const playerWins = state.history.filter((h) => h.winnerContradaId === state.playerContradaId).length;
  const purgas = state.history.filter((h) => h.scudisciato).length;
  const total = state.history.length;

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-3 text-center">
          <Trophy className="mx-auto mb-1 text-amber-400" size={20} />
          <div className="font-serif text-2xl font-black text-amber-200">{playerWins}</div>
          <div className="text-[10px] uppercase text-stone-400">Vittorie</div>
        </div>
        <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-3 text-center">
          <Skull className="mx-auto mb-1 text-red-400" size={20} />
          <div className="font-serif text-2xl font-black text-red-300">{purgas}</div>
          <div className="text-[10px] uppercase text-stone-400">Purghe</div>
        </div>
        <div className="rounded-xl border border-stone-700 bg-stone-900/50 p-3 text-center">
          <Award className="mx-auto mb-1 text-stone-400" size={20} />
          <div className="font-serif text-2xl font-black text-stone-200">{total}</div>
          <div className="text-[10px] uppercase text-stone-400">Palii corsi</div>
        </div>
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-stone-800 bg-stone-900/50 p-4 text-center text-sm text-stone-500">
          Non hai ancora corso nessun Palio. Avanza le fasi fino alla corsa!
        </p>
      ) : (
        <div className="space-y-2">
          <SectionTitle icon={<ScrollText className="text-amber-400" />}>Resoconto Palii</SectionTitle>
          {[...state.history].reverse().map((r) => {
            const winner = CONTRADA_BY_ID[r.winnerContradaId];
            const isWin = r.winnerContradaId === r.playerContradaId;
            const isPurga = r.scudisciato;
            const playerJ = r.playerJockeyId ? JOCKEY_BY_ID[r.playerJockeyId] : null;
            return (
              <div
                key={`${r.turn}-${r.palioIndex}`}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isWin ? 'border-amber-500/50 bg-amber-950/20' : isPurga ? 'border-red-800/50 bg-red-950/20' : 'border-stone-700 bg-stone-900/40'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-stone-400">{r.palioIndex === 0 ? 'Lug' : 'Ago'}</span>
                  <span className="font-serif text-sm font-bold text-amber-200">{r.year}</span>
                </div>
                <div className="h-8 w-1 rounded-full" style={{ backgroundColor: winner.colors.bg }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isWin ? <Trophy size={14} className="text-amber-400" /> : isPurga ? <Skull size={14} className="text-red-400" /> : null}
                    <span className="font-serif text-sm font-bold text-stone-100">
                      {isWin ? 'VITTORIA!' : isPurga ? 'PURGA' : `Vinto da ${winner.name}`}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400">
                    Tu: {r.playerFinished}° con {playerJ ? `"${playerJ.nickname}"` : '—'} su {r.playerHorse}
                    {' · '}Budget {euro(r.budgetAfter)} · Morale {r.moraleAfter}%
                  </div>
                </div>
                <ContradaFlag contradaId={r.winnerContradaId} size={28} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
