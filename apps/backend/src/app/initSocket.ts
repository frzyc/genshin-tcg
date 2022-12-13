import { UID, User } from "@genshin-tcg/common";
import { Server } from "http";
import { Server as SocketServer } from "socket.io";
import { Socket } from "socket.io";
import { Database } from "./Database";
type UserSocket = {
  user: User,
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
const queue = {} as { [uid: UID]: Socket }
export default function initSocket(server: Server) {
  const io = new SocketServer(server, {
    cors: {
      origin: "http://localhost:4200",
      methods: ["GET", "POST"]
    }
  });


  setInterval(() => {
    io.emit('users', Object.keys(queue).length)
  }, 1000)

  io.on('connection', (socket) => {
    let socketUid: UID = ""
    socket.on("match", (uid) => {
      if (queue[uid]) {
        console.error("user already queued")
        return
      }
      console.log("onMatch, adding ", uid, "to queue", Object.keys(queue))
      if (Object.keys(queue).length >= 1) { // TODO elo matching
        const opponentUid = Object.keys(queue)[0]

        matchPlayer({ user: database.getSync(uid), socket }, { user: database.getSync(opponentUid), socket: queue[opponentUid] })
        delete queue[opponentUid]
      } else {
        queue[uid] = socket
      }
    })
    socket.on("match:cancel", (uid: UID) => {
      delete queue[uid]
    })
    socket.on("userData", async (uid: UID) => {
      const usr = await database.get(uid)
      if (usr) {
        socket.emit("userData", usr)
        socketUid = uid
      }
      else socket.emit("userData:fail")
    })
    socket.on("profile", async (uid: UID) => {
      const usr = await database.get(uid)
      console.log("emit", `profile:${uid}`)
      if (usr) socket.emit(`profile:${uid}`, usr.profile)
      else socket.emit("profile:fail")
    })
    socket.on('disconnect', () => {
      console.log('user disconnected', socketUid, !!queue[socketUid]);
      delete queue[socketUid]
    });
  });
}

function matchPlayer(p1: UserSocket, p2: UserSocket) {
  const key = "" + p1.user.uid + p2.user.uid + matchCounter++
  const match: Match = {
    key, p1, p2,
    startTime: new Date()
  };
  [p1, p2].map(p => p.socket.emit("matched", key))
  let p1Accept = false, p2Accept = false
  p1.socket.once(`match_accept`, id => {
    if (id !== key) return
    p1Accept = true
    if (p2Accept) matchAccepted(key, p1, p2)
  })
  p2.socket.once(`match_accept`, id => {
    if (id !== key) return
    p2Accept = true
    if (p1Accept) matchAccepted(key, p1, p2)
  })

  setTimeout(() => {
    if (p1Accept && p2Accept) return
    console.log("MATCH DECLIENED");
    [p1, p2].map(p => p.socket.emit(`match:${key}:canceled`))
    //TODO: decline behaviour, putting the player who didnt decline back in queue
  }, 30 * 1000);
}

function matchAccepted(key: string, p1: UserSocket, p2: UserSocket) {
  console.log("MATCH ACCEPTED")
  p1.socket.emit("match_opponent", { name: p2.user.uid, join: false })
  p2.socket.emit("match_opponent", { name: p1.user.uid, join: true })

  let p1Result = undefined as undefined | boolean
  let p2Result = undefined as undefined | boolean

  p1.socket.on("match_result", ({ matchId, result }) => {
    console.log("p1 match_result", matchId, result)
    if (matchId !== key) return
    p1Result = result
    checkResult()
  })
  p2.socket.on("match_result", ({ matchId, result }) => {
    console.log("p2 match_result", matchId, result)
    if (matchId !== key) return
    p2Result = result
    checkResult()
  })
  function checkResult() {
    if (p1Result === undefined || p2Result === undefined) return
    if (p1Result === p2Result) {
      // result discrepancy
      [p1Result, p2Result] = [undefined, undefined];
      p1.socket.emit("match_discrepancy")
      p2.socket.emit("match_discrepancy")
    } else {
      p1.socket.removeAllListeners("match_result")
      p2.socket.removeAllListeners("match_result")
      console.log("MATCH IS OVER", p1Result, p2Result)
      const [winner, loser] = p1Result ? [p1, p2] : [p2, p1]
      winner.socket.emit("userData", database.matched(winner.user.uid, loser.user.uid, "win"))
      loser.socket.emit("userData", database.matched(loser.user.uid, winner.user.uid, "loss"))
      p1.socket.emit("match_result_accepted")
      p2.socket.emit("match_result_accepted")
    }
  }
}