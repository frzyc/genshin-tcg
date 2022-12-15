import { ACCEPT_MATCH_PERIOD_MS, MatchOpponent, serverLookup, UID, UserData } from "@genshin-tcg/common";
import { Socket } from "socket.io";
import { database, enkaCache, getUsr, matches, serverQueueMap } from "./Globals";
import Match from "./Match";
import MatchQueue from "./MatchQueue";

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
    socket.on("ongoing", () => this.checkOnGoing())
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
    this.queue.add(this.uid, this)
    this.queue.match(this.uid, matchPlayer)
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
  async checkOnGoing() {

    //check if there is an ongoing match
    const ogMatch = matches.get(this.uid)
    console.log("checkOnGoing", !!ogMatch)
    if (ogMatch) {
      const opponent = ogMatch.p1.uid === this.uid ? ogMatch.p2 : ogMatch.p1
      this.socket.emit("match:ongoing", {
        matchId: ogMatch.matchId,
        uid: opponent.uid,
        profile: (await enkaCache.get(opponent.uid)).profile,
        join: ogMatch.p2.uid === this.uid,
        startTime: ogMatch.startTime
      } as MatchOpponent)
    }
  }
}

function matchPlayer(p1: User, p2: User) {
  const matchId = "" + p1.uid + p2.uid + matchCounter++
  [p1, p2].map(p => p.socket.emit("match", matchId))
  let p1Accept = false, p2Accept = false
  const matchStr = `match:${matchId}:accept`
  p1.socket.once(matchStr, () => {
    p1Accept = true
    if (p2Accept) matches.add(new Match(matchId, p1, p2))
  })
  p2.socket.once(matchStr, () => {
    p2Accept = true
    if (p1Accept) matches.add(new Match(matchId, p1, p2))
  })

  setTimeout(() => {
    if (p1Accept && p2Accept) return
    [p1, p2].map(p => p.socket.emit(`match:${matchId}:canceled`))
  }, ACCEPT_MATCH_PERIOD_MS);
}