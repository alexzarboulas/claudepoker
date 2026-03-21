import { Card, Rank } from './types';

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

const HAND_NAMES = [
  'High Card', 'One Pair', 'Two Pair', 'Three of a Kind',
  'Straight', 'Flush', 'Full House', 'Four of a Kind',
  'Straight Flush', 'Royal Flush',
];

interface EvalResult {
  rank: number; // 0 = high card, 9 = royal flush
  value: number[]; // tiebreaker values, highest first
  name: string;
}

function getRankVal(r: Rank): number {
  return RANK_VALUES[r];
}

function evaluateFiveCards(cards: Card[]): EvalResult {
  const ranks = cards.map(c => getRankVal(c.rank)).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  if (uniqueRanks.length === 5 && uniqueRanks[0] - uniqueRanks[4] === 4) {
    isStraight = true;
    straightHigh = uniqueRanks[0];
  }
  // Wheel straight: A-2-3-4-5
  if (!isStraight && uniqueRanks.join(',') === '14,5,4,3,2') {
    isStraight = true;
    straightHigh = 5;
  }

  // Count rank frequencies
  const freq: Record<number, number> = {};
  ranks.forEach(r => { freq[r] = (freq[r] || 0) + 1; });
  const counts = Object.entries(freq)
    .map(([r, c]) => ({ r: Number(r), c }))
    .sort((a, b) => b.c - a.c || b.r - a.r);

  const countValues = counts.map(x => x.c);

  if (isFlush && isStraight) {
    if (straightHigh === 14) return { rank: 9, value: [14], name: 'Royal Flush' };
    return { rank: 8, value: [straightHigh], name: 'Straight Flush' };
  }
  if (countValues[0] === 4) {
    return { rank: 7, value: [counts[0].r, counts[1].r], name: 'Four of a Kind' };
  }
  if (countValues[0] === 3 && countValues[1] === 2) {
    return { rank: 6, value: [counts[0].r, counts[1].r], name: 'Full House' };
  }
  if (isFlush) {
    return { rank: 5, value: ranks, name: 'Flush' };
  }
  if (isStraight) {
    return { rank: 4, value: [straightHigh], name: 'Straight' };
  }
  if (countValues[0] === 3) {
    return { rank: 3, value: [counts[0].r, ...ranks.filter(r => r !== counts[0].r)], name: 'Three of a Kind' };
  }
  if (countValues[0] === 2 && countValues[1] === 2) {
    const pairs = counts.filter(x => x.c === 2).map(x => x.r).sort((a, b) => b - a);
    const kicker = counts.find(x => x.c === 1)!.r;
    return { rank: 2, value: [...pairs, kicker], name: 'Two Pair' };
  }
  if (countValues[0] === 2) {
    const kickers = counts.filter(x => x.c === 1).map(x => x.r).sort((a, b) => b - a);
    return { rank: 1, value: [counts[0].r, ...kickers], name: 'One Pair' };
  }
  return { rank: 0, value: ranks, name: 'High Card' };
}

function chooseBestFive(cards: Card[]): EvalResult {
  let best: EvalResult | null = null;
  // Generate all C(n,5) combinations
  for (let i = 0; i < cards.length - 4; i++) {
    for (let j = i + 1; j < cards.length - 3; j++) {
      for (let k = j + 1; k < cards.length - 2; k++) {
        for (let l = k + 1; l < cards.length - 1; l++) {
          for (let m = l + 1; m < cards.length; m++) {
            const five = [cards[i], cards[j], cards[k], cards[l], cards[m]];
            const result = evaluateFiveCards(five);
            if (!best || compareResults(result, best) > 0) {
              best = result;
            }
          }
        }
      }
    }
  }
  return best!;
}

function compareResults(a: EvalResult, b: EvalResult): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.max(a.value.length, b.value.length); i++) {
    const av = a.value[i] ?? 0;
    const bv = b.value[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

export function evaluateHand(holeCards: Card[], board: Card[]): EvalResult {
  const all = [...holeCards, ...board];
  if (all.length < 5) {
    // Pre-showdown: return placeholder
    const ranks = holeCards.map(c => getRankVal(c.rank)).sort((a, b) => b - a);
    return { rank: 0, value: ranks, name: 'High Card' };
  }
  return chooseBestFive(all);
}

export function determineWinner(
  humanHole: Card[],
  opponentHole: Card[],
  board: Card[]
): { winner: 'human' | 'opponent' | 'split'; humanName: string; opponentName: string } {
  const humanResult = evaluateHand(humanHole, board);
  const opponentResult = evaluateHand(opponentHole, board);
  const cmp = compareResults(humanResult, opponentResult);

  return {
    winner: cmp > 0 ? 'human' : cmp < 0 ? 'opponent' : 'split',
    humanName: humanResult.name,
    opponentName: opponentResult.name,
  };
}

export function handStrengthDescription(holeCards: Card[], board: Card[]): string {
  if (board.length === 0) return '';
  const result = evaluateHand(holeCards, board);
  return result.name;
}
