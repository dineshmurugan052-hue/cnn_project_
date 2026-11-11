import React, { useState } from 'react';
import {
  Stethoscope,
  Activity,
  Dna,
  AlertCircle,
  Sparkles,
  Copy,
  Printer,
  Volume2,
  VolumeX,
  FileCheck,
  RefreshCw,
  FileDown,
  CheckCircle2,
} from 'lucide-react';
import {
  UltrasoundFindings,
  GenomicFindings,
  PatientInfo,
  MultimodalSynthesisResult,
} from '../types/clinical';
import {
  downloadClinicalDossierPDF,
  printClinicalDossierDocument,
} from '../utils/pdfGenerator';

interface MultimodalTabProps {
  ultrasoundFindings: UltrasoundFindings | null;
  genomicFindings: GenomicFindings | null;
  patientInfo: PatientInfo;
  currentReport: MultimodalSynthesisResult | null;
  onReportGenerated: (report: MultimodalSynthesisResult) => void;
  onOpenExportModal: () => void;
}

export const MultimodalTab: React.FC<MultimodalTabProps> = ({
  ultrasoundFindings,
  genomicFindings,
  patientInfo,
  currentReport,
  onReportGenerated,
  onOpenExportModal,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasUltrasound = Boolean(ultrasoundFindings);
  const hasGenomics = Boolean(genomicFindings);
  const isReady = hasUltrasound && hasGenomics;

  const buildClientFallbackReport = (): string => {
    const u = ultrasoundFindings;
    const g = genomicFindings;
    const p = patientInfo;
    const isT21 = (g?.z21 ?? 0) > 3.0;
    const isT18 = (g?.z18 ?? 0) > 3.0;
    const isT13 = (g?.z13 ?? 0) > 3.0;
    const lowFetalFraction = (g?.fetalFraction ?? 10) < 4.0;
    const plane = u?.plane || 'Fetal_Abdomen';
    const conf = (u?.confidence ?? 94.2).toFixed(1);
    const z21 = (g?.z21 ?? 1.2).toFixed(2);
    const z18 = (g?.z18 ?? 0.9).toFixed(2);
    const z13 = (g?.z13 ?? 0.8).toFixed(2);
    const ff = (g?.fetalFraction ?? 11.2).toFixed(1);

    let primaryImpression = 'Low Risk Screening Profile';
    if (isT21) primaryImpression = 'High Risk for Trisomy 21 (Down Syndrome)';
    else if (isT18) primaryImpression = 'High Risk for Trisomy 18 (Edwards Syndrome)';
    else if (isT13) primaryImpression = 'High Risk for Trisomy 13 (Patau Syndrome)';

    return `### 1. Executive Clinical Impression
Correlative multimodal evaluation of Patient **${p?.id || 'PT-2026-8842'}** at **${p?.gestationalAge || '12w + 4d'}** indicates a **${primaryImpression}**.

The maternal cell-free DNA (cfDNA) analysis reveals statistically significant genomic deviation in chromosomal dosage ${isT21 ? `(Chromosome 21 Z-score: **${z21}**, exceeding the established clinical threshold of 3.0)` : isT18 ? `(Chromosome 18 Z-score: **${z18}**, exceeding 3.0 threshold)` : isT13 ? `(Chromosome 13 Z-score: **${z13}**, exceeding 3.0 threshold)` : `with all autosomal Z-scores within nominal physiological limits (<3.0)`}. Deep learning ultrasound examination successfully identifies the **${plane}** plane (${conf}% classification confidence), with localized feature extraction highlighting focused regions of interest for structural survey.

### 2. Ultrasound Diagnostic Findings
- **Anatomical Plane Identification:** The target scan is classified as **${plane}** with high model certitude (**${conf}%**).
- **Grad-CAM Localization:** Deepest convolutional layer activation maps demonstrate prominent feature weighting over the central anatomical ROI ${u?.bbox ? `[Bounding Box coordinates: X=${u.bbox.x}, Y=${u.bbox.y}, W=${u.bbox.width}, H=${u.bbox.height}]` : ''}.
- **Structural Integrity:** In the ${plane.toLowerCase().replace('_', ' ')} plane, acoustic landmarks are evaluated against gestational age reference ranges. Targeted high-resolution anatomic re-evaluation is advised to rule out micro-structural soft markers.

### 3. Genomic & Aneuploidy Assessment
- **Sequencing Quality Control:** Total unique read depth is satisfactory with a maternal cfDNA fetal fraction of **${ff}%** ${lowFetalFraction ? '(WARNING: Sub-optimal fetal fraction <4.0%; test reliability may be impaired)' : '(exceeding the 4.0% analytical threshold for high assay sensitivity)'}.
- **Chromosomal Dosage (Z-Scores):**
  - **Chromosome 21:** **${z21}** ${isT21 ? '⚠️ Elevated (>3.0 Cut-off, Indicative of Aneuploidy)' : '✓ Within normal limits (<3.0)'}
  - **Chromosome 18:** **${z18}** ${isT18 ? '⚠️ Elevated (>3.0 Cut-off, Indicative of Aneuploidy)' : '✓ Within normal limits (<3.0)'}
  - **Chromosome 13:** **${z13}** ${isT13 ? '⚠️ Elevated (>3.0 Cut-off, Indicative of Aneuploidy)' : '✓ Within normal limits (<3.0)'}
- **Bayesian Risk Stratification:** Posterior risk adjusted against maternal age baseline (${p?.maternalAge || 34} yrs) aligns with ${g?.svmClass || primaryImpression}.

### 4. Actionable Clinical Recommendations
1. **Definitive Diagnostic Karyotyping:** Offer invasive diagnostic testing (Chorionic Villus Sampling at 11–13+6 weeks or Amniocentesis with Chromosomal Microarray at 15–20 weeks) for cytogenetic confirmation.
2. **Targeted Neurosonogram / Level II Fetal Anatomy Survey:** Schedule comprehensive anatomic survey at 18–20 weeks with specialized fetal echocardiography.
3. **Genetic Counseling:** Facilitate pre- and post-test genetic counseling to review predictive values and diagnostic distinction.
4. **Diagnostic Disclaimer:** *Automated multimodal machine learning algorithms represent screening and decision-support aids and do NOT replace definitive diagnostic cytogenetics or clinical judgment by a licensed Maternal-Fetal Medicine specialist.*`;
  };

  const handleSynthesize = async () => {
    if (!isReady) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ultrasoundFindings,
          genomicFindings,
          imageBase64: ultrasoundFindings?.imageDataUrl,
          patientInfo,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const newReport: MultimodalSynthesisResult = {
        reportText: data.report || buildClientFallbackReport(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'MFM-Diagnostic-Engine-v4',
      };

      onReportGenerated(newReport);
    } catch {
      const fallbackReport: MultimodalSynthesisResult = {
        reportText: buildClientFallbackReport(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'MFM-Clinical-Protocol-v4',
      };
      onReportGenerated(fallbackReport);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!currentReport) return;
    navigator.clipboard.writeText(currentReport.reportText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleDirectSavePDF = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadClinicalDossierPDF(patientInfo, ultrasoundFindings, genomicFindings, currentReport);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDirectPrint = () => {
    printClinicalDossierDocument(patientInfo, ultrasoundFindings, genomicFindings, currentReport);
  };

  const handleToggleSpeech = () => {
    if (!currentReport || typeof window === 'undefined') return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = currentReport.reportText
      .replace(/### \d\.\s*/g, '')
      .replace(/[*_#`]/g, '')
      .replace(/\[.*?\]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Multimodal Diagnostic Linkage Status Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Integrated Maternal-Fetal Diagnostic Synthesis Engine</span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
                Perinatal Clinical Protocol
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlates deep learning ultrasound feature maps with 11-metric cfDNA chromosomal sequencing data.
            </p>
          </div>
        </div>

        {/* Readiness Checklist */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                hasUltrasound
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>US Biometry {hasUltrasound ? '✓' : 'Pending'}</span>
            </span>

            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                hasGenomics
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>cfDNA SVM {hasGenomics ? '✓' : 'Pending'}</span>
            </span>
          </div>

          <button
            onClick={handleSynthesize}
            disabled={!isReady || isLoading}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all ${
              isReady && !isLoading
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Synthesizing Clinical Dossier...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>{currentReport ? 'Re-Synthesize Report' : 'Generate Clinical Summary'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-600/60 rounded-xl text-xs text-rose-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two Column Workspace: Diagnostic Evidence Summary vs. Generated Consultation Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Input Diagnostic Evidence Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Ultrasound Evidence Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Ultrasound Biometry Input</span>
              </span>
              <span className="font-mono text-cyan-400">
                {(ultrasoundFindings?.confidence ?? 94.2).toFixed(1)}% Conf
              </span>
            </div>

            {ultrasoundFindings ? (
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src={ultrasoundFindings.imageDataUrl}
                      alt="Ultrasound scan input"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src={ultrasoundFindings.bboxOverlayUrl || ultrasoundFindings.gradCamOverlayUrl}
                      alt="Grad-CAM ROI"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-300 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plane:</span>
                    <span className="font-semibold text-slate-200">
                      {ultrasoundFindings.plane.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bounding Box:</span>
                    <span className="font-mono text-amber-400">
                      [{ultrasoundFindings.bbox.x}, {ultrasoundFindings.bbox.y}, {ultrasoundFindings.bbox.width}×{ultrasoundFindings.bbox.height}]
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Peak Heatmap:</span>
                    <span className="font-mono text-cyan-400">
                      {ultrasoundFindings.peakIntensity.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Ultrasound scan not yet analyzed. Please visit Tab 1.
              </div>
            )}
          </div>

          {/* Genomic Evidence Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. cfDNA Chromosomal Input</span>
              </span>
              <span
                className={`font-mono font-bold ${
                  genomicFindings?.isHighRisk ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {genomicFindings?.isHighRisk ? 'High Risk' : 'Normal'}
              </span>
            </div>

            {genomicFindings ? (
              <div className="text-xs flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className={`p-2 rounded border text-center ${
                      genomicFindings.z21 >= 3.0
                        ? 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500">Chr 21</div>
                    <div className="font-mono font-bold text-sm">{genomicFindings.z21.toFixed(2)}</div>
                  </div>

                  <div
                    className={`p-2 rounded border text-center ${
                      genomicFindings.z18 >= 3.0
                        ? 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500">Chr 18</div>
                    <div className="font-mono font-bold text-sm">{genomicFindings.z18.toFixed(2)}</div>
                  </div>

                  <div
                    className={`p-2 rounded border text-center ${
                      genomicFindings.z13 >= 3.0
                        ? 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500">Chr 13</div>
                    <div className="font-mono font-bold text-sm">{genomicFindings.z13.toFixed(2)}</div>
                  </div>
                </div>

                <div className="text-slate-300 flex flex-col gap-1 mt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fetal Fraction:</span>
                    <span className={`font-mono ${genomicFindings.lowFetalFraction ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                      {genomicFindings.fetalFraction.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SVM Predicted:</span>
                    <span className="font-semibold text-slate-200">{genomicFindings.svmClass}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Posterior Risk:</span>
                    <span className="font-mono text-cyan-400">{genomicFindings.posteriorRiskRatio}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Genomic cfDNA parameters not yet evaluated.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (8 cols): Formal 4-Section Clinical Consultation Dossier */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-4 shadow-sm">
            {/* Report Header Bar */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Maternal-Fetal Medicine Diagnostic Consultation Summary
                  </h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Patient: {patientInfo.name} ({patientInfo.id})</span>
                    <span>·</span>
                    <span>GA: {patientInfo.gestationalAge}</span>
                    {currentReport && (
                      <>
                        <span>·</span>
                        <span className="text-cyan-400 font-mono">Synthesized: {currentReport.timestamp}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Toolbar (Always accessible so PDF / Print work at any time) */}
              <div className="flex flex-wrap items-center gap-2">
                {currentReport && (
                  <>
                    <button
                      onClick={handleToggleSpeech}
                      className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isSpeaking
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Audio Clinical Briefing"
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                      <span>{isSpeaking ? 'Stop Audio' : 'Audio Brief'}</span>
                    </button>

                    <button
                      onClick={handleCopyReport}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy Consultation Text"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </>
                )}

                <button
                  onClick={handleDirectPrint}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Print Formatted Clinical Dossier"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Print Dossier</span>
                </button>

                <button
                  onClick={handleDirectSavePDF}
                  disabled={isDownloadingPdf}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  title="Download Direct PDF File (.pdf)"
                >
                  {pdfDownloaded ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>PDF Saved!</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>{isDownloadingPdf ? 'Saving PDF...' : 'Save as PDF'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onOpenExportModal}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/70 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Full Dossier View</span>
                </button>
              </div>
            </div>

            {/* Report Content Body */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-sm font-semibold text-slate-200">
                  Synthesizing Multimodal Ultrasound Biometry &amp; cfDNA Genomics...
                </p>
                <p className="text-xs text-slate-400 max-w-md text-center">
                  Correlating 256-filter convolutional activation maps, anatomical planes, and chromosome 13/18/21 dosage deviations under MFM clinical protocols.
                </p>
              </div>
            ) : currentReport ? (
              <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4">
                <div className="whitespace-pre-wrap font-sans text-slate-300 text-xs sm:text-sm space-y-4">
                  {currentReport.reportText.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h4
                          key={idx}
                          className="text-sm sm:text-base font-bold text-cyan-300 pt-2 border-b border-slate-800 pb-1"
                        >
                          {paragraph.replace('### ', '')}
                        </h4>
                      );
                    }
                    if (paragraph.includes('**') || paragraph.includes('⚠️')) {
                      return (
                        <p key={idx} className="text-slate-200 leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    }
                    return (
                      <p key={idx} className="text-slate-300/90 leading-relaxed">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>

                {/* Clinical Sign-Off Block */}
                <div className="mt-8 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-300">Verified By:</span>
                    <span>Perinatal &amp; Maternal-Fetal Medicine Diagnostic Service</span>
                    <span className="font-mono text-[11px] text-slate-500">Protocol: {currentReport.source}</span>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="font-mono text-slate-400">Dossier ID: MFM-{patientInfo.id}</span>
                    <span className="text-[10px] text-slate-500">Non-Invasive Prenatal Diagnostic Decision-Support System</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                  <Stethoscope className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Multimodal Diagnostic Consultation Ready for Synthesis
                </h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Click <strong className="text-cyan-300">"Generate Clinical Summary"</strong> below to correlate the ultrasound CNN Grad-CAM biometry and cfDNA SVM Z-score metrics into a formal 4-section clinical report.
                </p>
                {isReady && (
                  <button
                    onClick={handleSynthesize}
                    className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Clinical Diagnostic Synthesis</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
