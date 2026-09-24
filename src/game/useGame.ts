import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, PendingDeal } from './types';
import {
  createNewGame,
  saveGame,
  loadGame,
  clearSave,
  advancePhase,
  hireJockey,
  releaseJockey,
  promiseBonus,
  guardJockey,
  bribeJockey,
  spyJockey,
  proposeDeal,
  resolveDebt,
  simulateRace,
  endPalio,
  acceptIncomingOffer,
  rejectIncomingOffer,
  confirmScare,
  askProtectors,
  orderKillerAction,
} from './engine';
import { CONTRADA_BY_ID, JOCKEY_BY_ID } from './data';

export interface ActionResult {
  ok: boolean;
  reason?: string;
  info?: string;
  success?: boolean;
}

export function useGame() {
  const [state, setState] = useState<GameState | null>(() => loadGame());
  const [flash, setFlash] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);

  const showFlash = useCallback((msg: string) => {
    setFlash(msg);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 3000);
  }, []);

  // autosave (debounced) after every state change
  useEffect(() => {
    if (!state) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveGame(state), 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state]);

  const update = useCallback((fn: (s: GameState) => GameState) => {
    setState((prev) => (prev ? fn(structuredClone(prev)) : prev));
  }, []);

  const startNew = useCallback((contradaId: string) => {
    clearSave();
    const s = createNewGame(contradaId);
    setState(s);
  }, []);

  const reset = useCallback(() => {
    clearSave();
    setState(null);
  }, []);

  const doAdvancePhase = useCallback(() => {
    update((s) => {
      const { s: ns, advanced } = advancePhase(s);
      if (!advanced) return s;
      return ns;
    });
  }, [update]);

  const doHire = useCallback((jockeyId: string): ActionResult => {
    let res: ActionResult = { ok: false };
    update((s) => {
      const r = hireJockey(s, jockeyId);
      res = { ok: r.ok, reason: r.reason };
      return r.s;
    });
    return res;
  }, [update]);

  const doRelease = useCallback((jockeyId: string) => {
    update((s) => releaseJockey(s, jockeyId));
  }, [update]);

  const doBonus = useCallback((jockeyId: string, amount: number): ActionResult => {
    let res: ActionResult = { ok: false };
    update((s) => {
      const r = promiseBonus(s, jockeyId, amount);
      res = { ok: r.ok, reason: r.reason };
      return r.s;
    });
    return res;
  }, [update]);

  const doGuard = useCallback((jockeyId: string): ActionResult => {
    let res: ActionResult = { ok: false };
    update((s) => {
      const r = guardJockey(s, jockeyId);
      res = { ok: r.ok, reason: r.reason };
      return r.s;
    });
    return res;
  }, [update]);

  const doBribe = useCallback((jockeyId: string, amount: number): ActionResult => {
    let res: ActionResult = { ok: false };
    update((s) => {
      const r = bribeJockey(s, jockeyId, amount);
      res = { ok: r.ok, reason: r.reason, success: r.success };
      return r.s;
    });
    return res;
  }, [update]);

  const doSpy = useCallback((jockeyId: string): ActionResult => {
    let res: ActionResult = { ok: false };
    update((s) => {
      const r = spyJockey(s, jockeyId);
      res = { ok: r.ok, reason: r.reason, info: r.info };
      return r.s;
    });
    return res;
  }, [update]);

  const doPropose = useCallback(
    (contradaId: string, type: PendingDeal['type'], targetContradaId: string | undefined, payment: 'cash' | 'favore', amount: number, lastMinute = false): ActionResult => {
      let res: ActionResult = { ok: false };
      update((s) => {
        const r = proposeDeal(s, contradaId, type, targetContradaId, payment, amount, lastMinute);
        res = { ok: r.ok, reason: r.reason };
        return r.s;
      });
      return res;
    },
    [update],
  );

  const doAcceptOffer = useCallback((offerId: string): ActionResult => {
    let res: ActionResult = { ok: false };
    update((s) => {
      const r = acceptIncomingOffer(s, offerId);
      res = { ok: r.ok, reason: r.reason };
      return r.s;
    });
    return res;
  }, [update]);

  const doRejectOffer = useCallback((offerId: string) => {
    update((s) => rejectIncomingOffer(s, offerId));
  }, [update]);

  const doResolveDebt = useCallback((debtId: string, accept: boolean) => {
    update((s) => resolveDebt(s, debtId, accept));
  }, [update]);

  const doSimulate = useCallback(() => {
    update((s) => simulateRace(s));
  }, [update]);

  const doEndPalio = useCallback(() => {
    update((s) => endPalio(s));
  }, [update]);

  const doConfirmScare = useCallback((confirm: boolean) => {
    update((s) => confirmScare(s, confirm));
  }, [update]);

  const doAskProtectors = useCallback(() => {
    update((s) => {
      const r = askProtectors(s);
      if (!r.ok) {
        showFlash(r.reason || 'Non puoi chiedere ora');
        return s;
      }
      showFlash('+€25.000 dai protettori! Credibilità ridotta');
      return r.s;
    });
  }, [update, showFlash]);

  const doOrderKiller = useCallback((jockeyId: string, mode: 'nerbata' | 'caduta'): ActionResult => {
    let res: ActionResult = { ok: false };
    update((s) => {
      const r = orderKillerAction(s, jockeyId, mode);
      res = { ok: r.ok, reason: r.reason };
      if (!r.ok) {
        showFlash(r.reason || 'Azione non disponibile');
        return s;
      }
      showFlash(`Azione killer ordinata a ${JOCKEY_BY_ID[jockeyId]?.nickname || 'fantino'}`);
      return r.s;
    });
    return res;
  }, [update, showFlash]);

  return {
    state,
    flash,
    startNew,
    reset,
    doAdvancePhase,
    doHire,
    doRelease,
    doBonus,
    doGuard,
    doBribe,
    doSpy,
    doPropose,
    doAcceptOffer,
    doRejectOffer,
    doResolveDebt,
    doSimulate,
    doEndPalio,
    doConfirmScare,
    doAskProtectors,
    doOrderKiller,
  };
}

export function getContrada(id: string) {
  return CONTRADA_BY_ID[id];
}
