import { ProfileData } from "@genshin-tcg/common"

export type EnkaData = {
  uid: string,
  playerInfo: {
    nickname: string, level: number, signature: string, nameCardId: number,
    profilePicture: {
      avatarId: number
    }
  }
}

export function enkaToProfile(enkaData: EnkaData): ProfileData {
  const { playerInfo: { nickname, level, signature, nameCardId, profilePicture: { avatarId: profilePicture } } } = enkaData
  return {
    level,
    nickname,
    signature,
    nameCardId,
    profilePicture,
  }
}

