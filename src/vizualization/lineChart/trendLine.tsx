"use client";

import { scaleLinear } from "d3-scale";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { line, curveCardinal } from "d3-shape";
import { LineItem } from "@/vizualization/lineChart/LineItem";

const MARGIN = { top: 60, right: 60, bottom: 100, left: 120 };

export type UnifiedDatum = {
  country: string;
  year: number;
  value: number;
};

type Props = {
  width: number;
  height: number;
  data: UnifiedDatum[];
  dataType: string;
  selectedCountry?: string;
  setSelectedCountry: (c: string) => void;
  highlightedYear?: number;
  stackBy?: "year" | "country";
  title?: string;
  insight?: string;
};

export const TrendLine = ({
  width,
  height,
  data,
  dataType,
  selectedCountry,
  setSelectedCountry,
  highlightedYear,
  stackBy = "year",
  insight = "The trend line reveals how disaster economic losses have evolved over time.",
}: Props) => {
  const [isClient, setIsClient] = useState(false);
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; year: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isLineHovered, setIsLineHovered] = useState(false);
  
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const stackKeys = useMemo(() => {
    if (stackBy === "year") {
      return Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
    } else {
      return Array.from(new Set(data.map((d) => d.country))).sort();
    }
  }, [data, stackBy]);

  const hasData = data.length > 0 && stackKeys.length > 0;

  const trendData = useMemo(() => {
    const map = new Map<number, number>();
    data.forEach((d) => {
      const key = d.year;
      map.set(key, (map.get(key) ?? 0) + (d.value || 0));
    });
    return Array.from(map.entries())
      .map(([year, total]) => ({ year, total }))
      .sort((a, b) => a.year - b.year);
  }, [data]);

  const totalLoss = useMemo(
    () => data.reduce((sum, d) => sum + (d.value || 0), 0),
    [data]
  );

  const averageLoss = trendData.length > 0 ? totalLoss / trendData.length : 0;

  const worstYear = trendData.reduce(
    (worst, cur) => (cur.total > (worst?.total ?? 0) ? cur : worst),
    trendData[0]
  );

  const bestYear = trendData.reduce(
    (best, cur) => (cur.total < (best?.total ?? Infinity) ? cur : best),
    trendData[0]
  );

  const growthRate = useMemo(() => {
    if (trendData.length < 2) return 0;
    const first = trendData[0].total;
    const last = trendData[trendData.length - 1].total;
    return first === 0 ? 0 : ((last - first) / first) * 100;
  }, [trendData]);

  const formatCompact = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return v.toString();
  };

  const formatTick = (v: number) => `$${formatCompact(v)}`;

  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([
          trendData[0]?.year ?? 0,
          trendData[trendData.length - 1]?.year ?? 1,
        ])
        .range([0, boundsWidth]),
    [trendData, boundsWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, Math.max(...trendData.map((d) => d.total), 1) * 1.1])
        .range([boundsHeight, 0]),
    [trendData, boundsHeight]
  );

  const linePath = useMemo(() => {
    if (trendData.length === 0) return "";
    return (
      line<{ year: number; total: number }>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.total))
        .curve(curveCardinal)(trendData) || ""
    );
  }, [trendData, xScale, yScale]);

  const areaPath = useMemo(() => {
    if (trendData.length === 0) return "";
    const lineGenerator = line<{ year: number; total: number }>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.total))
      .curve(curveCardinal);
    
    const linePart = lineGenerator(trendData);
    if (!linePart) return "";
    
    const lastPoint = trendData[trendData.length - 1];
    const firstPoint = trendData[0];
    
    return `${linePart} L ${xScale(lastPoint.year)} ${boundsHeight} L ${xScale(firstPoint.year)} ${boundsHeight} Z`;
  }, [trendData, xScale, yScale, boundsHeight]);

  const xAxisTicks = useMemo(() => {
    const years = trendData.map(d => d.year);
    const maxTicks = Math.max(5, Math.min(10, Math.floor(boundsWidth / 70)));
    const step = Math.ceil(years.length / maxTicks);
    return years.filter((_, i) => i % step === 0);
  }, [trendData, boundsWidth]);

  const yAxisTicks = useMemo(() => {
    const maxValue = Math.max(...trendData.map((d) => d.total), 1);
    const ticks: number[] = [];
    const step = maxValue / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(i * step);
    }
    return ticks;
  }, [trendData]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handlePointEnter = (event: React.MouseEvent, year: number, value: number, x: number, y: number) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    setTooltipPosition({ x: mouseX + 15, y: mouseY - 55 });
    setHoveredPoint({ x, y, value, year });
  };

  const handlePointLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setHoveredPoint(null);
    }, 150);
  };

  const handleLineHover = (hovered: boolean) => {
    if (hovered) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      setIsLineHovered(true);
      setHoveredPoint(null);
    } else {
      setIsLineHovered(false);
    }
  };

  if (!isClient) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30">📊</div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No economic loss data available for the selected filter
          </p>
        </div>
      </div>
    );
  }

  const lineColor = "#06b6d4";

  return (
    <div className="w-full font-sans">
      {/* Stats Cards */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="text-center p-3 bg-cyan-50 rounded-lg border border-cyan-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="text-xl font-bold text-cyan-700">{formatTick(totalLoss)}</div>
          <div className="text-xs text-slate-500 mt-1">Total Economic Loss</div>
        </div>
        <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="text-xl font-bold text-emerald-700">{formatTick(averageLoss)}</div>
          <div className="text-xs text-slate-500 mt-1">Annual Average</div>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="text-xl font-bold text-amber-700">{worstYear?.year || "—"}</div>
          <div className="text-xs text-slate-500 mt-1">Worst Year</div>
          <div className="text-[11px] text-amber-600 font-medium">{worstYear ? formatCompact(worstYear.total) : "—"}</div>
        </div>
        <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className={`text-xl font-bold ${growthRate > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Overall Trend</div>
          <div className="text-[11px] text-slate-400">{trendData[0]?.year} → {trendData[trendData.length - 1]?.year}</div>
        </div>
      </div>

      {/* Insight Text - Without country selection */}
      <div className="mb-5 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          Over the {trendData.length}-year period ({trendData[0]?.year} - {trendData[trendData.length - 1]?.year}), 
          disaster economic losses have shown a <span className={`font-semibold ${growthRate > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {Math.abs(growthRate).toFixed(1)}% {growthRate > 0 ? 'increase' : 'decrease'}
          </span>.
          The total economic loss across all years was <span className="font-semibold text-cyan-700">{formatTick(totalLoss)}</span>, 
          with an annual average of <span className="font-semibold text-cyan-700">{formatTick(averageLoss)}</span>. 
          The highest loss was recorded in <span className="font-semibold text-amber-600">{worstYear?.year}</span> 
          at <span className="font-semibold text-amber-600">{worstYear ? formatCompact(worstYear.total) : "—"}</span>, 
          while the lowest was in <span className="font-semibold text-emerald-600">{bestYear?.year}</span> 
          at <span className="font-semibold text-emerald-600">{bestYear ? formatCompact(bestYear.total) : "—"}</span>.
        </p>
      </div>

      {/* Line Chart */}
      <div className="relative">
        <svg 
          ref={svgRef}
          width={width} 
          height={height} 
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
            </linearGradient>
          </defs>

          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* Grid lines */}
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

            <path 
              d={areaPath} 
              fill="url(#areaGradient)" 
              opacity="0.3"
            />

            <LineItem
              path={linePath}
              color={lineColor}
              opacity={0.85}
              strokeWidth={3.5}
              onHover={handleLineHover}
            />

            {trendData.map((d, i) => {
              const x = xScale(d.year);
              const y = yScale(d.total);
              const isHovered = hoveredPoint?.year === d.year;
              const isWorstYear = worstYear && d.year === worstYear.year;
              const isBestYear = bestYear && d.year === bestYear.year;
              const pointRadius = isHovered ? 10 : (isWorstYear ? 9 : isBestYear ? 7 : 5);
              const pointColor = isWorstYear ? "#f59e0b" : isBestYear ? "#10b981" : lineColor;
              
              return (
                <g 
                  key={i}
                  onMouseEnter={(e) => handlePointEnter(e, d.year, d.total, x, y)}
                  onMouseLeave={handlePointLeave}
                  style={{ cursor: 'pointer' }}
                >
                  {(isWorstYear || isBestYear) && !isHovered && !isLineHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={pointRadius + 3}
                      fill="none"
                      stroke={pointColor}
                      strokeWidth="1.5"
                      opacity="0.3"
                    />
                  )}
                  
                  <circle
                    cx={x}
                    cy={y}
                    r={pointRadius}
                    fill={pointColor}
                    stroke="#fff"
                    strokeWidth={2.5}
                  />
                  
                  {(isWorstYear || isBestYear || i === 0 || i === trendData.length - 1) && !isHovered && !isLineHovered && (
                    <text
                      x={x}
                      y={y - (isWorstYear ? 22 : 15)}
                      textAnchor="middle"
                      fontSize={isWorstYear ? "11" : "10"}
                      fill={pointColor}
                      fontWeight={isWorstYear ? "800" : "600"}
                      pointerEvents="none"
                    >
                      {formatCompact(d.total)}
                    </text>
                  )}
                </g>
              );
            })}

            {xAxisTicks.map((year, i) => (
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
                  fontSize="11"
                  fill="#475569"
                  className="select-none"
                >
                  {year}
                </text>
              </g>
            ))}

            {yAxisTicks.map((v, i) => (
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
                  fill="#475569"
                  fontWeight="500"
                  className="select-none"
                >
                  {formatTick(v)}
                </text>
              </g>
            ))}

            <text 
              x={boundsWidth / 2} 
              y={boundsHeight + 48} 
              textAnchor="middle" 
              fontSize="12" 
              fill="#64748b" 
              fontWeight="500"
            >
              Year
            </text>
            
            <text 
              transform={`rotate(-90) translate(${-boundsHeight / 2}, -70)`}
              textAnchor="middle" 
              fontSize="12" 
              fill="#64748b" 
              fontWeight="500"
            >
              Total Economic Loss (USD)
            </text>

            {worstYear && (
              <g>
                <line
                  x1={xScale(worstYear.year)}
                  x2={xScale(worstYear.year)}
                  y1={0}
                  y2={yScale(worstYear.total) - 5}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.4"
                />
                <rect
                  x={xScale(worstYear.year) - 45}
                  y={-30}
                  width={90}
                  height={22}
                  rx={6}
                  fill="#fef3c7"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />
                <text
                  x={xScale(worstYear.year)}
                  y={-15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#d97706"
                  fontWeight="700"
                >
                  Peak: {formatCompact(worstYear.total)}
                </text>
              </g>
            )}

            {trendData.length > 1 && (
              <g>
                <path
                  d={`M ${boundsWidth - 80} ${yScale(trendData[0].total)} L ${boundsWidth - 50} ${yScale(trendData[trendData.length - 1].total)}`}
                  stroke={growthRate > 0 ? "#ef4444" : "#10b981"}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  markerEnd="url(#arrowhead)"
                />
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 8 4, 0 8"
                      fill={growthRate > 0 ? "#ef4444" : "#10b981"}
                    />
                  </marker>
                </defs>
                <text
                  x={boundsWidth - 65}
                  y={yScale((trendData[0].total + trendData[trendData.length - 1].total) / 2) - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill={growthRate > 0 ? "#ef4444" : "#10b981"}
                  fontWeight="600"
                >
                  {growthRate > 0 ? '↑' : '↓'} {Math.abs(growthRate).toFixed(1)}%
                </text>
              </g>
            )}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredPoint && !isLineHovered && (
          <div
            style={{
              position: 'fixed',
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 99999,
              pointerEvents: 'none',
              minWidth: '160px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: lineColor }}></div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                Year {hoveredPoint.year}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {formatTick(hoveredPoint.value)}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
              economic loss
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
