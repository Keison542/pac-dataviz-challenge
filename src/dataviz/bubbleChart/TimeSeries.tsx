// src/dataviz/bubbleChart/TimeSeries.tsx
"use client";

import { scaleLinear } from "d3-scale";
import { line, curveCardinal, area } from "d3-shape";
import { useMemo, useState } from "react";

type DataPoint = {
  year: number;
  cropYield: number;
  livestockYield: number;
  touristArrivals: number;
};

type Props = {
  width: number;
  height: number;
  data: DataPoint[];
  selectedCountry: string;
  title?: string;
  insight?: string;
};

const MARGIN = { top: 70, right: 130, bottom: 100, left: 100 };

const METRICS = [
  {
    key: "cropYield",
    label: "Crop Yield",
    unit: "t/ha",
    color: "#10b981",
    lightColor: "#6ee7b7",
    icon: "🌾",
    format: (v: number) => v.toFixed(1),
    formatCompact: (v: number) => v.toFixed(1),
  },
  {
    key: "livestockYield",
    label: "Livestock",
    unit: "tons",
    color: "#f59e0b",
    lightColor: "#fcd34d",
    icon: "🐄",
    format: (v: number) => v.toLocaleString(),
    formatCompact: (v: number) =>
      v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString(),
  },
  {
    key: "touristArrivals",
    label: "Tourist Arrivals",
    unit: "",
    color: "#14b8a6",
    lightColor: "#5eead4",
    icon: "✈️",
    format: (v: number) =>
      v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString(),
    formatCompact: (v: number) =>
      v >= 1_000_000
        ? `${(v / 1_000_000).toFixed(1)}M`
        : v >= 1000
        ? `${(v / 1000).toFixed(0)}K`
        : v.toString(),
  },
];

