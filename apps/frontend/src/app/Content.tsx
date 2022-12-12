import { User } from '@genshin-tcg/common';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import MatchHistoryDisplay from './MatchHistoryDisplay';
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
      localStorage.setItem("username", u.uid)
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
        {!!user?.uid && <MatchMaker />}
        {!!user && <MatchHistoryDisplay user={user} />}
      </Stack>
    </UserContext.Provider>
  </SocketContext.Provider>
}

function MatchMaker() {
  const { isConnected, } = useContext(SocketContext)
  const { user } = useContext(UserContext)
  return <Card>
    <CardContent>
      <Connections />
      {isConnected && user && <Match user={user} />}
    </CardContent>
  </Card>
}
function Connections() {
  const { socket } = useContext(SocketContext)
  const [numUsers, setNumUsers] = useState(0)
  useEffect(() => {
    socket.on('users', (n) => {
      setNumUsers(n)
    })
    return () => {
      socket.off('users');
    };
  }, []);
  return <Typography>Number of players: {numUsers}</Typography>
}
function Match({ user }: { user: User }) {
  const { socket } = useContext(SocketContext)
  const [matching, setMatching] = useState(false);
  const [matchId, setMatchId] = useState("")
  const [opponent, setOpponent] = useState(undefined as undefined | { name: string, join: boolean })
  const [matchResult, setMatchResult] = useState(undefined as undefined | boolean)
  const [resultDiscrepancy, setresultDiscrepancy] = useState(false)
  const matchAccept = () => {
    setOpponent(undefined)
    socket.emit(`match_accept`, matchId);
  }
  const matchMake = () => {
    setMatching(true)
    setMatchId("")
    setOpponent(undefined)
    setMatchResult(undefined)
    setresultDiscrepancy(false)
    socket.emit('match', user.uid);
  }

  useEffect(() => {

    socket.on('matched', (op) => {
      setMatchId(op)
    });
    socket.on('match_opponent', (op) => {
      setOpponent(op)
    });
    socket.on("match_discrepancy", () => {
      setMatchResult(undefined)
      setresultDiscrepancy(true)
    })
    socket.on("match_result_accepted", () => {
      setMatching(false)
      setMatchId("")
      setOpponent(undefined)
      setMatchResult(undefined)
      setresultDiscrepancy(false)
    })

    return () => {
      socket.off('matched');
      socket.off('match_opponent');
    };
  }, []);

  const onWon = () => {
    setMatchResult(true)
    socket.emit("match_result", { matchId, result: true })
    setresultDiscrepancy(false)
  }
  const onLost = () => {
    setMatchResult(false)
    socket.emit("match_result", { matchId, result: false })
    setresultDiscrepancy(false)
  }

  return <Box>
    {!matchId && <Button variant='contained' onClick={matchMake} disabled={matching}>Match me</Button>}
    {!matchId && matching && <Typography>Matching....</Typography>}
    {!!matchId && !opponent && <Box>
      <Typography>Matched!</Typography>
      <Button variant='contained' onClick={matchAccept} disabled={!matchId}>Accept Match</Button>
      <Typography>You have 30 seconds to accept the match</Typography>
    </Box>}
    {!!opponent && <Box>
      <Typography>You have been matched with {opponent.name}.</Typography>
      {opponent.join ? <Typography>Join their world to start the game.</Typography> :
        <Typography>Wait for a join request to start the game.</Typography>}
      <Typography>You have 30 minutes to let us know if you win or lost.</Typography>
      <Box>
        <Button variant="contained" color="success" onClick={onWon} disabled={matchResult === false}>I won</Button>
        <Button variant="contained" color="error" onClick={onLost} disabled={matchResult === true}>I Lost</Button>
      </Box>
      {resultDiscrepancy && <Typography color="error">There is a discrepancy for result. Please submit result again.</Typography>}
    </Box>}
  </Box>
}
