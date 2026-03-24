export const DEFAULT_SCORING_LANGUAGE = 'es';
const STORAGE_KEY = 'faces-scoring-language';

export function normalizeScoringLanguage(value) {
  return value === 'en' ? 'en' : DEFAULT_SCORING_LANGUAGE;
}

export function getStoredScoringLanguage() {
  if (typeof window === 'undefined') return DEFAULT_SCORING_LANGUAGE;
  return normalizeScoringLanguage(window.localStorage.getItem(STORAGE_KEY));
}

export function persistScoringLanguage(language) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, normalizeScoringLanguage(language));
}

export function getDefaultPhaseName(index, language) {
  return normalizeScoringLanguage(language) === 'en' ? `Phase ${index + 1}` : `Fase ${index + 1}`;
}

export function getSessionTypeLabel(type, language) {
  if (type === 'Nacional') return normalizeScoringLanguage(language) === 'en' ? 'National' : 'Nacional';
  return 'Global';
}

export function getCountryDisplayName(country, language) {
  const normalizedLanguage = normalizeScoringLanguage(language);

  if (normalizedLanguage === 'en') {
    return country.name?.common || country.translations?.eng?.common || '';
  }

  return country.translations?.spa?.common || country.name?.common || '';
}

export const scoringCopy = {
  es: {
    languageLabel: 'Idioma',
    spanish: 'Español',
    english: 'English',
    backToStart: 'Volver al inicio',
    loading: 'Cargando...',
    landing: {
      title: `Scoring System v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : ''}`,
      subtitle: 'Panel de evaluación en tiempo real para certámenes y competencias.',
      createTitle: 'Crear Sesión',
      createDescription: 'Configura un nuevo tablero de evaluación como anfitrión (Host).',
      joinTitle: 'Unirse como Juez',
      joinDescription: 'Ingresa un código de sesión para comenzar a puntuar en tiempo real.'
    },
    create: {
      title: 'Nueva Sesión',
      subtitle: 'Configura lo esencial. Las fases se crean en vivo durante el certamen.',
      hostLabel: 'Tu Nombre (Host)',
      hostPlaceholder: 'Ej. Admin',
      sessionNameLabel: 'Nombre del Certamen',
      sessionNamePlaceholder: 'Ej. Miss Universe 2026',
      typeLabel: 'Tipo',
      globalOption: 'Global (Países)',
      nationalOption: 'Nacional (Ciudades)',
      submitIdle: 'Crear Sesión',
      submitBusy: 'Creando...',
      completeFields: 'Completa todos los campos.',
      createError: 'Error al crear la sesión. Intenta de nuevo.'
    },
    join: {
      title: 'Acceso de Juez',
      subtitle: 'Ingresa el código que te proporcionó el anfitrión para comenzar a puntuar.',
      judgeNameLabel: 'Tu Nombre',
      judgeNamePlaceholder: 'Ej. Pedro Pérez',
      sessionCodeLabel: 'Código de Sesión',
      sessionCodePlaceholder: 'MU-XXXXX',
      submitIdle: 'Unirse al Panel',
      submitBusy: 'Conectando...',
      sessionMissing: 'La sesión no existe. Revisa el código e intenta de nuevo.',
      connectionError: 'Error de conexión con la base de datos.'
    },
    board: {
      judgeSingular: 'juez',
      judgePlural: 'jueces',
      classifyLabel: 'Clasifican:',
      classifySummary: (cutoff, total) => `Clasifican: ${cutoff} de ${total}`,
      phaseNamePlaceholder: 'Nombre de la fase',
      addHostCountryFirst: 'Primero, selecciona el país sede...',
      hostCountryLabel: 'País sede',
      addCountryPlaceholder: 'Agregar país...',
      addCityPlaceholder: 'Agregar ciudad...',
      loadingCities: 'Cargando...',
      addManualEntry: query => `Añadir "${query}"`,
      useSearchToAdd: 'Usa la barra de búsqueda para agregar candidatas.',
      noParticipantsPhase: 'No hay candidatas en esta fase.',
      contestantHeader: 'Delegada',
      averageHeader: 'Prom.',
      yourScoreHeader: 'Tu Score',
      notVoted: 'Sin votar',
      removeVote: 'Quitar tu voto',
      judgesCompleted: (done, total) => `${done}/${total} jueces completaron`,
      advancePhase: 'Avanzar Fase',
      forceAdvance: pending => `Forzar Avance (pendientes = ${pending})`,
      viewWinner: 'Ver Ganadora',
      forceViewWinner: pending => `Forzar Ver Ganadora (pendientes = ${pending})`,
      globalResults: 'Resultados Globales',
      phasesCompleted: (participants, phases) => `${participants} candidatas • ${phases} fases completadas`,
      noGlobalParticipants: 'Sin participantes aún.',
      eliminatedIn: phaseName => `Eliminada en ${phaseName}`,
      winnerTitle: 'Ganadora',
      winnerSubtitle: 'La corona ya tiene dueña.',
      winnerScore: 'Promedio final',
      winnerFromPhase: phaseName => `Coronada en ${phaseName}`,
      winnerPending: 'Esperando el cierre final...',
      copyCode: 'Copiar código',
      cutoffLine: 'LÍNEA DE CORTE'
    }
  },
  en: {
    languageLabel: 'Language',
    spanish: 'Español',
    english: 'English',
    backToStart: 'Back to start',
    loading: 'Loading...',
    landing: {
      title: `Scoring System v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : ''}`,
      subtitle: 'Real-time judging panel for pageants and live competitions.',
      createTitle: 'Create Session',
      createDescription: 'Set up a new scoring board as the host.',
      joinTitle: 'Join as Judge',
      joinDescription: 'Enter a session code to start scoring in real time.'
    },
    create: {
      title: 'New Session',
      subtitle: 'Set the essentials. Phases are created live during the event.',
      hostLabel: 'Your Name (Host)',
      hostPlaceholder: 'Example: Admin',
      sessionNameLabel: 'Pageant Name',
      sessionNamePlaceholder: 'Example: Miss Universe 2026',
      typeLabel: 'Type',
      globalOption: 'Global (Countries)',
      nationalOption: 'National (Cities)',
      submitIdle: 'Create Session',
      submitBusy: 'Creating...',
      completeFields: 'Complete all fields.',
      createError: 'Could not create the session. Please try again.'
    },
    join: {
      title: 'Judge Access',
      subtitle: 'Enter the session code shared by the host to start scoring.',
      judgeNameLabel: 'Your Name',
      judgeNamePlaceholder: 'Example: Jane Doe',
      sessionCodeLabel: 'Session Code',
      sessionCodePlaceholder: 'MU-XXXXX',
      submitIdle: 'Join Panel',
      submitBusy: 'Connecting...',
      sessionMissing: 'This session does not exist. Check the code and try again.',
      connectionError: 'Database connection error.'
    },
    board: {
      judgeSingular: 'judge',
      judgePlural: 'judges',
      classifyLabel: 'Advancing:',
      classifySummary: (cutoff, total) => `${cutoff} of ${total} advance`,
      phaseNamePlaceholder: 'Phase name',
      addHostCountryFirst: 'First, choose the host country...',
      hostCountryLabel: 'Host country',
      addCountryPlaceholder: 'Add country...',
      addCityPlaceholder: 'Add city...',
      loadingCities: 'Loading...',
      addManualEntry: query => `Add "${query}"`,
      useSearchToAdd: 'Use the search bar to add contestants.',
      noParticipantsPhase: 'There are no contestants in this phase.',
      contestantHeader: 'Contestant',
      averageHeader: 'Avg.',
      yourScoreHeader: 'Your Score',
      notVoted: 'Not rated',
      removeVote: 'Remove your vote',
      judgesCompleted: (done, total) => `${done}/${total} judges completed`,
      advancePhase: 'Advance Phase',
      forceAdvance: pending => `Force Advance (pending = ${pending})`,
      viewWinner: 'View Winner',
      forceViewWinner: pending => `Force View Winner (pending = ${pending})`,
      globalResults: 'Global Results',
      phasesCompleted: (participants, phases) => `${participants} contestants • ${phases} completed phases`,
      noGlobalParticipants: 'No participants yet.',
      eliminatedIn: phaseName => `Eliminated in ${phaseName}`,
      winnerTitle: 'Winner',
      winnerSubtitle: 'The crown has been claimed.',
      winnerScore: 'Final average',
      winnerFromPhase: phaseName => `Crowned in ${phaseName}`,
      winnerPending: 'Waiting for the final reveal...',
      copyCode: 'Copy code',
      cutoffLine: 'CUTOFF LINE'
    }
  }
};

