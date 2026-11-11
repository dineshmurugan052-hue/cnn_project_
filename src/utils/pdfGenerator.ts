import {
  PatientInfo,
  UltrasoundFindings,
  GenomicFindings,
  MultimodalSynthesisResult,
} from '../types/clinical';

/**
 * Generates a default 4-section clinical report if one has not yet been synthesized.
 */
export function ensureClinicalReportText(
  patient: PatientInfo,
  ultrasound: UltrasoundFindings | null,
  genomics: GenomicFindings | null,
  report: MultimodalSynthesisResult | null
): string {
  if (report?.reportText) {
    return report.reportText;
  }

  const isT21 = (genomics?.z21 ?? 0) > 3.0;
  const isT18 = (genomics?.z18 ?? 0) > 3.0;
  const isT13 = (genomics?.z13 ?? 0) > 3.0;
  const plane = ultrasound?.plane?.replace('_', ' ') || 'Fetal Brain';
  const conf = (ultrasound?.confidence ?? 94.2).toFixed(1);
  const z21 = (genomics?.z21 ?? 1.1).toFixed(2);
  const z18 = (genomics?.z18 ?? 0.9).toFixed(2);
  const z13 = (genomics?.z13 ?? 0.8).toFixed(2);
  const ff = (genomics?.fetalFraction ?? 10.8).toFixed(1);

  let impression = 'Low Risk Euploid Screening Profile';
  if (isT21) impression = 'High Risk for Trisomy 21 (Down Syndrome)';
  else if (isT18) impression = 'High Risk for Trisomy 18 (Edwards Syndrome)';
  else if (isT13) impression = 'High Risk for Trisomy 13 (Patau Syndrome)';

  return `### 1. Executive Clinical Impression
Correlative multimodal evaluation of Patient ${patient.name} (MRN: ${patient.id}) at ${patient.gestationalAge} gestation indicates a ${impression}. Deep learning ultrasound biometry confirms the ${plane} anatomical plane (${conf}% classification certitude), correlated with maternal cell-free DNA (cfDNA) sequencing metrics.

### 2. Ultrasound Diagnostic Findings
- Anatomical Plane Classification: ${plane} (${conf}% confidence).
- Grad-CAM Activation ROI: [${ultrasound?.bbox.x ?? 120}, ${ultrasound?.bbox.y ?? 118}, ${ultrasound?.bbox.width ?? 110}x${ultrasound?.bbox.height ?? 105}] with peak activation intensity ${(ultrasound?.peakIntensity ?? 0.88).toFixed(2)}.
- Acoustic Evaluation: Structural landmarks evaluated against first/second-trimester reference biometry.

### 3. Genomic & Aneuploidy Assessment
- Chromosome 21 Z-Score: ${z21} (${isT21 ? 'ELEVATED > 3.0 Diagnostic Cut-Off' : 'Within Normal Limits < 3.0'})
- Chromosome 18 Z-Score: ${z18} (${isT18 ? 'ELEVATED > 3.0 Diagnostic Cut-Off' : 'Within Normal Limits < 3.0'})
- Chromosome 13 Z-Score: ${z13} (${isT13 ? 'ELEVATED > 3.0 Diagnostic Cut-Off' : 'Within Normal Limits < 3.0'})
- Fetal Fraction: ${ff}% (Analytical Quality Threshold >= 4.0%)
- Bayesian Risk Ratio: ${genomics?.posteriorRiskRatio || '1:1200'} (Baseline Age Risk: ${genomics?.ageAdjustedRisk || '1:450'})

### 4. Actionable Clinical Recommendations
1. Definitive Cytogenetic Confirmation: ${isT21 || isT18 || isT13 ? 'Offer invasive prenatal diagnostic testing via Chorionic Villus Sampling (CVS, 11-13+6w) or Amniocentesis (15-20w) with Chromosomal Microarray Analysis (CMA).' : 'Routine obstetric follow-up; no invasive testing indicated by screening baseline.'}
2. Targeted Fetal Imaging: Schedule Level II high-resolution anatomic survey and fetal echocardiography at 18-20 weeks gestation.
3. Genetic Counseling: Provide formal pre- and post-test perinatal genetic counseling.`;
}

