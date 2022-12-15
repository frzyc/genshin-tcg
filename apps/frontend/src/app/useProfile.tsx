import { ProfileData, UID } from "@genshin-tcg/common";
import { useContext, useEffect, useState } from "react";
import { profileCache } from "./ProfileCache";
import { SocketContext } from "./SocketContext";

export default function useProfile(uid: UID, delay: number) {
  const [profile, setProfile] = useState(undefined as ProfileData | undefined)
  const { socket } = useContext(SocketContext)

  useEffect(() => {
    if (profileCache[uid]) {
      setProfile(profileCache[uid])
      return
    }
    const rEvtName = `profile:${uid}`
    const timeout = setTimeout(() => {
      if (!profileCache[uid])
        socket.emit("profile", uid)
    }, delay);
    socket.once(rEvtName, (p: ProfileData) => {
      profileCache[uid] = p
      setProfile(p)
    })
    return () => {
      socket.off(rEvtName)
      clearTimeout(timeout)
    }
  }, [uid, socket, delay])
  return profile
}