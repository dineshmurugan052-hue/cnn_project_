import React from 'react';
import { Activity, Dna, Stethoscope, FolderArchive, FileText, Plus } from 'lucide-react';

interface HeaderNavbarProps {
  activeTab: 'ultrasound' | 'genomics' | 'multimodal' | 'archive';
  setActiveTab: (tab: 'ultrasound' | 'genomics' | 'multimodal' | 'archive') => void;
  onNewSession: () => void;
  onExportReport: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewSession,
  onExportReport,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-6 px-6 py-3.5 bg-slate-900 border-b border-slate-800 shrink-0">
      {/* Zone 1: Professional Hospital / Clinical Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Activity className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight text-slate-100 whitespace-nowrap">
            Perinatal Clinical Diagnostics
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Maternal-Fetal Ultrasound &amp; cfDNA Analytics
          </span>
        </div>
      </div>

      {/* Zone 2: 4 Clinical Diagnostic Modules */}
      <nav className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('ultrasound')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'ultrasound'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Ultrasound CNN &amp; Grad-CAM</span>
        </button>

        <button
          onClick={() => setActiveTab('genomics')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'genomics'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dna className="w-3.5 h-3.5" />
          <span>cfDNA Genomic SVM</span>
        </button>

        <button
          onClick={() => setActiveTab('multimodal')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'multimodal'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Clinical Diagnostic Synthesis</span>
        </button>

        <button
          onClick={() => setActiveTab('archive')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'archive'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Case Archive</span>
        </button>
      </nav>

      {/* Zone 3: Streamlined Clinical Session & Export Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Initialize New Patient Diagnostic Session"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>New Session</span>
        </button>

        <button
          onClick={onExportReport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-900/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Open Printable & PDF Export Dossier"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Export Clinical Dossier</span>
        </button>
      </div>
    </header>
  );
};
