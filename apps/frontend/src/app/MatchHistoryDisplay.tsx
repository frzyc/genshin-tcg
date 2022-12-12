import { eloMatchMeta, MatchEntry, ProfileData, User } from '@genshin-tcg/common';
import { avatars, namebanners } from '@genshin-tcg/genshin-imgs';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Chip, Divider, Stack, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { resolutionToColor } from './common';
import { relativeTime } from './relative';
import { SocketContext } from './SocketContext';
export default function MatchHistoryDisplay({ user }: { user: User }) {
  return <Card>
    <Accordion defaultExpanded >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Typography>Match History</Typography>
          <Chip label={`ELO: ${eloMatchMeta(user.matchMeta).toFixed()}`} color="secondary" />
          <Chip label={`Wins: ${user.matchMeta.wins}`} color="success" />
          <Chip label={`Loss: ${user.matchMeta.losses}`} color="error" />
        </Box>
      </AccordionSummary>
      <Divider />
      <AccordionDetails>
        <Stack spacing={1}>
          {user.history.map((matchEntry, i) => <MatchHistoryEntry matchEntry={matchEntry} key={i} />)}
        </Stack>
      </AccordionDetails>
    </Accordion>
  </Card>
}
function MatchHistoryEntry({ matchEntry: { elo, opponent, opponentElo, resolution, time } }: { matchEntry: MatchEntry }) {
  const [profile, setProfile] = useState(undefined as ProfileData | undefined)
  const { socket } = useContext(SocketContext)
  useEffect(() => {
    const rEvtName = `profile:${opponent}`
    console.log("emit", rEvtName)
    socket.emit("profile", opponent)
    socket.once(rEvtName, (p: ProfileData) => {
      console.log("got specific profile", rEvtName)
      setProfile(p)
    })
    return () => {
      socket.off(rEvtName)
    }
  }, [opponent, socket])
  const profileid = (profile?.profilePicture ?? 10000005) as keyof typeof avatars

  const namebanner = namebanners[(profile?.nameCardId ?? "") as keyof typeof namebanners]
  return <Box sx={{
    padding: 1,
    // pl: 0,
    borderRadius: "56px",
    display: "flex", gap: 1,
    width: "100%",
    backgroundColor: resolutionToColor(resolution),
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
    <Chip label={profile ? `${profile.nickname} (${opponentElo.toFixed()})` : opponent} size="small" />
    <Typography>ELO: {elo.toFixed()}</Typography>
    <Box flexGrow={1} />
    <Typography sx={{ pr: 2, textShadow: "0 0 5px black" }}>{relativeTime(Date.now(), time)}</Typography>
  </Box >
}