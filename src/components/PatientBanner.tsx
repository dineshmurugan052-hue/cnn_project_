import React from 'react';
import { User, Calendar, ShieldAlert, CheckCircle2, ChevronDown } from 'lucide-react';
import { PatientInfo } from '../types/clinical';
import { CLINICAL_PRESETS } from '../data/clinicalPresets';

interface PatientBannerProps {
  patient: PatientInfo;
  onSelectPreset: (presetId: string) => void;
  selectedPresetId: string;
  hasUltrasound: boolean;
  hasGenomics: boolean;
  isHighRisk: boolean;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({
  patient,
  onSelectPreset,
  selectedPresetId,
  hasUltrasound,
  hasGenomics,
  isHighRisk,
}) => {
  return (
    <div className="bg-slate-950 border-b border-slate-800/90 px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Patient Demographics (Zero-pill metadata discipline with separators) */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-slate-100 font-semibold">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>{patient.name}</span>
          </div>

          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="font-mono text-cyan-400">{patient.id}</span>

          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>{patient.maternalAge} yo</span>

          <span className="text-slate-600" aria-hidden="true">·</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className="font-mono">{patient.gestationalAge}</span>
          </div>

          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-slate-400">{patient.gravidaPara}</span>

          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-slate-400 truncate max-w-xs">{patient.indication}</span>
        </div>

        {/* Diagnostic Status & Clinical Preset Quick-Loader */}
        <div className="flex items-center gap-3">
          {/* Analysis status indicators */}
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${hasUltrasound ? 'bg-cyan-400' : 'bg-slate-600'}`} />
              <span>US Vision: {hasUltrasound ? 'Classified' : 'Pending'}</span>
            </span>

            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${hasGenomics ? 'bg-cyan-400' : 'bg-slate-600'}`} />
              <span>cfDNA SVM: {hasGenomics ? 'Evaluated' : 'Pending'}</span>
            </span>

            {hasGenomics && (
              <span className="flex items-center gap-1">
                {isHighRisk ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Z &gt; 3.0 Alert</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Screen Negative</span>
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Quick preset selector */}
          <div className="relative">
            <select
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="appearance-none bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 rounded-lg px-2.5 py-1 pr-7 text-xs font-medium cursor-pointer focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {CLINICAL_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-slate-900 text-slate-200">
                  {preset.title}
                </option>
              ))}
              <option value="custom" className="bg-slate-900 text-slate-200">
                Custom Patient Entry
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
