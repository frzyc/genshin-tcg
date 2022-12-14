import { UserData } from '@genshin-tcg/common';
import { avatars, namebanners } from '@genshin-tcg/genshin-imgs';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoadingButton from '@mui/lab/LoadingButton';
import { Box, TextField, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { SocketContext } from './SocketContext';
import { UserContext } from './UserContext';
export default function UserDisplay() {
  const { socket } = useContext(SocketContext)
  const { user, setUser } = useContext(UserContext)
  const [uidTemp, setUidTemp] = useState(() => localStorage.getItem("uid") || "123456789") // TODO: default ""
  const [checking, setchecking] = useState(false)
  useEffect(() => {
    uidTemp === user?.uid && setchecking(false)
  }, [uidTemp, user])

  const onClick = () => {
    socket.emit("userData", uidTemp)
  }
  useEffect(() => {
    socket.on('userData:fail', () => {
      setchecking(false);
      //TODO: handle userData failure
    });
    return () => {
      socket.off('userData:fail');
    };
  }, [socket]);

  useEffect(() => {
    socket.on("userData", (user: UserData) => {
      if (user.uid !== uidTemp) return
      setUser(user)
    })

    return () => {
      socket.off('userData');
    }
  }, [uidTemp, setUser, socket])

  const profileid = (user?.profile?.profilePicture ?? 10000005) as keyof typeof avatars

  const namebanner = namebanners[(user?.profile?.nameCardId ?? "") as keyof typeof namebanners]
  return <Box sx={{
    padding: 1,
    borderRadius: "56px",
    display: "flex", gap: 1,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    backgroundImage: `url(${namebanner})`,
    backgroundSize: "auto 100%",
    backgroundPosition: "right center",
    backgroundRepeat: "no-repeat"
  }}>
    <Box component="img" src={avatars[profileid]} sx={{ height: "56px", width: "auto", borderRadius: "56px", backgroundColor: "rgba(200,200,200,0.8)" }} />
    <Box>
      <Typography>{user?.profile?.nickname ?? "USERNAME"}</Typography>
      <Typography>{user?.profile?.signature ?? "Signature"}</Typography>
    </Box>
    <Box flexGrow={1}></Box>
    <TextField type="number" value={uidTemp} onChange={e => setUidTemp(e.target.value)}
      sx={{
        backgroundColor: "rgba(50,50,50,0.5)", borderRadius: 1, maxWidth: "9em",
        "input::-webkit-outer-spin-button, input::-webkit-inner-spin-button": {
          "WebkitAppearance": "none",
          "margin": 0
        },
        "input[type=number]": {
          "MozAppearance": "textfield"
        }
      }} />
    <LoadingButton
      sx={{ borderTopRightRadius: "28px", borderBottomRightRadius: "28px", opacity: 0.7 }}
      loading={checking} startIcon={<AccountCircleIcon />} loadingPosition="start"
      disabled={uidTemp.length !== 9} variant="contained"
      onClick={onClick}>Check UID</LoadingButton>

  </Box>
}