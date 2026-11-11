import React, { useState } from 'react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { PatientBanner } from './components/PatientBanner';
import { UltrasoundTab } from './components/UltrasoundTab';
import { GenomicTab } from './components/GenomicTab';
import { MultimodalTab } from './components/MultimodalTab';
import { CaseArchiveTab } from './components/CaseArchiveTab';
import { ClinicalExportModal } from './components/ClinicalExportModal';
import { CLINICAL_PRESETS } from './data/clinicalPresets';
import {
  PatientInfo,
  UltrasoundFindings,
  GenomicParameters,
  GenomicFindings,
  MultimodalSynthesisResult,
} from './types/clinical';
import { evaluateGenomicSVM } from './utils/genomicClassifier';

export default function App() {
  const [activeTab, setActiveTab] = useState<'ultrasound' | 'genomics' | 'multimodal' | 'archive'>('ultrasound');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('case-t21');
  const [isEditingPatient, setIsEditingPatient] = useState<boolean>(false);

  // Active patient data initialized with Preset 1 (T21)
  const defaultPreset = CLINICAL_PRESETS[0];
  const [patientInfo, setPatientInfo] = useState<PatientInfo>(defaultPreset.patient);
  const [ultrasoundFindings, setUltrasoundFindings] = useState<UltrasoundFindings | null>(null);
  const [genomicParams, setGenomicParams] = useState<GenomicParameters>(defaultPreset.genomics);
  const [genomicFindings, setGenomicFindings] = useState<GenomicFindings | null>(() =>
    evaluateGenomicSVM(defaultPreset.genomics, defaultPreset.patient.maternalAge)
  );
  const [currentReport, setCurrentReport] = useState<MultimodalSynthesisResult | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Update patient demographics and recalculate age-adjusted genomic risk
  const handleUpdatePatient = (updatedPatient: PatientInfo) => {
    setPatientInfo(updatedPatient);
    const evaluated = evaluateGenomicSVM(genomicParams, updatedPatient.maternalAge);
    setGenomicFindings(evaluated);
    setCurrentReport(null);
  };

  // Switch clinical preset or initialize custom session
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') {
      const newPatient: PatientInfo = {
        id: `PT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        name: 'New Clinical Patient',
        maternalAge: 31,
        gestationalAge: '12w + 4d',
        gravidaPara: 'G1 P0',
        indication: 'First Trimester Aneuploidy & Anatomical Screening',
        sampleId: `CF-${Math.floor(1000 + Math.random() * 9000)}`,
        collectionDate: new Date().toISOString().split('T')[0],
      };
      const baselineGenomics: GenomicParameters = {
        rawReads: 24.5,
        uniqueReads: 18.4,
        propAligned: 0.96,
        dupReads: 6.8,
        gcContent: 41.0,
        fetalFraction: 11.4,
        z13: 0.35,
        z18: 0.42,
        z21: 0.58,
        zx: 0.15,
        zy: 0.12,
      };
      setPatientInfo(newPatient);
      setGenomicParams(baselineGenomics);
      setGenomicFindings(evaluateGenomicSVM(baselineGenomics, newPatient.maternalAge));
      setCurrentReport(null);
      setIsEditingPatient(true);
      return;
    }

    const preset = CLINICAL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setPatientInfo(preset.patient);
      setGenomicParams(preset.genomics);
      const evaluated = evaluateGenomicSVM(preset.genomics, preset.patient.maternalAge);
      setGenomicFindings(evaluated);
      setCurrentReport(null);
      setIsEditingPatient(false);
    }
  };

  const handleNewSession = () => {
    handleSelectPreset('custom');
    setActiveTab('ultrasound');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Bar Clinical Header */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewSession={handleNewSession}
        onExportReport={() => setIsExportModalOpen(true)}
      />

      {/* Patient Demographics & Session Editor Ribbon */}
      <PatientBanner
        patient={patientInfo}
        onUpdatePatient={handleUpdatePatient}
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPresetId}
        hasUltrasound={Boolean(ultrasoundFindings)}
        hasGenomics={Boolean(genomicFindings)}
        isHighRisk={Boolean(genomicFindings?.isHighRisk)}
        isEditingPatient={isEditingPatient}
        setIsEditingPatient={setIsEditingPatient}
      />

      {/* Main Clinical Console Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {activeTab === 'ultrasound' && (
          <UltrasoundTab
            findings={ultrasoundFindings}
            onUpdateFindings={setUltrasoundFindings}
            presetPlane={
              selectedPresetId !== 'custom'
                ? CLINICAL_PRESETS.find((p) => p.id === selectedPresetId)?.ultrasound.plane
                : 'Fetal_Brain'
            }
            presetBBox={
              selectedPresetId !== 'custom'
                ? CLINICAL_PRESETS.find((p) => p.id === selectedPresetId)?.ultrasound.bbox
                : undefined
            }
          />
        )}

        {activeTab === 'genomics' && (
          <GenomicTab
            parameters={genomicParams}
            findings={genomicFindings}
            onUpdateParameters={setGenomicParams}
            onUpdateFindings={setGenomicFindings}
            maternalAge={patientInfo.maternalAge}
          />
        )}

        {activeTab === 'multimodal' && (
          <MultimodalTab
            ultrasoundFindings={ultrasoundFindings}
            genomicFindings={genomicFindings}
            patientInfo={patientInfo}
            currentReport={currentReport}
            onReportGenerated={setCurrentReport}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}

        {activeTab === 'archive' && (
          <CaseArchiveTab
            onLoadCase={(presetId) => {
              handleSelectPreset(presetId);
              setActiveTab('ultrasound');
            }}
            selectedCaseId={selectedPresetId}
          />
        )}
      </main>

      {/* Clean Hospital Clinical Footer */}
      <footer className="px-6 py-4 border-t border-slate-900 bg-slate-950/90 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>Perinatal Clinical Diagnostics · Maternal-Fetal Medicine Decision-Support System</span>
          <span aria-hidden="true">·</span>
          <span>Non-Invasive Prenatal Aneuploidy &amp; Biometry Analytics</span>
        </div>

        <div className="flex items-center gap-4">
          <span>Division of Perinatal Cytogenomics &amp; Fetal Imaging</span>
          <span aria-hidden="true">·</span>
          <span>De-identified Clinical Cohorts</span>
        </div>
      </footer>

      {/* Clinical Consultation Export & PDF Download Modal */}
      <ClinicalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        patient={patientInfo}
        ultrasound={ultrasoundFindings}
        genomics={genomicFindings}
        report={currentReport}
      />
    </div>
  );
}
