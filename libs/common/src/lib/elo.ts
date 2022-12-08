import { MatchHistory } from "./common"

export function elo(scores: number[]) {
  if (scores.length === 0) return 1000

  //algorithm of 400
  const scoreSum = scores.reduce((tot, s) => tot + Math.abs(s), 0)
  const winlossDiff = scores.reduce((tot, s) => tot + (s > 0 ? 1 : -1), 0)
  return (scoreSum + 400 * winlossDiff) / scores.length
}

export function historyToScores(history: MatchHistory): number[] {
  return Object.values(history).map(({ opponentElo, won }) => opponentElo * (won ? 1 : -1))
}

export function eloHistory(history: MatchHistory) {
  return elo(historyToScores(history))
}
