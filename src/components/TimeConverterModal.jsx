import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const SJO_TZ = 'America/Costa_Rica';

const TIMEZONES = {
    'America/New_York': 'EST (-5)',
    'Europe/London': 'GMT (+0)',
    'Europe/Paris': 'CET (+1)',
    'Europe/Berlin': 'CET-DE (+1)',
    'Europe/Athens': 'EET (+2)',
    'Africa/Johannesburg': 'SAST (+2)',
    'Asia/Dubai': 'GST (+4)',
    'Asia/Karachi': 'PKT (+5)',
    'Asia/Kolkata': 'IST (+5:30)',
    'Asia/Bangkok': 'ICT (+7)',
    'Asia/Hong_Kong': 'HKT (+8)',
    'Asia/Singapore': 'SGT (+8)',
    'Asia/Manila': 'PHT (+8)',
    'Asia/Tokyo': 'JST (+9)',
    'Asia/Seoul': 'KST (+9)',
    'Australia/Sydney': 'AEST (+10)',
    'Pacific/Auckland': 'NZST (+12)',
    'Etc/GMT+12': 'IDLW (-12)',
    'Pacific/Honolulu': 'HST (-10)',
    'America/Anchorage': 'AKST (-9)',
    'America/Los_Angeles': 'PST (-8)',
    'America/Denver': 'MST (-7)',
    'America/Chicago': 'CST (-6)',
    'America/Mexico_City': 'CST-MX (-6)',
    'America/Bogota': 'COT (-5)',
    'America/Lima': 'PET (-5)',
    'America/Caracas': 'VET (-4)',
    'America/Santiago': 'CLT (-3)',
    'America/Sao_Paulo': 'BRT (-3)',
    'Atlantic/Azores': 'AZOT (-1)',
};

const getDatesList = () => {
    const dates = [];
    const today = new Date();
    for (let i = -7; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        dates.push({
            value: `${y}-${m}-${d}`,
            label: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        });
    }
    return dates;
};

export default function TimeConverterModal({ isOpen, onClose }) {
    const [selectedTZ, setSelectedTZ] = useState('America/New_York');
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    });
    const [selectedTime, setSelectedTime] = useState(() => {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    });

    const [sjoDateStr, setSjoDateStr] = useState('-');
    const [sjoTimeStr, setSjoTimeStr] = useState('-');

    const dates = getDatesList();

    // Initialize calculation
    useEffect(() => {
        if (isOpen) {
            updateConversion(selectedTZ, selectedDate, selectedTime);
        }
    }, [isOpen]);

    const updateConversion = (tz, dateVal, timeVal) => {
        const [y, m, d] = dateVal.split('-').map(Number);
        const [hour, minute] = timeVal.split(':').map(Number);

        try {
            // Robust calculation: Extract exact timezone offset for the given date, append it to an ISO string
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

            setSjoDateStr(sjoDate);
            setSjoTimeStr(sjoTime);
        } catch (e) {
            console.error("Time conversion error", e);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay show" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="modal-content p-6 pt-8 relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-zinc-400 hover:text-white transition text-3xl z-10"
                    aria-label="Close time converter"
                >
                    &times;
                </button>
                <h2 className="text-center text-xl font-semibold title-fancy gold-title mb-6">
                    Time Converter
                </h2>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center px-4 pb-4">
                    <div className="flex flex-col gap-2">
                        <div className="font-bold text-lg text-zinc-100 uppercase tracking-widest text-[#d8a657]">SJO Time</div>
                        <div className="text-sm text-zinc-300 font-medium">{sjoDateStr}</div>
                    </div>
                    <div className="text-3xl text-[var(--gold2)] px-4">◀</div>
                    <div className="flex flex-col gap-2">
                        <select
                            value={selectedTZ}
                            onChange={(e) => { setSelectedTZ(e.target.value); updateConversion(e.target.value, selectedDate, selectedTime); }}
                            className="w-full h-10 px-3 text-sm dark-input rounded-md max-w-[150px] mx-auto overflow-hidden text-ellipsis"
                        >
                            {Object.entries(TIMEZONES).map(([val, text]) => (
                                <option key={val} value={val}>{text}</option>
                            ))}
                        </select>
                        <select
                            value={selectedDate}
                            onChange={(e) => { setSelectedDate(e.target.value); updateConversion(selectedTZ, e.target.value, selectedTime); }}
                            className="w-full h-10 px-3 text-sm dark-input rounded-md max-w-[150px] mx-auto text-ellipsis"
                        >
                            {dates.map((d) => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="border-t border-[var(--border)] pt-4">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                        <div className="text-4xl font-bold text-center text-zinc-100 tracking-wider">
                            {sjoTimeStr}
                        </div>
                        <div></div>
                        <div className="flex justify-center items-center h-full">
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        setSelectedTime(val);
                                        updateConversion(selectedTZ, selectedDate, val);
                                    }
                                }}
                                className="text-4xl font-bold bg-transparent text-center text-[var(--gold2)] outline-none cursor-pointer p-2 rounded-lg hover:bg-white/5 transition focus:bg-white/10"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
