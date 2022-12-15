import { UID } from "@genshin-tcg/common";
import User from "./User";

export default class MatchQueue {
  queue = {} as { [uid: UID]: User }
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
  add(uid: UID, usr: User) {
    this.queue[uid] = usr
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
  match(uid: UID, cb: (a: User, b: User) => void) {
    if (!this.queue[uid]) return
    if (!this.numUsrs) return
    // TODO: elo matching
    const opponentUid = this.getUids().find((u) => u !== uid)
    if (!opponentUid) return
    cb(this.queue[uid], this.queue[opponentUid])
    this.remove(uid)
    this.remove(opponentUid)
  }
}