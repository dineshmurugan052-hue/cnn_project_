import React from 'react';
import { FolderArchive, ArrowRight, CheckCircle2, ShieldAlert, AlertTriangle, FileText } from 'lucide-react';
import { CLINICAL_PRESETS } from '../data/clinicalPresets';

interface CaseArchiveTabProps {
  onLoadCase: (presetId: string) => void;
  selectedCaseId: string;
}

export const CaseArchiveTab: React.FC<CaseArchiveTabProps> = ({
  onLoadCase,
  selectedCaseId,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-cyan-400" />
            <span>Maternal-Fetal Medicine Clinical Case Archive</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-validated multimodal patient cohorts for benchmark evaluation of CNN Grad-CAM and cfDNA SVM classifiers.
          </p>
        </div>
      </div>

      {/* Case Studies Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CLINICAL_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedCaseId;
          const isT21 = preset.genomics.z21 >= 3.0;
          const isT18 = preset.genomics.z18 >= 3.0;
          const isT13 = preset.genomics.z13 >= 3.0;
          const isLowFF = preset.genomics.fetalFraction < 4.0;
          const isNormal = !isT21 && !isT18 && !isT13 && !isLowFF;

          return (
            <div
              key={preset.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-slate-850 border-cyan-500 shadow-md shadow-cyan-950/40'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-cyan-400">{preset.patient.id}</span>
                    <h3 className="text-sm font-semibold text-slate-100">{preset.patient.name}</h3>
                  </div>

                  {isNormal ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Screen Negative</span>
                    </span>
                  ) : isLowFF ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Low Fetal Fraction</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Aneuploidy Alert</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {preset.subtitle}
                </p>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950 rounded-lg text-[11px] font-mono">
                  <div className="text-center">
                    <span className="text-slate-500 block text-[10px]">Chr 21</span>
                    <span className={`font-bold ${isT21 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {preset.genomics.z21.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-500 block text-[10px]">Chr 18</span>
                    <span className={`font-bold ${isT18 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {preset.genomics.z18.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-500 block text-[10px]">Chr 13</span>
                    <span className={`font-bold ${isT13 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {preset.genomics.z13.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>US Plane: {preset.ultrasound.plane.replace('_', ' ')}</span>
                  <span className="font-mono">GA: {preset.patient.gestationalAge}</span>
                </div>
              </div>

              <button
                onClick={() => onLoadCase(preset.id)}
                className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80'
                }`}
              >
                <span>{isSelected ? 'Active in Console' : 'Load Case into Console'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Cohort Comparison Matrix Table */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
          Clinical Cohort Benchmark Comparison Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2 px-3">Patient ID</th>
                <th className="py-2 px-3">GA / Age</th>
                <th className="py-2 px-3">Ultrasound Plane</th>
                <th className="py-2 px-3">Z21</th>
                <th className="py-2 px-3">Z18</th>
                <th className="py-2 px-3">Z13</th>
                <th className="py-2 px-3">Fetal Fraction</th>
                <th className="py-2 px-3">SVM Stratification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {CLINICAL_PRESETS.map((p) => {
                const isHigh = p.genomics.z21 >= 3.0 || p.genomics.z18 >= 3.0 || p.genomics.z13 >= 3.0;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-cyan-400">{p.patient.id}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.patient.gestationalAge} / {p.patient.maternalAge}y</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.ultrasound.plane.replace('_', ' ')}</td>
                    <td className={`py-2.5 px-3 ${p.genomics.z21 >= 3.0 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      {p.genomics.z21.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 ${p.genomics.z18 >= 3.0 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      {p.genomics.z18.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 ${p.genomics.z13 >= 3.0 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      {p.genomics.z13.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 ${p.genomics.fetalFraction < 4.0 ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                      {p.genomics.fetalFraction.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        isHigh ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      }`}>
                        {isHigh ? 'High Risk' : 'Low Risk'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
