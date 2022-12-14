
import { UserData } from "@genshin-tcg/common";
import React from "react";

type UserContextObj = {
  user?: UserData,
  setUser: (u: UserData) => void,
  
}
const defUser: UserContextObj = {
  user: undefined,
  setUser: () => undefined,
}

export const UserContext = React.createContext(defUser)
