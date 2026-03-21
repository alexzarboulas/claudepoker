/**
 * Simple rule-based opponent AI.
 * Plays a loose-aggressive heads-up strategy without any ML.
 */
import { GameState, Action } from './types';
import { getValidActions } from './engine';

function rand(): number {
  return Math.random();
}

function potFraction(pot: number, fraction: number, betThisStreet: number, stack: number): number {
  // Returns a raise-to amount (total street commitment)
  const raiseSize = Math.floor(pot * fraction);
  return Math.min(betThisStreet + raiseSize, betThisStreet + stack);
}

export function getOpponentAction(state: GameState): Action {
  const valid = getValidActions(state, 'opponent');
  const opp = state.players.opponent;
  const pot = state.pot;
  const phase = state.phase;
  const toCall = valid.callAmount;
  const potOdds = toCall / (pot + toCall) || 0;

  // Preflop strategy
  if (phase === 'preflop') {
    const r = rand();
    if (valid.canRaise && r < 0.50) {
      // Raise 2.5x BB to 4x BB randomly
      const sizings = [2.5, 3, 3.5, 4];
      const mult = sizings[Math.floor(rand() * sizings.length)];
      const amount = Math.min(
        Math.floor(state.bigBlind * mult),
        opp.stack + opp.betThisStreet
      );
      return { type: 'raise', amount };
    }
    if (valid.canCall && r < 0.80) {
      return { type: 'call', amount: toCall };
    }
    if (valid.canCheck) {
      return { type: 'check', amount: 0 };
    }
    return { type: 'fold', amount: 0 };
  }

  // Post-flop strategy: semi-aggressive
  const r = rand();

  // If facing a bet
  if (valid.canCall || valid.canRaise) {
    // Fold if pot odds are terrible and random says fold
    if (potOdds > 0.40 && r < 0.35) {
      return { type: 'fold', amount: 0 };
    }
    // Re-raise occasionally
    if (valid.canRaise && r < 0.20) {
      const amount = potFraction(pot, 0.75, opp.betThisStreet, opp.stack);
      return { type: 'raise', amount };
    }
    // Call
    if (valid.canCall) {
      return { type: 'call', amount: toCall };
    }
  }

  // Check or bet
  if (valid.canCheck) {
    if (r < 0.45) {
      // Bet with sizing variance
      const fractions = [0.33, 0.50, 0.67, 1.0];
      const frac = fractions[Math.floor(rand() * fractions.length)];
      const amount = potFraction(pot, frac, opp.betThisStreet, opp.stack);
      if (amount > opp.betThisStreet) {
        return { type: 'bet', amount };
      }
    }
    return { type: 'check', amount: 0 };
  }

  return { type: 'fold', amount: 0 };
}
