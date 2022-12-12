import { eloMatchMeta, MatchEntry, UID, User } from "@genshin-tcg/common"
import axios from "axios"
import { enka } from "./enka"
import { EnkaData, newUser } from "./User"

export class Database {
  data = {} as { [user: string]: User }

  async get(uid: UID): Promise<User | null> {
    const usr = this.getSync(uid)
    if (usr) return usr
    if (process.env.NOVDE_ENV === "development" && !usr && enka[uid])
      return this.set(uid, newUser(uid, enka[uid]))
    const req = await axios.get(`https://enka.network/u/${uid}/__data.json`,
      { headers: { "User-Agent": "genshin-tcg", "accept-encoding": "*", timeout: 10 * 1000 } })
    if (req.data) {
      return this.set(uid, newUser(uid, req.data as EnkaData))
    }

    return null


  }
  getSync(uid: UID): User | undefined {
    return this.data[uid]
  }
  set(uid: UID, usr: User): User {
    this.data[uid] = usr
    return usr
  }
  matched(uid: UID, opponent: UID, resolution: MatchEntry["resolution"]) {
    const usr = this.getSync(uid)
    const opp = this.getSync(opponent)
    if (!usr || !opp) return
    const opponentElo = eloMatchMeta(opp.matchMeta)


    if (resolution !== "unknown")
      usr.matchMeta.eloTot += opponentElo

    if (resolution === "win")
      usr.matchMeta.wins++
    else if (resolution === "loss")
      usr.matchMeta.losses++

    usr.history = [{
      elo: eloMatchMeta(usr.matchMeta),
      opponent,
      opponentElo,
      resolution,
      time: Date.now()
    }, ...usr.history]

    return this.set(uid, usr)
  }
}