export function TimeSeriesDashboard({
  width,
  height,
  data,
  selectedCountry,
  title = "Climate & Socioeconomic Trends",
  insight = "Track crop yields, livestock production, and tourist arrivals over time.",
}: Props) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    metric: string;
    year: number;
    value: number;
  } | null>(null);
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(METRICS.map((m) => m.key))
  );

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const toggleMetric = (key: string) => {
    const newVisible = new Set(visibleMetrics);
    if (newVisible.has(key)) {
      newVisible.delete(key);
    } else {
      newVisible.add(key);
    }
    setVisibleMetrics(newVisible);
  };

  // Calculate series data with safe value handling
  const seriesData = useMemo(() => {
    return METRICS.map((metric) => {
      const values = data.map(
        (d) => d[metric.key as keyof DataPoint] as number
      );
      
      if (values.length === 0) {
        return {
          ...metric,
          values: [],
          total: 0,
          average: 0,
          max: 0,
          maxYear: 0,
          min: 0,
          minYear: 0,
          growthRate: 0,
        };
      }

      const total = values.reduce((a, b) => a + b, 0);
      const average = total / values.length;
      
      let max = -Infinity;
      let maxIndex = -1;
      let min = Infinity;
      let minIndex = -1;
      
      values.forEach((v, i) => {
        if (v > max) {
          max = v;
          maxIndex = i;
        }
        if (v < min) {
          min = v;
          minIndex = i;
        }
      });
      
      const maxYear = maxIndex !== -1 ? data[maxIndex]?.year || 0 : 0;
      const minYear = minIndex !== -1 ? data[minIndex]?.year || 0 : 0;
      
      const first = values[0] || 0;
      const last = values[values.length - 1] || 0;
      const growthRate = first !== 0 ? ((last - first) / first) * 100 : 0;

      return {
        ...metric,
        values,
        total,
        average,
        max: max === -Infinity ? 0 : max,
        maxYear,
        min: min === Infinity ? 0 : min,
        minYear,
        growthRate,
      };
    });
  }, [data]);

  // X scale
  const xScale = useMemo(() => {
    const years = data.map((d) => d.year);
    if (years.length === 0) return () => 0;
    return scaleLinear()
      .domain([Math.min(...years), Math.max(...years)])
      .range([0, boundsWidth]);
  }, [data, boundsWidth]);

  // Y scale
  const yScale = useMemo(() => {
    let maxValue = 0;
    data.forEach((d) => {
      METRICS.forEach((metric) => {
        if (visibleMetrics.has(metric.key)) {
          const value = d[metric.key as keyof DataPoint] as number;
          if (value > maxValue) maxValue = value;
        }
      });
    });
    return scaleLinear()
      .domain([0, maxValue * 1.1 || 1])
      .range([boundsHeight, 0])
      .nice();
  }, [data, boundsHeight, visibleMetrics]);

  // Line paths
  const linePaths = useMemo(() => {
    const paths: Record<string, string> = {};
    METRICS.forEach((metric) => {
      if (!visibleMetrics.has(metric.key)) return;

      const lineGenerator = line<DataPoint>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d[metric.key as keyof DataPoint] as number))
        .curve(curveCardinal.tension(0.7));

      paths[metric.key] = lineGenerator(data) || "";
    });
    return paths;
  }, [data, xScale, yScale, visibleMetrics]);

  // Area paths
  const areaPaths = useMemo(() => {
    const paths: Record<string, string> = {};
    METRICS.forEach((metric) => {
      if (!visibleMetrics.has(metric.key)) return;

      const areaGenerator = area<DataPoint>()
        .x((d) => xScale(d.year))
        .y0(boundsHeight)
        .y1((d) => yScale(d[metric.key as keyof DataPoint] as number))
        .curve(curveCardinal.tension(0.7));

      paths[metric.key] = areaGenerator(data) || "";
    });
    return paths;
  }, [data, xScale, yScale, boundsHeight, visibleMetrics]);

  // X-axis ticks by decade
  const xAxisTicks = useMemo(() => {
    const years = data.map((d) => d.year);
    if (years.length === 0) return [];
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const startDecade = Math.floor(minYear / 10) * 10;
    const endDecade = Math.floor(maxYear / 10) * 10;
    const decades: number[] = [];
    for (let year = startDecade; year <= endDecade + 10; year += 10) {
      if (year >= minYear - 5 && year <= maxYear + 5) {
        decades.push(year);
      }
    }
    const allTicks = new Set([...decades]);
    if (!decades.includes(minYear)) allTicks.add(minYear);
    if (!decades.includes(maxYear)) allTicks.add(maxYear);
    return Array.from(allTicks).sort((a, b) => a - b);
  }, [data]);

  // Y-axis ticks
  const yAxisTicks = useMemo(() => {
    const maxValue = yScale.domain()[1];
    const step = maxValue / 4;
    const ticks: number[] = [];
    for (let i = 0; i <= 4; i++) {
      ticks.push(Number((i * step).toFixed(2)));
    }
    return ticks;
  }, [yScale]);

  const formatYAxis = (value: number): string => {
    if (value === 0) return "0";
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    if (value >= 100) return value.toFixed(0);
    if (value >= 10) return value.toFixed(1);
    return value.toFixed(2);
  };

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
  };

  const totalCropYield = seriesData.find((m) => m.key === "cropYield")?.total || 0;
  const totalLivestock = seriesData.find((m) => m.key === "livestockYield")?.total || 0;
  const totalTourist = seriesData.find((m) => m.key === "touristArrivals")?.total || 0;

  const peakCrop = seriesData.find((m) => m.key === "cropYield")?.max || 0;
  const peakLivestock = seriesData.find((m) => m.key === "livestockYield")?.max || 0;
  const peakTourist = seriesData.find((m) => m.key === "touristArrivals")?.max || 0;

  const peakCropYear = seriesData.find((m) => m.key === "cropYield")?.maxYear || 0;
  const peakLivestockYear = seriesData.find((m) => m.key === "livestockYield")?.maxYear || 0;
  const peakTouristYear = seriesData.find((m) => m.key === "touristArrivals")?.maxYear || 0;

  if (!data.length) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30">📈</div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Key Findings Summary Cards */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <div className="text-lg font-bold text-emerald-700">
            {formatNumber(totalCropYield)} t/ha
          </div>
          <div className="text-xs text-slate-500">total crop yield</div>
          <div className="text-[10px] text-slate-400">
            Peak: {formatNumber(peakCrop)} t/ha ({peakCropYear})
          </div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-lg font-bold text-amber-700">
            {formatNumber(totalLivestock)} tons
          </div>
          <div className="text-xs text-slate-500">total livestock</div>
          <div className="text-[10px] text-slate-400">
            Peak: {formatNumber(peakLivestock)} tons ({peakLivestockYear})
          </div>
        </div>
        <div className="text-center p-2 bg-teal-50 rounded-lg">
          <div className="text-lg font-bold text-teal-700">
            {formatNumber(totalTourist)}
          </div>
          <div className="text-xs text-slate-500">total tourist arrivals</div>
          <div className="text-[10px] text-slate-400">
            Peak: {formatNumber(peakTourist)} ({peakTouristYear})
          </div>
        </div>
      </div>

      {/* Legend - Interactive */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
        {METRICS.map((metric) => {
          const isVisible = visibleMetrics.has(metric.key);
          const metricData = seriesData.find((m) => m.key === metric.key);

          return (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isVisible ? "shadow-sm" : "opacity-50 grayscale"
              }`}
              style={{
                backgroundColor: isVisible ? `${metric.color}15` : "#f1f5f9",
                color: isVisible ? metric.color : "#64748b",
                border: `1px solid ${isVisible ? metric.color : "#e2e8f0"}`,
              }}
            >
              <span className="text-sm">{metric.icon}</span>
              <span>{metric.label}</span>
              {metricData && isVisible && (
                <span className="text-[10px] opacity-75">
                  {metricData.growthRate > 0
                    ? "↑"
                    : metricData.growthRate < 0
                    ? "↓"
                    : "→"}{" "}
                  {Math.abs(metricData.growthRate).toFixed(0)}%
                </span>
              )}
              {isVisible && (
                <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            {METRICS.map((metric) => (
              <linearGradient
                key={`gradient-${metric.key}`}
                id={`areaGradient-${metric.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={metric.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={metric.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* Y-axis Grid Lines */}
            {yAxisTicks.map((v, i) => (
              <line
                key={`grid-y-${i}`}
                x1={0}
                x2={boundsWidth}
                y1={yScale(v)}
                y2={yScale(v)}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* X-axis Grid Lines */}
            {xAxisTicks.map((year, i) => (
              <line
                key={`grid-x-${i}`}
                x1={xScale(year)}
                x2={xScale(year)}
                y1={0}
                y2={boundsHeight}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Areas under curves */}
            {METRICS.map((metric) => {
              if (!visibleMetrics.has(metric.key)) return null;
              return (
                <path
                  key={`area-${metric.key}`}
                  d={areaPaths[metric.key]}
                  fill={`url(#areaGradient-${metric.key})`}
                  opacity="0.3"
                />
              );
            })}

            {/* Trend Lines */}
            {METRICS.map((metric) => {
              if (!visibleMetrics.has(metric.key)) return null;
              const isHovered = hoveredMetric === metric.key;
              return (
                <path
                  key={`line-${metric.key}`}
                  d={linePaths[metric.key]}
                  fill="none"
                  stroke={metric.color}
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={isHovered ? "url(#glow)" : "none"}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredMetric(metric.key)}
                  onMouseLeave={() => setHoveredMetric(null)}
                />
              );
            })}

            {/* Data points */}
            {data.map((point, idx) => (
              <g key={`point-group-${idx}`}>
                {METRICS.map((metric) => {
                  if (!visibleMetrics.has(metric.key)) return null;
                  const value = point[metric.key as keyof DataPoint] as number;
                  const cx = xScale(point.year);
                  const cy = yScale(value);
                  const isActive =
                    hoveredPoint?.metric === metric.key &&
                    hoveredPoint?.year === point.year;
                  const isMax =
                    value === seriesData.find((m) => m.key === metric.key)?.max &&
                    value > 0;
                  const pointRadius = isMax ? 6 : isActive ? 8 : 4.5;

                  if (value === 0) return null;

                  return (
                    <g key={`point-${metric.key}-${point.year}`}>
                      {isMax && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={pointRadius + 3}
                          fill="none"
                          stroke={metric.color}
                          strokeWidth="1.5"
                          opacity="0.3"
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={pointRadius}
                        fill={metric.color}
                        stroke="#fff"
                        strokeWidth={2.5}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredPoint({
                            metric: metric.key,
                            year: point.year,
                            value,
                          })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {isMax && (
                        <text
                          x={cx}
                          y={cy - 12}
                          textAnchor="middle"
                          fontSize="9"
                          fill={metric.color}
                          fontWeight="bold"
                          className="select-none"
                        >
                          {metric.formatCompact(value)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            ))}

            {/* X-axis labels */}
            {xAxisTicks.map((year, i) => {
              const isDecade = year % 10 === 0;
              const label = isDecade ? `${year}s` : year.toString();

              return (
                <g key={`x-axis-${i}`}>
                  <line
                    x1={xScale(year)}
                    y1={boundsHeight}
                    x2={xScale(year)}
                    y2={boundsHeight + 5}
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <text
                    x={xScale(year)}
                    y={boundsHeight + 20}
                    textAnchor="middle"
                    fontSize={isDecade ? "11" : "10"}
                    fill={isDecade ? "#1e293b" : "#64748b"}
                    fontWeight={isDecade ? "600" : "400"}
                    className="select-none"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Y-axis labels */}
            {yAxisTicks.map((v, i) => {
              const isZero = v === 0;
              return (
                <g key={`y-axis-${i}`}>
                  <line
                    x1={-5}
                    y1={yScale(v)}
                    x2={0}
                    y2={yScale(v)}
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <text
                    x={-12}
                    y={yScale(v) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill={isZero ? "#475569" : "#64748b"}
                    fontWeight={isZero ? "600" : "400"}
                    className="select-none"
                  >
                    {formatYAxis(v)}
                  </text>
                </g>
              );
            })}

            {/* Axis Titles */}
            <text
              x={boundsWidth / 2}
              y={boundsHeight + 48}
              textAnchor="middle"
              fontSize="12"
              fill="#64748b"
              fontWeight="500"
            >
              Year (by decade)
            </text>

            <text
              transform={`rotate(-90) translate(${-boundsHeight / 2}, -60)`}
              textAnchor="middle"
              fontSize="12"
              fill="#64748b"
              fontWeight="500"
            >
              Value
            </text>

            {/* Zero baseline highlight */}
            {yAxisTicks.includes(0) && (
              <line
                x1={0}
                x2={boundsWidth}
                y1={yScale(0)}
                y2={yScale(0)}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="none"
              />
            )}
          </g>
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="fixed pointer-events-none bg-white border border-slate-200 shadow-xl px-4 py-2.5 rounded-lg z-50"
          style={{
            left: xScale(hoveredPoint.year) + MARGIN.left + 15,
            top: yScale(hoveredPoint.value) + MARGIN.top - 50,
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: METRICS.find((m) => m.key === hoveredPoint.metric)
                  ?.color,
              }}
            ></div>
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              {METRICS.find((m) => m.key === hoveredPoint.metric)?.label} •{" "}
              {hoveredPoint.year}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-800">
            {METRICS.find((m) => m.key === hoveredPoint.metric)?.format(
              hoveredPoint.value
            )}
            {METRICS.find((m) => m.key === hoveredPoint.metric)?.unit}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {METRICS.find((m) => m.key === hoveredPoint.metric)?.label.toLowerCase()} value
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-500 text-center leading-relaxed space-y-1">
          <p>
            📊 Data across {data.length} years · 
            <span className="font-medium text-emerald-600"> Crop Yield</span> peaked at {formatNumber(peakCrop)} t/ha ({peakCropYear}) · 
            <span className="font-medium text-amber-600"> Livestock</span> peaked at {formatNumber(peakLivestock)} tons ({peakLivestockYear}) · 
            <span className="font-medium text-teal-600"> Tourism</span> peaked at {formatNumber(peakTourist)} ({peakTouristYear})
          </p>
          <p className="text-[10px] text-slate-400">
            💡 Click legend items to show/hide metrics · Hover over lines for exact values
          </p>
        </div>
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;