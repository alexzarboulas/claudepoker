import { Card, GameState, PlayerState, Phase, ActionType, Action, ActionRecord, HandResult, Rank, Suit } from './types';
import { determineWinner } from './evaluator';

const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUITS: Suit[] = ['s','h','d','c'];

function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const STARTING_STACK = 10000;
const SMALL_BLIND = 50;
const BIG_BLIND = 100;

export function newHand(handNumber: number, humanStack: number, opponentStack: number, humanIsBtn: boolean): GameState {
  const deck = shuffle(freshDeck());
  let idx = 0;

  const humanCards: Card[] = [deck[idx++], deck[idx++]];
  const opponentCards: Card[] = [deck[idx++], deck[idx++]];
  const remainingDeck = deck.slice(idx);

  // Heads-up: BTN = SB, acts first preflop; BB acts first post-flop
  const humanPos = humanIsBtn ? 'BTN' : 'BB';
  const opponentPos = humanIsBtn ? 'BB' : 'BTN';

  const sb = SMALL_BLIND;
  const bb = BIG_BLIND;

  // Post blinds
  const humanSbAmount = humanIsBtn ? Math.min(sb, humanStack) : Math.min(bb, humanStack);
  const opponentSbAmount = humanIsBtn ? Math.min(bb, opponentStack) : Math.min(sb, opponentStack);

  const humanPlayer: PlayerState = {
    stack: humanStack - humanSbAmount,
    holeCards: humanCards,
    betThisStreet: humanSbAmount,
    totalBetThisHand: humanSbAmount,
    isFolded: false,
    isAllIn: humanStack - humanSbAmount === 0,
    position: humanPos,
  };

  const opponentPlayer: PlayerState = {
    stack: opponentStack - opponentSbAmount,
    holeCards: opponentCards,
    betThisStreet: opponentSbAmount,
    totalBetThisHand: opponentSbAmount,
    isFolded: false,
    isAllIn: opponentStack - opponentSbAmount === 0,
    position: opponentPos,
  };

  const pot = humanSbAmount + opponentSbAmount;

  // Preflop: BTN (SB) acts first in heads-up
  const actionOn: 'human' | 'opponent' = humanIsBtn ? 'human' : 'opponent';

  return {
    handId: uid(),
    phase: 'preflop',
    deck: remainingDeck,
    communityCards: [],
    pot,
    players: { human: humanPlayer, opponent: opponentPlayer },
    actionOn,
    streetActions: [],
    handHistory: [],
    smallBlind: sb,
    bigBlind: bb,
    minRaise: bb,
    lastRaiseAmount: bb,
    handNumber,
    result: null,
    lastAction: null,
  };
}

