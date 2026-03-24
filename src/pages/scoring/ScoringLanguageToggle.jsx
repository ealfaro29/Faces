export default function ScoringLanguageToggle({ language, label, onChange }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-app-border bg-app-card/90 px-3 py-2 shadow-sm">
      <span className="text-[10px] uppercase tracking-[0.3em] text-app-muted">{label}</span>
      <div className="flex items-center gap-1 rounded-full bg-app-border/40 p-1">
        <button
          type="button"
          onClick={() => onChange('es')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            language === 'es' ? 'scoring-badge-active' : 'text-app-muted hover:text-app-text'
          }`}
        >
          ES
        </button>
        <button
          type="button"
          onClick={() => onChange('en')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            language === 'en' ? 'scoring-badge-active' : 'text-app-muted hover:text-app-text'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
