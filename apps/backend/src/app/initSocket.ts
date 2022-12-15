import { ACCEPT_MATCH_PERIOD_MS, MatchOpponent, serverLookup, UID, UserData } from "@genshin-tcg/common";
import { Server } from "http";
import { Server as SocketServer, Socket } from "socket.io";
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
    let queue: MatchQueue
    //update # of users to every connection
    let notifiedQL = queue?.numUsrsCached ?? 0
    const usrInterval = setInterval(() => {
      // Only send usr info if the number changes
      const ql = queue?.numUsrsCached ?? 0
      if (notifiedQL !== ql) {
        socket.emit('users',)
        notifiedQL = ql
      }
    }, 1000)
    //update leaderboard to every connection
    const leaderInterval = setInterval(() => {
      socketUid && socket.emit("leaderboard", database.leaderboardCache[serverLookup(socketUid)])
    }, 10 * 1000)

    socket.on("match", (uid) => {
      if (!queue) return
      queue = serverQueueMap[serverLookup(uid)]
      if (queue.get(uid)) {
        console.error("user already queued")
        //TODO: emit something back to reset UI
        return
      }
      queue.add(uid, socket)
      queue.match(uid, async (a, as, b, bs) => matchPlayer(
        { user: await getUsr(a), socket: as },
        { user: await getUsr(b), socket: bs })
      )
    })
    socket.on("match:cancel", (uid: UID) => {
      queue?.remove(uid)
    })
    socket.on("userData", async (uid: UID) => {
      console.log("userData", uid)
      const usr = await getUsr(uid)
      if (usr) {
        setTimeout(() => {
          socket.emit("userData", usr as UserData)
          socketUid = uid
          queue = serverQueueMap[serverLookup(socketUid)]
          io.emit("leaderboard", database.leaderboardCache[serverLookup(socketUid)])
        }, 1000);

      }
      else socket.emit("userData:fail")
    })
    socket.on("profile", async (uid: UID) => {
      const e = await enkaCache.get(uid)
      if (e) socket.emit(`profile:${uid}`, e.profile)
    })
    socket.on('disconnect', () => {
      queue?.remove(socketUid)
      socketUid = ""
      queue = undefined
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