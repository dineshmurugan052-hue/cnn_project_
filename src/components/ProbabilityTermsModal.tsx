import React from 'react';
import { Calculator, X, BookOpen, Sigma, HelpCircle, Layers, ShieldCheck } from 'lucide-react';
import { GenomicFindings } from '../types/clinical';

interface ProbabilityTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  findings: GenomicFindings | null;
}

export const ProbabilityTermsModal: React.FC<ProbabilityTermsModalProps> = ({
  isOpen,
  onClose,
  findings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Biostatistical Probability Terms & Confidence Reserves Reference
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                Maternal-Fetal Medicine Bayesian Risk Calculation Invariants
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-850 border border-slate-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {/* Active Patient Current Metrics Summary */}
          {findings && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider block">
                Current Patient Active Probability Terms & Reserves:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Prior Probability</span>
                  <strong className="text-slate-100 font-mono text-sm">{findings.ageAdjustedRisk}</strong>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    ({(findings.priorProbability * 100).toFixed(3)}%)
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Likelihood Ratio (LR)</span>
                  <strong className="text-cyan-400 font-mono text-sm">
                    {findings.likelihoodRatio.toFixed(1)}x
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    {findings.isHighRisk ? 'Positive LR+' : 'Negative LR-'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Posterior Probability</span>
                  <strong
                    className={`font-mono text-sm font-bold ${
                      findings.isHighRisk ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {(findings.posteriorProbability * 100).toFixed(1)}%
                  </strong>
                  <span className="text-[10px] text-slate-500 block">Bayesian Odds</span>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">PPV / NPV Term</span>
                  <strong className="text-slate-100 font-mono text-sm">
                    {findings.isHighRisk ? `PPV: ${findings.ppv}%` : `NPV: ${findings.npv}%`}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    {findings.isHighRisk ? 'Positive Predictive' : 'Negative Predictive'}
                  </span>
                </div>
              </div>

              {/* Statistical Confidence Reserves */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">
                    95% Confidence Interval Reserve Band (Z-Score):
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-cyan-300 font-bold">
                      [{findings.confidenceIntervalReserve.lower} — {findings.confidenceIntervalReserve.upper}]
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (SE = 0.18, 95% Confidence interval reserve buffer)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">
                    Fetal Fraction Analytical Reserve Buffer:
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`font-mono font-bold ${
                        findings.fetalFractionReserveBuffer >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {findings.fetalFractionReserveBuffer >= 0
                        ? `+${findings.fetalFractionReserveBuffer}% Above Reserve Threshold`
                        : `${findings.fetalFractionReserveBuffer}% Deficient (Below 4.0%)`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dictionary of Biostatistical & Probability Terms */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Standard Probability Terms in Prenatal Genomics</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              {/* Term 1: Prior Probability */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <strong className="text-cyan-300 block">1. Prior Probability (Baseline Age Risk)</strong>
                <p className="text-slate-400 leading-relaxed">
                  The pre-test epidemiological probability that a pregnancy is affected by a chromosomal aneuploidy, calculated from the mother's age at expected date of delivery (e.g. 1:1,200 at 25yo, 1:350 at 34yo, 1:100 at 40yo).
                </p>
                <code className="text-[11px] font-mono text-slate-400 block bg-slate-900 p-1 rounded">
                  Prior Odds = Prior_Prob / (1 - Prior_Prob)
                </code>
              </div>

              {/* Term 2: Likelihood Ratio */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <strong className="text-cyan-300 block">2. Likelihood Ratio (LR+ / LR-)</strong>
                <p className="text-slate-400 leading-relaxed">
                  The ratio of the probability of a given test result in affected fetuses to that in unaffected fetuses. For high-accuracy cfDNA assays with ~99.3% sensitivity and ~99.8% specificity, positive LR is approximately 450–500x.
                </p>
                <code className="text-[11px] font-mono text-slate-400 block bg-slate-900 p-1 rounded">
                  LR+ = Sensitivity / (1 - Specificity)
                </code>
              </div>

              {/* Term 3: Bayesian Posterior Probability */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <strong className="text-cyan-300 block">3. Posterior Probability (Bayes' Theorem)</strong>
                <p className="text-slate-400 leading-relaxed">
                  The updated, individualized post-test probability of aneuploidy that integrates the baseline maternal age prior odds with the empirical sequencing likelihood ratio.
                </p>
                <code className="text-[11px] font-mono text-slate-400 block bg-slate-900 p-1 rounded">
                  Posterior Odds = Prior Odds × Likelihood Ratio
                </code>
              </div>

              {/* Term 4: Positive Predictive Value (PPV) */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <strong className="text-cyan-300 block">4. Positive Predictive Value (PPV)</strong>
                <p className="text-slate-400 leading-relaxed">
                  The probability that a patient with a screen-positive cfDNA result truly has an affected fetus. PPV is heavily dependent on maternal age and prevalence (ranges from 50% in low-risk young patients to &gt;90% in advanced maternal age).
                </p>
                <code className="text-[11px] font-mono text-slate-400 block bg-slate-900 p-1 rounded">
                  PPV = True Positives / (True Positives + False Positives)
                </code>
              </div>

              {/* Term 5: Statistical Reserves & Confidence Intervals */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <strong className="text-cyan-300 block">5. Statistical Confidence Reserves (95% CI)</strong>
                <p className="text-slate-400 leading-relaxed">
                  The analytical reserve margins accounting for Poisson sequencing noise and standard error of read-count measurements. A 95% CI reserve ensures that borderline scores (e.g., Z = 2.85 to 3.15) are properly flagged for re-testing.
                </p>
                <code className="text-[11px] font-mono text-slate-400 block bg-slate-900 p-1 rounded">
                  CI_Reserve = Z_observed ± 1.96 × Standard_Error
                </code>
              </div>

              {/* Term 6: Fetal Fraction Reserve Buffer */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <strong className="text-cyan-300 block">6. Fetal Fraction Analytical Reserve Threshold</strong>
                <p className="text-slate-400 leading-relaxed">
                  Clinical guidelines (ACOG / ACMG) designate 4.0% fetal fraction as the minimum analytical threshold. The "Reserve Buffer" measures how far above or below this limit a sample resides, protecting against false negatives.
                </p>
                <code className="text-[11px] font-mono text-slate-400 block bg-slate-900 p-1 rounded">
                  Reserve Buffer = Fetal_Fraction (%) - 4.0%
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Reference Standard: ACMG & ACOG Practice Guidelines for cfDNA Screening
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Close Dictionary
          </button>
        </div>
      </div>
    </div>
  );
};
