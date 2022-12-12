
import { User } from "@genshin-tcg/common";
import React from "react";

type UserContextObj = {
  user?: User,
  setUser: (u: User) => void,
  
}
const defUser: UserContextObj = {
  user: undefined,
  setUser: () => undefined,
}

export const UserContext = React.createContext(defUser)
