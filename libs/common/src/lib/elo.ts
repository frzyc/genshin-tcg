import { User } from "./common"
export function eloMatchMeta(mm: User["matchMeta"]) {
  return elo(mm.wins, mm.losses, mm.eloTot)
}
export function elo(wins: number, losses: number, scoreSum: number) {

  //algorithm of 400, with a 5 game damper (hence 5*1000)
  return (5 * 1000 + scoreSum + 400 * (wins - losses)) / ((wins + losses) + 5)
}
