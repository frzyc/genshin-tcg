import { UID } from "@genshin-tcg/common";
import { Socket } from "socket.io";
import User from "./User";

export default class Users {
  users = {} as { [uid: UID]: User }
  get(uid: UID) {
    return this.users[uid]
  }
  set(uid: UID, socket: Socket) {
    if (this.users[uid]) this.users[uid].setSocket(socket)
    else this.users[uid] = new User(uid, socket)
  }
  remove(uid: UID) {
    this.users[uid]?.deconstructor()
    delete this.users[uid]
  }
}