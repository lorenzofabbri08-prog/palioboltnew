import { useState, useCallback, useEffect } from 'react';
import { useGame } from '@/game/useGame';
import { ContradaSelect } from '@/components/ContradaSelect';
import { TabUfficio } from '@/components/TabUfficio';
import { TabDiplomazia } from '@/components/TabDiplomazia';
import { TabMercato } from '@/components/TabMercato';
import { TabCorsa } from '@/components/TabCorsa';
import { CareerHistory } from '@/components/CareerHistory';
import { TabStatistiche } from '@/components/TabStatistiche';
import { TabCarrieraFantino } from '@/components/TabCarrieraFantino';
import { ContradaFlag } from '@/components/ContradaFlag';
import { CONTRADA_BY_ID } from '@/game/data';
import {
  loadJockeyCareer, saveJockeyCareer, clearJockeyCareer, createJockeyCareer,
} from '@/game/jockeyEngine';
import type { JockeyCareerState } from '@/game/types';
import {
  Briefcase,
  Handshake,
  Users,
  Flag,
  RotateCcw,
  ScrollText,
  BarChart3,
  User,
  Crown,
} from 'lucide-react';

type TabId = 'ufficio' | 'diplomazia' | 'mercato' | 'corsa' | 'carriera' | 'statistiche';
type AppMode = 'select' | 'capitano' | 'fantino';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'ufficio', label: 'Ufficio', icon: <Briefcase size={18} /> },
  { id: 'diplomazia', label: 'Geopolitica', icon: <Handshake size={18} /> },
  { id: 'mercato', label: 'Stalla', icon: <Users size={18} /> },
  { id: 'corsa', label: 'La Corsa', icon: <Flag size={18} /> },
  { id: 'carriera', label: 'Carriera', icon: <ScrollText size={18} /> },
  { id: 'statistiche', label: 'Statistiche', icon: <BarChart3 size={18} /> },
];

