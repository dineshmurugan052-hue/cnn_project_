import React, { useState, useEffect } from 'react';
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

  // Switch clinical preset
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') {
      setPatientInfo({
        id: `PT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        name: 'Jane Doe',
        maternalAge: 32,
        gestationalAge: '12w + 3d',
        gravidaPara: 'G1 P0',
        indication: 'First Trimester Screening',
        sampleId: `CF-${Math.floor(1000 + Math.random() * 9000)}`,
        collectionDate: new Date().toISOString().split('T')[0],
      });
      return;
    }

    const preset = CLINICAL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setPatientInfo(preset.patient);
      setGenomicParams(preset.genomics);
      const evaluated = evaluateGenomicSVM(preset.genomics, preset.patient.maternalAge);
      setGenomicFindings(evaluated);
      setCurrentReport(null); // Clear previous synthesis so user can re-generate for new patient
    }
  };

  const handleNewSession = () => {
    handleSelectPreset('custom');
    setActiveTab('ultrasound');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Bar Contract Header */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewSession={handleNewSession}
        onExportReport={() => setIsExportModalOpen(true)}
        hasReport={Boolean(currentReport)}
      />

      {/* Patient Demographics & Telemetry Ribbon */}
      <PatientBanner
        patient={patientInfo}
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPresetId}
        hasUltrasound={Boolean(ultrasoundFindings)}
        hasGenomics={Boolean(genomicFindings)}
        isHighRisk={Boolean(genomicFindings?.isHighRisk)}
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

      {/* Clinical Consultation Export Modal */}
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
