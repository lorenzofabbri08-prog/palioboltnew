import { useState } from 'react';
import { CONTRADE } from '@/game/data';
import { useGame } from '@/game/useGame';
import { Flag } from 'lucide-react';
import { ContradaFlag } from './ContradaFlag';

export function ContradaSelect({ game }: { game: ReturnType<typeof useGame> }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-black px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-3">
            <Flag className="text-amber-400" size={40} />
            <h1 className="font-serif text-4xl font-black tracking-tight text-amber-100 sm:text-5xl">
              Capitano Simulator
            </h1>
            <Flag className="text-amber-400" size={40} />
          </div>
          <p className="font-serif text-xl text-amber-300/80">Il Palio di Siena</p>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-stone-400">
            Assumi la carica di Capitano di una Contrada. Diplomazia, finanza, spionaggio e corruzione:
            conduci la tua Contrada alla gloria del Cencio. La partita è salvata in locale: puoi continuare offline in qualsiasi momento.
          </p>
        </div>

        <h2 className="mb-4 text-center font-serif text-lg text-amber-200">Scegli la tua Contrada</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {CONTRADE.map((c) => {
            const isSel = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`group relative flex flex-col items-center overflow-hidden rounded-xl border-2 p-3 text-center transition-all ${
                  isSel ? 'scale-105 border-amber-400 shadow-lg shadow-amber-500/30' : 'border-stone-700 hover:border-amber-600/60'
                }`}
                style={{ backgroundColor: c.colors.bg, color: c.colors.fg }}
              >
                <ContradaFlag contradaId={c.id} size={36} className="mb-1.5" />
                <div className="font-serif text-sm font-bold leading-tight">{c.title ? `${c.title} ` : ''}{c.name}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            disabled={!selected}
            onClick={() => selected && game.startNew(selected)}
            className="rounded-xl bg-amber-500 px-8 py-3 font-serif text-lg font-bold text-stone-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Inizia la Carriera
          </button>
        </div>

        {game.state && (
          <div className="mt-6 text-center">
            <button onClick={game.reset} className="text-sm text-stone-500 underline hover:text-stone-300">
              Cancella salvataggio esistente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
