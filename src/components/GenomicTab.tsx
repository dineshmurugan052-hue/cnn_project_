import React, { useState, useEffect } from 'react';
import {
  Dna,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BarChart3,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { GenomicParameters, GenomicFindings } from '../types/clinical';
import { evaluateGenomicSVM } from '../utils/genomicClassifier';

interface GenomicTabProps {
  parameters: GenomicParameters;
  findings: GenomicFindings | null;
  onUpdateParameters: (params: GenomicParameters) => void;
  onUpdateFindings: (findings: GenomicFindings) => void;
  maternalAge?: number;
}

export const GenomicTab: React.FC<GenomicTabProps> = ({
  parameters,
  findings,
  onUpdateParameters,
  onUpdateFindings,
  maternalAge = 34,
}) => {
  const [params, setParams] = useState<GenomicParameters>(parameters);

  useEffect(() => {
    setParams(parameters);
  }, [parameters]);

  const handleChange = (field: keyof GenomicParameters, value: number) => {
    const updated = { ...params, [field]: value };
    setParams(updated);
    onUpdateParameters(updated);
  };

  const handleRunSVM = () => {
    const result = evaluateGenomicSVM(params, maternalAge);
    onUpdateFindings(result);
  };

  // Run automatically if findings are not yet calculated
  useEffect(() => {
    if (!findings) {
      handleRunSVM();
    }
  }, []);

  const chromosomes = [
    { key: 'z13', label: 'Chr 13 (Patau)', val: params.z13, desc: 'Patau Syndrome dosage' },
    { key: 'z18', label: 'Chr 18 (Edwards)', val: params.z18, desc: 'Edwards Syndrome dosage' },
    { key: 'z21', label: 'Chr 21 (Down)', val: params.z21, desc: 'Down Syndrome dosage' },
    { key: 'zx', label: 'Chr X (Aneuploidy)', val: params.zx, desc: 'Sex chromosome X dosage' },
    { key: 'zy', label: 'Chr Y (Aneuploidy)', val: params.zy, desc: 'Sex chromosome Y dosage' },
  ];

  const maxZ = Math.max(5.0, params.z13, params.z18, params.z21, 3.5);

  return (
    <div className="flex flex-col gap-6">
      {/* Alert Card Header based on SVM outcome */}
      {findings && (
        <div>
          {findings.isHighRisk ? (
            <div className="p-4 bg-rose-950/40 border border-rose-600/60 rounded-xl flex items-start gap-3.5 shadow-sm">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-rose-200">
                    DIAGNOSTIC ALERT: {findings.svmClass} Detected
                  </h3>
                  <span className="text-[11px] font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                    Z-Score &gt; 3.0 Clinical Cut-Off Exceeded
                  </span>
                </div>
                <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                  Support Vector Machine (RBF-Kernel) classification flags elevated chromosomal dosage.
                  Posterior risk ratio estimated at <strong className="text-rose-100">{findings.posteriorRiskRatio}</strong> (baseline maternal age risk: {findings.ageAdjustedRisk}).
                  Definitive diagnostic karyotyping (CVS or Amniocentesis) is strongly recommended.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-950/40 border border-emerald-600/50 rounded-xl flex items-start gap-3.5 shadow-sm">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-emerald-200">
                    GENOMIC SCREEN NEGATIVE: Low Aneuploidy Risk Profile
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    All Autosomal Z-Scores &lt; 3.0 Cut-Off
                  </span>
                </div>
                <p className="text-xs text-emerald-300/90 mt-1 leading-relaxed">
                  Autosomal chromosome 13, 18, and 21 dosage levels conform to diploid physiological reference distributions.
                  Posterior risk ratio: <strong className="text-emerald-100">{findings.posteriorRiskRatio}</strong>. Routine obstetric surveillance indicated.
                </p>
              </div>
            </div>
          )}

          {/* Low fetal fraction advisory card */}
          {findings.lowFetalFraction && (
            <div className="mt-3 p-3.5 bg-amber-950/40 border border-amber-600/60 rounded-xl flex items-start gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-100 font-semibold">
                  Sequencing QC Warning: Sub-Optimal Fetal Fraction ({params.fetalFraction.toFixed(1)}% &lt; 4.0% Threshold)
                </strong>
                <p className="text-amber-300/90 mt-0.5">
                  Fetal fraction below 4.0% reduces assay analytical sensitivity and negative predictive value.
                  Repeat blood draw after 1–2 weeks gestation or diagnostic consultation recommended.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Parameter Inputs vs. Comparative Risk Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): 11 Genomic Inputs */}
        <div className="lg:col-span-5 flex flex-col gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Dna className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                11 cfDNA Sequencing Parameters
              </h3>
            </div>
            <button
              onClick={handleRunSVM}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow-sm transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run SVM Classifier</span>
            </button>
          </div>

          {/* Group 1: Chromosome Z-Scores */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
              Chromosome Z-Score Dosages (Cut-off: 3.0):
            </span>
            <div className="grid grid-cols-1 gap-2">
              {chromosomes.map((item) => {
                const isElevated = item.val >= 3.0;
                return (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                      isElevated
                        ? 'bg-rose-950/30 border-rose-700/60'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`font-semibold ${isElevated ? 'text-rose-300' : 'text-slate-200'}`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-500">{item.desc}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.05"
                        value={item.val}
                        onChange={(e) =>
                          handleChange(item.key as keyof GenomicParameters, parseFloat(e.target.value) || 0)
                        }
                        className={`w-20 px-2 py-1 bg-slate-900 border rounded font-mono text-xs text-right tabular-nums focus:outline-none focus:border-cyan-500 ${
                          isElevated
                            ? 'border-rose-500 text-rose-300 font-bold'
                            : 'border-slate-700 text-slate-200'
                        }`}
                      />
                      {isElevated && (
                        <span className="text-[10px] text-rose-400 font-bold font-mono">
                          &gt;3.0
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 2: Sequencing Quality Control Parameters */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
              Sequencing QC & Depth Parameters:
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Fetal Fraction */}
              <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Fetal Fraction (%)</span>
                <input
                  type="number"
                  step="0.1"
                  value={params.fetalFraction}
                  onChange={(e) => handleChange('fetalFraction', parseFloat(e.target.value) || 0)}
                  className={`w-full px-2 py-1 bg-slate-900 border rounded font-mono text-xs tabular-nums focus:outline-none focus:border-cyan-500 ${
                    params.fetalFraction < 4.0 ? 'border-amber-500 text-amber-300 font-bold' : 'border-slate-700 text-slate-200'
                  }`}
                />
              </div>

              {/* Proportion Aligned */}
              <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Proportion Aligned</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1.0"
                  value={params.propAligned}
                  onChange={(e) => handleChange('propAligned', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded font-mono text-xs text-slate-200 tabular-nums focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Duplicate Reads */}
              <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Duplicate Reads (%)</span>
                <input
                  type="number"
                  step="0.1"
                  value={params.dupReads}
                  onChange={(e) => handleChange('dupReads', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded font-mono text-xs text-slate-200 tabular-nums focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* GC Content */}
              <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">GC Content (%)</span>
                <input
                  type="number"
                  step="0.1"
                  value={params.gcContent}
                  onChange={(e) => handleChange('gcContent', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded font-mono text-xs text-slate-200 tabular-nums focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Raw Reads */}
              <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Raw Reads (M)</span>
                <input
                  type="number"
                  step="0.2"
                  value={params.rawReads}
                  onChange={(e) => handleChange('rawReads', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded font-mono text-xs text-slate-200 tabular-nums focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Unique Reads */}
              <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Unique Reads (M)</span>
                <input
                  type="number"
                  step="0.2"
                  value={params.uniqueReads}
                  onChange={(e) => handleChange('uniqueReads', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded font-mono text-xs text-slate-200 tabular-nums focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Comparative Risk Bar Chart & SVM Multi-Class Probabilities */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Comparative Risk Bar Chart with Cut-off (Z = 3.0) */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                  Maternal cfDNA Z-Score Deviation vs Clinical Threshold
                </h3>
              </div>
              <span className="text-[11px] font-mono text-rose-400">
                Diagnostic Cut-Off: Z = 3.0
              </span>
            </div>

            {/* SVG Visualizer Chart */}
            <div className="w-full h-64 bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
              {/* Chart Plot Area */}
              <div className="relative flex-1 w-full flex items-end justify-around pt-6 pb-2 px-8">
                {/* Horizontal Cut-off Line (Z = 3.0) */}
                <div
                  className="absolute left-6 right-6 border-b-2 border-dashed border-rose-500 pointer-events-none z-10 flex items-center justify-between"
                  style={{
                    bottom: `${(3.0 / maxZ) * 85}%`,
                  }}
                >
                  <span className="text-[10px] font-mono text-rose-400 -mt-4 bg-slate-950/90 px-1 rounded">
                    Clinical Diagnostic Cut-Off (Z = 3.0)
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 -mt-4 bg-slate-950/90 px-1 rounded">
                    Action Threshold
                  </span>
                </div>

                {/* Normal Physiological Baseline Band (Z = 0.0 - 2.0) */}
                <div
                  className="absolute left-6 right-6 bg-cyan-950/20 border-t border-cyan-800/30 pointer-events-none"
                  style={{
                    bottom: '0%',
                    height: `${(2.0 / maxZ) * 85}%`,
                  }}
                />

                {/* Bars for Chr 13, Chr 18, Chr 21 */}
                {[
                  { name: 'Chr 13 (Patau)', z: params.z13, code: 'T13' },
                  { name: 'Chr 18 (Edwards)', z: params.z18, code: 'T18' },
                  { name: 'Chr 21 (Down)', z: params.z21, code: 'T21' },
                ].map((bar) => {
                  const isElevated = bar.z >= 3.0;
                  const heightPct = Math.min(100, Math.max(8, (bar.z / maxZ) * 85));

                  return (
                    <div key={bar.code} className="flex flex-col items-center gap-2 z-20 w-24">
                      {/* Bar Value Tooltip */}
                      <span
                        className={`text-xs font-mono font-bold tabular-nums px-2 py-0.5 rounded ${
                          isElevated
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        Z = {bar.z.toFixed(2)}
                      </span>

                      {/* Animated Column Bar */}
                      <div className="w-14 bg-slate-900 rounded-t-lg overflow-hidden flex flex-col justify-end h-40">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            isElevated
                              ? 'bg-gradient-to-t from-rose-700 to-rose-500 shadow-lg shadow-rose-950/50'
                              : 'bg-gradient-to-t from-cyan-700 to-cyan-500 shadow-md shadow-cyan-950/40'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>

                      {/* X-Axis Bar Label */}
                      <span className="text-xs font-semibold text-slate-300 text-center leading-tight">
                        {bar.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800 px-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                    <span>Patient Normal (&lt;3.0)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                    <span>Patient Elevated (&ge;3.0)</span>
                  </span>
                </div>
                <span className="font-mono text-slate-500">
                  Standardized Z = (x - μ) / σ
                </span>
              </div>
            </div>
          </div>

          {/* SVM Decision Posterior Probabilities */}
          {findings && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                    SVM Multi-Class Calibrated Posterior Probabilities
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  RBF Kernel ($\gamma = 0.15$)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { name: 'Normal', prob: findings.probabilities.normal, isDominant: !findings.isHighRisk },
                  { name: 'Trisomy 21', prob: findings.probabilities.t21, isDominant: params.z21 >= 3.0 },
                  { name: 'Trisomy 18', prob: findings.probabilities.t18, isDominant: params.z18 >= 3.0 },
                  { name: 'Trisomy 13', prob: findings.probabilities.t13, isDominant: params.z13 >= 3.0 },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                      item.isDominant
                        ? item.name === 'Normal'
                          ? 'bg-emerald-950/40 border-emerald-500/50'
                          : 'bg-rose-950/40 border-rose-500/50'
                        : 'bg-slate-950/50 border-slate-800'
                    }`}
                  >
                    <span className="text-[11px] text-slate-400 font-medium">{item.name}</span>
                    <span
                      className={`text-base font-bold font-mono tabular-nums ${
                        item.isDominant
                          ? item.name === 'Normal'
                            ? 'text-emerald-300'
                            : 'text-rose-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {(item.prob * 100).toFixed(1)}%
                    </span>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${
                          item.isDominant
                            ? item.name === 'Normal'
                              ? 'bg-emerald-500'
                              : 'bg-rose-500'
                            : 'bg-slate-600'
                        }`}
                        style={{ width: `${Math.max(3, item.prob * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Clinical Geneticist Interpretation Footnote */}
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  Prior Age-Adjusted Risk: <strong className="text-slate-200">{findings.ageAdjustedRisk}</strong>
                </span>
                <span>
                  Posterior Risk: <strong className={findings.isHighRisk ? 'text-rose-300' : 'text-emerald-300'}>{findings.posteriorRiskRatio}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
