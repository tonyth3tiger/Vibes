import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TaxResult, TaxStrategy } from '../types';

interface Props {
  result: TaxResult;
  strategies: TaxStrategy[];
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'];

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export const TaxBreakdown: React.FC<Props> = ({ result, strategies }) => {
  const totalStrategySavings = strategies.reduce((sum, s) => sum + s.estimatedSavings, 0);
  const optimizedTax = Math.max(0, result.totalTax - totalStrategySavings);

  const pieData = result.breakdown
    .filter(item => item.amount > 0)
    .map(item => ({ name: item.label, value: Math.round(item.amount) }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-stone-200 rounded-lg shadow-lg px-4 py-3 text-sm">
          <p className="font-semibold text-stone-800">{payload[0].name}</p>
          <p className="text-stone-600">{fmt(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* Key Figures */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Total Income</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{fmt(result.totalIncome)}</p>
          {result.rsuIncome > 0 && (
            <p className="text-xs text-stone-400 mt-0.5">incl. {fmt(result.rsuIncome)} RSU</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Est. Total Tax</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{fmt(result.totalTax)}</p>
          <p className="text-xs text-stone-400 mt-0.5">effective rate {pct(result.effectiveRate)}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Marginal Rate</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{result.marginalRateLabel}</p>
          <p className="text-xs text-stone-400 mt-0.5">federal bracket</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Potential Savings</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{fmt(totalStrategySavings)}</p>
          <p className="text-xs text-emerald-600 mt-0.5">across all strategies</p>
        </div>
      </div>

      {/* Tax Breakdown Pie + Before/After Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Pie Chart */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h3 className="text-sm font-bold text-stone-700 mb-4">Tax Breakdown by Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-stone-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Before / After */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h3 className="text-sm font-bold text-stone-700 mb-4">Before vs. After Strategies</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-stone-500 mb-1">
                <span>Current (no changes)</span>
                <span className="font-semibold text-red-600">{fmt(result.totalTax)}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-5">
                <div className="bg-red-400 h-5 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-stone-500 mb-1">
                <span>After all strategies</span>
                <span className="font-semibold text-emerald-600">{fmt(optimizedTax)}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-5">
                <div
                  className="bg-emerald-500 h-5 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(5, (optimizedTax / result.totalTax) * 100)}%` }}
                />
              </div>
            </div>
            <div className="border-t border-stone-100 pt-3 mt-3">
              <p className="text-center text-sm text-stone-600">
                Implementing all strategies could save you{' '}
                <span className="font-bold text-emerald-700">{fmt(totalStrategySavings)}</span> annually.
              </p>
            </div>
          </div>

          {/* State local tax note */}
          {result.stateHasLocalTax && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Note:</strong> {result.stateLocalTaxNote}. This is not included in the estimate above.
            </div>
          )}
        </div>
      </div>

      {/* Withholding gap alert */}
      {result.rsuWithholdingGap > 500 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <div className="text-red-500 shrink-0 mt-0.5">⚠</div>
          <div>
            <p className="text-sm font-bold text-red-700">RSU Withholding Gap: ~{fmt(result.rsuWithholdingGap)}</p>
            <p className="text-xs text-red-600 mt-0.5">
              Your employer likely withheld only 22% on RSU income. At your {result.marginalRateLabel} marginal rate,
              you may owe additional federal tax when you file. Consider making an estimated tax payment to avoid penalties.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
