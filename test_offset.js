const y = 2026, m = 2, d = 28;
const hour = 6, minute = 0;
const defaultUtc = new Date(Date.UTC(y, m - 1, d, hour, minute));
const tzNameOffset = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', timeZoneName: 'shortOffset' })
    .formatToParts(defaultUtc)
    .find(p => p.type === 'timeZoneName')?.value;

let offsetString = "Z";
if (tzNameOffset && tzNameOffset !== 'GMT') {
    let cleanOffset = tzNameOffset.replace('GMT', '');
    if (cleanOffset) {
        const sign = cleanOffset[0];
        let hours = "00", mins = "00";
        const groups = cleanOffset.substring(1).split(':');
        hours = groups[0].padStart(2, '0');
        if (groups[1]) mins = groups[1].padStart(2, '0');
        offsetString = `${sign}${hours}:${mins}`;
    }
}

console.log("OFFSET:", tzNameOffset, offsetString);
