import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PricePoint, Signal } from '../types';

const cents = (p: number) => `${Math.round(p * 100)}¢`;

const dayLabel = (t: number) =>
  new Date(t * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const timeLabel = (t: number) =>
  new Date(t * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/** Nearest price to a timestamp, for anchoring anomaly markers on the line. */
function priceAt(points: PricePoint[], t: number): number | null {
  if (points.length === 0) return null;
  let best = points[0];
  for (const pt of points) {
    if (Math.abs(pt.t - t) < Math.abs(best.t - t)) best = pt;
  }
  return best.p;
}

const ChartTooltip: React.FC<{ active?: boolean; payload?: { payload: PricePoint }[] }> = ({
  active,
  payload,
}) => {
  if (!active || !payload?.length) return null;
  const { t, p } = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2 text-xs shadow-lg">
      <div className="text-[#898781]">{timeLabel(t)}</div>
      <div className="mt-0.5 font-medium text-white">YES {cents(p)}</div>
    </div>
  );
};

/** 7-day YES price line with anomaly markers at signal timestamps. */
const PriceChart: React.FC<{ data: PricePoint[]; signals?: Signal[] }> = ({
  data,
  signals = [],
}) => {
  if (data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[#898781]">
        No price history available
      </div>
    );
  }

  // One marker per distinct anomaly moment (several signals can share one burst).
  const markerTs = [...new Set(signals.map((s) => Math.round(s.timestamp / 1800) * 1800))];

  return (
    <div className="h-40 w-full" role="img" aria-label="YES price over the last 7 days">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#2c2c2a" strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={dayLabel}
            tickCount={5}
            tick={{ fill: '#898781', fontSize: 11 }}
            axisLine={{ stroke: '#383835' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={cents}
            width={36}
            tick={{ fill: '#898781', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#52514e', strokeDasharray: '3 3' }} />
          <Line
            type="monotone"
            dataKey="p"
            stroke="#3987e5"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {markerTs.map((t) => {
            const p = priceAt(data, t);
            if (p === null) return null;
            return (
              <ReferenceDot
                key={t}
                x={t}
                y={p}
                r={5}
                fill="#d03b3b"
                stroke="#1a1a19"
                strokeWidth={2}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
