import { ProfileData, UID } from "@genshin-tcg/common"
import axios from "axios"
import { enka, EnkaData, enkaToProfile } from "./enka"
type EnkaCacheEntry = {
  profile: ProfileData,
  acquired: number
}
function enkaToCache(enkaData: EnkaData): EnkaCacheEntry {
  return {
    profile: enkaToProfile(enkaData),
    acquired: Date.now()
  }
}
export class EnkaCache {
  data = {} as { [user: UID]: EnkaCacheEntry }

  async get(uid: UID): Promise<EnkaCacheEntry | null> {
    if (this.data[uid]) return this.data[uid]
    if (process.env.NODE_ENV === "development" && enka[uid])
      return this.set(uid, enkaToCache(enka[uid]))
    try {
      const req = await axios.get(`https://enka.network/u/${uid}/__data.json`,
        { headers: { "User-Agent": "genshin-tcg", "accept-encoding": "*", timeout: 1000 } })
      if (req.data)
        return this.set(uid, enkaToCache(req.data as EnkaData))
    } catch (error) {
      console.error("enka request err:", error)
    }
    return null
  }
  set(uid: UID, usr: EnkaCacheEntry): EnkaCacheEntry {
    this.data[uid] = usr
    return usr
  }
}