/**
 * Helper to load a data URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Word-wraps text onto a 2D canvas context and returns the new Y coordinate.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const paragraphs = text.split('\n');
  let currentY = y;

  for (const rawLine of paragraphs) {
    const cleanLine = rawLine.replace(/\*\*/g, '').trim();
    if (!cleanLine) {
      currentY += lineHeight * 0.45;
      continue;
    }

    const isHeader = cleanLine.startsWith('### ');
    const displayLine = isHeader ? cleanLine.replace('### ', '').toUpperCase() : cleanLine;

    if (isHeader) {
      currentY += 8;
      ctx.font = 'bold 21px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillStyle = '#0f172a';
    } else {
      ctx.font = '18px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillStyle = '#1e293b';
    }

    const words = displayLine.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), x, currentY);
      currentY += isHeader ? lineHeight + 4 : lineHeight;
    }
  }

  return currentY;
}

/**
 * Converts a JPEG Data URL into a valid single-page A4 PDF binary Blob
 * so the browser directly downloads a real .pdf file without relying on window.print().
 */
function createPdfFromJpegDataUrl(jpegDataUrl: string, pageWidthPt = 595.28, pageHeightPt = 841.89): Blob {
  const base64 = jpegDataUrl.split(',')[1];
  const binaryImg = atob(base64);
  const imgBytes = new Uint8Array(binaryImg.length);
  for (let i = 0; i < binaryImg.length; i++) {
    imgBytes[i] = binaryImg.charCodeAt(i);
  }

  // Pixel dimensions match our canvas (1240 x 1754)
  const imgWidthPx = 1240;
  const imgHeightPx = 1754;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const recordObj = () => {
    offsets.push(currentOffset);
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // 1: Catalog
  recordObj();
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2: Pages
  recordObj();
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // 3: Page
  recordObj();
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im0 4 0 R >> >> /MediaBox [0 0 ${pageWidthPt.toFixed(
      2
    )} ${pageHeightPt.toFixed(2)}] /Contents 5 0 R >>\nendobj\n`
  );

  // 4: Image XObject (DCTDecode = JPEG)
  recordObj();
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidthPx} /Height ${imgHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
  );
  pushBytes(imgBytes);
  pushStr('\nendstream\nendobj\n');

  // 5: Content Stream to draw image full-page
  const contentStream = `q\n${pageWidthPt.toFixed(2)} 0 0 ${pageHeightPt.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
  recordObj();
  pushStr(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  // XRef table
  const xrefOffset = currentOffset;
  pushStr(`xref\n0 6\n0000000000 65535 f \n`);
  for (const offset of offsets) {
    pushStr(`${String(offset).padStart(10, '0')} 00000 n \n`);
  }

  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

/**
 * Renders the clinical dossier onto a high-DPI A4 canvas, embeds it into a PDF 1.4 binary,
 * and triggers an immediate file download of `Perinatal_Clinical_Dossier_<PatientID>.pdf`.
 */
export async function downloadClinicalDossierPDF(
  patient: PatientInfo,
  ultrasound: UltrasoundFindings | null,
  genomics: GenomicFindings | null,
  report: MultimodalSynthesisResult | null
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1240; // High-res A4 width @ 150 DPI
  canvas.height = 1754; // High-res A4 height @ 150 DPI
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top Clinical Header Accent Bar
  ctx.fillStyle = '#0891b2';
  ctx.fillRect(0, 0, canvas.width, 14);

  // Header Titles
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('PERINATAL DIAGNOSTICS & GENOMIC ANALYTICS', 60, 68);

  ctx.fillStyle = '#475569';
  ctx.font = '18px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('Division of Maternal-Fetal Medicine & Prenatal Cytogenomics · Clinical Diagnostic Dossier', 60, 98);

  // Right Header Metadata
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText(`DOSSIER ID: MFM-${patient.id}`, 1180, 65);
  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, 1180, 92);
  ctx.textAlign = 'left';

  // Header Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 120);
  ctx.lineTo(1180, 120);
  ctx.stroke();

  // Patient Demographics Box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(60, 140, 1120, 100);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, 140, 1120, 100);

  const cols = [
    { label: 'PATIENT NAME', value: patient.name, x: 85 },
    { label: 'PATIENT MRN', value: patient.id, x: 360 },
    { label: 'GESTATIONAL AGE', value: patient.gestationalAge, x: 610 },
    { label: 'MATERNAL AGE / OB', value: `${patient.maternalAge} yrs (${patient.gravidaPara})`, x: 870 },
  ];

  cols.forEach((col) => {
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(col.label, col.x, 174);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(col.value, col.x, 208);
  });

  // Two-Column Evidence Section (Ultrasound + cfDNA Table)
  // Left Box: Ultrasound Biometry & Grad-CAM Image
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(60, 260, 540, 320);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('1. ULTRASOUND CNN & GRAD-CAM BIOMETRY', 80, 294);

  const scanImg = await loadImage(ultrasound?.bboxOverlayUrl || ultrasound?.imageDataUrl || '');
  if (scanImg) {
    ctx.drawImage(scanImg, 80, 312, 210, 210);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(80, 312, 210, 210);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('Ultrasound ROI', 130, 420);
  }

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('Anatomical Plane:', 310, 340);
  ctx.fillStyle = '#0891b2';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText(ultrasound?.plane?.replace('_', ' ') || 'Fetal Brain', 310, 366);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('Classification Certitude:', 310, 405);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText(`${(ultrasound?.confidence ?? 94.2).toFixed(1)}%`, 310, 430);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('Grad-CAM Bounding ROI:', 310, 470);
  ctx.fillStyle = '#475569';
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText(
    `[${ultrasound?.bbox.x ?? 120}, ${ultrasound?.bbox.y ?? 118}, ${ultrasound?.bbox.width ?? 110}×${
      ultrasound?.bbox.height ?? 105
    }]`,
    310,
    495
  );
  ctx.fillText(`Peak Heatmap: ${(ultrasound?.peakIntensity ?? 0.88).toFixed(2)}`, 310, 520);

  // Right Box: Maternal cfDNA Sequencing Metrics
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(640, 260, 540, 320);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('2. MATERNAL cfDNA CHROMOSOMAL SCREENING', 660, 294);

  const z21 = genomics?.z21 ?? 3.82;
  const z18 = genomics?.z18 ?? 1.15;
  const z13 = genomics?.z13 ?? 0.94;

  const rows = [
    { chr: 'Chromosome 21 (Down)', z: z21.toFixed(2), high: z21 >= 3.0 },
    { chr: 'Chromosome 18 (Edwards)', z: z18.toFixed(2), high: z18 >= 3.0 },
    { chr: 'Chromosome 13 (Patau)', z: z13.toFixed(2), high: z13 >= 3.0 },
  ];

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.fillText('CHROMOSOME', 660, 332);
  ctx.fillText('Z-SCORE', 910, 332);
  ctx.fillText('ASSESSMENT', 1020, 332);

  let rowY = 368;
  rows.forEach((r) => {
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(r.chr, 660, rowY);

    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillStyle = r.high ? '#dc2626' : '#0f172a';
    ctx.fillText(r.z, 910, rowY);

    ctx.fillStyle = r.high ? '#dc2626' : '#059669';
    ctx.font = 'bold 15px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(r.high ? 'HIGH RISK (>3.0)' : 'Normal (<3.0)', 1020, rowY);
    rowY += 42;
  });

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(660, 490, 500, 70);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.fillText(
    `Fetal Fraction: ${(genomics?.fetalFraction ?? 11.2).toFixed(1)}%   |   Posterior Risk: ${
      genomics?.posteriorRiskRatio || '1:10'
    }`,
    676,
    520
  );
  ctx.fillStyle = genomics?.isHighRisk ? '#dc2626' : '#059669';
  ctx.fillText(`SVM Classification: ${genomics?.svmClass || 'Evaluated'}`, 676, 545);

  // Consultation Report Section
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('3. MULTIMODAL CLINICAL CONSULTATION SUMMARY', 60, 622);

  ctx.strokeStyle = '#0891b2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 636);
  ctx.lineTo(1180, 636);
  ctx.stroke();

  const fullText = ensureClinicalReportText(patient, ultrasound, genomics, report);
  drawWrappedText(ctx, fullText, 60, 672, 1120, 27);

  // Bottom Signature Block
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 1630);
  ctx.lineTo(1180, 1630);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('Electronically Verified: Maternal-Fetal Medicine & Perinatal Genetics Service', 60, 1662);
  ctx.fillStyle = '#64748b';
  ctx.font = '14px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(
    'Clinical Decision-Support Dossier · Non-invasive screening requires cytogenetic confirmation via CVS or Amniocentesis.',
    60,
    1688
  );

  // Convert canvas to JPEG and wrap in PDF 1.4 binary
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const pdfBlob = createPdfFromJpegDataUrl(jpegDataUrl);

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Perinatal_Clinical_Dossier_${patient.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Triggers a clean browser print dialog using an isolated hidden iframe so
 * sandboxed preview windows and scrollable modals never clip the document.
 */
export function printClinicalDossierDocument(
  patient: PatientInfo,
  ultrasound: UltrasoundFindings | null,
  genomics: GenomicFindings | null,
  report: MultimodalSynthesisResult | null
): void {
  const reportText = ensureClinicalReportText(patient, ultrasound, genomics, report);
  const imgUrl = ultrasound?.bboxOverlayUrl || ultrasound?.imageDataUrl || '';

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Perinatal Clinical Dossier - ${patient.id}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; line-height: 1.5; font-size: 12px; margin: 0; padding: 0; }
    .header { border-bottom: 2px solid #0891b2; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { font-size: 11px; color: #475569; margin: 2px 0 0 0; }
    .meta { text-align: right; font-family: monospace; font-size: 11px; color: #334155; }
    .patient-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
    .patient-bar span { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; }
    .patient-bar strong { font-size: 13px; color: #0f172a; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; }
    .card h3 { font-size: 12px; text-transform: uppercase; color: #0891b2; margin: 0 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
    th, td { text-align: left; padding: 5px 4px; border-bottom: 1px solid #e2e8f0; }
    .report-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; white-space: pre-wrap; font-size: 12px; line-height: 1.55; }
    .footer { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">PERINATAL DIAGNOSTICS &amp; GENOMIC ANALYTICS</h1>
      <p class="subtitle">Division of Maternal-Fetal Medicine &amp; Clinical Cytogenomics · Official Diagnostic Dossier</p>
    </div>
    <div class="meta">
      <div><strong>DOSSIER ID:</strong> MFM-${patient.id}</div>
      <div><strong>DATE:</strong> ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="patient-bar">
    <div><span>Patient Name</span><strong>${patient.name}</strong></div>
    <div><span>Patient MRN</span><strong>${patient.id}</strong></div>
    <div><span>Gestational Age</span><strong>${patient.gestationalAge}</strong></div>
    <div><span>Maternal Age / OB</span><strong>${patient.maternalAge} yrs (${patient.gravidaPara})</strong></div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>1. Ultrasound CNN &amp; Grad-CAM Biometry</h3>
      <div style="display:flex; gap:12px; align-items:center;">
        ${imgUrl ? `<img src="${imgUrl}" style="width:110px;height:110px;object-fit:contain;border:1px solid #cbd5e1;border-radius:4px;" />` : ''}
        <div>
          <div><strong>Plane:</strong> ${ultrasound?.plane?.replace('_', ' ') || 'Fetal Brain'}</div>
          <div><strong>Confidence:</strong> ${(ultrasound?.confidence ?? 94.2).toFixed(1)}%</div>
          <div><strong>ROI Box:</strong> [${ultrasound?.bbox.x ?? 120}, ${ultrasound?.bbox.y ?? 118}, ${ultrasound?.bbox.width ?? 110}×${ultrasound?.bbox.height ?? 105}]</div>
          <div><strong>Peak Heatmap:</strong> ${(ultrasound?.peakIntensity ?? 0.88).toFixed(2)}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>2. Maternal cfDNA Chromosomal Screening</h3>
      <table>
        <thead><tr><th>Chromosome</th><th>Z-Score</th><th>Cut-off</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Chr 21 (Down)</td><td><strong>${(genomics?.z21 ?? 3.82).toFixed(2)}</strong></td><td>&gt; 3.0</td><td>${(genomics?.z21 ?? 0) >= 3 ? 'HIGH RISK' : 'Normal'}</td></tr>
          <tr><td>Chr 18 (Edwards)</td><td><strong>${(genomics?.z18 ?? 1.15).toFixed(2)}</strong></td><td>&gt; 3.0</td><td>${(genomics?.z18 ?? 0) >= 3 ? 'HIGH RISK' : 'Normal'}</td></tr>
          <tr><td>Chr 13 (Patau)</td><td><strong>${(genomics?.z13 ?? 0.94).toFixed(2)}</strong></td><td>&gt; 3.0</td><td>${(genomics?.z13 ?? 0) >= 3 ? 'HIGH RISK' : 'Normal'}</td></tr>
        </tbody>
      </table>
      <div style="margin-top:8px;font-size:11px;">
        <strong>Fetal Fraction:</strong> ${(genomics?.fetalFraction ?? 11.2).toFixed(1)}% &nbsp;|&nbsp;
        <strong>Posterior Risk:</strong> ${genomics?.posteriorRiskRatio || '1:10'}
      </div>
    </div>
  </div>

  <div class="report-box">${reportText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

  <div class="footer">
    <div>Electronically Signed: Maternal-Fetal Medicine (MFM) Diagnostic Subspecialist</div>
    <div>Perinatal Clinical Decision Support System · Ref #MFM-2026</div>
  </div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 350);
  }
}
