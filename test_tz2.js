const tz = "Europe/London";
const SJO_TZ = 'America/Costa_Rica';

const y = 2026, m = 2, d = 23;
// test midnights
for (let hour = 0; hour < 48; hour++) {
  const minute = 0;
  let t = Date.UTC(y, m - 1, d, hour, minute);

  const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date(t));

  const p = parts.reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
  if (p.hour === '24') console.log("Found 24! hour=", hour, "Parts:", p);
}
console.log("Done checking 24 hrs for en-CA");
