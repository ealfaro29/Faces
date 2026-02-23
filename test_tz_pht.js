const tz = "Asia/Manila";
const SJO_TZ = 'America/Costa_Rica';

// Let's test stable approach
function convert(tz, y, m, d, hour, minute) {
    const defaultUtc = new Date(Date.UTC(y, m-1, d, hour, minute));
    const tzNameOffset = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
        .formatToParts(defaultUtc)
        .find(p=>p.type==='timeZoneName')?.value;

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
    
    // the target UTC timestamp is the local string combined with its offset
    const finalDate = new Date(`${dateStr}${offsetString}`);

    const sjoDate = finalDate.toLocaleDateString('en-US', { timeZone: SJO_TZ, weekday: 'long', month: 'short', day: 'numeric' });
    const sjoTime = finalDate.toLocaleTimeString('en-US', { timeZone: SJO_TZ, hour: '2-digit', minute: '2-digit', hour12: false });
    
    console.log(`Original: ${y}-${m}-${d} ${hour}:${minute} in ${tz}`);
    console.log(`Parsed: ${dateStr}${offsetString}`);
    console.log(`SJO Result: ${sjoDate} ${sjoTime}`);
}

// 6 AM Saturday. Let's pick a Saturday date. 
// Feb 28, 2026 is Saturday.
convert("Asia/Manila", 2026, 2, 28, 6, 0);
