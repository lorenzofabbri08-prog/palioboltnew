import { useMemo, useState } from 'react';
import type { GameState } from '@/game/types';
import { JOCKEYS, JOCKEY_BY_ID, CONTRADA_BY_ID, CONTRADE } from '@/game/data';
import { ContradaFlag } from './ContradaFlag';
import { SectionTitle } from './ui';
import { Trophy, TrendingDown, Award, Flag as FlagIcon, User, Crown, AlertTriangle, Sparkles, History } from 'lucide-react';

type SortKey = 'wins' | 'palii' | 'cadute' | 'scosseVinte';

export function TabStatistiche({ state }: { state: GameState }) {
  const [sortKey, setSortKey] = useState<SortKey>('wins');

  const stats = useMemo(() => {
    const jStats: Record<string, { wins: number; palii: number; cadute: number; scosseVinte: number; positions: number[] }> = {};
    const hStats: Record<string, { wins: number; palii: number }> = {};
    const cStats: Record<string, { wins: number; palii: number; scudisci: number }> = {};

    for (const j of JOCKEYS) {
      jStats[j.id] = { wins: 0, palii: 0, cadute: 0, scosseVinte: 0, positions: [] };
    }
    for (const c of CONTRADE) {
      cStats[c.id] = { wins: 0, palii: 0, scudisci: 0 };
    }

    for (const r of state.history) {
      // Contrada stats
      if (cStats[r.winnerContradaId]) cStats[r.winnerContradaId].wins++;
      for (const fr of r.fullResult) {
        if (cStats[fr.contradaId]) {
          cStats[fr.contradaId].palii++;
          if (r.scudisciato && fr.contradaId === r.playerContradaId) cStats[fr.contradaId].scudisci++;
        }
      }

      // Horse stats
      if (!hStats[r.winnerHorse]) hStats[r.winnerHorse] = { wins: 0, palii: 0 };
      hStats[r.winnerHorse].wins++;
      for (const fr of r.fullResult) {
        if (!hStats[fr.horse]) hStats[fr.horse] = { wins: 0, palii: 0 };
        hStats[fr.horse].palii++;
      }

      // Jockey stats
      for (const fr of r.fullResult) {
        if (!fr.jockeyId || !jStats[fr.jockeyId]) continue;
        jStats[fr.jockeyId].palii++;
        jStats[fr.jockeyId].positions.push(fr.finished);
        if (fr.fallen) jStats[fr.jockeyId].cadute++;
        if (fr.finished === 1) {
          jStats[fr.jockeyId].wins++;
          if (fr.fallen) jStats[fr.jockeyId].scosseVinte++;
        }
      }
    }

    return { jStats, hStats, cStats };
  }, [state.history]);

  const jockeyMounts = useMemo(() => {
    const mounts: Record<string, { byContrada: Record<string, number>; palii: { year: number; palioIndex: number; contradaId: string; won: boolean; fallen: boolean; purgato: boolean }[] }> = {};
    for (const j of JOCKEYS) {
      mounts[j.id] = { byContrada: {}, palii: [] };
    }
    for (const r of state.history) {
      for (const fr of r.fullResult) {
        if (!fr.jockeyId || !mounts[fr.jockeyId]) continue;
        mounts[fr.jockeyId].byContrada[fr.contradaId] = (mounts[fr.jockeyId].byContrada[fr.contradaId] || 0) + 1;
        const contrada = CONTRADA_BY_ID[fr.contradaId];
        const purgato = contrada?.rivalId ? r.winnerContradaId === contrada.rivalId : false;
        mounts[fr.jockeyId].palii.push({
          year: r.year,
          palioIndex: r.palioIndex,
          contradaId: fr.contradaId,
          won: fr.finished === 1,
          fallen: fr.fallen,
          purgato,
        });
      }
    }
    return mounts;
  }, [state.history]);

  const sortedJockeys = useMemo(() => {
    return [...JOCKEYS].sort((a, b) => {
      const sa = stats.jStats[a.id];
      const sb = stats.jStats[b.id];
      switch (sortKey) {
        case 'wins': return sb.wins - sa.wins || sb.palii - sa.palii;
        case 'palii': return sb.palii - sa.palii || sb.wins - sa.wins;
        case 'cadute': return sb.cadute - sa.cadute || sb.palii - sa.palii;
        case 'scosseVinte': return sb.scosseVinte - sa.scosseVinte || sb.wins - sa.wins;
      }
    });
  }, [stats, sortKey]);

  const sortedHorses = useMemo(() => {
    return Object.entries(stats.hStats)
      .filter(([, h]) => h.palii > 0)
      .sort((a, b) => b[1].wins - a[1].wins || b[1].palii - a[1].palii);
  }, [stats]);

  const sortedContrade = useMemo(() => {
    return [...CONTRADE].sort((a, b) => {
      const ca = stats.cStats[a.id];
      const cb = stats.cStats[b.id];
      return cb.wins - ca.wins || cb.palii - ca.palii;
    });
  }, [stats]);

  const totalPalii = state.history.length;

  return (
    <div className="space-y-6">
      <SectionTitle icon={<Award className="text-amber-400" />}>Statistiche Palio</SectionTitle>

      {totalPalii === 0 ? (
        <p className="rounded-xl border border-stone-800 bg-stone-900/50 p-4 text-center text-sm text-stone-500">
          Non hai ancora corso nessun Palio. Avanza le fasi fino alla corsa per vedere le statistiche!
        </p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-3 text-center">
              <Trophy className="mx-auto mb-1 text-amber-400" size={18} />
              <div className="font-serif text-xl font-black text-amber-200">{totalPalii}</div>
              <div className="text-[10px] uppercase text-stone-400">Palii corsi</div>
            </div>
            <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-3 text-center">
              <Crown className="mx-auto mb-1 text-emerald-400" size={18} />
              <div className="font-serif text-xl font-black text-emerald-200">
                {Object.values(stats.hStats).reduce((s, h) => s + h.wins, 0)}
              </div>
              <div className="text-[10px] uppercase text-stone-400">Vittorie totali</div>
            </div>
            <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-3 text-center">
              <TrendingDown className="mx-auto mb-1 text-red-400" size={18} />
              <div className="font-serif text-xl font-black text-red-300">
                {Object.values(stats.jStats).reduce((s, j) => s + j.cadute, 0)}
              </div>
              <div className="text-[10px] uppercase text-stone-400">Cadute totali</div>
            </div>
            <div className="rounded-xl border border-sky-700/40 bg-sky-950/20 p-3 text-center">
              <AlertTriangle className="mx-auto mb-1 text-sky-400" size={18} />
              <div className="font-serif text-xl font-black text-sky-200">
                {Object.values(stats.jStats).reduce((s, j) => s + j.scosseVinte, 0)}
              </div>
              <div className="text-[10px] uppercase text-stone-400">Vittorie da scosso</div>
            </div>
          </div>

          {/* Jockey stats */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-200">
              <User size={16} /> Classifica Fantini
            </h3>
            <div className="mb-3 flex flex-wrap gap-2">
              {([
                { key: 'wins', label: 'Vittorie' },
                { key: 'palii', label: 'Palii corsi' },
                { key: 'cadute', label: 'Cadute' },
                { key: 'scosseVinte', label: 'Vittorie da scosso' },
              ] as { key: SortKey; label: string }[]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    sortKey === opt.key ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto rounded-xl border border-stone-800">
              <table className="w-full text-sm">
                <thead className="bg-stone-900/80 text-xs text-stone-400">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Fantino</th>
                    <th className="px-3 py-2 text-center">Palii</th>
                    <th className="px-3 py-2 text-center">Vittorie</th>
                    <th className="px-3 py-2 text-center">Cadute</th>
                    <th className="px-3 py-2 text-center">Scosse vinte</th>
                    <th className="px-3 py-2 text-center">Pos. media</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedJockeys.map((j, i) => {
                    const st = stats.jStats[j.id];
                    const avgPos = st.positions.length > 0
                      ? (st.positions.reduce((s, p) => s + p, 0) / st.positions.length).toFixed(1)
                      : '—';
                    return (
                      <tr
                        key={j.id}
                        className={`border-t border-stone-800 ${st.wins > 0 ? 'bg-amber-950/10' : ''}`}
                      >
                        <td className="px-3 py-2 text-stone-500">{i + 1}</td>
                        <td className="px-3 py-2">
                          <span className="font-serif font-bold text-amber-100">"{j.nickname}"</span>
                          <span className="ml-2 text-sm font-bold text-amber-300/90">{j.overall} ovr</span>
                        </td>
                        <td className="px-3 py-2 text-center text-stone-300">{st.palii}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-bold ${st.wins > 0 ? 'text-amber-300' : 'text-stone-500'}`}>
                            {st.wins}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={st.cadute > 0 ? 'text-red-400' : 'text-stone-500'}>{st.cadute}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={st.scosseVinte > 0 ? 'text-sky-300 font-bold' : 'text-stone-500'}>
                            {st.scosseVinte}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-stone-400">{avgPos}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-jockey mount history */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-200">
              <History size={16} /> Fantini: Presenze per Contrada
            </h3>
            <p className="mb-3 text-xs text-stone-500">
              Per ogni fantino, quante volte ha montato in ogni contrada. La contrada con più presenze è evidenziata.
            </p>
            <div className="space-y-2">
              {sortedJockeys.filter((j) => stats.jStats[j.id].palii > 0).map((j) => {
                const mounts = jockeyMounts[j.id];
                const total = stats.jStats[j.id].palii;
                if (total === 0) return null;
                const maxContrada = Object.entries(mounts.byContrada).sort((a, b) => b[1] - a[1])[0];
                const maxContradaId = maxContrada?.[0];
                const maxCount = maxContrada?.[1] || 0;
                return (
                  <div key={j.id} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-amber-100">"{j.nickname}"</span>
                        <span className="text-xs text-stone-400">{total} palii corsi</span>
                      </div>
                      {maxContradaId && maxCount > 1 && (
                        <div className="flex items-center gap-1.5 rounded-lg border border-amber-700/50 bg-amber-950/30 px-2 py-1 text-xs">
                          <ContradaFlag contradaId={maxContradaId} size={16} />
                          <span className="font-bold text-amber-300">
                            Più volte: {CONTRADA_BY_ID[maxContradaId]?.name} ({maxCount}×)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(mounts.byContrada).sort((a, b) => b[1] - a[1]).map(([cid, count]) => {
                        const isMax = cid === maxContradaId && maxCount > 1;
                        return (
                          <div
                            key={cid}
                            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${
                              isMax
                                ? 'border-amber-600 bg-amber-950/40'
                                : 'border-stone-700 bg-stone-800/40'
                            }`}
                          >
                            <ContradaFlag contradaId={cid} size={14} />
                            <span className={isMax ? 'font-bold text-amber-200' : 'text-stone-300'}>
                              {CONTRADA_BY_ID[cid]?.name}
                            </span>
                            <span className={`font-bold ${isMax ? 'text-amber-400' : 'text-stone-500'}`}>{count}×</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 border-t border-stone-800/60 pt-2">
                      <div className="text-[10px] uppercase text-stone-500">Palii disputati</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {mounts.palii.map((p, idx) => {
                          const isWin = p.won;
                          const isPurgato = p.purgato;
                          return (
                            <span
                              key={idx}
                              className={`rounded px-1.5 py-0.5 text-[10px] ${
                                isWin
                                  ? 'bg-amber-950/60 text-amber-300 font-bold ring-1 ring-amber-700/50'
                                  : isPurgato
                                  ? 'bg-red-950/50 text-red-400 font-bold ring-1 ring-red-800/50'
                                  : 'bg-stone-800/60 text-stone-400'
                              }`}
                              title={isPurgato ? 'Purgato: la rivale ha vinto il Palio' : undefined}
                            >
                              {isWin && '🏆 '}
                              {isPurgato && !isWin && '⚡ '}
                              {p.year} {p.palioIndex === 0 ? 'Lug' : 'Ago'}
                              <span className="ml-1 text-stone-600">·</span>
                              <span className="ml-0.5">{CONTRADA_BY_ID[p.contradaId]?.name}</span>
                              {isWin && <span className="ml-1 text-amber-500">VIT</span>}
                              {isPurgato && !isWin && <span className="ml-1 text-red-500">PURG</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Horse stats */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-200">
              <Sparkles size={16} /> Classifica Cavalli
            </h3>
            <div className="overflow-x-auto rounded-xl border border-stone-800">
              <table className="w-full text-sm">
                <thead className="bg-stone-900/80 text-xs text-stone-400">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Cavallo</th>
                    <th className="px-3 py-2 text-center">Palii corsi</th>
                    <th className="px-3 py-2 text-center">Vittorie</th>
                    <th className="px-3 py-2 text-center">Win %</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHorses.map(([name, h], i) => (
                    <tr
                      key={name}
                      className={`border-t border-stone-800 ${h.wins > 0 ? 'bg-amber-950/10' : ''}`}
                    >
                      <td className="px-3 py-2 text-stone-500">{i + 1}</td>
                      <td className="px-3 py-2 font-serif font-bold text-amber-100">{name}</td>
                      <td className="px-3 py-2 text-center text-stone-300">{h.palii}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-bold ${h.wins > 0 ? 'text-amber-300' : 'text-stone-500'}`}>
                          {h.wins}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-stone-400">
                        {h.palii > 0 ? ((h.wins / h.palii) * 100).toFixed(1) + '%' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contrada stats */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-200">
              <FlagIcon size={16} /> Classifica Contrade
            </h3>
            <div className="overflow-x-auto rounded-xl border border-stone-800">
              <table className="w-full text-sm">
                <thead className="bg-stone-900/80 text-xs text-stone-400">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Contrada</th>
                    <th className="px-3 py-2 text-center">Palii corsi</th>
                    <th className="px-3 py-2 text-center">Vittorie</th>
                    <th className="px-3 py-2 text-center">Win %</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedContrade.map((c, i) => {
                    const st = stats.cStats[c.id];
                    return (
                      <tr
                        key={c.id}
                        className={`border-t border-stone-800 ${st.wins > 0 ? 'bg-amber-950/10' : ''}`}
                      >
                        <td className="px-3 py-2 text-stone-500">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <ContradaFlag contradaId={c.id} size={18} />
                            <span className="font-serif font-bold text-stone-100">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-stone-300">{st.palii}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-bold ${st.wins > 0 ? 'text-amber-300' : 'text-stone-500'}`}>
                            {st.wins}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-stone-400">
                          {st.palii > 0 ? ((st.wins / st.palii) * 100).toFixed(1) + '%' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-contrada Palio history */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-200">
              <History size={16} /> Contrade: Palii Disputati
            </h3>
            <p className="mb-3 text-xs text-stone-500">
              Per ogni contrada, i Palii corsi con cavallo e fantino. Le vittorie sono evidenziate in oro, le purghe (vittoria della rivale) in rosso.
            </p>
            <div className="space-y-2">
              {sortedContrade.filter((c) => stats.cStats[c.id].palii > 0).map((c) => {
                const palii: { year: number; palioIndex: number; jockeyId: string; horse: string; won: boolean; fallen: boolean; rivalWon: boolean }[] = [];
                for (const r of state.history) {
                  const fr = r.fullResult.find((f) => f.contradaId === c.id);
                  if (!fr) continue;
                  const rivalWon = c.rivalId ? r.winnerContradaId === c.rivalId : false;
                  palii.push({
                    year: r.year,
                    palioIndex: r.palioIndex,
                    jockeyId: fr.jockeyId,
                    horse: fr.horse,
                    won: fr.finished === 1,
                    fallen: fr.fallen,
                    rivalWon,
                  });
                }
                if (palii.length === 0) return null;
                const wins = palii.filter((p) => p.won).length;
                const scudisci = palii.filter((p) => p.rivalWon).length;
                return (
                  <div key={c.id} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ContradaFlag contradaId={c.id} size={18} />
                        <span className="font-serif font-bold text-stone-100">{c.name}</span>
                        <span className="text-xs text-stone-400">{palii.length} palii</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {wins > 0 && (
                          <span className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-2 py-1 font-bold text-amber-300">
                            {wins} vittorie
                          </span>
                        )}
                        {scudisci > 0 && (
                          <span className="rounded-lg border border-red-800/50 bg-red-950/30 px-2 py-1 font-bold text-red-400">
                            {scudisci} purghe
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {palii.map((p, idx) => {
                        const jName = JOCKEY_BY_ID[p.jockeyId]?.nickname || '—';
                        return (
                          <span
                            key={idx}
                            className={`rounded px-1.5 py-0.5 text-[10px] ${
                              p.won
                                ? 'bg-amber-950/60 text-amber-300 font-bold ring-1 ring-amber-700/50'
                                : p.rivalWon
                                ? 'bg-red-950/50 text-red-400 font-bold ring-1 ring-red-800/50'
                                : p.fallen
                                ? 'bg-red-950/30 text-red-300/80 ring-1 ring-red-900/40'
                                : 'bg-stone-800/60 text-stone-400'
                            }`}
                            title={
                              p.won ? `Vittoria: ${p.horse} con ${jName}` :
                              p.rivalWon ? `Purga: la rivale ha vinto il Palio` :
                              p.fallen ? `Caduta: ${p.horse} con ${jName}` :
                              `${p.horse} con ${jName}`
                            }
                          >
                            {p.won && '🏆 '}
                            {p.rivalWon && !p.won && '⚡ '}
                            {p.fallen && !p.won && !p.rivalWon && '↓ '}
                            {p.year} {p.palioIndex === 0 ? 'Lug' : 'Ago'}
                            <span className="ml-1 text-stone-600">·</span>
                            <span className="ml-0.5">{jName}</span>
                            <span className="ml-1 text-stone-600">·</span>
                            <span className="ml-0.5">{p.horse}</span>
                            {p.won && <span className="ml-1 text-amber-500">VIT</span>}
                            {p.rivalWon && !p.won && <span className="ml-1 text-red-500">SCUD</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-Palio history: accoppiata + cadute */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-200">
              <History size={16} /> Cronologia Palii
            </h3>
            <div className="space-y-2">
              {[...state.history].reverse().map((r) => {
                const palioLabel = r.palioIndex === 0 ? 'Luglio' : 'Agosto';
                const winner = r.fullResult.find((f) => f.finished === 1);
                const fallen = r.fullResult.filter((f) => f.fallen);
                return (
                  <div key={r.turn} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ContradaFlag contradaId={r.winnerContradaId} size={20} />
                        <span className="font-serif text-xs font-bold text-amber-200">
                          {r.year} · Palio di {palioLabel}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500">Turno {r.turn}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-[10px] uppercase text-stone-500">
                          <tr>
                            <th className="px-2 py-1 text-left">Pos.</th>
                            <th className="px-2 py-1 text-left">Contrada</th>
                            <th className="px-2 py-1 text-left">Fantino</th>
                            <th className="px-2 py-1 text-left">Cavallo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...r.fullResult].sort((a, b) => a.finished - b.finished).map((f) => {
                            const isWinner = f.finished === 1;
                            const isPlayer = f.contradaId === r.playerContradaId;
                            const isFallen = f.fallen;
                            return (
                              <tr
                                key={f.contradaId}
                                className={`border-t border-stone-800/60 ${isWinner ? 'bg-amber-950/20' : ''} ${isFallen ? 'bg-red-950/20' : ''}`}
                              >
                                <td className="px-2 py-1 text-stone-400">
                                  {isFallen ? (
                                    <span className="inline-flex items-center gap-0.5 text-red-400">
                                      <TrendingDown size={10} /> CAD
                                    </span>
                                  ) : (
                                    f.finished
                                  )}
                                </td>
                                <td className="px-2 py-1">
                                  <div className="flex items-center gap-1.5">
                                    <ContradaFlag contradaId={f.contradaId} size={14} />
                                    <span className={`font-serif font-bold ${isWinner ? 'text-amber-300' : isPlayer ? 'text-sky-300' : 'text-stone-200'}`}>
                                      {CONTRADA_BY_ID[f.contradaId]?.name}
                                    </span>
                                    {isPlayer && <span className="text-[9px] text-sky-400">TU</span>}
                                  </div>
                                </td>
                                <td className="px-2 py-1 text-stone-300">
                                  {JOCKEY_BY_ID[f.jockeyId]?.nickname || '—'}
                                </td>
                                <td className="px-2 py-1 text-stone-400">
                                  {f.horse || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {fallen.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400">
                        <TrendingDown size={11} />
                        Cadute: {fallen.map((f) => CONTRADA_BY_ID[f.contradaId]?.name).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
