const SJO_TZ = 'America/Costa_Rica';
const y=2026, m=2, d=28, hour=6, minute=0, tz="Asia/Manila";
const defaultUtc = new Date(Date.UTC(y, m - 1, d, hour, minute));
const tzNameOffset = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
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

const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000`;
const finalDate = new Date(`${dateStr}${offsetString}`);

const sjoDate = finalDate.toLocaleDateString('en-US', { timeZone: SJO_TZ, weekday: 'long', month: 'short', day: 'numeric' });
const sjoTime = finalDate.toLocaleTimeString('en-US', { timeZone: SJO_TZ, hour: '2-digit', minute: '2-digit', hour12: false });
console.log("FINAL DATE SJO:", sjoDate, sjoTime);

const timeInPht = finalDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: false, weekday:'long' });
console.log("FINAL DATE VERIFY IN PHT:", timeInPht);
