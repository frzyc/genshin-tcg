import * as express from "express";
import { Express } from "express"
import * as cors from "cors";
import * as http from 'http';
import { elo } from "@genshin-tcg/common"

import { Server, Socket } from "socket.io";
import { Database } from "./Database";

export default function initServer(app: Express) {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:4200",
      methods: ["GET", "POST"]
    }

  });
  setInterval(() => {
    io.emit('users', io.engine.clientsCount)
  }, 1000)


  type NameSocket = {
    name: string,
    socket: Socket,
  }

  const database = new Database()

  type Match = {
    key: string
    p1: NameSocket
    p2: NameSocket
    startTime: Date,
  }
  let matchCounter = 0;
  const queue = {} as { [user: string]: Socket }
  io.on('connection', (socket) => {
    console.log('a user connected', io.engine.clientsCount);

    socket.on("match", (name) => {
      if (queue[name]) {
        console.error("user already queued")
        return
      }
      console.log("onMatch, adding ", name, "to queue", Object.keys(queue))
      if (Object.keys(queue).length >= 1) { // TODO elo matching
        const opponentname = Object.keys(queue)[0]

        matchPlayer({ name, socket }, { name: opponentname, socket: queue[opponentname] })
        delete queue[opponentname]
      } else {
        queue[name] = socket
      }
    })
    socket.on("userData", (name) => {
      console.log("sendUserData", name, database.get(name))
      socket.emit("userData", database.get(name))
    })
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  function matchPlayer(p1: NameSocket, p2: NameSocket) {
    const key = p1.name + p2.name + matchCounter++
    const match: Match = {
      key, p1, p2,
      startTime: new Date()
    };
    [p1, p2].map(p => p.socket.emit("matched", key))
    let p1Accept = false, p2Accept = false
    p1.socket.once(`match_accept`, id => {
      if (id !== key) return
      p1Accept = true
      matchAccepted()
    })
    p2.socket.once(`match_accept`, id => {
      if (id !== key) return
      p2Accept = true
      matchAccepted()
    })
    function matchAccepted() {
      if (!p1Accept || !p2Accept) return
      console.log("MATCH ACCEPTED")
      p1.socket.emit("match_opponent", { name: p2.name, join: false })
      p2.socket.emit("match_opponent", { name: p1.name, join: true })

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
          const winnerUser = database.get(winner.name)
          const loserUser = database.get(loser.name)
          const winnerElo = elo(Object.values(winnerUser.history).map(({ opponentElo, won }) => opponentElo * (won ? 1 : -1)))
          const loserElo = elo(Object.values(loserUser.history).map(({ opponentElo, won }) => opponentElo * (won ? 1 : -1)))
          winnerUser.history.push({ opponent: loser.name, opponentElo: loserElo, won: true, time: Date.now() })
          database.set(winner.name, winnerUser)

          loserUser.history.push({ opponent: winner.name, opponentElo: winnerElo, won: false, time: Date.now() })
          database.set(loser.name, loserUser)

          winner.socket.emit("userData", winnerUser)
          loser.socket.emit("userData", loserUser)
          p1.socket.emit("match_result_accepted")
          p2.socket.emit("match_result_accepted")
        }
      }
    }
    setTimeout(() => {
      console.log("MATCH DECLIENED");
      //TODO: decline behaviour
    }, 30 * 1000);
  }

  app.use(cors({ origin: "http://localhost:3000" }))

  // parse requests of content-type - application/json
  app.use(express.json());

  // parse requests of content-type - application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: true }));


  // simple route
  app.get("/", (req, res) => {
    res.json({ message: "Why are you here?" });
  });


  // set port, listen for requests
  const PORT = process.env.PORT || 8080;

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  })
  server.on('error', console.error);
  return server
}

