// utils/countries.js — Single source of truth for ISO country codes and flag emojis

export const ISO_MAP = {
    'BRAZIL': 'BR', 'UK': 'GB', 'USA': 'US', 'ZAMBIA': 'ZM', 'IRELAND': 'IE',
    'ITALY': 'IT', 'INDIA': 'IN', 'BELGIUM': 'BE', 'EGYPT': 'EG', 'SPAIN': 'ES',
    'FRANCE': 'FR', 'COSTA RICA': 'CR', 'THAILAND': 'TH', 'JAPAN': 'JP', 'KOREA': 'KR'
};

export function getIsoCode(name) {
    return ISO_MAP[name?.toUpperCase()] || 'XX';
}

export function getFlagEmoji(countryName) {
    const iso = ISO_MAP[countryName?.toUpperCase()];
    if (!iso) return null;
    return String.fromCodePoint(...iso.split('').map(c => 127397 + c.charCodeAt()));
}
