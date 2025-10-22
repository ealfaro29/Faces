// utils/flag.js

/**
 * Convierte un código ISO alpha-2 (ej: US, GB, BR) en el emoji de la bandera Unicode.
 * @param {string} countryCode - Código de país ISO de 2 letras.
 * @returns {string} El emoji de la bandera o un string vacío si no es válido.
 */
export const getFlagEmoji = (countryCode) => {
    if (!countryCode) return '';
    const code = countryCode.toUpperCase();
    // La conversión funciona convirtiendo cada letra del código a su equivalente en el bloque Regional Indicator Symbol Letter (A=1F1E6, B=1F1E7, etc.)
    return String.fromCodePoint(
        ...code.split('').map(char => 127397 + char.charCodeAt())
    );
};