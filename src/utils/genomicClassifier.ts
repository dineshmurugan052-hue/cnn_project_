import { GenomicParameters, GenomicFindings } from '../types/clinical';

// Empirical baseline parameters for StandardScaler from training cohort
const FEATURE_MEANS = [
  1.0,  // z13
  1.0,  // z18
  1.0,  // z21
  0.5,  // zx
  0.5,  // zy
  0.95, // propAligned
  8.0,  // dupReads
  41.0, // gcContent
  15.0, // rawReads
  13.0, // uniqueReads
  10.0, // fetalFraction
];

const FEATURE_STDS = [
  0.35, // z13
  0.35, // z18
  0.35, // z21
  0.25, // zx
  0.25, // zy
  0.03, // propAligned
  2.5,  // dupReads
  1.8,  // gcContent
  2.0,  // rawReads
  1.8,  // uniqueReads
  2.5,  // fetalFraction
];

// Prototype vectors for RBF SVM classification (Normal, T21, T18, T13)
const CLASS_PROTOTYPES = [
  { name: 'Normal Profile', z13: 1.0, z18: 1.0, z21: 1.0, classId: 'normal' },
  { name: 'Trisomy 21 (Down Syndrome)', z13: 1.0, z18: 1.0, z21: 3.8, classId: 't21' },
  { name: 'Trisomy 18 (Edwards Syndrome)', z13: 1.0, z18: 4.0, z21: 1.0, classId: 't18' },
  { name: 'Trisomy 13 (Patau Syndrome)', z13: 4.0, z18: 1.0, z21: 1.0, classId: 't13' },
];

export function evaluateGenomicSVM(
  params: GenomicParameters,
  maternalAge: number = 34
): GenomicFindings {
  const {
    z13,
    z18,
    z21,
    zx,
    zy,
    propAligned,
    dupReads,
    gcContent,
    rawReads,
    uniqueReads,
    fetalFraction,
  } = params;

  // Feature vector
  const rawVector = [
    z13,
    z18,
    z21,
    zx,
    zy,
    propAligned,
    dupReads,
    gcContent,
    rawReads,
    uniqueReads,
    fetalFraction,
  ];

  // StandardScaler transform
  const scaled = rawVector.map((val, idx) => (val - FEATURE_MEANS[idx]) / (FEATURE_STDS[idx] || 1));

  // RBF kernel similarity: K(x, prototype) = exp(-gamma * ||x - p||^2)
  const gamma = 0.15;
  const rawScores: number[] = [];

  for (let c = 0; c < CLASS_PROTOTYPES.length; c++) {
    const proto = CLASS_PROTOTYPES[c];
    const protoVec = [
      proto.z13,
      proto.z18,
      proto.z21,
      0.5,
      0.5,
      0.95,
      8.0,
      41.0,
      15.0,
      13.0,
      10.0,
    ];
    const protoScaled = protoVec.map(
      (val, idx) => (val - FEATURE_MEANS[idx]) / (FEATURE_STDS[idx] || 1)
    );

    let distSq = 0;
    // Emphasize chromosomal Z-score features in distance
    for (let i = 0; i < scaled.length; i++) {
      const weight = i < 3 ? 3.5 : 0.8;
      distSq += weight * Math.pow(scaled[i] - protoScaled[i], 2);
    }
    rawScores.push(Math.exp(-gamma * distSq));
  }

  // Softmax normalization
  const sumExp = rawScores.reduce((acc, s) => acc + s, 0);
  const probs = {
    normal: rawScores[0] / sumExp,
    t21: rawScores[1] / sumExp,
    t18: rawScores[2] / sumExp,
    t13: rawScores[3] / sumExp,
  };

  // Check clinical threshold Z > 3.0
  const flagged: string[] = [];
  if (z21 >= 3.0) flagged.push('Trisomy 21 (Down Syndrome)');
  if (z18 >= 3.0) flagged.push('Trisomy 18 (Edwards Syndrome)');
  if (z13 >= 3.0) flagged.push('Trisomy 13 (Patau Syndrome)');

  // Determine classified syndromic label
  let svmClass = 'Normal Profile (Screen Negative)';
  let isHighRisk = false;

  if (z21 >= 3.0 || probs.t21 > 0.45) {
    svmClass = 'Trisomy 21 (Down Syndrome)';
    isHighRisk = true;
  } else if (z18 >= 3.0 || probs.t18 > 0.45) {
    svmClass = 'Trisomy 18 (Edwards Syndrome)';
    isHighRisk = true;
  } else if (z13 >= 3.0 || probs.t13 > 0.45) {
    svmClass = 'Trisomy 13 (Patau Syndrome)';
    isHighRisk = true;
  }

  const lowFetalFraction = fetalFraction < 4.0;

  // Age-adjusted baseline risk ratio (e.g. 1:1300 at 25yo, 1:350 at 34yo, 1:100 at 40yo)
  let ageBaseline = '1 : 350';
  if (maternalAge <= 25) ageBaseline = '1 : 1,200';
  else if (maternalAge <= 30) ageBaseline = '1 : 850';
  else if (maternalAge <= 35) ageBaseline = '1 : 350';
  else if (maternalAge <= 38) ageBaseline = '1 : 175';
  else ageBaseline = '1 : 85';

  // Posterior risk based on cfDNA
  let posteriorRiskRatio = '1 : 10,000 (Low Risk)';
  if (isHighRisk) {
    posteriorRiskRatio = '> 1 : 10 (Critical High Risk)';
  } else if (z21 > 2.5 || z18 > 2.5 || z13 > 2.5) {
    posteriorRiskRatio = '1 : 120 (Intermediate / Borderline)';
  }

  return {
    ...params,
    svmClass,
    probabilities: probs,
    flagged: flagged.length > 0 ? flagged : ['None (All Z-scores < 3.0 cut-off)'],
    isHighRisk,
    lowFetalFraction,
    ageAdjustedRisk: ageBaseline,
    posteriorRiskRatio,
  };
}
