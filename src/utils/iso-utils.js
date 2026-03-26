// src/utils/iso-utils.js
// Extracted from legacy utils/countries.js

export const ISO_MAP = {
    'SPAIN': 'ES',
    'BRAZIL': 'BR',
    'UK': 'GB',
    'USA': 'US',
    'ZAMBIA': 'ZM',
    'IRELAND': 'IE',
    'ITALY': 'IT',
    'INDIA': 'IN',
    'BELGIUM': 'BE',
    'EGYPT': 'EG',
    'FRANCE': 'FR',
    'COSTA RICA': 'CR',
    'THAILAND': 'TH',
    'KOREA': 'KR',
    'JAPAN': 'JP',
    'MEXICO': 'MX',
    'ARGENTINA': 'AR',
    'COLOMBIA': 'CO',
    'VENEZUELA': 'VE',
    'PERU': 'PE',
    'CHILE': 'CL',
    'ECUADOR': 'EC',
    'URUGUAY': 'UY',
    'PANAMA': 'PA',
    'PUERTO RICO': 'PR',
    'DOMINICAN REPUBLIC': 'DO',
    'CANADA': 'CA',
    'AUSTRALIA': 'AU',
    'GERMANY': 'DE',
    'PORTUGAL': 'PT',
    'CHINA': 'CN',
    'PHILIPPINES': 'PH'
};

export const ALIAS_MAP = {
    'UNITED KINGDOM': 'UK',
    'UNITED STATES': 'USA',
    'SOUTH KOREA': 'KOREA'
};

export const getIsoCode = (countryName) => {
    if (!countryName) return null;
    let cleanName = countryName.toUpperCase().trim();
    // Resolve alias if exists
    if (ALIAS_MAP[cleanName]) cleanName = ALIAS_MAP[cleanName];
    return ISO_MAP[cleanName] || null;
};

export const getFlagEmoji = (isoCodeOrCountry) => {
    if (!isoCodeOrCountry) return '🏳️';
    
    // Always try to resolve the name first (handles aliases like UK -> GB)
    let iso = getIsoCode(isoCodeOrCountry) || (isoCodeOrCountry.length === 2 ? isoCodeOrCountry.toUpperCase() : null);
    
    if (!iso) return '🏳️';
    
    return iso
        .split('')
        .map(char => String.fromCodePoint(char.charCodeAt(0) + 127397))
        .join('');
};

export const getCountryList = () => {
    const list = new Set([...Object.keys(ISO_MAP), ...Object.keys(ALIAS_MAP)]);
    return Array.from(list).sort();
};
