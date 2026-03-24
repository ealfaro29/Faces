import { useState, useRef } from 'react';
import { X, Download, ImageIcon, Crown } from 'lucide-react';
import { toPng } from 'html-to-image';
import { scoringCopy } from './scoringI18n';

export default function PhaseReportModal({
  isOpen,
  onClose,
  session,
  scores,
  phases,
  currentPhaseIndex,
  getPhaseParticipants,
  rankParticipantsByPhaseScores,
  language,
  globalResults,
  winner,
  winnerResult,
  winnerPhaseName
}) {
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(currentPhaseIndex);
  const [isExporting, setIsExporting] = useState(false);
  const [accentColor] = useState(localStorage.getItem('faces-scoring-accent') || '#ffffff');
  const reportRef = useRef(null);
  const t = scoringCopy[language] || scoringCopy['es'];

  if (!isOpen) return null;

  const judges = session?.judges || [];
  const selectedPhase = phases[selectedPhaseIdx];
  const participants = getPhaseParticipants(selectedPhaseIdx);
  const phaseKey = `phase_${selectedPhaseIdx}`;
  const phaseScores = scores[phaseKey] || {};
  const rankedParticipants = rankParticipantsByPhaseScores(participants, phaseScores);

  const exportReport = async () => {
    if (!reportRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#0a0a0a',
        style: { transform: 'scale(1)', margin: '0' }
      });
      const link = document.createElement('a');
      const filename = selectedPhaseIdx === -1
        ? `${session.name.replace(/\s+/g, '_')}_Ganadora.png`
        : `${session.name.replace(/\s+/g, '_')}_${selectedPhase?.name || `Fase_${selectedPhaseIdx}`}.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" style={{ '--color-app-accent': accentColor, '--color-app-accent-muted': `${accentColor}22` }}>
      <div className="bg-app-card border border-app-border rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-app-border/80 bg-app-border/30/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-app-muted" />
            Reportes por Fase
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={exportReport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-4 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generando...' : 'Descargar Imagen'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-app-muted hover:text-white hover:bg-app-border rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-app-border bg-app-card px-5 py-4 scrollbar-none">
          {phases.slice(0, currentPhaseIndex + 1).map((ph, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPhaseIdx(idx)}
              className={`px-5 py-4 text-sm font-medium rounded-lg whitespace-nowrap transition-colors mr-2 ${
                selectedPhaseIdx === idx
                  ? 'bg-app-border text-white'
                  : 'text-app-muted/70 hover:text-app-text hover:bg-app-border/30'
              }`}
            >
              {ph.name}
            </button>
          ))}
          {session.status === 'completed' && winner && (
            <button
              onClick={() => setSelectedPhaseIdx(-1)}
              className={`px-5 py-4 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                selectedPhaseIdx === -1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-amber-500/60 hover:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Crown className="w-4 h-4" /> Ganadora Oficial
            </button>
          )}
        </div>

        {/* Content to Export */}
        <div className="flex-1 overflow-y-auto bg-app-card p-6 scrollbar-thin scrollbar-thumb-zinc-800">
          <div ref={reportRef} className="bg-app-card p-6 rounded-xl border border-app-border/50 max-w-4xl mx-auto">
            
            {/* Report Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase mb-1">
                {session.name}
              </h1>
              <h3 className="text-lg text-app-muted font-medium tracking-wide">
                Resultados Oficiales — {selectedPhase?.name || `Fase ${selectedPhaseIdx + 1}`}
              </h3>
            </div>

            {/* Table or Winner Card */}
            {selectedPhaseIdx === -1 ? (
              <div className="relative flex min-h-[500px] items-center justify-center overflow-hidden rounded-[2rem] border border-app-accent/20 bg-[radial-gradient(circle_at_top,var(--color-app-accent-muted),transparent_50%),linear-gradient(180deg,#0a0a0a_0%,#000000_100%)] p-8 text-center shadow-[0_0_60px_var(--color-app-accent-muted)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_80%_15%,var(--color-app-accent-muted),transparent_25%),radial-gradient(circle_at_50%_85%,rgba(255,255,255,0.03),transparent_20%)] opacity-80" />
                <div className="relative z-10 flex max-w-xl flex-col items-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-app-accent/20 bg-app-accent/10 text-app-accent shadow-[0_0_40px_var(--color-app-accent-muted)] transition-all animate-pulse">
                    <Crown className="h-12 w-12" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.45em] text-app-accent opacity-70">{t.board.winnerTitle}</p>
                  <h2 className="mt-4 text-5xl font-black tracking-tight text-white md:text-6xl drop-shadow-[0_0_15px_var(--color-app-accent-muted)]">{winner?.flag} {winner?.name || t.board.winnerPending}</h2>
                  <p className="mt-4 text-lg text-app-muted font-medium tracking-wide">{t.board.winnerSubtitle}</p>
                  {winnerResult && (
                    <div className="mt-12 grid w-full max-w-md grid-cols-2 gap-4">
                      <div className="glass-panel px-6 py-6 rounded-2xl border-app-accent/20">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-app-muted/70 font-bold mb-3">{t.board.winnerScore}</p>
                        <p className="text-4xl font-mono text-app-accent font-black tracking-tighter">{winnerResult.totalAvg.toFixed(2)}</p>
                      </div>
                      <div className="glass-panel px-6 py-6 rounded-2xl border-app-accent/20">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-app-muted/70 font-bold mb-3">{winnerPhaseName}</p>
                        <p className="text-base text-white tracking-wide font-bold leading-tight uppercase">{t.board.winnerFromPhase(winnerPhaseName).replace(winnerPhaseName, '').trim()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-app-border/80">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-app-border/30 border-b border-app-border text-xs uppercase tracking-widest text-app-muted/70">
                      <th className="px-5 py-4 text-center w-12 font-semibold">#</th>
                      <th className="px-5 py-4 font-semibold">Participante</th>
                      {judges.map(judge => (
                        <th key={judge} className="px-5 py-4 text-center font-semibold whitespace-nowrap">
                          {judge}
                        </th>
                      ))}
                      <th className="px-5 py-4 text-center font-bold text-white bg-app-border/30">Total</th>
                      <th className="px-5 py-4 text-center font-bold text-white bg-app-border/50">Prom.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {rankedParticipants.map((p, idx) => {
                      const pScores = phaseScores[p.id] || {};
                      const vals = judges.map(j => pScores[j]).filter(v => v !== null && v !== undefined);
                      const total = vals.reduce((sum, v) => sum + v, 0);
                      const avg = vals.length > 0 ? total / vals.length : 0;

                      return (
                        <tr key={p.id} className="bg-app-card hover:bg-app-border/30/50 transition-colors">
                          <td className="px-4 py-4 text-center text-sm font-medium text-app-muted/70">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{p.flag}</span>
                              <span className="text-sm font-semibold text-zinc-200">
                                {p.name}
                              </span>
                            </div>
                          </td>
                          {judges.map(judge => {
                            const val = pScores[judge];
                            return (
                              <td key={judge} className="px-4 py-4 text-center text-sm font-mono text-app-muted">
                                {val !== undefined && val !== null ? val.toFixed(1) : '-'}
                              </td>
                            );
                          })}
                          <td className="px-4 py-4 text-center text-sm font-mono font-semibold text-app-text bg-app-border/10">
                            {total.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-mono font-bold text-white bg-app-border/30">
                            {avg.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {rankedParticipants.length === 0 && (
                      <tr>
                        <td colSpan={judges.length + 4} className="px-4 py-12 text-center text-app-muted/70 text-sm">
                          No hay participantes clasificados en esta fase.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            
            <div className="mt-6 text-center">
              <p className="text-[10px] text-app-muted/50 uppercase tracking-widest font-mono">
                © {new Date().getFullYear()} Faces Scoring Engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
