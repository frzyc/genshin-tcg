import React from "react"
import { Socket } from "socket.io-client"

type SocketContextObj = {
    isConnected: boolean,
    socket: Socket
}

export const SocketContext = React.createContext({} as SocketContextObj)