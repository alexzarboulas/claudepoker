'use client';

import { useState, useCallback, useRef } from 'react';
import { GameState, Action, ValidActions, HandSummary, ActionRecord } from '@/lib/types';
import { newHand, getValidActions, applyAction } from '@/lib/engine';
import { getOpponentAction } from '@/lib/opponent';

interface PlayerStats {
  vpip: number;
  pfr: number;
  aggressionFactor: number;
  foldTo3bet: number;
  cbetFreq: number;
  foldToRiverBet: number;
  sampleSize: number;
}

interface Tip {
  id: string;
  text: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
}

// Stat counters
interface StatCounters {
  handsDealt: number;
  vpipOpp: number; vpipCount: number;
  pfrOpp: number; pfrCount: number;
  totalRaises: number; totalBets: number; totalCalls: number;
  threeBetFaced: number; threeBetFolded: number;
  cbetOpp: number; cbetCount: number;
  riverBetFaced: number; riverBetFolded: number;
  humanWasPreFlopAggressor: boolean;
}

const EMPTY_COUNTERS: StatCounters = {
  handsDealt: 0,
  vpipOpp: 0, vpipCount: 0,
  pfrOpp: 0, pfrCount: 0,
  totalRaises: 0, totalBets: 0, totalCalls: 0,
  threeBetFaced: 0, threeBetFolded: 0,
  cbetOpp: 0, cbetCount: 0,
  riverBetFaced: 0, riverBetFolded: 0,
  humanWasPreFlopAggressor: false,
};

function computeStats(c: StatCounters): PlayerStats {
  return {
    vpip: c.vpipOpp > 0 ? c.vpipCount / c.vpipOpp : 0,
    pfr: c.pfrOpp > 0 ? c.pfrCount / c.pfrOpp : 0,
    aggressionFactor: c.totalCalls > 0 ? (c.totalRaises + c.totalBets) / c.totalCalls : 0,
    foldTo3bet: c.threeBetFaced > 0 ? c.threeBetFolded / c.threeBetFaced : 0,
    cbetFreq: c.cbetOpp > 0 ? c.cbetCount / c.cbetOpp : 0,
    foldToRiverBet: c.riverBetFaced > 0 ? c.riverBetFolded / c.riverBetFaced : 0,
    sampleSize: c.handsDealt,
  };
}

function updateCountersFromActions(
  counters: StatCounters,
  actions: ActionRecord[],
  phase: string
): StatCounters {
  const c = { ...counters };

  // Detect if opponent raised preflop (3-bet scenario)
  let opponentRaisedPreflop = false;
  let humanRaisedPreflop = false;

  actions.forEach(a => {
    if (phase === 'preflop') {
      c.vpipOpp++;
      if (a.player === 'human') {
        if (a.action === 'call' || a.action === 'bet' || a.action === 'raise' || a.action === 'allin') {
          c.vpipCount++;
        }
        if (a.action === 'raise' || a.action === 'allin') {
          c.pfrCount++;
          humanRaisedPreflop = true;
        }
        c.pfrOpp++;
      }
      if (a.player === 'opponent' && (a.action === 'raise' || a.action === 'allin')) {
        opponentRaisedPreflop = true;
      }
    }

    // Aggression tracking
    if (a.player === 'human') {
      if (a.action === 'raise' || a.action === 'allin') c.totalRaises++;
      if (a.action === 'bet') c.totalBets++;
      if (a.action === 'call') c.totalCalls++;
    }

    // River fold
    if (phase === 'river' && a.player === 'human') {
      if (a.action === 'fold') {
        // we'll track facing bet separately
      }
    }
  });

  // 3-bet detection: if opponent raised and human had to respond
  if (phase === 'preflop' && opponentRaisedPreflop && humanRaisedPreflop) {
    // This was a re-raise situation — simplified
  }

  if (humanRaisedPreflop) c.humanWasPreFlopAggressor = true;

  return c;
}

const STATIC_TIPS: Tip[] = [
  {
    id: 'tip-gto-1',
    text: 'In heads-up play, you should be entering pots around 65–75% of the time preflop. Playing too tight lets your opponent steal too many blinds.',
    severity: 'info',
    timestamp: Date.now(),
  },
];

