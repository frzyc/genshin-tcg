import { UID } from "@genshin-tcg/common"
import Match from "./Match"

export default class Matches {
  matches = {} as { [uid: UID]: Match }
  add(match: Match) {
    this.matches[match.p1.uid] = match
    this.matches[match.p2.uid] = match
  }
  remove(match: Match) {
    delete this.matches[match.p1.uid]
    delete this.matches[match.p2.uid]
  }
  get(uid: UID) {
    return this.matches[uid]
  }
}