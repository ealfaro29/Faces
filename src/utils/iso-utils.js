// src/utils/iso-utils.js
// Extracted from legacy utils/countries.js

export const ISO_MAP = {
    'SPAIN': 'ES',
    'BRAZIL': 'BR',
    'UK': 'GB',
    'UNITED KINGDOM': 'GB',
    'USA': 'US',
    'UNITED STATES': 'US',
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
    'SOUTH KOREA': 'KR',
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

export const getIsoCode = (countryName) => {
    if (!countryName) return null;
    const cleanName = countryName.toUpperCase().trim();
    return ISO_MAP[cleanName] || null;
};

export const getFlagEmoji = (isoCodeOrCountry) => {
    if (!isoCodeOrCountry) return '🏳️';
    
    // Check if it's already an ISO code (2 letters)
    let iso = isoCodeOrCountry.length === 2 ? isoCodeOrCountry.toUpperCase() : getIsoCode(isoCodeOrCountry);
    
    if (!iso) return '🏳️';
    
    return iso
        .split('')
        .map(char => String.fromCodePoint(char.charCodeAt(0) + 127397))
        .join('');
};

export const getCountryList = () => {
    return Object.keys(ISO_MAP).sort();
};
