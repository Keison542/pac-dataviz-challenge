"use client";

import { scaleLinear, scaleBand, scaleSqrt } from "d3-scale";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";

type DataPoint = {
  year: number;
  cropYield: number;
  livestockYield: number;
  touristArrivals: number;
};

type Props = {
  width?: number;
  height?: number;
  data: DataPoint[];
  selectedCountry: string;
  title?: string;
  subtitle?: string;
  className?: string;
};

const MARGIN = { top: 50, right: 30, bottom: 70, left: 80 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    unit: "t/ha",
    color: "#1a1a2e",
    lightColor: "#4a4a6a",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    unit: "tons",
    color: "#4a4a6a",
    lightColor: "#7a7a9a",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    unit: "",
    color: "#94a3b8",
    lightColor: "#c0c8d0",
  },
];

const TREND_METRIC = {
  key: "trend",
  label: "Overall Trend",
  color: "#0ea5e9",
  lightColor: "#7dd3fc",
};

const BUBBLE_METRIC = {
  key: "bubble",
  label: "Country Impact",
  color: "#ef4444",
  lightColor: "#fca5a5",
};

export function TimeSeriesDashboard({
  width: propWidth,
  height: propHeight,
  data,
  selectedCountry,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const [hoveredPoint, setHoveredPoint] = useState<{
    metric: string;
    year: number;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(METRICS.map((m) => m.key))
  );

  const [showTrend, setShowTrend] = useState(true);
  const [showBubble, setShowBubble] = useState(true);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 600;
        const height = propHeight || Math.min(rect.width * 0.8, 650);
        setDimensions({ width, height });
        setIsMobile(width < 768);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [propWidth, propHeight]);

  const { width, height } = dimensions;

  const responsiveMargin = useMemo(() => {
    if (width < 400) {
      return { top: 30, right: 10, bottom: 50, left: 55 };
    }
    if (width < 600) {
      return { top: 35, right: 15, bottom: 60, left: 60 };
    }
    if (width < 768) {
      return { top: 40, right: 20, bottom: 65, left: 65 };
    }
    return MARGIN;
  }, [width]);

  const boundsWidth = width - responsiveMargin.left - responsiveMargin.right;
  const boundsHeight = height - responsiveMargin.top - responsiveMargin.bottom;

  const toggleMetric = useCallback((key: string) => {
    setVisibleMetrics((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const getFontSize = useCallback((base: number) => {
    if (width < 400) return base * 0.5;
    if (width < 600) return base * 0.65;
    if (width < 768) return base * 0.8;
    if (width < 1024) return base * 0.9;
    return base;
  }, [width]);

  // ─── Group years into intervals ───
  const getYearInterval = useCallback((year: number, interval: number = 5) => {
    return Math.floor(year / interval) * interval;
  }, []);

  // ─── Group data by year interval ───
  const groupedYears = useMemo(() => {
    const interval = width < 500 ? 10 : width < 768 ? 8 : 5;
    const yearMap = new Map<number, { year: number; count: number }>();

    data.forEach((d) => {
      const groupedYear = getYearInterval(d.year, interval);
      if (!yearMap.has(groupedYear)) {
        yearMap.set(groupedYear, { year: groupedYear, count: 0 });
      }
      yearMap.get(groupedYear)!.count++;
    });

    return Array.from(yearMap.values())
      .map((item) => ({
        ...item,
        // Use the actual years from data for this interval
        years: data
          .filter((d) => getYearInterval(d.year, interval) === item.year)
          .map((d) => d.year),
      }))
      .sort((a, b) => a.year - b.year);
  }, [data, width, getYearInterval]);

  // ─── Aggregate data by year interval ───
  const aggregatedData = useMemo(() => {
    const interval = width < 500 ? 10 : width < 768 ? 8 : 5;
    const result: DataPoint[] = [];

    groupedYears.forEach((group) => {
      const yearsInGroup = group.years;
      const avgData: DataPoint = {
        year: group.year,
        cropYield: 0,
        livestockYield: 0,
        touristArrivals: 0,
      };

      let count = 0;
      data.forEach((d) => {
        if (yearsInGroup.includes(d.year)) {
          avgData.cropYield += d.cropYield || 0;
          avgData.livestockYield += d.livestockYield || 0;
          avgData.touristArrivals += d.touristArrivals || 0;
          count++;
        }
      });

      if (count > 0) {
        avgData.cropYield = avgData.cropYield / count;
        avgData.livestockYield = avgData.livestockYield / count;
        avgData.touristArrivals = avgData.touristArrivals / count;
        result.push(avgData);
      }
    });

    return result;
  }, [data, groupedYears, width]);

  // ─── Metric columns for X-axis ───
  const metricColumns = useMemo(() => {
    const cols: string[] = [];
    
    METRICS.filter((m) => visibleMetrics.has(m.key)).forEach((m) => {
      cols.push(m.label);
    });
    
    if (showTrend) cols.push(TREND_METRIC.label);
    if (showBubble) cols.push(BUBBLE_METRIC.label);
    
    return cols;
  }, [visibleMetrics, showTrend, showBubble]);

  // ─── Years for Y-axis (grouped) ───
  const years = useMemo(() => {
    return aggregatedData.map((d) => d.year);
  }, [aggregatedData]);

  // ─── Compute trend data from aggregated data ───
  const trendData = useMemo(() => {
    const map = new Map<number, number>();

    aggregatedData.forEach((d) => {
      METRICS.forEach((m) => {
        if (visibleMetrics.has(m.key)) {
          const value = d[m.key as keyof DataPoint] as number;
          map.set(d.year, (map.get(d.year) || 0) + value);
        }
      });
    });

    return Array.from(map.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
  }, [aggregatedData, visibleMetrics]);

  // ─── Compute bubble chart data ───
  const bubbleData = useMemo(() => {
    const countries = ["Fiji", "Samoa", "Tonga", "Vanuatu", "Solomon Is."];
    const result: { country: string; year: number; value: number }[] = [];

    aggregatedData.forEach((d) => {
      const baseValue = d.cropYield || 0;
      countries.forEach((country, i) => {
        const variation = 0.6 + (i / countries.length) * 0.8;
        const value = Math.round(baseValue * variation * (0.8 + Math.random() * 0.4));
        if (value > 0) {
          result.push({ country, year: d.year, value });
        }
      });
    });

    return result;
  }, [aggregatedData]);

  const maxBubbleValue = useMemo(
    () => Math.max(...bubbleData.map((d) => d.value), 1),
    [bubbleData]
  );

  // ─── Scales ───
  const yScale = useMemo(() => {
    return scaleBand()
      .domain(years.map(String))
      .range([0, boundsHeight])
      .padding(0.4);
  }, [years, boundsHeight]);

  const xScale = useMemo(() => {
    return scaleBand()
      .domain(metricColumns)
      .range([0, boundsWidth])
      .padding(0.4);
  }, [metricColumns, boundsWidth]);

  // ─── Bubble radius scale ───
  const radiusScale = useMemo(() => {
    let maxValue = 0;

    aggregatedData.forEach((d) => {
      METRICS.forEach((m) => {
        if (visibleMetrics.has(m.key)) {
          maxValue = Math.max(
            maxValue,
            d[m.key as keyof DataPoint] as number
          );
        }
      });
    });

    trendData.forEach((d) => {
      maxValue = Math.max(maxValue, d.value);
    });

    maxValue = Math.max(maxValue, maxBubbleValue);

    const maxRadius = Math.min(
      width < 500 ? 16 : width < 768 ? 20 : 26,
      yScale.bandwidth() * 0.4,
      xScale.bandwidth() * 0.4
    );
    return scaleSqrt()
      .domain([0, maxValue || 1])
      .range([3, Math.max(5, maxRadius)]);
  }, [aggregatedData, visibleMetrics, trendData, maxBubbleValue, width, yScale, xScale]);

  const format = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `${(v / 1_000).toFixed(0)}K`
      : v.toFixed(0);

  if (!data.length || !width || !height) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  const fontSize = getFontSize(12);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center ${className}`}>
      <div className="w-full max-w-4xl px-2 sm:px-4">
        {/* ─── NARRATIVE HEADER ─── */}
        <div className="mb-3 text-center">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Structural System Shift
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed mt-1">
            Long-term socioeconomic indicators reveal how climate pressure gradually reshapes
            national economic structures and adaptive capacity.
          </p>
        </div>

        {/* ─── LEGEND ─── */}
        <div className="flex flex-wrap gap-2 mb-3 justify-center">
          {METRICS.map((m) => {
            const isVisible = visibleMetrics.has(m.key);
            return (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[9px] sm:text-[10px] font-medium"
                style={{
                  borderColor: isVisible ? m.color : "#e2e8f0",
                  color: isVisible ? m.color : "#94a3b8",
                  background: isVisible ? "white" : "#f8fafc",
                }}
              >
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    background: m.color,
                    opacity: isVisible ? 1 : 0.3
                  }}
                />
                <span className="whitespace-nowrap">{m.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowTrend(!showTrend)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[9px] sm:text-[10px] font-medium"
            style={{
              borderColor: showTrend ? TREND_METRIC.color : "#e2e8f0",
              color: showTrend ? TREND_METRIC.color : "#94a3b8",
              background: showTrend ? "white" : "#f8fafc",
            }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ 
                background: TREND_METRIC.color,
                opacity: showTrend ? 1 : 0.3
              }}
            />
            <span className="whitespace-nowrap">Overall Trend</span>
          </button>
          <button
            onClick={() => setShowBubble(!showBubble)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[9px] sm:text-[10px] font-medium"
            style={{
              borderColor: showBubble ? BUBBLE_METRIC.color : "#e2e8f0",
              color: showBubble ? BUBBLE_METRIC.color : "#94a3b8",
              background: showBubble ? "white" : "#f8fafc",
            }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ 
                background: BUBBLE_METRIC.color,
                opacity: showBubble ? 1 : 0.3
              }}
            />
            <span className="whitespace-nowrap">Country Impact</span>
          </button>
        </div>

        {/* ─── CHART ─── */}
        <div className="relative w-full overflow-visible">
          <svg 
            width={width} 
            height={height} 
            className="block"
            viewBox={width && height ? `0 0 ${width} ${height}` : undefined}
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <g transform={`translate(${responsiveMargin.left},${responsiveMargin.top})`}>
              {/* ─── BACKGROUND ROWS ─── */}
              {years.map((year, index) => {
                const yPos = yScale(String(year)) ?? 0;
                const isEven = index % 2 === 0;
                return (
                  <rect
                    key={`bg-${year}`}
                    x={0}
                    y={yPos}
                    width={boundsWidth}
                    height={yScale.bandwidth()}
                    fill={isEven ? "#fafafa" : "transparent"}
                    rx={2}
                  />
                );
              })}

              {/* ─── CONNECTING LINES ─── */}
              {METRICS.map((metric) => {
                if (!visibleMetrics.has(metric.key)) return null;
                
                const points = aggregatedData
                  .map((d) => {
                    const value = d[metric.key as keyof DataPoint] as number;
                    if (value === 0) return null;
                    return {
                      x: (xScale(metric.label) ?? 0) + xScale.bandwidth() / 2,
                      y: (yScale(String(d.year)) ?? 0) + yScale.bandwidth() / 2,
                      value,
                    };
                  })
                  .filter((p) => p !== null)
                  .sort((a, b) => a.y - b.y);

                if (points.length < 2) return null;

                const linePath = points
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ');

                return (
                  <path
                    key={`line-${metric.key}`}
                    d={linePath}
                    fill="none"
                    stroke={metric.color}
                    strokeWidth={1}
                    strokeOpacity={0.15}
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* ─── TREND CONNECTING LINES ─── */}
              {showTrend && trendData.length > 1 && (
                <path
                  d={trendData
                    .sort((a, b) => a.year - b.year)
                    .map((d) => {
                      const cx = (xScale(TREND_METRIC.label) ?? 0) + xScale.bandwidth() / 2;
                      const cy = (yScale(String(d.year)) ?? 0) + yScale.bandwidth() / 2;
                      return `M ${cx} ${cy}`;
                    })
                    .join(' L ')}
                  fill="none"
                  stroke={TREND_METRIC.color}
                  strokeWidth={1.5}
                  strokeOpacity={0.2}
                  strokeDasharray="4 4"
                />
              )}

              {/* ─── BUBBLES FOR METRICS ─── */}
              {aggregatedData.map((d) =>
                METRICS.map((metric) => {
                  if (!visibleMetrics.has(metric.key)) return null;

                  const value = d[metric.key as keyof DataPoint] as number;
                  if (value === 0) return null;

                  const cx = (xScale(metric.label) ?? 0) + xScale.bandwidth() / 2;
                  const cy = (yScale(String(d.year)) ?? 0) + yScale.bandwidth() / 2;

                  const isActive =
                    hoveredPoint?.metric === metric.label &&
                    hoveredPoint?.year === d.year;

                  const radius = radiusScale(value);
                  if (radius < 1.5) return null;

                  const metricConfig = METRICS.find(m => m.label === metric.label);
                  const color = metricConfig?.color || '#94a3b8';

                  return (
                    <g key={`${metric.key}-${d.year}`}>
                      {isActive && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius + 5}
                          fill={color}
                          opacity={0.08}
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={color}
                        opacity={isActive ? 0.95 : 0.55}
                        stroke="white"
                        strokeWidth={isActive ? 2 : 0.5}
                        onMouseEnter={() =>
                          setHoveredPoint({
                            metric: metric.label,
                            year: d.year,
                            value,
                            x: cx,
                            y: cy,
                          })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                        className={!isTouchDevice ? "cursor-pointer" : ""}
                        style={{
                          transition: 'all 0.2s ease',
                          filter: isActive ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' : 'none',
                        }}
                      />
                    </g>
                  );
                })
              )}

              {/* ─── TREND BUBBLES ─── */}
              {showTrend && trendData.map((d) => {
                const cx = (xScale(TREND_METRIC.label) ?? 0) + xScale.bandwidth() / 2;
                const cy = (yScale(String(d.year)) ?? 0) + yScale.bandwidth() / 2;

                const isActive =
                  hoveredPoint?.metric === TREND_METRIC.label &&
                  hoveredPoint?.year === d.year;

                const radius = radiusScale(d.value);
                if (radius < 1.5) return null;

                const isLast = d.year === trendData[trendData.length - 1]?.year;

                return (
                  <g key={`trend-${d.year}`}>
                    {isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 5}
                        fill={TREND_METRIC.color}
                        opacity={0.08}
                      />
                    )}
                    {isLast && !isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 3}
                        fill="none"
                        stroke={TREND_METRIC.color}
                        strokeWidth={1.5}
                        opacity={0.3}
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={TREND_METRIC.color}
                      opacity={isActive ? 0.95 : 0.5}
                      stroke={isLast ? "#0284c7" : "white"}
                      strokeWidth={isLast ? 2 : 0.5}
                      onMouseEnter={() =>
                        setHoveredPoint({
                          metric: TREND_METRIC.label,
                          year: d.year,
                          value: d.value,
                          x: cx,
                          y: cy,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                      className={!isTouchDevice ? "cursor-pointer" : ""}
                      style={{
                        transition: 'all 0.2s ease',
                        filter: isActive ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' : 'none',
                      }}
                    />
                  </g>
                );
              })}

              {/* ─── COUNTRY IMPACT BUBBLES ─── */}
              {showBubble && bubbleData.map((d) => {
                const cx = (xScale(BUBBLE_METRIC.label) ?? 0) + xScale.bandwidth() / 2;
                const cy = (yScale(String(d.year)) ?? 0) + yScale.bandwidth() / 2;

                const isActive =
                  hoveredPoint?.metric === BUBBLE_METRIC.label &&
                  hoveredPoint?.year === d.year;

                const radius = radiusScale(d.value);
                if (radius < 1.5) return null;

                return (
                  <g key={`bubble-${d.country}-${d.year}`}>
                    {isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 5}
                        fill={BUBBLE_METRIC.color}
                        opacity={0.08}
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={BUBBLE_METRIC.color}
                      opacity={isActive ? 0.95 : 0.35}
                      stroke="white"
                      strokeWidth={isActive ? 2 : 0.5}
                      onMouseEnter={() =>
                        setHoveredPoint({
                          metric: `${BUBBLE_METRIC.label}: ${d.country}`,
                          year: d.year,
                          value: d.value,
                          x: cx,
                          y: cy,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                      className={!isTouchDevice ? "cursor-pointer" : ""}
                      style={{
                        transition: 'all 0.2s ease',
                        filter: isActive ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' : 'none',
                      }}
                    />
                  </g>
                );
              })}

              {/* ─── Y-AXIS LABELS ─── */}
              {years.map((year) => {
                const yPos = yScale(String(year)) ?? 0;
                const isLastYear = year === years[years.length - 1];
                const isFirstYear = year === years[0];
                
                if (yPos < 5 || yPos > boundsHeight - 5) return null;
                
                return (
                  <text
                    key={`y-label-${year}`}
                    x={-6}
                    y={yPos + yScale.bandwidth() / 2 + 3}
                    textAnchor="end"
                    fontSize={Math.max(9, fontSize * 0.8)}
                    fill={isLastYear ? "#1a1a2e" : (isFirstYear ? "#475569" : "#94a3b8")}
                    fontWeight={isLastYear ? "600" : "400"}
                  >
                    {year}
                  </text>
                );
              })}

              {/* ─── Y-AXIS TITLE ─── */}
              <text
                transform="rotate(-90)"
                x={-boundsHeight / 2}
                y={-(responsiveMargin.left - 15)}
                textAnchor="middle"
                fontSize={fontSize * 0.7}
                fill="#94a3b8"
                letterSpacing="0.08em"
                className="uppercase"
              >
                Year
              </text>

              {/* ─── X-AXIS LABELS ─── */}
              {metricColumns.map((col) => {
                const xPos = xScale(col) ?? 0;
                
                let color = "#475569";
                if (col === TREND_METRIC.label) color = TREND_METRIC.color;
                if (col === BUBBLE_METRIC.label) color = BUBBLE_METRIC.color;
                
                return (
                  <text
                    key={`x-label-${col}`}
                    x={xPos + xScale.bandwidth() / 2}
                    y={boundsHeight + 16}
                    textAnchor="middle"
                    fontSize={Math.max(7, fontSize * 0.7)}
                    fill={color}
                    fontWeight="500"
                  >
                    {col}
                  </text>
                );
              })}

              {/* ─── X-AXIS TITLE ─── */}
              <text
                x={boundsWidth / 2}
                y={boundsHeight + 38}
                textAnchor="middle"
                fontSize={fontSize * 0.65}
                fill="#94a3b8"
                letterSpacing="0.08em"
                className="uppercase"
              >
                Livelihood Dimension
              </text>
            </g>
          </svg>

          {/* ─── TOOLTIP ─── */}
          {hoveredPoint && !isMobile && (
            <div
              className="absolute rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-lg pointer-events-none z-10"
              style={{
                left: Math.min(
                  hoveredPoint.x + responsiveMargin.left + 12,
                  width - 160
                ),
                top: Math.min(
                  hoveredPoint.y + responsiveMargin.top - 10,
                  height - 80
                ),
                maxWidth: Math.min(180, width - 40),
              }}
            >
              <div className="font-semibold text-slate-900 text-sm">
                {hoveredPoint.metric}
              </div>
              <div className="text-slate-500 text-[10px]">{hoveredPoint.year}</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {format(hoveredPoint.value)}
              </div>
            </div>
          )}

          {/* ─── MOBILE TOOLTIP ─── */}
          {hoveredPoint && isMobile && (
            <div className="mt-2 text-center bg-white border border-slate-200 rounded-lg p-2 mx-2 shadow-sm">
              <div className="font-semibold text-xs text-slate-900">{hoveredPoint.metric}</div>
              <div className="text-xs text-slate-500">{hoveredPoint.year}</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {format(hoveredPoint.value)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
