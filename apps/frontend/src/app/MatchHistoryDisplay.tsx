import { eloMatchMeta, MatchEntry, UserData } from '@genshin-tcg/common';
import { avatars, namebanners } from '@genshin-tcg/genshin-imgs';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Card, Chip, Divider, Stack, Typography } from '@mui/material';
import { resolutionToColor } from './common';
import { relativeTime } from './relative';
import useProfile from './useProfile';
export default function MatchHistoryDisplay({ user }: { user: UserData }) {
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
          {user.history.map((matchEntry, i) => <MatchHistoryEntry index={i} matchEntry={matchEntry} key={`${i}${matchEntry.opponent}${matchEntry.time}`} />)}
        </Stack>
      </AccordionDetails>
    </Accordion>
  </Card>
}
function MatchHistoryEntry({ index, matchEntry: { elo, opponent, opponentElo, resolution, time } }: { index: number, matchEntry: MatchEntry }) {
  //TODO: need to refresh every once in a while to refresh the timer

  const profile = useProfile(opponent, (index + 1) * 100)
  const profileid = (profile?.profilePicture ?? 10000005) as keyof typeof avatars

  const namebanner = namebanners[(profile?.nameCardId ?? "") as keyof typeof namebanners]
  return <Box display="flex" alignItems="center" gap={1}>
    <Typography sx={{ minWidth: "3em", color: resolutionToColor(resolution) }}>{elo.toFixed()}</Typography>
    <Box sx={{
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

      <Box flexGrow={1} />
      <Typography sx={{ pr: 2, textShadow: "0 0 5px black" }}>{relativeTime(Date.now(), time)}</Typography>
    </Box >
  </Box >
}