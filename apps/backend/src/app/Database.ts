import { eloMatchMeta, Leaderboard, MatchEntry, MatchHistory, MatchMeta, serverLookup, ServerName, serverNames, UID } from "@genshin-tcg/common"
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "fs"
import { resolve } from "path"
type DatabaseEntry = {
  matchMeta: MatchMeta,
  history: MatchHistory
}

function newEntry(): DatabaseEntry {
  return {
    matchMeta: {
      wins: 0,
      losses: 0,
      eloTot: 0,
      elo: 1000
    },
    history: []
  }
}
const backupDir = resolve(__dirname, "../../../backend_backup")
const BACKUP_PERIOD = 5 * 60 * 1000
const CLEANSE_OLD_BACKUP_PERIOD = 5 * BACKUP_PERIOD
export class Database {
  leaderboardCache: Record<ServerName, Leaderboard>
  constructor() {

    //load from latest backup
    if (existsSync(backupDir)) {
      const sortedFs = readdirSync(backupDir).map(f => resolve(backupDir, f)).sort((a, b) => statSync(b).ctime.getTime() - statSync(a).ctime.getTime())
      if (sortedFs.length)
        this.data = JSON.parse(readFileSync(sortedFs[0], 'utf8'))
    }

    setInterval(() => {
      this.backup()
    }, BACKUP_PERIOD)

    this.leaderboardCache = this.leaderboard()
    setInterval(() => {
      this.leaderboardCache = this.leaderboard()
    }, 10 * 1000)
  }
  data = {} as { [uid: UID]: DatabaseEntry }
  get(uid: UID): DatabaseEntry {
    if (this.data[uid])
      return this.data[uid]
    return this.set(uid, newEntry())
  }
  set(uid: UID, entry: DatabaseEntry): DatabaseEntry {
    this.data[uid] = entry
    return entry
  }
  backup() {
    if (!existsSync(backupDir)) mkdirSync(backupDir)

    readdirSync(backupDir).forEach(f => {
      const fPath = resolve(backupDir, f)
      if ((statSync(fPath).ctime.getTime()) <= (Date.now() - CLEANSE_OLD_BACKUP_PERIOD)) unlinkSync(fPath)
    })

    const data = JSON.stringify(this.data);
    writeFileSync(`${backupDir}/${(new Date()).toISOString().split(".")[0].replace("T", "_").replace(/:/g, "-")}.json`, data);

  }
  matched(uid: UID, opponent: UID, resolution: MatchEntry["resolution"]) {
    const usr = this.get(uid)
    const opp = this.get(opponent)
    if (!usr || !opp) return
    const opponentElo = eloMatchMeta(opp.matchMeta)


    if (resolution !== "unknown")
      usr.matchMeta.eloTot += opponentElo

    if (resolution === "win")
      usr.matchMeta.wins++
    else if (resolution === "loss")
      usr.matchMeta.losses++

    if (resolution !== "unknown")
      usr.matchMeta.elo = eloMatchMeta(usr.matchMeta)

    usr.history = [{
      elo: usr.matchMeta.elo,
      opponent,
      opponentElo,
      resolution,
      time: Date.now()
    }, ...usr.history]

    return this.set(uid, usr)
  }
  leaderboard() {
    const serverMappedUID = Object.entries(this.data).reduce((map, [uid, entry]) => {
      map[serverLookup(uid)].push([uid, entry.matchMeta.elo])
      return map
    }, Object.fromEntries(serverNames.map(sn => [sn, [] as Leaderboard])) as Record<ServerName, Leaderboard>)
    Object.keys(serverMappedUID).forEach(k => {
      serverMappedUID[k] = serverMappedUID[k].sort(([, a], [, b]) => b - a).slice(0, 10)
    })
    return serverMappedUID
  }
}
