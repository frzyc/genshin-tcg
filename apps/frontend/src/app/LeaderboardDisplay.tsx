import { Leaderboard, UID } from '@genshin-tcg/common';
import { avatars, namebanners } from '@genshin-tcg/genshin-imgs';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Chip, Divider, Stack, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { SocketContext } from './SocketContext';
import useProfile from './useProfile';
export default function LeaderboardDisplay() {
  const { socket } = useContext(SocketContext)
  const [leaderboard, setleaderboard] = useState([] as Leaderboard)
  useEffect(() => {
    socket.on("leaderboard", l => setleaderboard(l))

    return () => {
      socket.off("leaderboard")
    }
  }, [socket])
  if (!leaderboard) return null
  return <Card>
    <Accordion defaultExpanded >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Leaderboard (refreshes every 10s)</Typography>
      </AccordionSummary>
      <Divider />
      <AccordionDetails>
        <Stack spacing={1}>
          {leaderboard.map(([uid, elo], i) => <LeaderboardEntry index={i} uid={uid} elo={elo} key={`${uid}_${elo}`} />)}
        </Stack>
      </AccordionDetails>
    </Accordion>
  </Card>
}
function LeaderboardEntry({ index, uid, elo }: { index: number, uid: UID, elo: number }) {
  const profile = useProfile(uid, (index + 1) * 100)

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