export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type Phase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'complete';
export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';
export type Position = 'BTN' | 'BB';

export interface Action {
  type: ActionType;
  amount: number;
}

export interface PlayerState {
  stack: number;
  holeCards: Card[];
  betThisStreet: number;
  totalBetThisHand: number;
  isFolded: boolean;
  isAllIn: boolean;
  position: Position;
}

export interface ActionRecord {
  player: 'human' | 'opponent';
  action: ActionType;
  amount: number;
}

export interface StreetLog {
  street: Phase;
  actions: ActionRecord[];
  boardAtStart: Card[];
}

export interface HandResult {
  winner: 'human' | 'opponent' | 'split';
  potWon: number;
  humanHandName: string;
  opponentHandName: string;
  opponentCards: Card[];
}

export interface GameState {
  handId: string;
  phase: Phase;
  deck: Card[];
  communityCards: Card[];
  pot: number;
  players: {
    human: PlayerState;
    opponent: PlayerState;
  };
  actionOn: 'human' | 'opponent' | null;
  streetActions: ActionRecord[];
  handHistory: StreetLog[];
  smallBlind: number;
  bigBlind: number;
  minRaise: number;
  lastRaiseAmount: number;
  handNumber: number;
  result: HandResult | null;
  lastAction: ActionRecord | null;
}

export interface SessionStats {
  handsPlayed: number;
  sessionPnl: number;
  humanStack: number;
  opponentStack: number;
}

export interface ValidActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canBet: boolean;
  canRaise: boolean;
  minRaise: number;
  maxRaise: number;
}

export interface HandSummary {
  handNumber: number;
  result: 'won' | 'lost' | 'split';
  pnl: number;
  keyAction: string;
  board: Card[];
}
