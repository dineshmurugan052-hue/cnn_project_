export type AnatomicalPlane =
  | 'Fetal_Abdomen'
  | 'Fetal_Brain'
  | 'Fetal_Femur'
  | 'Fetal_Thorax'
  | 'Cervix'
  | 'Maternal_Spine'
  | 'Placenta'
  | 'Other';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UltrasoundFindings {
  plane: AnatomicalPlane;
  confidence: number;
  hotspot: string;
  bbox: BoundingBox;
  peakIntensity: number;
  probabilities: Record<AnatomicalPlane, number>;
  imageDataUrl: string;
  gradCamOverlayUrl?: string;
  bboxOverlayUrl?: string;
}

export interface GenomicParameters {
  z13: number;
  z18: number;
  z21: number;
  zx: number;
  zy: number;
  propAligned: number;
  dupReads: number;
  gcContent: number;
  rawReads: number;
  uniqueReads: number;
  fetalFraction: number;
}

export interface GenomicFindings extends GenomicParameters {
  svmClass: string;
  probabilities: {
    normal: number;
    t21: number;
    t18: number;
    t13: number;
  };
  flagged: string[];
  isHighRisk: boolean;
  lowFetalFraction: boolean;
  ageAdjustedRisk: string;
  posteriorRiskRatio: string;
}

export interface PatientInfo {
  id: string;
  name: string;
  maternalAge: number;
  gestationalAge: string;
  gravidaPara: string;
  indication: string;
  sampleId: string;
  collectionDate: string;
}

export interface MultimodalSynthesisResult {
  reportText: string;
  timestamp: string;
  source: string;
  isCustomReport?: boolean;
}

export interface ClinicalCasePreset {
  id: string;
  title: string;
  subtitle: string;
  patient: PatientInfo;
  ultrasound: {
    plane: AnatomicalPlane;
    confidence: number;
    hotspot: string;
    bbox: BoundingBox;
    description: string;
  };
  genomics: GenomicParameters;
}
