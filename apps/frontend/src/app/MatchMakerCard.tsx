import { ACCEPT_MATCH_PERIOD_MS, MatchOpponent, UserData } from '@genshin-tcg/common';
import { avatars, namebanners } from '@genshin-tcg/genshin-imgs';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import GroupIcon from '@mui/icons-material/Group';
import { LoadingButton } from '@mui/lab';
import { Box, Button, ButtonGroup, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { minSecStr } from './relative';
import { SocketContext } from './SocketContext';
export default function MatchMakerCard({ user }: { user: UserData }) {
  const { socket } = useContext(SocketContext)
  const [matchId, setMatchId] = useState("")
  const [opponent, setOpponent] = useState(undefined as undefined | MatchOpponent)

  // when a new match is found, reset the opponent.
  useEffect(() => setOpponent(undefined), [matchId])

  const onMatchMake = useCallback(() => {
    setMatchId("")
    setOpponent(undefined)
    socket.emit('match', user.uid);
  }, [socket, user.uid])
  const stopMatchMake = useCallback(() => {
    socket.emit("match:cancel", user.uid)
  }, [socket, user.uid])

  useEffect(() => {
    socket.on('match', (op) => {
      setMatchId(op)
    });

    return () => {
      socket.off('match');
      socket.off('match_discrepancy');
      socket.off('match_result_accepted');
    };
  }, [socket]);
  useEffect(() => {
    const matchOppStr = `match:${matchId}:opponent`
    socket.on(matchOppStr, (op: MatchOpponent) => {
      setOpponent(op)
    });
    return () => {
      socket.off(matchOppStr);
    };
  }, [socket, matchId])

  useEffect(() => {
    const matchStr = `match:${matchId}:canceled`
    socket.once(matchStr, () => {
      setMatchId("")
      setOpponent(undefined)
    })

    return () => {
      socket.off(matchStr)
    }
  }, [socket, matchId])

  const onMatchOver = useCallback(() => setMatchId(""), [],
  )

  return <Card>
    <CardContent sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      {!matchId && <Box display="flex" gap={1} width="100%" alignItems="center">
        <MatchMakeButton onMatchMake={onMatchMake} stopMatchMake={stopMatchMake} />
        <Box flexGrow={1} />
        <NumUserDisplay />
      </Box>}
      {/* {!matchId && matching && <Typography>Matching....</Typography>} */}
      {!!matchId && !opponent && <AcceptMatchButton matchId={matchId} />}
      {!!matchId && !!opponent && <MatchOpponentDisplay opponent={opponent} matchId={matchId} onMatchOver={onMatchOver} />}
    </CardContent>
  </Card>
}
function NumUserDisplay() {
  const [numUsers, setNumUsers] = useState(0)
  const { socket } = useContext(SocketContext)
  useEffect(() => {
    socket.on('users', (n) => {
      console.log("users", n)
      setNumUsers(n)
    })
    return () => {
      socket.off('users');
    };
  }, [socket]);
  return <Typography>Number of players in queue: {numUsers}</Typography>
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
function AcceptMatchButton({ matchId, }: { matchId: string }) {
  const { socket } = useContext(SocketContext)
  const [startTime, setstartTime] = useState(0)
  const [timeElapsed, settimeElapsed] = useState(0)
  const interval = useRef(undefined as undefined | NodeJS.Timer)
  const [accepted, setAccepted] = useState(false)
  const onClick = useCallback(() => {
    setAccepted(true)
    console.log("accept", `match:${matchId}:accept`)
    socket.emit(`match:${matchId}:accept`);
  }, [setAccepted, socket, matchId],)
  useEffect(() => {
    setstartTime(Date.now())
    setAccepted(false)
  }, [matchId])
  useEffect(() => {
    interval.current = setInterval(() => {
      const elapsed = ACCEPT_MATCH_PERIOD_MS - (Date.now() - startTime)
      settimeElapsed(elapsed < 0 ? 0 : elapsed)
    }, 100)

    return () => {
      clearInterval(interval.current)
    }
  }, [startTime,])
  const progress = 100 * timeElapsed / (ACCEPT_MATCH_PERIOD_MS)
  return <Button sx={{
    position: "relative",
    overflow: "hidden"
  }}
    variant="contained"
    color="success"
    onClick={onClick}
    disabled={!matchId || accepted}
  >
    <span>ACCEPT MATCH <strong>{(timeElapsed / 1000).toFixed(1)}s</strong></span>
    <LinearProgress sx={{ width: "100%", position: "absolute", bottom: 0 }} color="error" value={progress} variant="determinate" />
  </Button>
}
function MatchOpponentDisplay({ matchId, opponent, onMatchOver }: { matchId: string, opponent: MatchOpponent, onMatchOver: () => void }) {
  const { socket } = useContext(SocketContext)
  const [matchResult, setMatchResult] = useState(undefined as undefined | boolean)
  const [resultDiscrepancy, setresultDiscrepancy] = useState(false)

  useEffect(() => {
    const matchResultDisStr = `match:${matchId}:result_discrepancy`
    socket.on(matchResultDisStr, () => {
      setMatchResult(undefined)
      setresultDiscrepancy(true)
    })
    const matchResultAcceptStr = `match:${matchId}:result_accepted`
    socket.on(matchResultAcceptStr, () => {
      setMatchResult(undefined)
      setresultDiscrepancy(false)
      onMatchOver()
    })
    return () => {
      socket.off(matchResultDisStr);
      socket.off(matchResultAcceptStr);
    };
  }, [socket, matchId, onMatchOver]);
  const matchResultStr = `match:${matchId}:result`
  const onWon = () => {
    setMatchResult(true)
    socket.emit(matchResultStr, true)
    setresultDiscrepancy(false)
  }
  const onLost = () => {
    setMatchResult(false)
    socket.emit(matchResultStr, false)
    setresultDiscrepancy(false)
  }
  return <Box>
    <Typography>You have been matched with:</Typography>
    <OpponentDisplay opponent={opponent} />
    {opponent.join ? <Typography>Join their world to start the game.</Typography> :
      <Typography>Wait for a join request to start the game.</Typography>}
    <Typography>You have 30 minutes to let us know if you win or lost.</Typography>
    <Box display="flex" gap={2}>
      <Button variant="contained" color="success" onClick={onWon} disabled={matchResult === false}>I won</Button>
      <Button variant="contained" color="error" onClick={onLost} disabled={matchResult === true}>I Lost</Button>
    </Box>
    {resultDiscrepancy && <Typography color="error">There is a discrepancy for result. Please submit result again.</Typography>}
  </Box>
}
function OpponentDisplay({ opponent: { join, profile: { nickname, profilePicture, nameCardId }, uid } }: { opponent: MatchOpponent }) {
  const profileImg = avatars[profilePicture as keyof typeof avatars]

  const namebanner = namebanners[nameCardId as keyof typeof namebanners]
  const onCopy = () => {
    navigator.clipboard.writeText(uid);

  }
  return <Box sx={{
    padding: 1,
    // pl: 0,
    borderRadius: "56px",
    display: "flex", gap: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    backgroundImage: `url(${namebanner})`,
    backgroundSize: "auto 100%",
    backgroundPosition: "right center",
    backgroundRepeat: "no-repeat"
  }}>
    <Box sx={{
      marginY: "-4px",
      marginLeft: "-4px",
      height: "32px", width: "auto",
      borderRadius: "56px",
      backgroundColor: "rgba(200,200,200,0.8)"
    }} component="img" src={profileImg} />
    <Chip label={`${nickname}`} size="small" />
    <Box flexGrow={1} />
    {join && <Chip label={uid} color="primary" size="small" deleteIcon={<ContentPasteIcon />} onClick={onCopy} onDelete={onCopy} />}
  </Box >
}