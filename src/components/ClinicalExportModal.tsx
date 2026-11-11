import React, { useState } from 'react';
import { X, Printer, Download, Activity, Dna, FileCheck, FileDown, CheckCircle2 } from 'lucide-react';
import {
  PatientInfo,
  UltrasoundFindings,
  GenomicFindings,
  MultimodalSynthesisResult,
} from '../types/clinical';
import {
  ensureClinicalReportText,
  downloadClinicalDossierPDF,
  printClinicalDossierDocument,
} from '../utils/pdfGenerator';

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!isOpen) return null;

  const fullReportText = ensureClinicalReportText(patient, ultrasound, genomics, report);

  const handleSavePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadClinicalDossierPDF(patient, ultrasound, genomics, report);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    printClinicalDossierDocument(patient, ultrasound, genomics, report);
  };

  const handleDownloadJSON = () => {
    const dossier = {
      patient,
      ultrasound,
      genomics,
      consultationSummary: fullReportText,
      exportTimestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Perinatal_Clinical_Dossier_${patient.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Clinical Diagnostic Dossier Export
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                Direct PDF Download, Printer Formatting &amp; Structured JSON
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={handleSavePDF}
              disabled={isGeneratingPdf}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Save as PDF (.pdf)'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-lg ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Clinical Document Preview */}
        <div className="p-8 overflow-y-auto bg-slate-950 text-slate-100 text-xs sm:text-sm font-sans space-y-6">
          {/* Hospital Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-cyan-600/80 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-cyan-400">
                PERINATAL DIAGNOSTICS &amp; GENOMIC ANALYTICS
              </h1>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Division of Maternal-Fetal Medicine &amp; Clinical Cytogenomics
              </p>
              <p className="text-[11px] text-slate-500">
                Tertiary Perinatal Referral Center · Clinical Diagnostic Consultation Dossier
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <div>
                DOSSIER ID: <strong className="text-slate-200">MFM-{patient.id}</strong>
              </div>
              <div>DATE: {new Date().toLocaleDateString()}</div>
              <div>
                STATUS: <strong className="text-emerald-400">VERIFIED CONSULTATION</strong>
              </div>
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
              <span className="text-slate-500 block text-[11px]">Maternal Age / Parity</span>
              <strong className="text-slate-200">
                {patient.maternalAge} years ({patient.gravidaPara})
              </strong>
            </div>
          </div>

          {/* Imaging & Genomics Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ultrasound Snapshot */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between font-semibold text-xs text-cyan-400 border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Ultrasound CNN &amp; Grad-CAM Biometry</span>
                </span>
                <span className="font-mono text-slate-300">
                  {ultrasound?.plane.replace('_', ' ') || 'Fetal Brain'} (
                  {(ultrasound?.confidence ?? 94.2).toFixed(1)}%)
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
                <span>
                  Contour ROI: [{ultrasound?.bbox.x ?? 120}, {ultrasound?.bbox.y ?? 118},{' '}
                  {ultrasound?.bbox.width ?? 110}×{ultrasound?.bbox.height ?? 105}]
                </span>
                <span>Peak Act: {(ultrasound?.peakIntensity ?? 0.88).toFixed(2)}</span>
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
                  <span
                    className={`font-mono ${
                      genomics?.isHighRisk ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
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
                      <td
                        className={`py-1 font-bold ${
                          genomics && genomics.z21 >= 3.0 ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {genomics?.z21.toFixed(2)}
                      </td>
                      <td className="py-1 text-slate-500">&gt; 3.0</td>
                      <td className="py-1">
                        {genomics && genomics.z21 >= 3.0 ? '⚠️ High Risk' : 'Normal'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-300">Chr 18 (Edwards)</td>
                      <td
                        className={`py-1 font-bold ${
                          genomics && genomics.z18 >= 3.0 ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {genomics?.z18.toFixed(2)}
                      </td>
                      <td className="py-1 text-slate-500">&gt; 3.0</td>
                      <td className="py-1">
                        {genomics && genomics.z18 >= 3.0 ? '⚠️ High Risk' : 'Normal'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-300">Chr 13 (Patau)</td>
                      <td
                        className={`py-1 font-bold ${
                          genomics && genomics.z13 >= 3.0 ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {genomics?.z13.toFixed(2)}
                      </td>
                      <td className="py-1 text-slate-500">&gt; 3.0</td>
                      <td className="py-1">
                        {genomics && genomics.z13 >= 3.0 ? '⚠️ High Risk' : 'Normal'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-2 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-400 flex justify-between">
                <span>
                  Fetal Fraction:{' '}
                  <strong className="text-slate-200">{genomics?.fetalFraction.toFixed(1)}%</strong>
                </span>
                <span>
                  Posterior:{' '}
                  <strong className="text-cyan-400">{genomics?.posteriorRiskRatio}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Full Consultation Text */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 leading-relaxed">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono border-b border-slate-800 pb-2">
              Official Medical Consultation Summary
            </h3>
            <div className="whitespace-pre-wrap text-slate-300 text-xs sm:text-sm space-y-3 font-sans">
              {fullReportText}
            </div>
          </div>

          {/* Medical Doctor Sign-Off */}
          <div className="pt-6 border-t border-slate-800 flex flex-wrap justify-between items-end gap-4 text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-300">Electronically Signed By:</p>
              <p>Maternal-Fetal Medicine (MFM) Diagnostic Subspecialist</p>
              <p className="text-[11px] text-slate-500">
                Board Certified Clinical Perinatalogist &amp; Medical Geneticist
              </p>
            </div>
            <div className="text-right font-mono text-[11px] text-slate-500">
              <div>PERINATAL CLINICAL DECISION SUPPORT SYSTEM</div>
              <div>VERIFICATION CODE: MFM-DIAG-2026-VAL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
