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

const MARGIN = { top: 50, right: 50, bottom: 70, left: 160 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    unit: "t/ha",
    color: "#1a1a2e",
    lightColor: "#4a4a6a",
    bgColor: "#f0f0f5",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    unit: "tons",
    color: "#4a4a6a",
    lightColor: "#7a7a9a",
    bgColor: "#f5f5f8",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    unit: "",
    color: "#94a3b8",
    lightColor: "#c0c8d0",
    bgColor: "#fafafa",
  },
];

// Trend metric (aggregated from all metrics)
const TREND_METRIC = {
  key: "trend",
  label: "Overall Trend (Aggregated)",
  color: "#0ea5e9",
  lightColor: "#7dd3fc",
  bgColor: "#f0f9ff",
};

// Bubble Chart metric (country-level data)
const BUBBLE_METRIC = {
  key: "bubble",
  label: "Country-Level Impact",
  color: "#ef4444",
  lightColor: "#fca5a5",
  bgColor: "#fef2f2",
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

  // ─── Responsive sizing ───
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 600;
        const height = propHeight || Math.min(rect.width * 0.6, 550);
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

  // ─── Responsive margins ───
  const responsiveMargin = useMemo(() => {
    if (width < 400) {
      return { top: 40, right: 15, bottom: 50, left: 110 };
    }
    if (width < 600) {
      return { top: 45, right: 20, bottom: 60, left: 130 };
    }
    if (width < 768) {
      return { top: 48, right: 30, bottom: 65, left: 145 };
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

  // ─── Responsive font sizes ───
  const getFontSize = useCallback((base: number) => {
    if (width < 400) return base * 0.5;
    if (width < 600) return base * 0.65;
    if (width < 768) return base * 0.8;
    if (width < 1024) return base * 0.9;
    return base;
  }, [width]);

  // ─── Metric rows for Y-axis ───
  const metricRows = useMemo(() => {
    const rows: string[] = [];
    
    // Add metric rows
    METRICS.filter((m) => visibleMetrics.has(m.key)).forEach((m) => {
      rows.push(m.label);
    });
    
    // Add trend row
    if (showTrend) rows.push(TREND_METRIC.label);
    
    // Add bubble chart row
    if (showBubble) rows.push(BUBBLE_METRIC.label);
    
    return rows;
  }, [visibleMetrics, showTrend, showBubble]);

  // ─── Compute trend data ───
  const trendData = useMemo(() => {
    const map = new Map<number, number>();

    data.forEach((d) => {
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
  }, [data, visibleMetrics]);

  // ─── Compute bubble chart data (simulated country-level data) ───
  const bubbleData = useMemo(() => {
    // Simulate country-level data based on the selected country's data
    // In a real implementation, this would come from a separate data source
    const countries = ["Fiji", "Samoa", "Tonga", "Vanuatu", "Solomon Islands"];
    const result: { country: string; year: number; value: number }[] = [];

    data.forEach((d) => {
      // Use cropYield as a proxy for country-level impact
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
  }, [data]);

  const maxBubbleValue = useMemo(
    () => Math.max(...bubbleData.map((d) => d.value), 1),
    [bubbleData]
  );

  // ─── Scales ───
  const xScale = useMemo(() => {
    const years = data.map((d) => d.year);
    return scaleLinear()
      .domain([Math.min(...years), Math.max(...years)])
      .range([0, boundsWidth]);
  }, [data, boundsWidth]);

  const yScale = useMemo(() => {
    return scaleBand()
      .domain(metricRows)
      .range([0, boundsHeight])
      .padding(0.4);
  }, [metricRows, boundsHeight]);

  // ─── Bubble radius scale ───
  const radiusScale = useMemo(() => {
    let maxValue = 0;

    data.forEach((d) => {
      METRICS.forEach((m) => {
        if (visibleMetrics.has(m.key)) {
          maxValue = Math.max(
            maxValue,
            d[m.key as keyof DataPoint] as number
          );
        }
      });
    });

    // Also include trend data
    trendData.forEach((d) => {
      maxValue = Math.max(maxValue, d.value);
    });

    // Also include bubble data
    maxValue = Math.max(maxValue, maxBubbleValue);

    const maxRadius = width < 500 ? 16 : width < 768 ? 20 : 26;
    return scaleSqrt()
      .domain([0, maxValue || 1])
      .range([3, maxRadius]);
  }, [data, visibleMetrics, trendData, maxBubbleValue, width]);

  // ─── Dynamic ticks ───
  const xTicks = useMemo(() => {
    const years = data.map((d) => d.year);
    const min = Math.min(...years);
    const max = Math.max(...years);
    
    const maxTicks = width < 500 ? 4 : width < 768 ? 5 : 7;
    const step = Math.max(1, Math.floor((max - min) / maxTicks));
    
    const ticks: number[] = [];
    for (let y = min; y <= max; y += step) ticks.push(y);
    if (ticks[ticks.length - 1] !== max) ticks.push(max);

    return ticks;
  }, [data, width]);

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
        <div className="mb-4 text-center">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Structural System Shift
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed mt-1">
            Long-term socioeconomic indicators reveal how climate pressure gradually reshapes
            national economic structures and adaptive capacity.
          </p>
          <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed mt-2">
            Larger circles indicate periods where livelihood systems carried greater economic importance or
            production value. Patterns reveal how resilience shifted across food production, livelihood assets and
            tourism.
          </p>
        </div>

        {/* ─── LEGEND ─── */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
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
                  boxShadow: isVisible ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
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
              boxShadow: showTrend ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
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
              boxShadow: showBubble ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
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
              {/* ─── LIGHT BACKGROUND ROWS ─── */}
              {metricRows.map((row, index) => {
                const yPos = yScale(row) ?? 0;
                const metric = METRICS.find(m => m.label === row);
                const isTrend = row === TREND_METRIC.label;
                const isBubble = row === BUBBLE_METRIC.label;
                
                let bgColor = index % 2 === 0 ? "#f8fafc" : "transparent";
                if (isTrend) bgColor = TREND_METRIC.bgColor;
                if (isBubble) bgColor = BUBBLE_METRIC.bgColor;
                if (metric) bgColor = metric.bgColor;
                
                return (
                  <rect
                    key={`bg-${row}`}
                    x={0}
                    y={yPos}
                    width={boundsWidth}
                    height={yScale.bandwidth()}
                    fill={bgColor}
                    rx={2}
                  />
                );
              })}

              {/* ─── GRID - Horizontal lines ─── */}
              {metricRows.map((row) => {
                const yPos = yScale(row) ?? 0;
                return (
                  <line
                    key={`grid-${row}`}
                    x1={0}
                    x2={boundsWidth}
                    y1={yPos + yScale.bandwidth()}
                    y2={yPos + yScale.bandwidth()}
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* ─── GRID - Vertical lines ─── */}
              {xTicks.map((x, i) => {
                const xPos = xScale(x);
                if (xPos < 5 || xPos > boundsWidth - 5) return null;
                
                return (
                  <line
                    key={`grid-x-${i}`}
                    x1={xPos}
                    x2={xPos}
                    y1={0}
                    y2={boundsHeight}
                    stroke="#f1f5f9"
                    strokeDasharray="3 3"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* ─── CONNECTING LINES (between bubbles) ─── */}
              {METRICS.map((metric) => {
                if (!visibleMetrics.has(metric.key)) return null;
                
                const points = data
                  .map((d) => {
                    const value = d[metric.key as keyof DataPoint] as number;
                    if (value === 0) return null;
                    return {
                      x: xScale(d.year),
                      y: (yScale(metric.label) ?? 0) + yScale.bandwidth() / 2,
                      value,
                    };
                  })
                  .filter((p) => p !== null);

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
                    strokeWidth={1.5}
                    strokeOpacity={0.15}
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* ─── CONNECTING LINES FOR TREND ─── */}
              {showTrend && trendData.length > 1 && (
                <path
                  d={trendData
                    .map((d, i) => {
                      const cx = xScale(d.year);
                      const cy = (yScale(TREND_METRIC.label) ?? 0) + yScale.bandwidth() / 2;
                      return `${i === 0 ? 'M' : 'L'} ${cx} ${cy}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke={TREND_METRIC.color}
                  strokeWidth={2}
                  strokeOpacity={0.2}
                  strokeDasharray="4 4"
                />
              )}

              {/* ─── CONNECTING LINES FOR BUBBLE CHART ─── */}
              {showBubble && bubbleData.length > 0 && (
                <>
                  {Array.from(new Set(bubbleData.map(d => d.country))).map((country) => {
                    const points = bubbleData
                      .filter(d => d.country === country)
                      .sort((a, b) => a.year - b.year)
                      .map(d => ({
                        x: xScale(d.year),
                        y: (yScale(BUBBLE_METRIC.label) ?? 0) + yScale.bandwidth() / 2,
                        value: d.value,
                      }))
                      .filter(p => p !== null);

                    if (points.length < 2) return null;

                    const linePath = points
                      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                      .join(' ');

                    return (
                      <path
                        key={`bubble-line-${country}`}
                        d={linePath}
                        fill="none"
                        stroke={BUBBLE_METRIC.color}
                        strokeWidth={1}
                        strokeOpacity={0.1}
                        strokeDasharray="2 4"
                      />
                    );
                  })}
                </>
              )}

              {/* ─── BUBBLES FOR METRICS ─── */}
              {data.map((d) =>
                METRICS.map((metric) => {
                  if (!visibleMetrics.has(metric.key)) return null;

                  const value = d[metric.key as keyof DataPoint] as number;
                  if (value === 0) return null;

                  const cx = xScale(d.year);
                  const cy = (yScale(metric.label) ?? 0) + yScale.bandwidth() / 2;

                  const isActive =
                    hoveredPoint?.metric === metric.label &&
                    hoveredPoint?.year === d.year;

                  const radius = radiusScale(value);
                  if (radius < 2) return null;

                  const metricConfig = METRICS.find(m => m.label === metric.label);
                  const color = metricConfig?.color || '#94a3b8';

                  return (
                    <g key={`${metric.key}-${d.year}`}>
                      {isActive && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius + 6}
                          fill={color}
                          opacity={0.08}
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={color}
                        opacity={isActive ? 0.95 : 0.6}
                        stroke="white"
                        strokeWidth={isActive ? 2 : 1}
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
                      {radius > 12 && (
                        <text
                          x={cx}
                          y={cy + 3}
                          textAnchor="middle"
                          fontSize={Math.min(8, radius * 0.4)}
                          fill="white"
                          fontWeight="500"
                          opacity={0.8}
                        >
                          {format(value)}
                        </text>
                      )}
                    </g>
                  );
                })
              )}

              {/* ─── BUBBLES FOR TREND ─── */}
              {showTrend && trendData.map((d, i) => {
                const cx = xScale(d.year);
                const cy = (yScale(TREND_METRIC.label) ?? 0) + yScale.bandwidth() / 2;

                const isActive =
                  hoveredPoint?.metric === TREND_METRIC.label &&
                  hoveredPoint?.year === d.year;

                const radius = radiusScale(d.value);
                if (radius < 2) return null;

                const isLast = i === trendData.length - 1;

                return (
                  <g key={`trend-${d.year}`}>
                    {isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 6}
                        fill={TREND_METRIC.color}
                        opacity={0.08}
                      />
                    )}
                    {isLast && !isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 4}
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
                      strokeWidth={isLast ? 2 : 1}
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
                    {radius > 12 && (
                      <text
                        x={cx}
                        y={cy + 3}
                        textAnchor="middle"
                        fontSize={Math.min(8, radius * 0.4)}
                        fill="white"
                        fontWeight="500"
                        opacity={0.8}
                      >
                        {format(d.value)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ─── BUBBLES FOR BUBBLE CHART ─── */}
              {showBubble && bubbleData.map((d, i) => {
                const cx = xScale(d.year);
                const cy = (yScale(BUBBLE_METRIC.label) ?? 0) + yScale.bandwidth() / 2;

                const isActive =
                  hoveredPoint?.metric === BUBBLE_METRIC.label &&
                  hoveredPoint?.year === d.year;

                const radius = radiusScale(d.value);
                if (radius < 2) return null;

                // Random offset for country bubbles to show distribution
                const countryIndex = Array.from(new Set(bubbleData.map(b => b.country))).indexOf(d.country);
                const offset = (countryIndex / 10) * yScale.bandwidth() * 0.3 - yScale.bandwidth() * 0.15;

                return (
                  <g key={`bubble-${d.country}-${d.year}`}>
                    {isActive && (
                      <circle
                        cx={cx + offset}
                        cy={cy}
                        r={radius + 6}
                        fill={BUBBLE_METRIC.color}
                        opacity={0.08}
                      />
                    )}
                    <circle
                      cx={cx + offset}
                      cy={cy}
                      r={radius}
                      fill={BUBBLE_METRIC.color}
                      opacity={isActive ? 0.95 : 0.4}
                      stroke="white"
                      strokeWidth={isActive ? 2 : 0.5}
                      onMouseEnter={() =>
                        setHoveredPoint({
                          metric: `${BUBBLE_METRIC.label}: ${d.country}`,
                          year: d.year,
                          value: d.value,
                          x: cx + offset,
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
                    {radius > 10 && (
                      <text
                        x={cx + offset}
                        y={cy + 3}
                        textAnchor="middle"
                        fontSize={Math.min(6, radius * 0.3)}
                        fill="white"
                        fontWeight="500"
                        opacity={0.7}
                      >
                        {d.country.slice(0, 3)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ─── X-AXIS TICK LABELS ─── */}
              {xTicks.map((x, i) => {
                const xPos = xScale(x);
                if (xPos < 5 || xPos > boundsWidth - 5) return null;
                
                const isLastYear = i === xTicks.length - 1;
                
                return (
                  <text
                    key={`x-label-${i}`}
                    x={xPos}
                    y={boundsHeight + 18}
                    textAnchor="middle"
                    fontSize={Math.max(9, fontSize * 0.8)}
                    fill={isLastYear ? "#1a1a2e" : "#94a3b8"}
                    fontWeight={isLastYear ? "600" : "400"}
                  >
                    {x}
                  </text>
                );
              })}

              {/* ─── X-AXIS LABEL ─── */}
              <text
                x={boundsWidth / 2}
                y={boundsHeight + 40}
                textAnchor="middle"
                fontSize={fontSize * 0.7}
                fill="#94a3b8"
                letterSpacing="0.08em"
                className="uppercase"
              >
                Year
              </text>

              {/* ─── Y-AXIS TICK LABELS ─── */}
              {metricRows.map((metric) => {
                const yPos = yScale(metric) ?? 0;
                const isLast = metric === metricRows[metricRows.length - 1];
                const isTrend = metric === TREND_METRIC.label;
                const isBubble = metric === BUBBLE_METRIC.label;
                
                let color = isLast ? "#1a1a2e" : "#475569";
                if (isTrend) color = TREND_METRIC.color;
                if (isBubble) color = BUBBLE_METRIC.color;
                
                return (
                  <text
                    key={`y-label-${metric}`}
                    x={-14}
                    y={yPos + yScale.bandwidth() / 2 + 4}
                    textAnchor="end"
                    fontSize={Math.max(8, fontSize * 0.8)}
                    fill={color}
                    fontWeight={isTrend || isBubble ? "600" : (isLast ? "600" : "500")}
                  >
                    {metric}
                  </text>
                );
              })}

              {/* ─── Y-AXIS LABEL ─── */}
              <text
                transform="rotate(-90)"
                x={-boundsHeight / 2}
                y={-(responsiveMargin.left - 10)}
                textAnchor="middle"
                fontSize={fontSize * 0.7}
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
              className="absolute rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3 text-xs shadow-lg pointer-events-none z-10"
              style={{
                left: Math.min(
                  hoveredPoint.x + responsiveMargin.left + 14,
                  width - 170
                ),
                top: Math.min(
                  hoveredPoint.y + responsiveMargin.top - 10,
                  height - 90
                ),
                maxWidth: Math.min(190, width - 40),
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
            <div className="mt-3 text-center bg-white border border-slate-200 rounded-lg p-2.5 mx-2 shadow-sm">
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
