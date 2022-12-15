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
export type MatchMeta = {
  wins: number
  losses: number
  eloTot: number
  elo: number
}
export type UserData = {
  uid: string,
  profile: ProfileData,
  matchMeta: MatchMeta,
  history: MatchHistory
}

export type MatchOpponent = {
  uid: string,
  profile: ProfileData,
  join: boolean
}

export type Leaderboard = Array<[uid: string, elo: number]>

export const serverNames = ["internal", "celestia", "irminsul", "na", "eu", "asia", "sar"] as const
export type ServerName = typeof serverNames[number]

export function serverLookup(uid: UID): ServerName {
  const prefix = uid[0]
  switch (prefix) {
    case "0":
      return "internal"
    case "1":
    case "2":
      return "celestia"
    case "5":
      return "irminsul"
    case "6":
      return "na"
    case "7":
      return "eu"
    case "8":
      return "asia"
    case "9":
      return "sar"
    default:
      return "internal"
  }
}

export const ACCEPT_MATCH_PERIOD_MS = 30 * 1000