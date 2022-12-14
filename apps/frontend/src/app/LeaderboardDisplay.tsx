import { Leaderboard, ProfileData, UID } from '@genshin-tcg/common';
import { avatars, namebanners } from '@genshin-tcg/genshin-imgs';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Chip, Divider, Stack, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { SocketContext } from './SocketContext';
export default function LeaderboardDisplay() {
  const { socket } = useContext(SocketContext)
  const [leaderboard, setleaderboard] = useState([] as Leaderboard)
  useEffect(() => {
    socket.on("leaderboard", l => setleaderboard(l))

    return () => {
      socket.off("leaderboard")
    }
  }, [socket])
  return <Card>
    <Accordion defaultExpanded >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Leaderboard (refreshes every 10s)</Typography>
      </AccordionSummary>
      <Divider />
      <AccordionDetails>
        <Stack spacing={1}>
          {leaderboard.map(([uid, elo]) => <LeaderboardEntry uid={uid} elo={elo} key={`${uid}_${elo}`} />)}
        </Stack>
      </AccordionDetails>
    </Accordion>
  </Card>
}
function LeaderboardEntry({ uid, elo }: { uid: UID, elo: number }) {
  const [profile, setProfile] = useState(undefined as ProfileData | undefined)
  const { socket } = useContext(SocketContext)
  useEffect(() => {
    const rEvtName = `profile:${uid}`
    socket.emit("profile", uid)
    socket.once(rEvtName, (p: ProfileData) => setProfile(p))
    return () => {
      socket.off(rEvtName)
    }
  }, [uid, socket])
  const profileid = (profile?.profilePicture ?? 10000005) as keyof typeof avatars

  const namebanner = namebanners[(profile?.nameCardId ?? "") as keyof typeof namebanners]
  return <Box sx={{
    padding: 1,
    // pl: 0,
    borderRadius: "56px",
    display: "flex", gap: 1,
    width: "100%",
    backgroundColor: `rgba(255,255,255,0.2)`,
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
    }} component="img" src={avatars[profileid]} />
    <Chip label={profile ? `${profile.nickname}` : uid} size="small" />
    <Typography>ELO: {elo.toFixed()}</Typography>
  </Box >
}