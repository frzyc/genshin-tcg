import { MatchOpponent, MATCH_TIME_MS } from "@genshin-tcg/common";
import { database, enkaCache, getUsr, matches } from "./Globals";
import User from "./User"

export default class Match {
  matchId: string
  p1: User
  p2: User
  startTime: number
  p1Result: undefined | boolean
  p2Result: undefined | boolean
  matchResultStr: string
  constructor(matchId: string, p1: User, p2: User) {
    this.startTime = Date.now();
    [this.matchId, this.p1, this.p2] = [matchId, p1, p2];
    this.emitMatch()
    this.matchResultStr = `match:${matchId}:result`
    p1.socket.on(this.matchResultStr, (result: boolean) => {
      this.p1Result = result
      this.checkResult()
    })
    p2.socket.on(this.matchResultStr, (result: boolean) => {
      this.p2Result = result
      this.checkResult()
    })

    setTimeout(() => this.draw(), MATCH_TIME_MS);
  }
  async emitMatch() {
    const matchOppStr = `match:${this.matchId}:opponent`
    const [p1, p2] = [this.p1, this.p2]
    p1.socket.emit(matchOppStr, { matchId: this.matchId, uid: p2.uid, profile: (await enkaCache.get(p2.uid)).profile, startTime: this.startTime, join: false } as MatchOpponent)
    p2.socket.emit(matchOppStr, { matchId: this.matchId, uid: p1.uid, profile: (await enkaCache.get(p1.uid)).profile, startTime: this.startTime, join: true } as MatchOpponent)
  }
  async checkResult() {
    const [p1, p2] = [this.p1, this.p2]
    if (this.p1Result === undefined || this.p2Result === undefined) return
    if (this.p1Result === this.p2Result) {
      // result discrepancy
      [this.p1Result, this.p2Result] = [undefined, undefined];
      [p1, p2].forEach(p => p.socket.emit(`match:${this.matchId}:result_discrepancy`))
    } else {
      // results are good
      [p1, p2].forEach(p => p.socket.removeAllListeners(this.matchResultStr))
      const [winner, loser] = this.p1Result ? [p1, p2] : [p2, p1]
      database.matched(winner.uid, loser.uid, "win")
      database.matched(loser.uid, winner.uid, "loss")
      winner.socket.emit("userData", await getUsr(winner.uid))
      loser.socket.emit("userData", await getUsr(loser.uid))

      this.end()
    }
  }
  draw() {
    database.matched(this.p1.uid, this.p2.uid, "unknown")
    database.matched(this.p2.uid, this.p1.uid, "unknown")
    this.end()
  }
  async end() {
    [this.p1, this.p2].forEach(p => p.socket.removeAllListeners(this.matchResultStr));
    [this.p1, this.p2].forEach(p => p.socket.emit(`match:${this.matchId}:end`))
    matches.remove(this)
  }
}