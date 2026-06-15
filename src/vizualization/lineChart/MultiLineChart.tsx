"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { scaleLinear } from "d3-scale";
import { line, curveMonotoneX } from "d3-shape";
import { LineItem } from "@/vizualization/lineChart/LineItem";

const MARGIN = {
  top: 40,
  right: 140,
  bottom: 60,
  left: 60,
};

type Series = {
  key: string;
  label: string;
  color: string;
};

type DataRow = {
  year: number;
  country?: string;
  [key: string]: number | string | undefined;
};

type Props = {
  width: number;
  height: number;
  data: DataRow[];
  series: Series[];
  title?: string;
  insight?: string;
  yAxisLabel?: string;
  selectedCountry?: string;
};

export function MultiLineChart({
  width,
  height,
  data,
  series,
  title = "Multi-Indicator Trends",
  insight = "This chart shows standardized anomaly values (indexed to baseline year), allowing direct comparison of how different climate indicators have changed relative to their baseline.",
  yAxisLabel = "Standardized Anomaly (baseline = 0)",
  selectedCountry = "the selected country",
}: Props) {
  const [hovered, setHovered] = useState<any>(null);
  const [animate, setAnimate] = useState(false);
  const [activeSeries, setActiveSeries] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"regional" | "country">("regional");
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  const safeData = Array.isArray(data) ? data : [];
  const safeSeries = Array.isArray(series) ? series : [];

  // Initialize all series as active
  useEffect(() => {
    if (safeSeries.length > 0 && activeSeries.size === 0) {
      setActiveSeries(new Set(safeSeries.map(s => s.key)));
    }
  }, [safeSeries]);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // STANDARDIZE values: for each indicator, set baseline year (first year) to 0
  const standardizeData = useCallback((rawData: DataRow[], indicatorKeys: string[]): DataRow[] => {
    if (!rawData.length) return [];
    
    const sortedByYear = [...rawData].sort((a, b) => (a.year || 0) - (b.year || 0));
    const baselineYear = sortedByYear[0]?.year;
    
    if (!baselineYear) return rawData;
    
    const baselineValues: Record<string, number> = {};
    const baselineRow = rawData.find(d => d.year === baselineYear);
    
    indicatorKeys.forEach(key => {
      baselineValues[key] = (baselineRow?.[key] as number) || 0;
    });
    
    return rawData.map(row => {
      const standardizedRow: any = { year: row.year };
      if (row.country) standardizedRow.country = row.country;
      
      indicatorKeys.forEach(key => {
        const rawValue = (row[key] as number) || 0;
        standardizedRow[key] = rawValue - baselineValues[key];
      });
      
      return standardizedRow;
    });
  }, []);

  // Process data based on view mode, then standardize
  const processedData = useMemo(() => {
    let rawData: DataRow[];
    
    if (viewMode === "country" && selectedCountry && selectedCountry !== "the selected country") {
      rawData = safeData
        .filter(row => row.country === selectedCountry)
        .map(({ country, ...rest }) => rest)
        .sort((a, b) => (a.year || 0) - (b.year || 0));
    } else {
      const yearMap = new Map<number, { [key: string]: { sum: number; count: number } }>();
      
      safeData.forEach(row => {
        const year = row.year;
        if (!yearMap.has(year)) {
          yearMap.set(year, {});
        }
        
        const yearData = yearMap.get(year)!;
        
        safeSeries.forEach(s => {
          const value = row[s.key];
          if (value !== undefined && value !== null && !isNaN(value as number)) {
            if (!yearData[s.key]) {
              yearData[s.key] = { sum: 0, count: 0 };
            }
            yearData[s.key].sum += value as number;
            yearData[s.key].count += 1;
          }
        });
      });
      
      rawData = Array.from(yearMap.entries())
        .map(([year, indicators]) => {
          const row: any = { year };
          safeSeries.forEach(s => {
            const indicator = indicators[s.key];
            row[s.key] = indicator ? indicator.sum / indicator.count : 0;
          });
          return row;
        })
        .sort((a, b) => a.year - b.year);
    }
    
    const indicatorKeys = safeSeries.map(s => s.key);
    return standardizeData(rawData, indicatorKeys);
  }, [safeData, safeSeries, viewMode, selectedCountry, standardizeData]);

  const years = useMemo(() => {
    return processedData
      .map((d) => d.year)
      .filter((v) => Number.isFinite(v))
      .sort((a, b) => a - b);
  }, [processedData]);

  const visibleSeries = useMemo(() => {
    return safeSeries.filter(s => activeSeries.has(s.key));
  }, [safeSeries, activeSeries]);

  const xScale = useMemo(() => {
    if (!years.length) return null;
    return scaleLinear()
      .domain([Math.min(...years), Math.max(...years)])
      .range([0, boundsWidth]);
  }, [years, boundsWidth]);

  const allValues = useMemo(() => {
    return processedData.flatMap(row =>
      visibleSeries.map(s => Number(row[s.key] ?? 0))
    );
  }, [processedData, visibleSeries]);

  const yScale = useMemo(() => {
    const min = Math.min(...allValues, -0.5);
    const max = Math.max(...allValues, 0.5);
    const padding = (max - min) * 0.1;
    return scaleLinear()
      .domain([min - padding, max + padding])
      .nice()
      .range([boundsHeight, 0]);
  }, [allValues, boundsHeight]);

  // Animation
  useEffect(() => {
    if (processedData.length > 0) {
      setAnimate(false);
      const timer = setTimeout(() => setAnimate(true), 100);
      return () => clearTimeout(timer);
    }
  }, [processedData.length]);

  // Calculate story insights
  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const baselineYear = firstYear;
  
  const seriesTrends = useMemo(() => {
    const trends: Record<string, { start: number; end: number; change: number; direction: string; finalValue: number }> = {};
    
    safeSeries.forEach(s => {
      const startValue = processedData.find(d => d.year === firstYear)?.[s.key];
      const endValue = processedData.find(d => d.year === lastYear)?.[s.key];
      
      if (typeof startValue === "number" && typeof endValue === "number") {
        const change = endValue - startValue;
        trends[s.key] = {
          start: startValue,
          end: endValue,
          change,
          finalValue: endValue,
          direction: change > 0.1 ? "↑ rising" : change < -0.1 ? "↓ falling" : "→ stable",
        };
      }
    });
    
    return trends;
  }, [processedData, safeSeries, firstYear, lastYear]);

  const fastestRising = Object.entries(seriesTrends)
    .sort((a, b) => b[1].change - a[1].change)[0];
  
  const fastestFalling = Object.entries(seriesTrends)
    .sort((a, b) => a[1].change - b[1].change)[0];

  const toggleSeries = useCallback((key: string) => {
    setActiveSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        if (newSet.size > 1) newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const formatValue = useCallback((value: number | undefined | null, key: string): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "—";
    }
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}`;
  }, []);

  // Generate line paths for each visible series
  const linePaths = useMemo(() => {
    const paths: Record<string, string> = {};
    
    visibleSeries.forEach(s => {
      const lineGenerator = line<any>()
        .x((d) => xScale?.(d.year) ?? 0)
        .y((d) => yScale(Number(d?.[s.key] ?? 0)))
        .curve(curveMonotoneX);
      
      paths[s.key] = lineGenerator(processedData) || "";
    });
    
    return paths;
  }, [processedData, xScale, yScale, visibleSeries]);

  if (!processedData.length || !safeSeries.length || !xScale) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white" 
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30"></div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {viewMode === "country" && selectedCountry && selectedCountry !== "the selected country"
              ? `No multi-indicator data available for ${selectedCountry}`
              : "No multi-indicator data available for the Pacific region"}
          </p>
        </div>
      </div>
    );
  }

  const hasAirTemp = safeSeries.some(s => s.key === "temp");
  const hasSeaSurfaceTemp = safeSeries.some(s => s.key === "sea_surface_temperature");
  const displayName = viewMode === "country" && selectedCountry !== "the selected country" ? selectedCountry : "Pacific Region";
  const baselineYearDisplay = firstYear;

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
          
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("regional")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                viewMode === "regional"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
               Regional Average
            </button>
            <button
              onClick={() => setViewMode("country")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                viewMode === "country"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
               {selectedCountry !== "the selected country" ? selectedCountry : "Select a country"}
            </button>
          </div>
        </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {insight}
          </p>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700">{firstYear}–{lastYear}</div>
          <div className="text-xs text-slate-500">Time Period</div>
          <div className="text-[10px] text-slate-400">(baseline {baselineYearDisplay}=0)</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-700">
            {fastestRising ? (fastestRising[1].change > 0 ? `+${fastestRising[1].change.toFixed(2)}` : fastestRising[1].change.toFixed(2)) : "—"}
          </div>
          <div className="text-xs text-slate-500">largest ↑</div>
          <div className="text-[10px] text-slate-400 max-w-[80px] truncate">{fastestRising?.[0]?.replace(/_/g, " ")}</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-700">
            {fastestFalling ? (fastestFalling[1].change < 0 ? `${fastestFalling[1].change.toFixed(2)}` : `+${fastestFalling[1].change.toFixed(2)}`) : "—"}
          </div>
          <div className="text-xs text-slate-500">largest ↓</div>
          <div className="text-[10px] text-slate-400 max-w-[80px] truncate">{fastestFalling?.[0]?.replace(/_/g, " ")}</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-700">{safeSeries.length}</div>
          <div className="text-xs text-slate-500">Indicators</div>
        </div>
      </div>

      <div className="mb-5 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          {displayName} over {firstYear}–{lastYear} (standardized to {baselineYearDisplay}=0)
          {fastestRising && fastestRising[1].change > 0 && (
            <>{fastestRising[0].replace(/_/g, " ")} showed the strongest increase 
            (+{fastestRising[1].change.toFixed(2)} units),</>
          )}
          {fastestFalling && fastestFalling[1].change < 0 && (
            <> while {fastestFalling[0].replace(/_/g, " ")} 
            declined by {Math.abs(fastestFalling[1].change).toFixed(2)} units.</>
          )}
          {' '}The standardized scale allows direct comparison of each indicator's trend.
        </p>
      </div>

      <svg width={width} height={height} className="overflow-visible">
        <defs>
          {safeSeries.map(s => (
            <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.3" />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Horizontal grid lines */}
          {yScale.ticks(6).map((tick, i) => (
            <line 
              key={`y-${i}`} 
              x1={0} 
              x2={boundsWidth} 
              y1={yScale(tick)} 
              y2={yScale(tick)} 
              stroke="#e2e8f0" 
              strokeWidth={0.8}
              strokeDasharray="4 4"
            />
          ))}
          
          {/* Vertical grid lines */}
          {xScale.ticks(8).map((tick, i) => (
            <line 
              key={`x-${i}`} 
              x1={xScale(tick)} 
              x2={xScale(tick)} 
              y1={0} 
              y2={boundsHeight} 
              stroke="#e2e8f0" 
              strokeWidth={0.8}
              strokeDasharray="4 4"
            />
          ))}

          {/* Zero baseline */}
          <line 
            x1={0} 
            x2={boundsWidth} 
            y1={yScale(0)} 
            y2={yScale(0)} 
            stroke="#0f172a" 
            strokeWidth={1.5} 
            strokeDasharray="none"
          />

          {/* Lines using LineItem component for enhanced hover effects */}
          {visibleSeries.map((s) => {
            const pathData = linePaths[s.key];
            const isHoveredLine = hoveredLine === s.key;
            
            return (
              <LineItem
                key={s.key}
                path={pathData}
                color={s.color}
                opacity={animate ? 0.9 : 0}
                strokeWidth={2.5}
                onHover={(hovered: boolean) => {
                  setHoveredLine(hovered ? s.key : null);
                }}
              />
            );
          })}

          {/* Data points */}
          {visibleSeries.map((s) =>
            processedData.map((row, i) => {
              const value = row?.[s.key];
              if (value === undefined || value === null) return null;
              
              const x = xScale(row.year);
              const y = yScale(Number(value));
              const isHovered = hovered?.year === row.year && hovered?.key === s.key;
              const isFirstOrLast = i === 0 || i === processedData.length - 1;
              const isLineHovered = hoveredLine === s.key;
              const showPoint = isHovered || isFirstOrLast || i % 3 === 0 || isLineHovered;

              if (!showPoint) return null;

              return (
                <circle
                  key={`${s.key}-${i}`}
                  cx={x}
                  cy={y}
                  r={isHovered ? 7 : (isLineHovered ? 5 : 3.5)}
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="cursor-pointer transition-all duration-150"
                  style={{
                    filter: isHovered ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none",
                    transition: "r 0.2s ease, filter 0.2s ease"
                  }}
                  onMouseEnter={() => setHovered({ 
                    x, y, year: row.year, 
                    value: value, 
                    label: s.label, 
                    key: s.key 
                  })}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })
          )}

          {/* X-axis labels */}
          {xScale.ticks(8).map((tick) => (
            <text 
              key={`xt-${tick}`} 
              x={xScale(tick)} 
              y={boundsHeight + 22} 
              textAnchor="middle" 
              fill="#64748b" 
              fontSize={11}
            >
              {tick}
            </text>
          ))}

          {/* Y-axis labels */}
          {yScale.ticks(6).map((tick) => (
            <text 
              key={`yt-${tick}`} 
              x={-8} 
              y={yScale(tick) + 4} 
              textAnchor="end" 
              fill="#64748b" 
              fontSize={11}
            >
              {tick > 0 ? `+${tick.toFixed(1)}` : tick.toFixed(1)}
            </text>
          ))}

          {/* Axis titles */}
          <text 
            x={boundsWidth / 2} 
            y={boundsHeight + 45} 
            textAnchor="middle" 
            fill="#475569" 
            fontSize={11} 
            fontWeight="500"
          >
            Year
          </text>
          
          <text 
            transform={`rotate(-90) translate(${-boundsHeight / 2}, -42)`} 
            textAnchor="middle" 
            fill="#475569" 
            fontSize={11} 
            fontWeight="500"
          >
            {yAxisLabel}
          </text>

          {/* Legend */}
          <g transform={`translate(${boundsWidth + 20}, 0)`}>
            <text x="0" y="-8" fill="#64748b" fontSize={10} fontWeight="600" letterSpacing="0.05em">
              SHOW/HIDE
            </text>
            {safeSeries.map((s, i) => {
              const isActive = activeSeries.has(s.key);
              const isLineHovered = hoveredLine === s.key;
              const trend = seriesTrends[s.key];
              const trendIcon = trend?.direction === "↑ rising" ? "📈" : trend?.direction === "↓ falling" ? "📉" : "➡️";
              const changeValue = trend?.change || 0;
              const displayLabel = s.label.replace(/_/g, " ");
              
              return (
                <g 
                  key={s.key} 
                  transform={`translate(0, ${i * 26 + 8})`}
                  className="cursor-pointer"
                  onClick={() => toggleSeries(s.key)}
                >
                  <rect 
                    width="12" 
                    height="12" 
                    rx="2" 
                    fill={s.color} 
                    opacity={isActive ? 1 : 0.3} 
                    className="transition-opacity duration-150"
                  />
                  <text 
                    x="20" 
                    y="10" 
                    fill={isActive ? (isLineHovered ? s.color : "#334155") : "#94a3b8"} 
                    fontSize={10} 
                    fontWeight={isLineHovered ? "600" : (isActive ? "500" : "400")}
                    className="transition-all duration-150"
                  >
                    {displayLabel}
                  </text>
                  {isActive && trend && (
                    <text 
                      x="105" 
                      y="10" 
                      fontSize={9} 
                      fill={changeValue > 0 ? "#ef4444" : changeValue < 0 ? "#22c55e" : "#64748b"}
                    >
                      {trendIcon} {changeValue > 0 ? `+${changeValue.toFixed(1)}` : changeValue.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Enhanced Tooltip */}
      {hovered && (
        <div
          className="fixed pointer-events-none bg-white border border-slate-200 shadow-xl px-4 py-2.5 rounded-lg z-50"
          style={{ 
            left: hovered.x + MARGIN.left + 15, 
            top: hovered.y + MARGIN.top - 55,
            transition: "all 0.1s ease"
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: hovered.key ? safeSeries.find(s => s.key === hovered.key)?.color : "#D85A30" }}
            />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              {hovered.label?.replace(/_/g, " ")}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-800 tabular-nums">
            {hovered.value > 0 ? `+${hovered.value.toFixed(2)}` : hovered.value.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {viewMode === "country" && selectedCountry !== "the selected country" ? selectedCountry : "Regional Average"} • {hovered.year}
          </div>
          <div className="text-[9px] text-slate-300 mt-0.5">
            (deviation from {baselineYearDisplay} baseline)
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          <span className="font-medium">Standardized anomaly values</span> (baseline {baselineYearDisplay} = 0) allow direct comparison of trends across different indicators · 
          Toggle between <span className="font-medium">Regional Average</span> and <span className="font-medium">{selectedCountry !== "the selected country" ? selectedCountry : "selected country"}</span> · 
          Hover lines for emphasis and exact values
        </p>
      </div>
    </div>
  );
}
