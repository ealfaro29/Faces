export default function ScoringLanguageToggle({ language, label, onChange }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-2">
      <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">{label}</span>
      <div className="flex items-center gap-1 rounded-full bg-zinc-900 p-1">
        <button
          type="button"
          onClick={() => onChange('es')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            language === 'es' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          ES
        </button>
        <button
          type="button"
          onClick={() => onChange('en')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            language === 'en' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
