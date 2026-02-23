const tz = "Australia/Sydney";
const SJO_TZ = 'America/Costa_Rica';

const [y, m, d] = [2026, 2, 23];
const hour = 1;
const minute = 0;

let t = Date.UTC(y, m - 1, d, hour, minute);

const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
}).formatToParts(new Date(t));

const p = parts.reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
console.log("Parts:", p);

t -= (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t);

const sjoDate = new Date(t).toLocaleDateString('en-US', { timeZone: SJO_TZ, weekday: 'long', month: 'short', day: 'numeric' });
const sjoTime = new Date(t).toLocaleTimeString('en-US', { timeZone: SJO_TZ, hour: '2-digit', minute: '2-digit', hour12: false });

console.log("Calculated SJO:", sjoDate, sjoTime);

const tzNameOffset = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date(Date.UTC(y, m-1, d, hour, minute))).find(p=>p.type==='timeZoneName');
console.log("ShortOffset:", tzNameOffset);
