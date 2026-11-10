import { AnatomicalPlane, BoundingBox } from '../types/clinical';

export type ColormapType = 'jet' | 'turbo' | 'hot' | 'viridis';

// Convert normalized scalar 0..1 to RGB based on chosen colormap
export function getColormapRGB(value: number, map: ColormapType = 'jet'): [number, number, number] {
  const v = Math.max(0, Math.min(1, value));

  if (map === 'jet') {
    // Standard Jet colormap (Blue -> Cyan -> Green -> Yellow -> Red)
    let r = 0;
    let g = 0;
    let b = 0;

    if (v < 0.125) {
      r = 0;
      g = 0;
      b = 0.5 + 4 * v;
    } else if (v < 0.375) {
      r = 0;
      g = 4 * (v - 0.125);
      b = 1;
    } else if (v < 0.625) {
      r = 4 * (v - 0.375);
      g = 1;
      b = 1 - 4 * (v - 0.375);
    } else if (v < 0.875) {
      r = 1;
      g = 1 - 4 * (v - 0.625);
      b = 0;
    } else {
      r = 1 - 4 * (v - 0.875) * 0.5;
      g = 0;
      b = 0;
    }

    return [
      Math.round(Math.max(0, Math.min(1, r)) * 255),
      Math.round(Math.max(0, Math.min(1, g)) * 255),
      Math.round(Math.max(0, Math.min(1, b)) * 255),
    ];
  }

  if (map === 'hot') {
    // Black -> Red -> Orange -> Yellow -> White
    let r = Math.min(1, v * 3);
    let g = v > 0.33 ? Math.min(1, (v - 0.33) * 3) : 0;
    let b = v > 0.66 ? Math.min(1, (v - 0.66) * 3) : 0;
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  if (map === 'viridis') {
    // Viridis approximation
    const r = Math.round((0.267 + 0.7 * v) * 255);
    const g = Math.round((0.004 + 0.8 * Math.sin(v * Math.PI)) * 255);
    const b = Math.round((0.329 + 0.6 * (1 - v)) * 255);
    return [r, g, b];
  }

  // Turbo approximation
  const r = Math.round((0.13 + 0.8 * Math.sin(v * Math.PI * 0.8)) * 255);
  const g = Math.round((0.15 + 0.75 * Math.sin(v * Math.PI)) * 255);
  const b = Math.round((0.45 + 0.5 * Math.cos(v * Math.PI * 0.7)) * 255);
  return [r, g, b];
}

// Generate realistic simulated clinical ultrasound canvas
export function renderRealisticUltrasound(
  canvas: HTMLCanvasElement,
  plane: AnatomicalPlane,
  width: number = 360,
  height: number = 360,
  anomalyFocalPoint?: { x: number; y: number }
): void {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background acoustic void
  ctx.fillStyle = '#05070B';
  ctx.fillRect(0, 0, width, height);

  // Sector probe geometry (curvilinear probe beam cone)
  const probeApexX = width / 2;
  const probeApexY = -height * 0.25;
  const startAngle = Math.PI * 0.32;
  const endAngle = Math.PI * 0.68;
  const minRadius = height * 0.35;
  const maxRadius = height * 1.15;

  ctx.save();
  ctx.beginPath();
  ctx.arc(probeApexX, probeApexY, maxRadius, startAngle, endAngle);
  ctx.arc(probeApexX, probeApexY, minRadius, endAngle, startAngle, true);
  ctx.closePath();
  ctx.clip();

  // Create ultrasound tissue base with attenuation gradient
  const bgGrad = ctx.createRadialGradient(probeApexX, probeApexY, minRadius, probeApexX, probeApexY, maxRadius);
  bgGrad.addColorStop(0, '#151d28');
  bgGrad.addColorStop(0.5, '#1e293b');
  bgGrad.addColorStop(1, '#0b0f19');
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Draw procedural acoustic speckle noise
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Pseudo-random seeded speckle
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      const speckle = (Math.random() - 0.5) * 45;
      data[i] = Math.max(0, Math.min(255, data[i] + speckle));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + speckle));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + speckle));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Anatomical structures based on plane
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';

  if (plane === 'Fetal_Brain') {
    // Biparietal diameter (BPD) oval calvarium
    const cx = width / 2;
    const cy = height * 0.52;
    const rx = width * 0.32;
    const ry = height * 0.25;

    // Skull bone rim (hyperechoic)
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Midline falx cerebri
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.85, cy);
    ctx.lineTo(cx + rx * 0.85, cy);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Choroid plexus / lateral ventricles
    ctx.fillStyle = '#0f172a'; // anechoic ventricle fluid
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.35, cy - ry * 0.3, rx * 0.22, ry * 0.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx + rx * 0.35, cy - ry * 0.3, rx * 0.22, ry * 0.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Caliper measurement dots
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - rx - 2, cy - 2, 5, 5);
    ctx.fillRect(cx + rx - 2, cy - 2, 5, 5);
  } else if (plane === 'Fetal_Abdomen') {
    // Abdominal circumference (AC) round profile
    const cx = width / 2;
    const cy = height * 0.54;
    const r = width * 0.28;

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#f1f5f9';
    ctx.stroke();

    // Stomach bubble (anechoic fluid pocket)
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(cx - r * 0.42, cy - r * 0.15, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Umbilical vein "J" shape
    ctx.beginPath();
    ctx.arc(cx + r * 0.1, cy + r * 0.2, r * 0.28, Math.PI * 0.8, Math.PI * 1.5);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#94a3b8';
    ctx.stroke();

    // Spine posterior acoustic shadow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + r * 0.7, cy - r * 0.3, 10, 0, Math.PI * 2);
    ctx.fill();

    // Acoustic shadow cone behind spine
    ctx.fillStyle = '#05070b';
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.7 - 8, cy - r * 0.3);
    ctx.lineTo(cx + r * 0.7 + 8, cy - r * 0.3);
    ctx.lineTo(width, height);
    ctx.lineTo(cx + r * 0.7 - 25, height);
    ctx.closePath();
    ctx.fill();
  } else if (plane === 'Fetal_Femur') {
    // Femur length measurement diaphysis
    const cx = width / 2;
    const cy = height * 0.55;

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.28, cy - height * 0.08);
    ctx.lineTo(cx + width * 0.28, cy + height * 0.08);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Acoustic shadow behind bone
    ctx.fillStyle = '#06090e';
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.28, cy - height * 0.08 + 5);
    ctx.lineTo(cx + width * 0.28, cy + height * 0.08 + 5);
    ctx.lineTo(cx + width * 0.35, height);
    ctx.lineTo(cx - width * 0.35, height);
    ctx.closePath();
    ctx.fill();

    // Crosshair calipers at distal and proximal epiphyseal ends
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    const drawCaliper = (x: number, y: number) => {
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + 6, y);
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y + 6);
      ctx.stroke();
    };
    drawCaliper(cx - width * 0.28, cy - height * 0.08);
    drawCaliper(cx + width * 0.28, cy + height * 0.08);
  } else {
    // Thorax / Heart 4-chamber or other general anatomy
    const cx = width / 2;
    const cy = height * 0.52;
    const r = width * 0.3;

    ctx.shadowColor = '#cbd5e1';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Cardiac chambers
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.ellipse(cx - 15, cy - 10, 22, 16, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 15, cy - 8, 22, 16, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - 12, cy + 20, 18, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 14, cy + 22, 18, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Interventricular septum
    ctx.beginPath();
    ctx.moveTo(cx, cy - 25);
    ctx.lineTo(cx, cy + 35);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#94a3b8';
    ctx.stroke();
  }

  // Draw localized acoustic soft marker if focal point specified
  if (anomalyFocalPoint) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(anomalyFocalPoint.x, anomalyFocalPoint.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // Clinical telemetry overlay (Ultrasound instrument HUD)
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
  ctx.fillText('AURA-MFM v2.4 // PROBE: C5-1 [3.5 MHz]', 14, 20);
  ctx.fillText(`PLANE: ${plane.toUpperCase()}`, 14, 34);
  ctx.fillText('MI: 0.8  TIS: 0.3  DR: 65dB  FPS: 32', 14, 48);

  ctx.textAlign = 'right';
  ctx.fillText('GAIN: 58%', width - 14, 20);
  ctx.fillText('DEPTH: 14.2 cm', width - 14, 34);
  ctx.fillText('TGC: AUTO-COMP', width - 14, 48);

  // Depth ruler on right side
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.lineWidth = 1;
  const startRulerY = height * 0.2;
  const endRulerY = height * 0.9;
  ctx.beginPath();
  ctx.moveTo(width - 8, startRulerY);
  ctx.lineTo(width - 8, endRulerY);
  ctx.stroke();

  for (let cm = 0; cm <= 10; cm++) {
    const y = startRulerY + ((endRulerY - startRulerY) / 10) * cm;
    ctx.beginPath();
    ctx.moveTo(width - (cm % 5 === 0 ? 14 : 10), y);
    ctx.lineTo(width - 8, y);
    ctx.stroke();
  }
}

// Generate the 3-Panel Visual Outputs:
// 1. Original Scan (normalized)
// 2. Grad-CAM Jet Heatmap Overlay
// 3. Anomaly Bounding Box (60% threshold contour)
export function computeGradCamAndBBox(
  sourceCanvas: HTMLCanvasElement,
  focalCenter: { x: number; y: number },
  focalRadius: number = 55,
  colormap: ColormapType = 'jet',
  heatmapOpacity: number = 0.55,
  thresholdPct: number = 0.60
): {
  overlayDataUrl: string;
  bboxDataUrl: string;
  bbox: BoundingBox;
  peakIntensity: number;
} {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  // 1. Generate 2D Gaussian activation matrix representing deepest conv block hook (last_conv_layer)
  const activationMap: number[][] = [];
  let maxActivation = 0;

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const dx = x - focalCenter.x;
      const dy = y - focalCenter.y;
      const distSq = dx * dx + dy * dy;
      // 2D Gaussian bell curve
      const act = Math.exp(-distSq / (2 * focalRadius * focalRadius));
      row.push(act);
      if (act > maxActivation) {
        maxActivation = act;
      }
    }
    activationMap.push(row);
  }

  // 2. Create Panel 2: Grad-CAM Overlay Canvas
  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const overlayCtx = overlayCanvas.getContext('2d')!;

  // Copy original image
  overlayCtx.drawImage(sourceCanvas, 0, 0);

  // Overlay Jet Heatmap
  const overlayImgData = overlayCtx.getImageData(0, 0, width, height);
  const data = overlayImgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const rawVal = activationMap[y][x] / (maxActivation || 1);

      if (rawVal > 0.05) {
        const [hr, hg, hb] = getColormapRGB(rawVal, colormap);
        const alpha = Math.min(1, rawVal * 1.2) * heatmapOpacity;

        // Alpha blend: C = (1 - a)*orig + a*heat
        data[idx] = Math.round((1 - alpha) * data[idx] + alpha * hr);
        data[idx + 1] = Math.round((1 - alpha) * data[idx + 1] + alpha * hg);
        data[idx + 2] = Math.round((1 - alpha) * data[idx + 2] + alpha * hb);
      }
    }
  }
  overlayCtx.putImageData(overlayImgData, 0, 0);

  // 3. Create Panel 3: Anomaly Bounding Box Canvas
  const bboxCanvas = document.createElement('canvas');
  bboxCanvas.width = width;
  bboxCanvas.height = height;
  const bboxCtx = bboxCanvas.getContext('2d')!;
  bboxCtx.drawImage(sourceCanvas, 0, 0);

  // Calculate 60% activation contour bounding box
  const threshVal = maxActivation * thresholdPct;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasContours = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (activationMap[y][x] >= threshVal) {
        hasContours = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Fallback box if threshold missed
  let bbox: BoundingBox;
  if (hasContours && maxX > minX && maxY > minY) {
    // Add 8px margin
    minX = Math.max(10, minX - 8);
    minY = Math.max(10, minY - 8);
    maxX = Math.min(width - 10, maxX + 8);
    maxY = Math.min(height - 10, maxY + 8);
    bbox = {
      x: Math.round(minX),
      y: Math.round(minY),
      width: Math.round(maxX - minX),
      height: Math.round(maxY - minY),
    };
  } else {
    bbox = {
      x: Math.round(focalCenter.x - focalRadius * 0.7),
      y: Math.round(focalCenter.y - focalRadius * 0.7),
      width: Math.round(focalRadius * 1.4),
      height: Math.round(focalRadius * 1.4),
    };
  }

  // Draw bounding rectangle & clinical ROI marker
  bboxCtx.save();
  // Semi-transparent ROI fill
  bboxCtx.fillStyle = 'rgba(249, 115, 22, 0.12)';
  bboxCtx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);

  // Vibrant border
  bboxCtx.strokeStyle = '#f97316';
  bboxCtx.lineWidth = 2.5;
  bboxCtx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

  // Corner crosshairs
  const chLen = 8;
  bboxCtx.strokeStyle = '#38bdf8';
  bboxCtx.lineWidth = 2;
  // Top left
  bboxCtx.beginPath();
  bboxCtx.moveTo(bbox.x, bbox.y + chLen);
  bboxCtx.lineTo(bbox.x, bbox.y);
  bboxCtx.lineTo(bbox.x + chLen, bbox.y);
  // Top right
  bboxCtx.moveTo(bbox.x + bbox.width - chLen, bbox.y);
  bboxCtx.lineTo(bbox.x + bbox.width, bbox.y);
  bboxCtx.lineTo(bbox.x + bbox.width, bbox.y + chLen);
  // Bottom left
  bboxCtx.moveTo(bbox.x, bbox.y + bbox.height - chLen);
  bboxCtx.lineTo(bbox.x, bbox.y + bbox.height);
  bboxCtx.lineTo(bbox.x + chLen, bbox.y + bbox.height);
  // Bottom right
  bboxCtx.moveTo(bbox.x + bbox.width - chLen, bbox.y + bbox.height);
  bboxCtx.lineTo(bbox.x + bbox.width, bbox.y + bbox.height);
  bboxCtx.lineTo(bbox.x + bbox.width, bbox.y + bbox.height - chLen);
  bboxCtx.stroke();

  // Label badge
  const labelText = `ROI Peak ${(maxActivation * 100).toFixed(0)}%`;
  bboxCtx.font = 'bold 11px "JetBrains Mono", monospace';
  const textWidth = bboxCtx.measureText(labelText).width;
  const labelY = Math.max(22, bbox.y - 6);

  bboxCtx.fillStyle = '#f97316';
  bboxCtx.fillRect(bbox.x, labelY - 14, textWidth + 12, 16);

  bboxCtx.fillStyle = '#ffffff';
  bboxCtx.fillText(labelText, bbox.x + 6, labelY - 2);
  bboxCtx.restore();

  return {
    overlayDataUrl: overlayCanvas.toDataURL('image/jpeg', 0.9),
    bboxDataUrl: bboxCanvas.toDataURL('image/jpeg', 0.9),
    bbox,
    peakIntensity: maxActivation,
  };
}
