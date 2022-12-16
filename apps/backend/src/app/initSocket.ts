import { UID } from "@genshin-tcg/common";
import { Server } from "http";
import { Server as SocketServer } from "socket.io";
import { environment } from "../environments/environment";
import { getUsr, users } from "./Globals";

export default function initSocket(server: Server) {
  const io = new SocketServer(server, environment.production ? undefined : {
    cors: {
      origin: "http://localhost:4200",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    socket.once("userData", async (uid: UID) => {
      const usr = await getUsr(uid)
      if (!usr) return socket.emit("userData:fail")
      users.set(uid, socket)
      socket.once('disconnect', () => {
        users.remove(uid)
      })
    })
  });
}