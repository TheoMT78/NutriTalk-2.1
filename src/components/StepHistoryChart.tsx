import React from 'react';

interface StepPoint {
  label: string;
  value: number;
}

interface StepHistoryChartProps {
  data: StepPoint[];
  className?: string;
  ticks?: { index: number; label: string }[];
  mode: 'steps' | 'water';
}

const StepHistoryChart: React.FC<StepHistoryChartProps> = ({ data, className = '', ticks, mode }) => {
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Aucune donnée</p>
      </div>
    );
  }

  const width = 260;
  const height = 100;
  const marginLeft = 30;
  const marginTop = 10;
  const innerWidth = width - marginLeft;
  const maxVal = Math.max(...data.map(d => d.value));
  const barWidth = innerWidth / data.length;
  const avg = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  const computeStepTicks = (max: number) => {
    if (max <= 10000) return [0, 2000, 4000, 6000, 8000, 10000];
    if (max <= 15000) return [0, 5000, 10000, 15000];
    if (max <= 20000) return [0, 10000, 20000];
    if (max <= 30000) return [0, 10000, 20000, 30000];
    return [0, 10000, 20000, 30000, 40000];
  };

  const computeWaterTicks = (max: number) => {
    if (max <= 4000) return [0, 1000, 2000, 3000, 4000];
    const top = Math.max(6000, Math.ceil(max / 2000) * 2000);
    const arr = [] as number[];
    for (let v = 0; v <= top; v += 2000) arr.push(v);
    return arr;
  };

  const yTicks = mode === 'steps' ? computeStepTicks(maxVal) : computeWaterTicks(maxVal);
  const maxTick = yTicks[yTicks.length - 1] || maxVal;

  return (
    <div className={className}>
      <svg width={width} height={height + marginTop + 20} className="mx-auto">
        {/* axes */}
        <line
          x1={marginLeft}
          y1={marginTop + height}
          x2={width}
          y2={marginTop + height}
          className="stroke-gray-300 dark:stroke-gray-600"
        />
        {yTicks.map((val, i) => (
          <g key={i}>
            <line
              x1={marginLeft}
              y1={marginTop + height - (val / maxTick) * height}
              x2={width}
              y2={marginTop + height - (val / maxTick) * height}
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth={0.5}
            />
            <text
              x={marginLeft - 2}
              y={marginTop + height - (val / maxTick) * height}
              textAnchor="end"
              dominantBaseline="central"
              className="text-[10px] fill-current"
            >
              {Math.round(val)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const barHeight = (d.value / maxTick) * height;
          const x = marginLeft + i * barWidth + barWidth * 0.1;
          const y = marginTop + height - barHeight;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth * 0.8}
                height={barHeight}
                className="fill-teal-500"
              />
            </g>
          );
        })}
        {/* x-axis ticks */}
        {(ticks ?? data.map((d, i) => ({ index: i, label: d.label }))).map(t => (
          <g key={t.index}>
            <line
              x1={marginLeft + (t.index + 0.5) * barWidth}
              y1={marginTop + height}
              x2={marginLeft + (t.index + 0.5) * barWidth}
              y2={marginTop + height + 4}
              className="stroke-gray-400"
              strokeWidth={0.5}
            />
            <text
              x={marginLeft + (t.index + 0.5) * barWidth}
              y={marginTop + height + 12}
              textAnchor="middle"
              className="text-[10px] fill-current"
            >
              {t.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
        Moyenne {Math.round(avg)}
      </p>
    </div>
  );
};

export default StepHistoryChart;
