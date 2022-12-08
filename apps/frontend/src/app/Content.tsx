import { Box, Button, Card, CardContent, CardHeader, Chip, Stack, TextField, Typography } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { eloHistory } from '@genshin-tcg/common';
import { MatchHistory } from '@genshin-tcg/common';
import { UserContext } from './UserContext';

const socket = io("http://localhost:8080/")

export default function Content() {
  const [username, setUserName] = useState(() => localStorage.getItem("username") || "")
  const [history, setHistory] = useState([] as MatchHistory)
  const userCtx = useMemo(() => ({
    username,
    setUserName: (u: string) => {
      setUserName(u)
      setHistory([])
    },
    history,
    setHistory
  }), [username, setUserName, history, setHistory])
  useEffect(() => {
    socket.emit("userData", username)
  }, [username])
  console.log("username", username)
  return <UserContext.Provider value={userCtx}>
    {username ? <Stack spacing={1}>
      <User />
      <MatchMaker />
    </Stack> : <Name />}
  </UserContext.Provider>
}
function Name() {
  const { setUserName } = useContext(UserContext)
  const [iUName, setIUName] = useState("")
  return <Card>
    <CardHeader title="who are you?" />
    <CardContent sx={{ display: "flex", gap: 1 }}>
      <TextField label="Your name" value={iUName} onChange={e => setIUName(e.target.value)} />
      <Button variant="contained" onClick={(e) => {
        localStorage.setItem("username", iUName)
        console.log("newname", iUName)
        setUserName(iUName)
      }}>That's me!</Button>
    </CardContent>
  </Card>
}

function User() {
  const { username, history, setUserName } = useContext(UserContext)
  const eloScore = useMemo(() => eloHistory(history), [history])
  return <Card>
    <CardHeader title={<Typography>{username} ELO:{eloScore}</Typography>} action={<Button onClick={() => {
      setUserName("")
      localStorage.removeItem("username")
    }}>LOG OUT</Button>} />
    <CardContent>
      <Stack spacing={1}>
        {history.map(({ opponent, opponentElo, won, time }, i) => <Box display="flex" gap={1}>
          <Chip label={opponent} color={won ? "success" : "error"} />
          {(new Date(time)).toString()}
          ELO: {opponentElo}
        </Box>)}
      </Stack>
    </CardContent>
  </Card>
}
function MatchMaker() {
  const { setHistory } = useContext(UserContext)
  const [isConnected, setIsConnected] = useState(socket.connected);


  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on("userData", ({ history }) => {
      //TODO: update userData?
      console.log("got userData", history)
      setHistory(history)
    })
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('userData');
    };
  }, []);



  return <Card>
    <CardContent>
      <Connections />
      {isConnected && <Match />}
    </CardContent>
  </Card>
}
function Connections() {
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
function Match() {
  const { username, setHistory } = useContext(UserContext)
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
    socket.emit('match', username);
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
