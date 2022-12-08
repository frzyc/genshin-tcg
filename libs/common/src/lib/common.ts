export function common(): string {
  return 'common';
}

export type MatchEntry = {
  opponent: string,
  opponentElo: number,
  won: boolean,
  time: number,
}
export type MatchHistory = MatchEntry[]
