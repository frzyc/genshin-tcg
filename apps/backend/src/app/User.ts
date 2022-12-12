import { ProfileData, User } from "@genshin-tcg/common"

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
export function newUser(uid: string, enkaData: EnkaData): User {
    return {
        uid,
        profile: enkaToProfile(enkaData),
        matchMeta: {
            wins: 0,
            losses: 0,
            eloTot: 0,
        },

        history: [
            // {
            //     opponent: "987654321",
            //     opponentElo: 1200,
            //     resolution: "win",
            //     time: 1670797528000,
                
            // },
            // {
            //     opponent: "987654321",
            //     opponentElo: 1200,
            //     resolution: "loss",
            //     time: 1670797428000
            // }, {
            //     opponent: "987654321",
            //     opponentElo: 1000,
            //     resolution: "unknown",
            //     time: 1670797328000
            // }, {
            //     opponent: "987654321",
            //     opponentElo: 1000,
            //     resolution: "win",
            //     time: 1670797228000
            // },
        ]
    }
}

