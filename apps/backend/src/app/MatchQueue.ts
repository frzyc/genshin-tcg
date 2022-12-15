import { UID } from "@genshin-tcg/common";
import { Socket } from "socket.io";

export default class MatchQueue {
  queue = {} as { [uid: UID]: Socket }
  numUsrsCached = 0
  updateInterval: NodeJS.Timer
  constructor() {
    this.updateInterval = setInterval(() => {
      this.numUsrsCached = Object.keys(this.queue).length
    }, 1000)
  }
  destructor() {
    clearInterval(this.updateInterval)
  }
  add(uid: UID, socket: Socket) {
    this.queue[uid] = socket
  }
  remove(uid: UID) {
    delete this.queue[uid]
  }
  get(uid: UID) {
    return this.queue[uid]
  }
  getUids(): UID[] {
    return Object.keys(this.queue)
  }
  get numUsrs() {
    this.numUsrsCached = Object.keys(this.queue).length
    return this.numUsrsCached
  }
  match(uid: UID, cb: (a: UID, as: Socket, b: UID, bs: Socket) => void) {
    if (!this.numUsrs) return
    // TODO: elo matching
    const opponentUid = this.getUids().find((u) => u !== uid)
    if (!opponentUid) return
    cb(uid, this.get(uid), opponentUid, this.get(opponentUid))
    this.remove(uid)
    this.remove(opponentUid)
  }
}