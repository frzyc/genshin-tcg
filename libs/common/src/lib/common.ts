// Common things shared with backend/frontend

export type UID = string

export function common(): string {
  return 'common';
}

export type MatchEntry = {
  elo: number,
  opponent: string,
  opponentElo: number,
  resolution: "win" | "loss" | "unknown",
  time: number,
}
export type MatchHistory = MatchEntry[]

export type ProfileData = {
  level: number,
  nickname: string,
  signature: string,
  nameCardId: number,
  profilePicture: number,
}

export type User = {
  uid: string,
  profile: ProfileData,
  matchMeta: {
    wins: number
    losses: number
    eloTot: number
  }
  history: MatchHistory
}
