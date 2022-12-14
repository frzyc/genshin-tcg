import { UserData } from '@genshin-tcg/common';
import { Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import LeaderboardDisplay from './LeaderboardDisplay';
import MatchHistoryDisplay from './MatchHistoryDisplay';
import MatchMakerCard from './MatchMakerCard';
import { SocketContext } from './SocketContext';
import { UserContext } from './UserContext';
import UserDisplay from './UserDisplay';
const socket = io("http://localhost:8080/")
export default function Content() {
  const [user, setUser] = useState(undefined as UserData | undefined)
  // const socket = useMemo(() => io("http://localhost:8080/"), [])
  const [isConnected, setIsConnected] = useState(socket.connected);
  const socketCtx = useMemo(() => ({
    isConnected,
    socket
  }), [isConnected])
  const userCtx = useMemo(() => ({
    user,
    setUser: (u: UserData) => {
      setUser(u)
      localStorage.setItem("uid", u.uid)
    },
  }), [user, setUser])
  // set up event handlers
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });
    socket.on('disconnect', () => {
      setIsConnected(false);
      socket.removeAllListeners();
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);
  return <SocketContext.Provider value={socketCtx}>
    <UserContext.Provider value={userCtx}>
      <Stack spacing={2}>
        <UserDisplay />
        {!!user && isConnected && <MatchMakerCard user={user} />}
        {!!user && <MatchHistoryDisplay user={user} />}
        <LeaderboardDisplay />
      </Stack>
    </UserContext.Provider>
  </SocketContext.Provider>
}