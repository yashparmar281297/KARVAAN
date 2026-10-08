// Projects [lat, lng] waypoints into an SVG viewBox (equirectangular with
// cos(lat) correction — accurate enough at route scale) and smooths them
// into a Catmull-Rom curve so routes read like roads, not polylines.

export interface Projected {
  width: number;
  height: number;
  points: [number, number][];
  project: (lat: number, lng: number) => [number, number];
  d: string;
}

export function projectPath(path: [number, number][], width = 800, height = 500, pad = 48): Projected {
  const lat0 = path.reduce((s, p) => s + p[0], 0) / path.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const xs = path.map((p) => p[1] * k);
  const ys = path.map((p) => -p[0]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const spanX = maxX - minX || 1e-6;
  const spanY = maxY - minY || 1e-6;
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  const project = (lat: number, lng: number): [number, number] => [
    +(offX + (lng * k - minX) * scale).toFixed(2),
    +(offY + (-lat - minY) * scale).toFixed(2),
  ];
  const points = path.map(([la, ln]) => project(la, ln));
  return { width, height, points, project, d: smooth(points) };
}

export function smooth(pts: [number, number][], tension = 0.5) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Elevation samples → area path for a profile chart. */
export function elevationPath(samples: number[], width: number, height: number) {
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const span = max - min || 1;
  const pts = samples.map((e, i): [number, number] => [
    +((i / (samples.length - 1)) * width).toFixed(2),
    +(height - 6 - ((e - min) / span) * (height - 16)).toFixed(2),
  ]);
  const line = smooth(pts, 0.4);
  return { line, area: `${line} L${width},${height} L0,${height} Z`, min, max };
}
