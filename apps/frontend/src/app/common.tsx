import { MatchEntry } from "@genshin-tcg/common"

export function resolutionToVariant(resolution: MatchEntry["resolution"]) {
    switch (resolution) {
        case "win":
            return "success"
        case "loss":
            return "error"
        default:
            return "info"
    }
}
export function resolutionToColor(resolution: MatchEntry["resolution"]) {
    switch (resolution) {
        case "win":
            return "rgba(100,200,100,0.5)"
        case "loss":
            return "rgba(200,100,100,0.5)"
        default:
            return "rgba(100,100,100,0.7)"
    }
}