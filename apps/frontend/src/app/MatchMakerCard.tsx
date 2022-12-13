import { User } from '@genshin-tcg/common';
import GroupIcon from '@mui/icons-material/Group';
import { LoadingButton } from '@mui/lab';
import { Box, Button, ButtonGroup, Card, CardContent, LinearProgress, Typography } from '@mui/material';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { minSecStr } from './relative';
import { SocketContext } from './SocketContext';
import { UserContext } from './UserContext';
export default function MatchMakerCard() {
  const { user } = useContext(UserContext)
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
  return <Card>
    <CardContent sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      {user && <Match user={user} />}
      <Box flexGrow={1} />
      <Typography>Number of players in queue: {numUsers}</Typography>
    </CardContent>
  </Card>
}
function Match({ user }: { user: User }) {
  const { socket } = useContext(SocketContext)
  const [matchId, setMatchId] = useState("")
  const [opponent, setOpponent] = useState(undefined as undefined | { name: string, join: boolean })
  const [matchResult, setMatchResult] = useState(undefined as undefined | boolean)
  const [resultDiscrepancy, setresultDiscrepancy] = useState(false)
  const matchAccept = () => {
    setOpponent(undefined)
    socket.emit(`match_accept`, matchId);
  }
  const onMatchMake = useCallback(() => {

    setMatchId("")
    setOpponent(undefined)
    setMatchResult(undefined)
    setresultDiscrepancy(false)
    socket.emit('match', user.uid);
  }, [socket, user.uid])
  const stopMatchMake = useCallback(() => {
    socket.emit("match:cancel", user.uid)
  }, [socket, user.uid])

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

      setMatchId("")
      setOpponent(undefined)
      setMatchResult(undefined)
      setresultDiscrepancy(false)
    })

    return () => {
      socket.off('matched');
      socket.off('match_opponent');
      socket.off('match_discrepancy');
      socket.off('match_result_accepted');
    };
  }, [socket]);

  useEffect(() => {
    const matchStr = `match:${matchId}:canceled`
    socket.once(matchStr, () => {
      setMatchId("")
      setOpponent(undefined)
      setMatchResult(undefined)
      setresultDiscrepancy(false)
    })

    return () => {
      socket.off(matchStr)
    }
  }, [socket, matchId])


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

    {!matchId && <MatchMakeButton onMatchMake={onMatchMake} stopMatchMake={stopMatchMake} />}
    {/* {!matchId && matching && <Typography>Matching....</Typography>} */}
    {!!matchId && !opponent && <AcceptMatchButton matchid={"matchId"} onClick={matchAccept} />}
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
function MatchMakeButton({ onMatchMake, stopMatchMake }: { onMatchMake: () => void, stopMatchMake: () => void }) {
  const [timeStr, settimeStr] = useState("")
  const interval = useRef(undefined as undefined | NodeJS.Timer)
  const [matchTime, setMatchTime] = useState(0);
  const onMatch = useCallback(() => {
    setMatchTime(Date.now())
    onMatchMake()
  }, [onMatchMake, setMatchTime],)
  const onCancel = useCallback(() => {
    setMatchTime(0)
    stopMatchMake()
  }, [setMatchTime, stopMatchMake],)


  useEffect(() => {
    if (matchTime) interval.current = setInterval(() => settimeStr(minSecStr(Date.now() - matchTime)), 100)
    else settimeStr("")
    return () => {
      clearInterval(interval.current)
    }
  }, [matchTime, interval])

  return <ButtonGroup><LoadingButton
    loading={!!matchTime}
    loadingPosition="start"
    startIcon={<GroupIcon />}
    variant='contained'
    onClick={onMatch}>
    {timeStr ? `Matching ${timeStr}` : "Match me"}
  </LoadingButton>
    <Button color="error" variant="contained" disabled={!matchTime} onClick={onCancel}>
      Cancel
    </Button>
  </ButtonGroup>
}
function AcceptMatchButton({ matchid, onClick: onClickProp }: { matchid: string, onClick: () => void }) {
  const [startTime, setstartTime] = useState(0)
  const [timeElapsed, settimeElapsed] = useState(0)
  const interval = useRef(undefined as undefined | NodeJS.Timer)
  const [accepted, setAccepted] = useState(false)
  const onClick = useCallback(() => {
    setAccepted(true)
    onClickProp()
  }, [setAccepted, onClickProp],)

  useEffect(() => {
    if (matchid) {
      setstartTime(Date.now())
      setAccepted(false)

      interval.current = setInterval(() => {
        const elapsed = 30 * 1000 - (Date.now() - startTime)
        settimeElapsed(elapsed < 0 ? 0 : elapsed)
      }, 100)
    }
    return () => {
      clearInterval(interval.current)
    }
  }, [setstartTime, setAccepted, startTime, matchid, interval])
  const progress = 100 * timeElapsed / (30 * 1000)
  return <Button sx={{
    position: "relative",
    overflow: "hidden"
  }}
    variant="contained"
    color="success"
    onClick={onClick}
    disabled={!matchid || accepted}
  >
    <span>ACCEPT MATCH <strong>{(timeElapsed / 1000).toFixed(1)}s</strong></span>
    <LinearProgress sx={{ width: "100%", position: "absolute", bottom: 0 }} color="error" value={progress} variant="determinate" />
  </Button>
}