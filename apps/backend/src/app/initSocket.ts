import { MatchOpponent, serverLookup, ServerName, serverNames, UID, UserData } from "@genshin-tcg/common";
import { Server } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { Database } from "./Database";
import { EnkaCache } from "./EnkaCache";
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

const database = new Database()
const enkaCache = new EnkaCache()
async function getUsr(uid: UID): Promise<UserData | null> {
  const enkaEntry = await enkaCache.get(uid)
  if (!enkaEntry) return null
  return { ...database.get(uid), uid, profile: enkaEntry.profile }
}

type Queue = { [uid: UID]: Socket }

const serverQueueMap = Object.fromEntries(serverNames.map(sn => [sn, {}])) as Record<ServerName, Queue>

let leaderboardCache = database.leaderboard()
setInterval(() => {
  leaderboardCache = database.leaderboard()
}, 10 * 1000)

export default function initSocket(server: Server) {
  const io = new SocketServer(server, {
    cors: {
      origin: "http://localhost:4200",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log("new connection", io.engine.clientsCount)
    let socketUid: UID = ""
    let queue = {} as Queue
    //update # of users to every connection
    const usrInterval = setInterval(() => {
      io.emit('users', Object.keys(queue).length)
    }, 1000)
    //update leaderboard to every connection
    const leaderInterval = setInterval(() => {
      socketUid && io.emit("leaderboard", leaderboardCache[serverLookup(socketUid)])
    }, 10 * 1000)

    socket.on("match", async (uid) => {
      queue = serverQueueMap[serverLookup(uid)]
      if (queue[uid]) {
        console.error("user already queued")
        //TODO: emit something back to reset UI
        return
      }
      if (Object.keys(queue).length >= 1) { // TODO elo matching
        const opponentUid = Object.keys(queue)[0]
        matchPlayer(
          { user: await getUsr(uid), socket },
          { user: await getUsr(opponentUid), socket: queue[opponentUid] })
        delete queue[opponentUid]
      } else {
        queue[uid] = socket
      }
    })
    socket.on("match:cancel", (uid: UID) => {
      delete queue[uid]
    })
    socket.on("userData", async (uid: UID) => {
      const usr = await getUsr(uid)
      if (usr) {
        socket.emit("userData", usr as UserData)
        socketUid = uid
        queue = serverQueueMap[serverLookup(socketUid)]
        io.emit("leaderboard", leaderboardCache[serverLookup(socketUid)])
      }
      else socket.emit("userData:fail")
    })
    socket.on("profile", async (uid: UID) => {
      const e = await enkaCache.get(uid)
      if (e) socket.emit(`profile:${uid}`, e.profile)
    })
    socket.on('disconnect', () => {
      delete queue[socketUid]
      socketUid = ""
      queue = {}
      socket.removeAllListeners()
      clearInterval(usrInterval)
      clearInterval(leaderInterval)
    });
  });
}

function matchPlayer(p1: UserSocket, p2: UserSocket) {
  console.log(p1.user.uid, p2.user.uid)
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
    console.log("MATCH DECLIENED");
    [p1, p2].map(p => p.socket.emit(`match:${matchId}:canceled`))
    //TODO: decline behaviour, putting the player who didnt decline back in queue
  }, 30 * 1000);
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