export function usePokerGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [sessionPnl, setSessionPnl] = useState(0);
  const [handCount, setHandCount] = useState(0);
  const [humanStack, setHumanStack] = useState(10000);
  const [opponentStack, setOpponentStack] = useState(10000);
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [history, setHistory] = useState<HandSummary[]>([]);
  const [tips, setTips] = useState<Tip[]>(STATIC_TIPS);
  const [counters, setCounters] = useState<StatCounters>(EMPTY_COUNTERS);
  const humanIsBtn = useRef(true);

  const startNewHand = useCallback(() => {
    humanIsBtn.current = !humanIsBtn.current;
    const state = newHand(handCount + 1, humanStack, opponentStack, humanIsBtn.current);
    setHandCount(h => h + 1);
    setGameState(state);
    setIsOpponentThinking(false);

    // If opponent acts first (BB preflop = opponent), trigger opponent action
    if (state.actionOn === 'opponent') {
      triggerOpponentAction(state);
    }
  }, [handCount, humanStack, opponentStack]);

  const triggerOpponentAction = useCallback((state: GameState) => {
    setIsOpponentThinking(true);
    const delay = 600 + Math.random() * 700;
    setTimeout(() => {
      const action = getOpponentAction(state);
      const newState = applyAction(state, 'opponent', action);
      setIsOpponentThinking(false);
      setGameState(newState);

      if (newState.phase === 'complete') {
        finalizeHand(newState);
      } else if (newState.actionOn === 'opponent') {
        // Opponent acts again (e.g. after dealing new street)
        triggerOpponentAction(newState);
      }
    }, delay);
  }, []);

  const handleAction = useCallback((action: Action) => {
    if (!gameState || gameState.actionOn !== 'human') return;

    const newState = applyAction(gameState, 'human', action);
    setGameState(newState);

    if (newState.phase === 'complete') {
      finalizeHand(newState);
    } else if (newState.actionOn === 'opponent') {
      triggerOpponentAction(newState);
    }
  }, [gameState, triggerOpponentAction]);

  const finalizeHand = useCallback((state: GameState) => {
    if (!state.result) return;

    const { winner, potWon } = state.result;
    const pnl = winner === 'human' ? potWon - state.players.human.totalBetThisHand
               : winner === 'split' ? 0
               : -state.players.human.totalBetThisHand;

    setSessionPnl(p => p + pnl);
    setHumanStack(state.players.human.stack);
    setOpponentStack(state.players.opponent.stack);

    // Determine key action for history
    const allActions = state.handHistory.flatMap(s => s.actions);
    const humanActions = allActions.filter(a => a.player === 'human');
    const lastHumanAction = humanActions[humanActions.length - 1];
    const keyAction = lastHumanAction
      ? `${lastHumanAction.action}${lastHumanAction.amount > 0 ? ' $' + lastHumanAction.amount : ''}`
      : 'No action';

    const summary: HandSummary = {
      handNumber: state.handNumber,
      result: winner === 'human' ? 'won' : winner === 'split' ? 'split' : 'lost',
      pnl,
      keyAction,
      board: state.communityCards,
    };

    setHistory(h => [...h, summary]);

    // Update counters from hand history
    setCounters(prev => {
      let c = { ...prev, handsDealt: prev.handsDealt + 1 };
      state.handHistory.forEach(street => {
        c = updateCountersFromActions(c, street.actions, street.street);
      });

      // Check for tips after 5+ hands
      if (c.handsDealt >= 5) {
        const stats = computeStats(c);
        checkAndAddTips(stats, c);
      }

      return c;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAndAddTips = useCallback((stats: PlayerStats, c: StatCounters) => {
    const newTips: Tip[] = [];
    const handNum = c.handsDealt;

    if (stats.vpip < 0.45) {
      newTips.push({
        id: `tip-vpip-${handNum}`,
        text: `Your VPIP is ${(stats.vpip * 100).toFixed(0)}% — well below the 68% GTO baseline. You're folding too many playable hands and letting your opponent steal blinds for free.`,
        severity: 'critical',
        timestamp: Date.now(),
      });
    } else if (stats.vpip > 0.90) {
      newTips.push({
        id: `tip-vpip-high-${handNum}`,
        text: `Your VPIP of ${(stats.vpip * 100).toFixed(0)}% is very high. In heads-up you play wide, but entering every pot leads to tough spots with weak holdings.`,
        severity: 'warning',
        timestamp: Date.now(),
      });
    }

    if (stats.pfr < 0.30 && c.handsDealt >= 8) {
      newTips.push({
        id: `tip-pfr-${handNum}`,
        text: `Your PFR of ${(stats.pfr * 100).toFixed(0)}% is low. Raising more preflop builds the pot with strong hands and gives you initiative post-flop.`,
        severity: 'warning',
        timestamp: Date.now(),
      });
    }

    if (stats.foldToRiverBet > 0.70 && c.riverBetFaced >= 3) {
      newTips.push({
        id: `tip-river-${handNum}`,
        text: `You're folding to river bets ${(stats.foldToRiverBet * 100).toFixed(0)}% of the time. GTO suggests calling ~55%. Your opponent can exploit this by bluffing rivers frequently.`,
        severity: 'critical',
        timestamp: Date.now(),
      });
    }

    if (stats.aggressionFactor < 1.0 && c.handsDealt >= 10) {
      newTips.push({
        id: `tip-af-${handNum}`,
        text: `Your aggression factor of ${stats.aggressionFactor.toFixed(1)}× is passive. Betting and raising more wins uncontested pots and extracts more value from strong hands.`,
        severity: 'warning',
        timestamp: Date.now(),
      });
    }

    if (newTips.length > 0) {
      setTips(prev => [...newTips, ...prev].slice(0, 10));
    }
  }, []);

  const validActions: ValidActions | null = gameState && gameState.actionOn === 'human' && gameState.phase !== 'complete'
    ? getValidActions(gameState, 'human')
    : null;

  const stats = computeStats(counters);

  return {
    gameState,
    validActions,
    sessionPnl,
    handCount,
    humanStack,
    opponentStack,
    isOpponentThinking,
    history,
    tips,
    stats,
    handleAction,
    startNewHand,
  };
}
