
import { MatchHistory } from "@genshin-tcg/common";
import React from "react";

type User = {
  username: string,
  setUserName: (u: string) => void
  history: MatchHistory
  setHistory: (h: MatchHistory) => void
}
const defUser: User = {
  username: "",
  history: [],
  setHistory: () => undefined,
  setUserName: () => undefined
}

export const UserContext = React.createContext(defUser)
