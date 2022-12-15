import { ServerName, serverNames, UID, UserData } from "@genshin-tcg/common";
import { Database } from "./Database";
import { EnkaCache } from "./EnkaCache";
import MatchQueue from "./MatchQueue";
import Users from "./Users";

export const database = new Database()
export const enkaCache = new EnkaCache()
export async function getUsr(uid: UID): Promise<UserData | null> {
    const enkaEntry = await enkaCache.get(uid)
    if (!enkaEntry) return null
    return { ...database.get(uid), uid, profile: enkaEntry.profile }
}
export const serverQueueMap = Object.fromEntries(serverNames.map(sn => [sn, new MatchQueue()])) as Record<ServerName, MatchQueue>
export const users = new Users()