function deepCopy(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

export function getValidActions(state: GameState, player: 'human' | 'opponent') {
  const me = state.players[player];
  const them = state.players[player === 'human' ? 'opponent' : 'human'];
  const toCall = them.betThisStreet - me.betThisStreet;

  const canCheck = toCall === 0;
  const canCall = toCall > 0 && me.stack > 0;
  const callAmount = Math.min(toCall, me.stack);
  const canRaisePure = me.stack > toCall; // has chips beyond calling
  const minRaise = Math.min(me.stack, toCall + state.lastRaiseAmount);
  const maxRaise = me.stack + me.betThisStreet; // total commitment = all-in

  return {
    canFold: true,
    canCheck,
    canCall,
    callAmount,
    canBet: canCheck && me.stack > 0,
    canRaise: canRaisePure,
    minRaise,
    maxRaise,
  };
}

export function applyAction(state: GameState, player: 'human' | 'opponent', action: Action): GameState {
  const s = deepCopy(state);
  const me = s.players[player];
  const them = s.players[player === 'human' ? 'opponent' : 'human'];
  const toCall = them.betThisStreet - me.betThisStreet;

  let record: ActionRecord;

  switch (action.type) {
    case 'fold': {
      me.isFolded = true;
      record = { player, action: 'fold', amount: 0 };
      s.streetActions.push(record);
      s.lastAction = record;
      s.actionOn = null;
      return awardPot(s, player === 'human' ? 'opponent' : 'human');
    }
    case 'check': {
      record = { player, action: 'check', amount: 0 };
      s.streetActions.push(record);
      s.lastAction = record;
      break;
    }
    case 'call': {
      const amt = Math.min(toCall, me.stack);
      me.stack -= amt;
      me.betThisStreet += amt;
      me.totalBetThisHand += amt;
      s.pot += amt;
      if (me.stack === 0) me.isAllIn = true;
      record = { player, action: 'call', amount: amt };
      s.streetActions.push(record);
      s.lastAction = record;
      break;
    }
    case 'bet':
    case 'raise': {
      // action.amount = total commitment this street (bet/raise TO)
      const totalCommit = Math.min(action.amount, me.stack + me.betThisStreet);
      const extraChips = totalCommit - me.betThisStreet;
      const raiseBy = totalCommit - them.betThisStreet;
      me.stack -= extraChips;
      me.totalBetThisHand += extraChips;
      me.betThisStreet = totalCommit;
      s.pot += extraChips;
      s.lastRaiseAmount = Math.max(raiseBy, s.bigBlind);
      s.minRaise = Math.min(them.stack + them.betThisStreet, them.betThisStreet + s.lastRaiseAmount);
      if (me.stack === 0) me.isAllIn = true;
      record = { player, action: action.type, amount: totalCommit };
      s.streetActions.push(record);
      s.lastAction = record;
      break;
    }
    case 'allin': {
      const allInAmt = me.stack;
      const raiseBy = me.stack + me.betThisStreet - them.betThisStreet;
      me.betThisStreet += allInAmt;
      me.totalBetThisHand += allInAmt;
      s.pot += allInAmt;
      me.stack = 0;
      me.isAllIn = true;
      if (raiseBy > 0) s.lastRaiseAmount = Math.max(raiseBy, s.bigBlind);
      record = { player, action: 'allin', amount: me.betThisStreet };
      s.streetActions.push(record);
      s.lastAction = record;
      break;
    }
  }

  s.actionOn = player === 'human' ? 'opponent' : 'human';
  return advanceState(s);
}

function isBettingClosed(state: GameState): boolean {
  const { human, opponent } = state.players;
  if (human.isFolded || opponent.isFolded) return true;
  if (human.isAllIn && opponent.isAllIn) return true;

  const actions = state.streetActions;
  if (actions.length === 0) return false;

  const lastAct = actions[actions.length - 1];
  const prevActions = actions.slice(0, -1);
  const otherPlayer = lastAct.player === 'human' ? 'opponent' : 'human';

  const betsEqual = human.betThisStreet === opponent.betThisStreet;

  if (!betsEqual) {
    // One or both players have unequal bets.
    if (!human.isAllIn && !opponent.isAllIn) return false; // Neither all-in: action is open.

    // One player is all-in with unequal bets.
    const allInKey = human.isAllIn ? 'human' : 'opponent';
    const allInBet  = human.isAllIn ? human.betThisStreet   : opponent.betThisStreet;
    const otherBet  = human.isAllIn ? opponent.betThisStreet : human.betThisStreet;

    if (allInBet < otherBet) {
      // Short all-in: the all-in player couldn't cover. The other player
      // has already put in more, so no further action is needed.
      return true;
    }

    // All-in raise: the non-all-in player must still respond (call / allin / fold).
    const responder = allInKey === 'human' ? 'opponent' : 'human';
    return lastAct.player === responder && (lastAct.action === 'call' || lastAct.action === 'allin');
    // fold is caught by the isFolded check at the top.
  }

  // Bets are equal from here.
  // One player is all-in, bets match → close on the matching action.
  if (human.isAllIn || opponent.isAllIn) {
    return lastAct.action === 'call' || lastAct.action === 'check' || lastAct.action === 'allin';
  }

  // Bets are equal — need both players to have had a chance to act
  if (lastAct.action === 'check') {
    // A check closes the street only if the other player has already acted this street.
    // This prevents the first actor's check from skipping the second player's turn.
    return prevActions.some(a => a.player === otherPlayer);
  }

  if (lastAct.action === 'call') {
    // A call closes the street only if there was a voluntary bet/raise in streetActions.
    // This handles the preflop BB option: when BTN limps (calls the blind), the BB blind
    // was not a streetAction, so BB still gets their option to raise.
    return prevActions.some(a => a.action === 'bet' || a.action === 'raise' || a.action === 'allin');
  }

  // A bet/raise never closes the street — other player must respond
  return false;
}

function advanceState(state: GameState): GameState {
  const s = deepCopy(state);
  if (!isBettingClosed(s)) return s;

  // Save this street's log
  s.handHistory.push({
    street: s.phase,
    actions: [...s.streetActions],
    boardAtStart: [...s.communityCards],
  });
  s.streetActions = [];

  // Move to next phase
  const nextPhase = nextStreet(s.phase);
  if (nextPhase === 'showdown') {
    return resolveShowdown(s);
  }

  // Deal community cards
  if (nextPhase === 'flop') {
    s.communityCards = [s.deck[0], s.deck[1], s.deck[2]];
    s.deck = s.deck.slice(3);
  } else if (nextPhase === 'turn' || nextPhase === 'river') {
    s.communityCards = [...s.communityCards, s.deck[0]];
    s.deck = s.deck.slice(1);
  }

  // Reset bets
  s.players.human.betThisStreet = 0;
  s.players.opponent.betThisStreet = 0;
  s.lastRaiseAmount = s.bigBlind;
  s.minRaise = s.bigBlind;
  s.phase = nextPhase;

  // Post-flop: BB acts first (non-BTN position)
  // In heads-up: BB = non-button, acts first post-flop
  const humanIsBb = s.players.human.position === 'BB';
  if (!s.players.human.isAllIn && !s.players.human.isFolded && humanIsBb) {
    s.actionOn = 'human';
  } else if (!s.players.opponent.isAllIn && !s.players.opponent.isFolded && !humanIsBb) {
    s.actionOn = 'opponent';
  } else {
    // Handle all-in run-outs
    s.actionOn = null;
    return advanceState(s);
  }

  return s;
}

function nextStreet(phase: Phase): Phase {
  const order: Phase[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const idx = order.indexOf(phase);
  return order[idx + 1] ?? 'showdown';
}

function resolveShowdown(state: GameState): GameState {
  const s = deepCopy(state);
  const { human, opponent } = s.players;
  const { winner, humanName, opponentName } = determineWinner(
    human.holeCards,
    opponent.holeCards,
    s.communityCards
  );

  const result: HandResult = {
    winner,
    potWon: s.pot,
    humanHandName: humanName,
    opponentHandName: opponentName,
    opponentCards: opponent.holeCards,
  };

  if (winner === 'human') {
    s.players.human.stack += s.pot;
  } else if (winner === 'opponent') {
    s.players.opponent.stack += s.pot;
  } else {
    const half = Math.floor(s.pot / 2);
    s.players.human.stack += half;
    s.players.opponent.stack += s.pot - half;
  }

  s.pot = 0;
  s.phase = 'complete';
  s.actionOn = null;
  s.result = result;
  return s;
}

function awardPot(state: GameState, winner: 'human' | 'opponent'): GameState {
  const s = deepCopy(state);
  const potWon = s.pot;

  s.players[winner].stack += s.pot;
  s.pot = 0;
  s.phase = 'complete';
  s.actionOn = null;

  s.result = {
    winner,
    potWon,
    humanHandName: '',
    opponentHandName: '',
    opponentCards: [],
  };

  return s;
}

export function startingState(): { humanStack: number; opponentStack: number } {
  return { humanStack: STARTING_STACK, opponentStack: STARTING_STACK };
}
