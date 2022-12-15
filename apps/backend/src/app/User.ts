import { ACCEPT_MATCH_PERIOD_MS, MatchOpponent, serverLookup, UID, UserData } from "@genshin-tcg/common";
import { Socket } from "socket.io";
import { database, enkaCache, getUsr, serverQueueMap } from "./Globals";
import MatchQueue from "./MatchQueue";

type UserSocket = {
  user: UserData,
  socket: Socket,
}
type Match = {
  key: string
  p1: UserSocket
  p2: UserSocket
  startTime: Date,
}
let matchCounter = 0;
// Associates a uid with a socket. this means that if another tab is opened with the same UID, the old socket will be kicked.
export default class User {
  socket: Socket
  queue: MatchQueue
  uid: UID
  usrInterval: NodeJS.Timer
  notifiedQL = 0
  leaderInterval: NodeJS.Timer
  constructor(uid: UID, socket: Socket) {
    this.uid = uid
    this.setSocket(socket)
    this.queue = serverQueueMap[serverLookup(uid)]

    this.usrInterval = setInterval(() => {
      // Only send usr info if the number changes
      const ql = this.queue.numUsrsCached
      if (this.notifiedQL !== ql) {
        socket.emit('users', ql)
        this.notifiedQL = ql
      }
    }, 1000)

    this.leaderInterval = setInterval(() => {
      socket.emit("leaderboard", database.leaderboardCache[serverLookup(uid)])
    }, 10 * 1000)
  }
  deconstructor() {
    this.queue.remove(this.uid)
    this.socket.removeAllListeners()
    clearInterval(this.usrInterval)
    clearInterval(this.leaderInterval)
  }
  setSocket(socket: Socket) {
    if (this.socket) this.unsetSocket()
    this.socket = socket
    this.userData()
    socket.on("match", () => this.matchMake())
    socket.on("match:cancel", () => this.unMatchMake())
    socket.on("profile", (uid: UID) => this.getProfile(uid))
  }
  unsetSocket() {
    this.socket.emit("new_connection_disconnect")
    this.socket.removeAllListeners()
  }
  matchMake() {
    if (this.queue.get(this.uid)) {
      console.error("user already queued")
      //TODO: emit something back to reset UI
      return
    }
    this.queue.add(this.uid, this.socket)
    this.queue.match(this.uid, async (a, as, b, bs) => matchPlayer(
      { user: await getUsr(a), socket: as },
      { user: await getUsr(b), socket: bs })
    )
  }
  unMatchMake() {
    this.queue.remove(this.uid)
  }
  async userData() {
    const usr = await getUsr(this.uid)
    if (!usr) return console.error("wtf?")
    this.socket.emit("userData", usr as UserData)
    this.socket.emit("leaderboard", database.leaderboardCache[serverLookup(this.uid)])
  }
  async getProfile(uid: UID) {
    const e = await enkaCache.get(uid)
    if (e) this.socket.emit(`profile:${uid}`, e.profile)
  }
}

function matchPlayer(p1: UserSocket, p2: UserSocket) {
  const matchId = "" + p1.user.uid + p2.user.uid + matchCounter++
  const match: Match = {
    key: matchId, p1, p2,
    startTime: new Date()
  };
  [p1, p2].map(p => p.socket.emit("match", matchId))
  let p1Accept = false, p2Accept = false
  const matchStr = `match:${matchId}:accept`
  p1.socket.once(matchStr, () => {
    p1Accept = true
    if (p2Accept) matchAccepted(matchId, p1, p2)
  })
  p2.socket.once(matchStr, () => {
    p2Accept = true
    if (p1Accept) matchAccepted(matchId, p1, p2)
  })

  setTimeout(() => {
    if (p1Accept && p2Accept) return
    [p1, p2].map(p => p.socket.emit(`match:${matchId}:canceled`))
  }, ACCEPT_MATCH_PERIOD_MS);
}

function matchAccepted(matchId: string, p1: UserSocket, p2: UserSocket) {
  const matchOppStr = `match:${matchId}:opponent`
  p1.socket.emit(matchOppStr, { uid: p2.user.uid, profile: p2.user.profile, join: false } as MatchOpponent)
  p2.socket.emit(matchOppStr, { uid: p1.user.uid, profile: p1.user.profile, join: true } as MatchOpponent)

  let p1Result = undefined as undefined | boolean
  let p2Result = undefined as undefined | boolean
  const matchResultStr = `match:${matchId}:result`
  p1.socket.on(matchResultStr, (result: boolean) => {
    p1Result = result
    checkResult()
  })
  p2.socket.on(matchResultStr, (result: boolean) => {
    p2Result = result
    checkResult()
  })
  async function checkResult() {
    if (p1Result === undefined || p2Result === undefined) return
    if (p1Result === p2Result) {
      // result discrepancy
      [p1Result, p2Result] = [undefined, undefined];
      const matchResultDisStr = `match:${matchId}:result_discrepancy`
      p1.socket.emit(matchResultDisStr)
      p2.socket.emit(matchResultDisStr)
    } else {
      p1.socket.removeAllListeners(matchResultStr)
      p2.socket.removeAllListeners(matchResultStr)
      const [winner, loser] = p1Result ? [p1, p2] : [p2, p1]
      database.matched(winner.user.uid, loser.user.uid, "win")
      database.matched(loser.user.uid, winner.user.uid, "loss")
      winner.socket.emit("userData", await getUsr(winner.user.uid))
      loser.socket.emit("userData", await getUsr(loser.user.uid))
      const matchResultAcceptStr = `match:${matchId}:result_accepted`
      p1.socket.emit(matchResultAcceptStr)
      p2.socket.emit(matchResultAcceptStr)
    }
  }
}