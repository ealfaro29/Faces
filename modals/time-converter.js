// modals/time-converter.js

const SJO_TZ = 'America/Costa_Rica';

export const setupModal = (openBtnId, closeBtnId, modalId) => {
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);
    const modal = document.getElementById(modalId);
    if (openBtn) openBtn.addEventListener('click', () => { if (modal) modal.classList.add('show'); });
    if (closeBtn) closeBtn.addEventListener('click', () => { if (modal) modal.classList.remove('show'); });
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
};


export function initializeTimeConverter() {
    const tzSelect = document.getElementById('eventTimeZone');
    const dateSelect = document.getElementById('eventDate');
    const hourScroller = document.getElementById('hour-scroller-input');
    const sjoDateEl = document.getElementById('sjoDate');
    const sjoTimeEl = document.getElementById('sjoTime');
    
    if (!tzSelect || !dateSelect || !hourScroller || !sjoDateEl || !sjoTimeEl) return;
    
    const timezones = { 'Etc/GMT+12':'IDLW (-12)','Pacific/Honolulu':'HST (-10)','America/Anchorage':'AKST (-9)','America/Los_Angeles':'PST (-8)','America/Denver':'MST (-7)','America/Chicago':'CST (-6)','America/Mexico_City':'CST-MX (-6)','America/New_York':'EST (-5)','America/Bogota':'COT (-5)','America/Lima':'PET (-5)','America/Caracas':'VET (-4)','America/Santiago':'CLT (-3)','America/Sao_Paulo':'BRT (-3)','Atlantic/Azores':'AZOT (-1)','Europe/London':'GMT (+0)','Europe/Paris':'CET (+1)','Europe/Berlin':'CET-DE (+1)','Europe/Athens':'EET (+2)','Africa/Johannesburg':'SAST (+2)','Asia/Dubai':'GST (+4)','Asia/Karachi':'PKT (+5)','Asia/Kolkata':'IST (+5:30)','Asia/Bangkok':'ICT (+7)','Asia/Hong_Kong':'HKT (+8)','Asia/Singapore':'SGT (+8)','Asia/Manila':'PHT (+8)','Asia/Tokyo':'JST (+9)','Asia/Seoul':'KST (+9)','Australia/Sydney':'AEST (+10)','Pacific/Auckland':'NZST (+12)' };
    tzSelect.innerHTML = Object.entries(timezones).map(([val, text]) => `<option value="${val}">${text}</option>`).join('');
    tzSelect.value = 'America/New_York';

    const today = new Date();
    for (let i = -7; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const option = document.createElement('option');
        option.value = date.toISOString().split('T')[0];
        option.textContent = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        if (i === 0) option.selected = true;
        dateSelect.appendChild(option);
    }

    let scrollerHTML = '<div class="h-[80px]"></div>';
    for (let i = 0; i < 48; i++) {
        const hour = Math.floor(i / 2);
        const minute = (i % 2) * 30;
        scrollerHTML += `<div class="hour-scroller-item" data-index="${i}">${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}</div>`;
    }
    hourScroller.innerHTML = scrollerHTML + '<div class="h-[80px]"></div>';

    const hourItems = hourScroller.querySelectorAll('.hour-scroller-item');
    const now = new Date();
    hourScroller.scrollTop = (now.getHours() * 2 + Math.floor(now.getMinutes() / 30)) * 40;

    function updateConversion() {
        const tz = tzSelect.value;
        const [y,m,d] = dateSelect.value.split('-').map(Number);
        const selectedIndex = Math.round(hourScroller.scrollTop / 40);
        const hour = Math.floor(selectedIndex / 2);
        const minute = (selectedIndex % 2) * 30;

        hourItems.forEach((item, index) => item.classList.toggle('active', index === selectedIndex));
        
        let t = Date.UTC(y, m-1, d, hour, minute);
        const p = new Intl.DateTimeFormat('en-CA', {timeZone: tz, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(t)).reduce((a,p)=>(a[p.type]=p.value,a),{}); 
        t -= (Date.UTC(+p.year, +p.month-1, +p.day, +p.hour, +p.minute) - t);
        
        const sjoDate = new Date(t).toLocaleDateString('en-US', {timeZone: SJO_TZ, weekday: 'long', month: 'short', day: 'numeric'});
        const sjoTime = new Date(t).toLocaleTimeString('en-US', {timeZone: SJO_TZ, hour: '2-digit', minute: '2-digit', hour12: false });
        sjoDateEl.textContent = sjoDate; 
        sjoTimeEl.textContent = sjoTime;
    }

    let scrollTimeout;
    hourScroller.addEventListener('scroll', () => { clearTimeout(scrollTimeout); scrollTimeout = setTimeout(updateConversion, 150); });
    hourScroller.addEventListener('wheel', (event) => {
        event.preventDefault();
        const itemHeight = 40;
        const currentIndex = Math.round(hourScroller.scrollTop / itemHeight);
        hourScroller.scrollTo({ top: (Math.max(0, Math.min(currentIndex + Math.sign(event.deltaY), 47)) * itemHeight), behavior: 'smooth' });
    });
    tzSelect.addEventListener('change', updateConversion);
    dateSelect.addEventListener('change', updateConversion);
    updateConversion();
}