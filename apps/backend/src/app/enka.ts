import { EnkaData } from "./User";

// a test database so we dont use the enka api
export const enka: { [uid: string]: EnkaData } = {
    123456789: {
        uid: "123456789",
        playerInfo: {
            nickname: "Artesians",
            signature: "I stream sometimes",
            nameCardId: 210052,
            level: 69,
            profilePicture: {
                avatarId: 10000074
            },

        }
    },
    987654321: {
        uid: "987654321",
        playerInfo: {
            nickname: "Eko the pengu",
            signature: "Exam is never ending",
            nameCardId: 210004,
            level: 420,
            profilePicture: {
                avatarId: 10000063
            },

        }
    },
}