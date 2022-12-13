import { User } from '@genshin-tcg/common';
import { Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import MatchHistoryDisplay from './MatchHistoryDisplay';
import MatchMakerCard from './MatchMakerCard';
import { SocketContext } from './SocketContext';
import { UserContext } from './UserContext';
import UserDisplay from './UserDisplay';

export default function Content() {
  const [user, setUser] = useState(undefined as User | undefined)
  const socket = useMemo(() => io("http://localhost:8080/"), [])
  const [isConnected, setIsConnected] = useState(socket.connected);
  const socketCtx = useMemo(() => ({
    isConnected,
    socket
  }), [socket, isConnected])
  const userCtx = useMemo(() => ({
    user,
    setUser: (u: User) => {
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
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);
  console.log({ user })
  return <SocketContext.Provider value={socketCtx}>
    <UserContext.Provider value={userCtx}>
      <Stack spacing={2}>
        <UserDisplay />
        {!!user?.uid && isConnected && <MatchMakerCard />}
        {!!user && <MatchHistoryDisplay user={user} />}
      </Stack>
    </UserContext.Provider>
  </SocketContext.Provider>
}