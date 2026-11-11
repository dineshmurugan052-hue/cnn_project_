import React, { useState, useEffect } from 'react';
import { User, Calendar, ShieldAlert, CheckCircle2, ChevronDown, Edit3, Check, X } from 'lucide-react';
import { PatientInfo } from '../types/clinical';
import { CLINICAL_PRESETS } from '../data/clinicalPresets';

interface PatientBannerProps {
  patient: PatientInfo;
  onUpdatePatient: (updated: PatientInfo) => void;
  onSelectPreset: (presetId: string) => void;
  selectedPresetId: string;
  hasUltrasound: boolean;
  hasGenomics: boolean;
  isHighRisk: boolean;
  isEditingPatient: boolean;
  setIsEditingPatient: (val: boolean) => void;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({
  patient,
  onUpdatePatient,
  onSelectPreset,
  selectedPresetId,
  hasUltrasound,
  hasGenomics,
  isHighRisk,
  isEditingPatient,
  setIsEditingPatient,
}) => {
  const [draft, setDraft] = useState<PatientInfo>(patient);

  useEffect(() => {
    setDraft(patient);
  }, [patient]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePatient({
      ...draft,
      maternalAge: Math.max(15, Math.min(55, Number(draft.maternalAge) || 32)),
    });
    setIsEditingPatient(false);
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800/90 px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Patient Demographics */}
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

          <button
            onClick={() => setIsEditingPatient(!isEditingPatient)}
            className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700/80 text-[11px] font-medium transition-colors cursor-pointer"
            title="Edit Patient Demographics"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit Patient</span>
          </button>
        </div>

        {/* Diagnostic Status & Clinical Preset Quick-Loader */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${hasUltrasound ? 'bg-cyan-400' : 'bg-slate-600'}`} />
              <span>US Biometry: {hasUltrasound ? 'Classified' : 'Pending'}</span>
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
              className="appearance-none bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg px-2.5 py-1 pr-7 text-xs font-medium cursor-pointer focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {CLINICAL_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-slate-900 text-slate-200">
                  {preset.title}
                </option>
              ))}
              <option value="custom" className="bg-slate-900 text-slate-200">
                Custom Patient Session
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Expandable New Session / Custom Patient Dossier Form */}
      {isEditingPatient && (
        <form
          onSubmit={handleSave}
          className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end bg-slate-900/60 p-3 rounded-xl border"
        >
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Patient Name</label>
            <input
              type="text"
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Patient MRN / ID</label>
            <input
              type="text"
              required
              value={draft.id}
              onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Maternal Age (yrs)</label>
            <input
              type="number"
              min={15}
              max={55}
              required
              value={draft.maternalAge}
              onChange={(e) => setDraft({ ...draft, maternalAge: parseInt(e.target.value, 10) || 32 })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Gestational Age</label>
            <input
              type="text"
              required
              value={draft.gestationalAge}
              onChange={(e) => setDraft({ ...draft, gestationalAge: e.target.value })}
              placeholder="e.g. 12w + 4d"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Gravida / Para</label>
            <input
              type="text"
              required
              value={draft.gravidaPara}
              onChange={(e) => setDraft({ ...draft, gravidaPara: e.target.value })}
              placeholder="e.g. G2 P1"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Session</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingPatient(false)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
