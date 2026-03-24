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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-zinc-400" />
            Reportes por Fase
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={exportReport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generando...' : 'Descargar Imagen'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-4 py-2 scrollbar-none">
          {phases.slice(0, currentPhaseIndex + 1).map((ph, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPhaseIdx(idx)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors mr-2 ${
                selectedPhaseIdx === idx
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              {ph.name}
            </button>
          ))}
          {session.status === 'completed' && winner && (
            <button
              onClick={() => setSelectedPhaseIdx(-1)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
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
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 scrollbar-thin scrollbar-thumb-zinc-800">
          <div ref={reportRef} className="bg-zinc-950 p-6 rounded-xl border border-zinc-800/50 max-w-4xl mx-auto">
            
            {/* Report Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase mb-1">
                {session.name}
              </h1>
              <h3 className="text-lg text-zinc-400 font-medium tracking-wide">
                Resultados Oficiales — {selectedPhase?.name || `Fase ${selectedPhaseIdx + 1}`}
              </h3>
            </div>

            {/* Table or Winner Card */}
            {selectedPhaseIdx === -1 ? (
              <div className="relative flex min-h-[500px] items-center justify-center overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top,#fde68a22,transparent_40%),linear-gradient(180deg,#18181b_0%,#09090b_100%)] p-8 text-center shadow-[0_0_60px_rgba(251,191,36,0.08)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_80%_15%,rgba(251,191,36,0.18),transparent_20%),radial-gradient(circle_at_50%_85%,rgba(255,255,255,0.05),transparent_20%)] opacity-80" />
                <div className="relative z-10 flex max-w-xl flex-col items-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-amber-200/20 bg-amber-300/10 text-amber-200 shadow-[0_0_40px_rgba(251,191,36,0.2)]">
                    <Crown className="h-12 w-12" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.45em] text-amber-200/70">{t.board.winnerTitle}</p>
                  <h2 className="mt-4 text-5xl font-black tracking-tight text-white md:text-6xl">{winner?.flag} {winner?.name || t.board.winnerPending}</h2>
                  <p className="mt-3 text-lg text-zinc-400">{t.board.winnerSubtitle}</p>
                  {winnerResult && (
                    <div className="mt-10 grid w-full max-w-md grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-6 py-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{t.board.winnerScore}</p>
                        <p className="mt-3 text-3xl font-mono text-white">{winnerResult.totalAvg.toFixed(2)}</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-6 py-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{winnerPhaseName}</p>
                        <p className="mt-3 text-base text-zinc-300 tracking-wide font-medium">{t.board.winnerFromPhase(winnerPhaseName).replace(winnerPhaseName, '').trim()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-800/80">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-xs uppercase tracking-widest text-zinc-500">
                      <th className="px-4 py-3 text-center w-12 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Participante</th>
                      {judges.map(judge => (
                        <th key={judge} className="px-4 py-3 text-center font-semibold whitespace-nowrap">
                          {judge}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center font-bold text-white bg-zinc-800/30">Total</th>
                      <th className="px-4 py-3 text-center font-bold text-white bg-zinc-800/50">Prom.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {rankedParticipants.map((p, idx) => {
                      const pScores = phaseScores[p.id] || {};
                      const vals = judges.map(j => pScores[j]).filter(v => v !== null && v !== undefined);
                      const total = vals.reduce((sum, v) => sum + v, 0);
                      const avg = vals.length > 0 ? total / vals.length : 0;

                      return (
                        <tr key={p.id} className="bg-zinc-950 hover:bg-zinc-900/50 transition-colors">
                          <td className="px-4 py-3.5 text-center text-sm font-medium text-zinc-500">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3.5">
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
                              <td key={judge} className="px-4 py-3.5 text-center text-sm font-mono text-zinc-400">
                                {val !== undefined && val !== null ? val.toFixed(1) : '-'}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3.5 text-center text-sm font-mono font-semibold text-zinc-300 bg-zinc-800/10">
                            {total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 text-center text-sm font-mono font-bold text-white bg-zinc-800/30">
                            {avg.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {rankedParticipants.length === 0 && (
                      <tr>
                        <td colSpan={judges.length + 4} className="px-4 py-12 text-center text-zinc-500 text-sm">
                          No hay participantes clasificados en esta fase.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            
            <div className="mt-6 text-center">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
                © {new Date().getFullYear()} Faces Scoring Engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
