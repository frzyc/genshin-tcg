
const msPerMin = 60 * 1000;
const msPerHour = msPerMin * 60;
const msPerDay = msPerHour * 24;
const msPerMonth = msPerDay * 30;
const msPerYear = msPerDay * 365;

export function relativeTime(a: number, b: number) {
    console.log({ a, b, ab: a - b })
    return relativeTimeDiff(Math.abs(a - b))
}

export function relativeTimeDiff(elapsed: number) {
    if (elapsed < msPerMin)
        return Math.round(elapsed / 1000) + ' seconds ago';
    else if (elapsed < msPerHour)
        return Math.round(elapsed / msPerMin) + ' minutes ago';
    else if (elapsed < msPerDay)
        return Math.round(elapsed / msPerHour) + ' hours ago';
    else if (elapsed < msPerMonth)
        return '~' + Math.round(elapsed / msPerDay) + ' days ago';
    else if (elapsed < msPerYear)
        return '~' + Math.round(elapsed / msPerMonth) + ' months ago';
    else
        return '~' + Math.round(elapsed / msPerYear) + ' years ago';
}