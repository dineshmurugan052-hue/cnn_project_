import React from 'react';
import { X, Printer, Download, Activity, Dna, FileCheck } from 'lucide-react';
import {
  PatientInfo,
  UltrasoundFindings,
  GenomicFindings,
  MultimodalSynthesisResult,
} from '../types/clinical';

interface ClinicalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientInfo;
  ultrasound: UltrasoundFindings | null;
  genomics: GenomicFindings | null;
  report: MultimodalSynthesisResult | null;
}

export const ClinicalExportModal: React.FC<ClinicalExportModalProps> = ({
  isOpen,
  onClose,
  patient,
  ultrasound,
  genomics,
  report,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dossier = {
      patient,
      ultrasound,
      genomics,
      report,
      exportTimestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clinical_Dossier_${patient.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-slate-100">
              Clinical Diagnostic Dossier Export
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-850 border border-slate-700 rounded-lg ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (Styled for clinical document) */}
        <div className="p-8 overflow-y-auto bg-slate-950 text-slate-100 text-xs sm:text-sm font-sans space-y-6 print:p-0 print:bg-white print:text-black">
          {/* Hospital Header */}
          <div className="flex items-start justify-between border-b-2 border-cyan-600/80 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-cyan-400">
                AURA ADVANCED PERINATAL MEDICINE
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Center for Maternal-Fetal Medicine & Clinical Cytogenomics
              </p>
              <p className="text-[11px] text-slate-500">
                Level IV Regional Referral Perinatal Diagnostic Center · Clinical Lic. #MFM-88402
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <div>REPORT ID: <strong className="text-slate-200">MFM-{patient.id}</strong></div>
              <div>DATE: {new Date().toLocaleDateString()}</div>
              <div>STATUS: <strong className="text-emerald-400">OFFICIAL CONSULTATION</strong></div>
            </div>
          </div>

          {/* Patient Demographics Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Patient Name</span>
              <strong className="text-slate-200 text-sm">{patient.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Patient MRN</span>
              <strong className="font-mono text-cyan-400">{patient.id}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Gestational Age</span>
              <strong className="font-mono text-slate-200">{patient.gestationalAge}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Maternal Age</span>
              <strong className="text-slate-200">{patient.maternalAge} years ({patient.gravidaPara})</strong>
            </div>
          </div>

          {/* Imaging & Genomics Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ultrasound Snapshot */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between font-semibold text-xs text-cyan-400 border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Deep Learning Ultrasound Biometry</span>
                </span>
                <span className="font-mono text-slate-300">
                  {ultrasound?.plane.replace('_', ' ')} ({(ultrasound?.confidence ?? 94).toFixed(1)}%)
                </span>
              </div>
              {ultrasound?.bboxOverlayUrl && (
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                  <img
                    src={ultrasound.bboxOverlayUrl}
                    alt="Grad-CAM ROI"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                <span>Contour ROI: [{ultrasound?.bbox.x}, {ultrasound?.bbox.y}, {ultrasound?.bbox.width}×{ultrasound?.bbox.height}]</span>
                <span>Peak Act: {ultrasound?.peakIntensity.toFixed(2)}</span>
              </div>
            </div>

            {/* cfDNA Dosage Table */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2 justify-between">
              <div>
                <div className="flex items-center justify-between font-semibold text-xs text-cyan-400 border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Dna className="w-3.5 h-3.5" />
                    <span>Maternal cfDNA Sequencing Metrics</span>
                  </span>
                  <span className={`font-mono ${genomics?.isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {genomics?.isHighRisk ? 'Aneuploidy Flagged' : 'Normal Limits'}
                  </span>
                </div>

                <table className="w-full text-xs mt-3 text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                      <th className="py-1">Chromosome</th>
                      <th className="py-1">Z-Score</th>
                      <th className="py-1">Cut-Off</th>
                      <th className="py-1">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    <tr>
                      <td className="py-1 text-slate-300">Chr 21 (Down)</td>
                      <td className={`py-1 font-bold ${genomics && genomics.z21 >= 3.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {genomics?.z21.toFixed(2)}
                      </td>
                      <td className="py-1 text-slate-500">&gt; 3.0</td>
                      <td className="py-1">{genomics && genomics.z21 >= 3.0 ? '⚠️ High Risk' : 'Normal'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-300">Chr 18 (Edwards)</td>
                      <td className={`py-1 font-bold ${genomics && genomics.z18 >= 3.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {genomics?.z18.toFixed(2)}
                      </td>
                      <td className="py-1 text-slate-500">&gt; 3.0</td>
                      <td className="py-1">{genomics && genomics.z18 >= 3.0 ? '⚠️ High Risk' : 'Normal'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-300">Chr 13 (Patau)</td>
                      <td className={`py-1 font-bold ${genomics && genomics.z13 >= 3.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {genomics?.z13.toFixed(2)}
                      </td>
                      <td className="py-1 text-slate-500">&gt; 3.0</td>
                      <td className="py-1">{genomics && genomics.z13 >= 3.0 ? '⚠️ High Risk' : 'Normal'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-2 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-400 flex justify-between">
                <span>Fetal Fraction: <strong className="text-slate-200">{genomics?.fetalFraction.toFixed(1)}%</strong></span>
                <span>Posterior: <strong className="text-cyan-400">{genomics?.posteriorRiskRatio}</strong></span>
              </div>
            </div>
          </div>

          {/* Full Consultation Text */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 leading-relaxed">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono border-b border-slate-800 pb-2">
              Official Medical Consultation Summary
            </h3>
            {report ? (
              <div className="whitespace-pre-wrap text-slate-300 text-xs sm:text-sm space-y-3 font-sans">
                {report.reportText}
              </div>
            ) : (
              <div className="text-slate-500 italic py-4">No report text generated yet.</div>
            )}
          </div>

          {/* Medical Doctor Sign-Off */}
          <div className="pt-6 border-t border-slate-800 flex justify-between items-end text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-300">Electronically Signed By:</p>
              <p>Maternal-Fetal Medicine (MFM) Diagnostic Subspecialist</p>
              <p className="text-[11px] text-slate-500">Board Certified Clinical Perinatalogist & Geneticist</p>
            </div>
            <div className="text-right font-mono text-[11px] text-slate-500">
              <div>CLINICAL DECISION SUPPORT SYSTEM</div>
              <div>VERIFICATION CODE: MFM-AI-STU-2026-VAL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