function ModeSelect({ onSelect }: { onSelect: (m: 'capitano' | 'fantino') => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: '#c9a96a' }}>
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-black text-stone-900">Il Palio di Siena</h1>
          <p className="mt-2 font-serif text-lg text-stone-700">Scegli il tuo ruolo</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Capitano */}
          <button
            onClick={() => onSelect('capitano')}
            className="group rounded-2xl border-2 border-stone-800 bg-stone-950 p-6 text-left transition hover:border-amber-500 hover:shadow-xl hover:shadow-amber-900/30"
          >
            <Crown className="mb-3 text-amber-400 group-hover:scale-110 transition" size={40} />
            <h2 className="font-serif text-xl font-bold text-amber-100">Modulo Capitano</h2>
            <p className="mt-2 text-sm text-stone-400">
              Guidi una contrada. Ingaggia fantini, gestisci la diplomazia, corrompi avversari e porta la tua contrada alla vittoria.
            </p>
          </button>
          {/* Fantino */}
          <button
            onClick={() => onSelect('fantino')}
            className="group rounded-2xl border-2 border-stone-800 bg-stone-950 p-6 text-left transition hover:border-red-500 hover:shadow-xl hover:shadow-red-900/30"
          >
            <User className="mb-3 text-red-400 group-hover:scale-110 transition" size={40} />
            <h2 className="font-serif text-xl font-bold text-amber-100">Carriera Fantino</h2>
            <p className="mt-2 text-sm text-stone-400">
              Sei tu il fantino. Scegli il soprannome, l'indice killer, accetta o rifiuta proposte di monta. Fatti corrompere o resta onesto.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState<TabId>('ufficio');
  const [mode, setMode] = useState<AppMode>(() => {
    if (loadJockeyCareer()) return 'fantino';
    return 'select';
  });
  const [jockeyState, setJockeyState] = useState<JockeyCareerState | null>(() => loadJockeyCareer());

  const goToCorsa = useCallback(() => setTab('corsa'), []);

  // Autosave jockey career
  useEffect(() => {
    if (jockeyState && mode === 'fantino') {
      const t = setTimeout(() => saveJockeyCareer(jockeyState), 300);
      return () => clearTimeout(t);
    }
  }, [jockeyState, mode]);

  // ── Mode select ──
  if (mode === 'select') {
    return <ModeSelect onSelect={(m) => {
      if (m === 'fantino') {
        const existing = loadJockeyCareer();
        if (existing) {
          setJockeyState(existing);
          setMode('fantino');
        } else {
          const fresh = createJockeyCareer('nuovo', 5);
          fresh.phase = 'creation';
          setJockeyState(fresh);
          setMode('fantino');
        }
      } else {
        setMode('capitano');
      }
    }} />;
  }

  // ── Fantino mode ──
  if (mode === 'fantino') {
    if (!jockeyState) {
      const fresh = createJockeyCareer('nuovo', 5);
      fresh.phase = 'creation';
      setJockeyState(fresh);
      return null;
    }

    return (
      <div className="min-h-screen text-stone-100" style={{ backgroundColor: '#c9a96a' }}>
        <header className="sticky top-0 z-40 border-b border-amber-900/30 bg-stone-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <User className="text-red-400" size={28} />
              <div>
                <h1 className="font-serif text-lg font-black leading-none text-amber-100">Carriera Fantino</h1>
                <p className="text-[11px] text-stone-400">"{jockeyState.nickname}" · {jockeyState.palioIndex === 0 ? 'Luglio' : 'Agosto'} {jockeyState.year}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="hidden text-right sm:block">
                <div className="text-stone-400">Reputazione</div>
                <div className={`font-bold ${jockeyState.reputation < 20 ? 'text-red-400' : 'text-amber-300'}`}>{jockeyState.reputation}</div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-stone-400">Patrimonio</div>
                <div className="font-bold text-emerald-400">€{jockeyState.wealth.toLocaleString('it-IT')}</div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Vuoi abbandonare la carriera e tornare al menu? Il salvataggio sarà cancellato.')) {
                    clearJockeyCareer();
                    setJockeyState(null);
                    setMode('select');
                  }
                }}
                className="rounded-lg border border-stone-700 p-2 text-stone-400 hover:border-red-700 hover:text-red-300"
                title="Torna al menu"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-6">
          <TabCarrieraFantino state={jockeyState} setState={setJockeyState} />
        </main>

        <footer className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-stone-600">
          Carriera Fantino · Il Palio di Siena · Salvataggio automatico in locale
        </footer>
      </div>
    );
  }

  // ── Capitano mode (existing game) ──
  if (!game.state) {
    return <ContradaSelect game={game} />;
  }

  const state = game.state;
  const c = CONTRADA_BY_ID[state.playerContradaId];

  return (
    <div className="min-h-screen text-stone-100" style={{ backgroundColor: '#c9a96a' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-amber-900/30 bg-stone-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <ContradaFlag contradaId={state.playerContradaId} size={32} />
            <div>
              <h1 className="font-serif text-lg font-black leading-none text-amber-100">Capitano Simulator</h1>
              <p className="text-[11px] text-stone-400">
                {c.title ? `${c.title} ` : ''}{c.name} · {state.palioIndex === 0 ? 'Palio di Luglio' : 'Palio di Agosto'} {state.year}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden text-right sm:block">
              <div className="text-stone-400">Budget</div>
              <div className="font-bold text-amber-300">€{state.budget.toLocaleString('it-IT')}</div>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-stone-400">Morale</div>
              <div className={`font-bold ${state.morale < 30 ? 'text-red-400' : 'text-emerald-400'}`}>{state.morale}%</div>
            </div>
            <button
              onClick={() => {
                if (confirm('Vuoi davvero abbandonare la carriera e ricominciare? Il salvataggio sarà cancellato.')) {
                  game.reset();
                  setMode('select');
                }
              }}
              className="rounded-lg border border-stone-700 p-2 text-stone-400 hover:border-red-700 hover:text-red-300"
              title="Ricomincia"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mx-auto max-w-6xl px-4">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === t.id
                    ? 'bg-amber-500 text-stone-950'
                    : 'text-stone-300 hover:bg-stone-800'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === 'ufficio' && <TabUfficio state={state} game={game} onGoToCorsa={goToCorsa} />}
        {tab === 'diplomazia' && <TabDiplomazia state={state} game={game} />}
        {tab === 'mercato' && <TabMercato state={state} game={game} />}
        {tab === 'corsa' && <TabCorsa state={state} game={game} />}
        {tab === 'carriera' && <CareerHistory state={state} />}
        {tab === 'statistiche' && <TabStatistiche state={state} />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-stone-600">
        Capitano Simulator · Il Palio di Siena · Salvataggio automatico in locale · Continua offline
      </footer>

      {game.flash && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in">
          <div className="rounded-xl border border-amber-600/50 bg-stone-950/95 px-5 py-3 text-sm font-semibold text-amber-200 shadow-xl">
            {game.flash}
          </div>
        </div>
      )}
    </div>
  );
}
