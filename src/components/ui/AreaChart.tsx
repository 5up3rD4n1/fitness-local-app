import React from 'react';

interface AreaChartProps {
  /** y-values; scaled to the max (min 1) */
  data: number[];
  labels?: string[];
  height?: number;
  className?: string;
}

/** Smooth SVG area + line chart: flat accent fill, solid line. Offline, no deps. */
const AreaChart: React.FC<AreaChartProps> = ({ data, labels, height = 150, className = '' }) => {
  const W = 340;
  const H = 130;
  const pad = 8;
  const max = Math.max(...data, 1);
  const n = data.length;

  const pts = data.map((v, i) => {
    const x = n <= 1 ? W / 2 : (i / (n - 1)) * W;
    const y = H - pad - (v / max) * (H - pad * 2);
    return [x, y] as const;
  });

  const line = pts.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`;
    const prev = arr[i - 1];
    const cx = (prev[0] + p[0]) / 2;
    return `${acc} C ${cx} ${prev[1]}, ${cx} ${p[1]}, ${p[0]} ${p[1]}`;
  }, '');
  const area = pts.length ? `${line} L ${pts[n - 1][0]} ${H} L ${pts[0][0]} ${H} Z` : '';

  return (
    <div className={className}>
      <svg width="100%" height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[pad, H / 2, H - pad].map((y) => (
          <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="#23272f" strokeWidth="1" />
        ))}
        {area && <path d={area} fill="rgba(91,140,255,0.10)" />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke="#5b8cff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {pts.length > 0 && (
          <circle
            cx={pts[n - 1][0]}
            cy={pts[n - 1][1]}
            r="4"
            fill="#5b8cff"
            stroke="#0b0d11"
            strokeWidth="2.5"
          />
        )}
      </svg>
      {labels && (
        <div className="mt-2 flex justify-between">
          {labels.map((l, i) => (
            <span key={i} className="text-micro flex-1 text-center text-text-tertiary">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AreaChart;
