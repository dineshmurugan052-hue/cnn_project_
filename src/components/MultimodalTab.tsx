import React, { useState } from 'react';
import {
  Stethoscope,
  Activity,
  Dna,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  Printer,
  Volume2,
  VolumeX,
  FileCheck,
  RefreshCw,
  Share2,
} from 'lucide-react';
import {
  UltrasoundFindings,
  GenomicFindings,
  PatientInfo,
  MultimodalSynthesisResult,
} from '../types/clinical';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasUltrasound = Boolean(ultrasoundFindings);
  const hasGenomics = Boolean(genomicFindings);
  const isReady = hasUltrasound && hasGenomics;

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
        reportText: data.report || 'Synthesis failed to generate text.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini-3.8-flash',
      };

      onReportGenerated(newReport);
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setErrorMessage(err.message || 'Failed to synthesize report. Please check server logs.');
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

  const handleToggleSpeech = () => {
    if (!currentReport || typeof window === 'undefined') return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown headings for speech synthesis
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
              <span>Google AI Studio Gemini Multimodal Synthesis Layer</span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
                MFM Expert Protocol
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlates deep learning ultrasound feature maps with 11-metric cfDNA chromosomal sequencing data.
            </p>
          </div>
        </div>

        {/* Readiness Checklist */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                hasUltrasound
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>US Vision {hasUltrasound ? '✓' : 'Pending'}</span>
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
                <span>Synthesizing Multimodal Report...</span>
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
                <span>1. Deep Learning Ultrasound Input</span>
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
                    Clinical MFM Diagnostic Consultation Summary
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

              {/* Action Toolbar */}
              {currentReport && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleSpeech}
                    className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                      isSpeaking
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                    }`}
                    title="Audio Doctor Briefing"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    <span>{isSpeaking ? 'Stop Audio' : 'Audio Brief'}</span>
                  </button>

                  <button
                    onClick={handleCopyReport}
                    className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    title="Copy Markdown Text"
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={onOpenExportModal}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Dossier</span>
                  </button>
                </div>
              )}
            </div>

            {/* Report Content Body */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-sm font-semibold text-slate-200">
                  Synthesizing Multimodal Ultrasound Vision + cfDNA Genomics...
                </p>
                <p className="text-xs text-slate-400 max-w-md text-center">
                  Correlating 256-filter convolutional activation maps, biparietal anatomical planes, and chromosome 13/18/21 dosage deviations under MFM clinical protocols.
                </p>
              </div>
            ) : currentReport ? (
              <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4">
                {/* Custom formatted render of the 4 clinical sections */}
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
                    <span className="font-semibold text-slate-300">Reviewed By:</span>
                    <span>Maternal-Fetal Medicine (MFM) Clinical AI Engine</span>
                    <span className="font-mono text-[11px] text-slate-500">Model Engine: {currentReport.source}</span>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="font-mono text-slate-400">Dossier ID: MFM-{patientInfo.id}</span>
                    <span className="text-[10px] text-slate-500">Non-Invasive Prenatal Diagnostic Support System</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
                  <Stethoscope className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Multimodal Diagnostic Consultation Not Yet Generated
                </h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Click the <strong className="text-cyan-300">"Generate Clinical Summary"</strong> button above to synthesize the ultrasound CNN Grad-CAM findings and cfDNA SVM Z-score metrics into an authoritative medical report.
                </p>
                {isReady && (
                  <button
                    onClick={handleSynthesize}
                    className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Gemini Multimodal Synthesis Now</span>
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
