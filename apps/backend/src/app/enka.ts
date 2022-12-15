import { ProfileData } from "@genshin-tcg/common";

// a test database so we dont use the enka api
export const enka: { [uid: string]: EnkaData } = {
  601061705: {
    uid: "601061705",
    playerInfo: {
      nickname: "frzyc",
      signature: "Genshin Optimizer Dev",
      nameCardId: 210092,
      level: 69,
      profilePicture: {
        avatarId: 10000043
      },

    }
  },
  604097434: {
    uid: "604097434",
    playerInfo: {
      nickname: "Monochrom9",
      signature: "Certified Dolphin",
      nameCardId: 210014,
      level: 420,
      profilePicture: {
        avatarId: 10000034
      },

    }
  },
}

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

