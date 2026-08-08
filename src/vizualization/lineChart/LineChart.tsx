"use client";

import { scaleLinear } from "d3-scale";
import { line, area, curveMonotoneX } from "d3-shape";
import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { LineItem } from "./LineItem";

const MARGIN = {
  top: 50,
  right: 40,
  bottom: 70,
  left: 75,
};

export type ClimateDriverType =
  | "surfaceTempAnomaly"
  | "seaSurfaceTempAnomaly"
  | "precipitationAnomaly"
  | "seaLevelAnomaly";

type ClimateDataPoint = {
  year: number;
  value: number;
};

type LineChartProps = {
  width: number;
  height: number;
  data: ClimateDataPoint[];
  dataType: ClimateDriverType;
  selectedCountry?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
};

/* =========================================================
   CLIMATE VARIABLE LABELS
   ========================================================= */

const getChartLabel = (
  dataType: ClimateDriverType
): string => {
  switch (dataType) {
    case "surfaceTempAnomaly":
      return "Surface Temperature";

    case "seaSurfaceTempAnomaly":
      return "Sea Surface Temperature";

    case "precipitationAnomaly":
      return "Rainfall Anomaly";

    case "seaLevelAnomaly":
      return "Sea Level Rise";

    default:
      return "Climate Indicator";
  }
};

/* =========================================================
   UNITS
   ========================================================= */

const getUnit = (
  dataType: ClimateDriverType
): string => {
  switch (dataType) {
    case "surfaceTempAnomaly":
    case "seaSurfaceTempAnomaly":
      return "°C";

    case "precipitationAnomaly":
      return "mm";

    case "seaLevelAnomaly":
      return "m";

    default:
      return "";
  }
};

/* =========================================================
   DECIMAL PRECISION
   ========================================================= */

const getDecimalPlaces = (
  dataType: ClimateDriverType
): number => {
  switch (dataType) {
    case "surfaceTempAnomaly":
    case "seaSurfaceTempAnomaly":
      return 2;

    case "precipitationAnomaly":
      return 1;

    case "seaLevelAnomaly":
      return 3;

    default:
      return 2;
  }
};

/* =========================================================
   TREND TERMINOLOGY
   ========================================================= */

const getPositiveTrendLabel = (
  dataType: ClimateDriverType
): string => {
  switch (dataType) {
    case "surfaceTempAnomaly":
      return "warming";

    case "seaSurfaceTempAnomaly":
      return "warming";

    case "precipitationAnomaly":
      return "increasing anomaly";

    case "seaLevelAnomaly":
      return "rising";

    default:
      return "increasing";
  }
};

const getNegativeTrendLabel = (
  dataType: ClimateDriverType
): string => {
  switch (dataType) {
    case "surfaceTempAnomaly":
      return "cooling";

    case "seaSurfaceTempAnomaly":
      return "cooling";

    case "precipitationAnomaly":
      return "decreasing anomaly";

    case "seaLevelAnomaly":
      return "falling";

    default:
      return "decreasing";
  }
};

/* =========================================================
   TREND STRENGTH
   ========================================================= */

const getTrendThreshold = (
  dataType: ClimateDriverType,
  values: number[]
): number => {
  if (!values.length) return 0;

  const mean =
    values.reduce((sum, value) => sum + Math.abs(value), 0) /
    values.length;

  /*
   * Use a small data-dependent threshold rather than a
   * hard-coded climate threshold.
   *
   * This is only used to decide whether the fitted trend
   * is effectively flat for presentation purposes.
   */
  switch (dataType) {
    case "surfaceTempAnomaly":
    case "seaSurfaceTempAnomaly":
      return Math.max(mean * 0.005, 0.0001);

    case "precipitationAnomaly":
      return Math.max(mean * 0.005, 0.001);

    case "seaLevelAnomaly":
      return Math.max(mean * 0.005, 0.00001);

    default:
      return Math.max(mean * 0.005, 0.0001);
  }
};

/* =========================================================
   LINEAR REGRESSION
   =========================================================

   Calculates:

       y = intercept + slope * x

   where:
       x = year
       y = climate indicator

   We use the fitted slope rather than simply comparing
   first and last values.

   The slope is expressed per year and later converted
   to change per decade.
   ========================================================= */

const calculateLinearTrend = (
  data: ClimateDataPoint[]
) => {
  if (data.length < 2) {
    return {
      slope: 0,
      intercept: data[0]?.value ?? 0,
      rSquared: 0,
    };
  }

  const n = data.length;

  const meanYear =
    data.reduce((sum, d) => sum + d.year, 0) / n;

  const meanValue =
    data.reduce((sum, d) => sum + d.value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (const d of data) {
    const yearDifference = d.year - meanYear;
    const valueDifference = d.value - meanValue;

    numerator += yearDifference * valueDifference;
    denominator += yearDifference * yearDifference;
  }

  const slope =
    denominator !== 0
      ? numerator / denominator
      : 0;

  const intercept =
    meanValue - slope * meanYear;

  /*
   * R-squared
   *
   * This tells us how strongly a straight-line trend
   * describes the observed series.
   *
   * It is descriptive, not a causal climate statistic.
   */

  let ssTotal = 0;
  let ssResidual = 0;

  for (const d of data) {
    const predicted =
      intercept + slope * d.year;

    ssTotal +=
      Math.pow(d.value - meanValue, 2);

    ssResidual +=
      Math.pow(d.value - predicted, 2);
  }

  const rSquared =
    ssTotal > 0
      ? Math.max(
          0,
          Math.min(
            1,
            1 - ssResidual / ssTotal
          )
        )
      : 0;

  return {
    slope,
    intercept,
    rSquared,
  };
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export const LineChart = ({
  width,
  height,
  data,
  dataType,
  selectedCountry = "Selected Country",
  xAxisLabel = "Year",
  yAxisLabel,
  title,
}: LineChartProps) => {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    year: number;
    value: number;
  } | null>(null);

  const [hoveredPoint, setHoveredPoint] =
    useState<number | null>(null);

  const svgRef =
    useRef<SVGSVGElement>(null);

  const tooltipTimerRef =
    useRef<NodeJS.Timeout | null>(null);

  const boundsWidth = Math.max(
    0,
    width - MARGIN.left - MARGIN.right
  );

  const boundsHeight = Math.max(
    0,
    height - MARGIN.top - MARGIN.bottom
  );

  /* =======================================================
     SAFE DATA
     ======================================================= */

  const safeData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.filter(
      (d) =>
        d &&
        typeof d.year === "number" &&
        Number.isFinite(d.year) &&
        typeof d.value === "number" &&
        Number.isFinite(d.value)
    );
  }, [data]);

  /* =======================================================
     SORT DATA BY YEAR
     ======================================================= */

  const processedData = useMemo(
    () =>
      [...safeData].sort(
        (a, b) => a.year - b.year
      ),
    [safeData]
  );

  /* =======================================================
     BASIC STATISTICS
     ======================================================= */

  const stats = useMemo(() => {
    if (!processedData.length) {
      return null;
    }

    const first =
      processedData[0].value;

    const last =
      processedData[
        processedData.length - 1
      ].value;

    const firstYear =
      processedData[0].year;

    const lastYear =
      processedData[
        processedData.length - 1
      ].year;

    const period =
      lastYear - firstYear;

    /*
     * Absolute change.
     *
     * This is the actual difference between the
     * first and last observations.
     *
     * Unlike the previous percentage calculation,
     * this is meaningful for climate anomalies.
     */

    const absoluteChange =
      last - first;

    /*
     * Linear trend over the whole series.
     */

    const regression =
      calculateLinearTrend(processedData);

    const trendPerYear =
      regression.slope;

    const trendPerDecade =
      trendPerYear * 10;

    /*
     * Determine whether the fitted trend is effectively
     * flat.
     */

    const values =
      processedData.map(
        (d) => d.value
      );

    const threshold =
      getTrendThreshold(
        dataType,
        values
      );

    let trend: string;

    if (
      Math.abs(trendPerYear) <= threshold
    ) {
      trend = "relatively stable";
    } else if (
      trendPerYear > 0
    ) {
      trend =
        getPositiveTrendLabel(
          dataType
        );
    } else {
      trend =
        getNegativeTrendLabel(
          dataType
        );
    }

    /*
     * Range.
     */

    const minValue =
      Math.min(...values);

    const maxValue =
      Math.max(...values);

    /*
     * Mean.
     */

    const meanValue =
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / values.length;

    return {
      first,
      last,
      firstYear,
      lastYear,
      period,
      absoluteChange,
      trendPerYear,
      trendPerDecade,
      trend,
      minValue,
      maxValue,
      meanValue,
      rSquared:
        regression.rSquared,
    };
  }, [processedData, dataType]);

  /* =======================================================
     X SCALE
     ======================================================= */

  const xScale = useMemo(() => {
    if (!processedData.length) {
      return scaleLinear()
        .domain([0, 1])
        .range([0, boundsWidth]);
    }

    const years =
      processedData.map(
        (d) => d.year
      );

    const minYear =
      Math.min(...years);

    const maxYear =
      Math.max(...years);

    /*
     * Prevent zero-width domain if only one
     * observation exists.
     */

    if (minYear === maxYear) {
      return scaleLinear()
        .domain([
          minYear - 1,
          maxYear + 1,
        ])
        .range([0, boundsWidth]);
    }

    return scaleLinear()
      .domain([
        minYear,
        maxYear,
      ])
      .range([
        0,
        boundsWidth,
      ]);
  }, [
    processedData,
    boundsWidth,
  ]);

  /* =======================================================
     Y SCALE
     * ======================================================= */

  const yScale = useMemo(() => {
    if (!processedData.length) {
      return scaleLinear()
        .domain([0, 1])
        .range([
          boundsHeight,
          0,
        ]);
    }

    const values =
      processedData.map(
        (d) => d.value
      );

    let minVal =
      Math.min(...values);

    let maxVal =
      Math.max(...values);

    /*
     * If all values are identical, create
     * a small visual range around them.
     */

    if (minVal === maxVal) {
      const padding =
        Math.abs(minVal) * 0.1 ||
        0.1;

      minVal -= padding;
      maxVal += padding;
    } else {
      const padding =
        (maxVal - minVal) *
        0.1;

      minVal -= padding;
      maxVal += padding;
    }

    return scaleLinear()
      .domain([
        minVal,
        maxVal,
      ])
      .range([
        boundsHeight,
        0,
      ]);
  }, [
    processedData,
    boundsHeight,
  ]);

  /* =======================================================
     LINE BUILDER
     ======================================================= */

  const lineBuilder = useMemo(
    () =>
      line<ClimateDataPoint>()
        .x((d) =>
          xScale(d.year)
        )
        .y((d) =>
          yScale(d.value)
        )
        .curve(
          curveMonotoneX
        ),
    [xScale, yScale]
  );

  /* =======================================================
     AREA BUILDER
     ======================================================= */

  const areaBuilder = useMemo(
    () =>
      area<ClimateDataPoint>()
        .x((d) =>
          xScale(d.year)
        )
        .y0(boundsHeight)
        .y1((d) =>
          yScale(d.value)
        )
        .curve(
          curveMonotoneX
        ),
    [
      xScale,
      yScale,
      boundsHeight,
    ]
  );

  const linePath =
    lineBuilder(
      processedData
    );

  const areaPath =
    areaBuilder(
      processedData
    );

  const chartLabel =
    getChartLabel(
      dataType
    );

  const unit =
    getUnit(
      dataType
    );

  const decimalPlaces =
    getDecimalPlaces(
      dataType
    );

  /* =======================================================
     X AXIS TICKS
     ======================================================= */

  const xAxisTicks =
    useMemo(() => {
      if (!processedData.length) {
        return [];
      }

      const years =
        processedData.map(
          (d) => d.year
        );

      const minYear =
        Math.min(...years);

      const maxYear =
        Math.max(...years);

      const range =
        maxYear - minYear;

      if (range === 0) {
        return [minYear];
      }

      const targetTicks =
        Math.min(
          8,
          Math.max(
            5,
            Math.floor(
              boundsWidth / 70
            )
          )
        );

      const step =
        Math.max(
          1,
          Math.ceil(
            range /
              (targetTicks - 1)
          )
        );

      const niceSteps = [
        1,
        2,
        5,
        10,
        20,
        50,
        100,
      ];

      const niceStep =
        niceSteps.find(
          (s) => s >= step
        ) || step;

      const ticks: number[] =
        [];

      let start =
        Math.floor(
          minYear /
            niceStep
        ) * niceStep;

      while (
        start <= maxYear
      ) {
        if (
          start >= minYear &&
          start <= maxYear
        ) {
          ticks.push(start);
        }

        start += niceStep;
      }

      /*
       * Make sure the final year can appear
       * when appropriate.
       */

      if (
        ticks.length > 0 &&
        ticks[ticks.length - 1] !==
          maxYear
      ) {
        if (
          maxYear -
            ticks[ticks.length - 1] >
          niceStep / 2
        ) {
          ticks.push(maxYear);
        }
      }

      return ticks;
    }, [
      processedData,
      boundsWidth,
    ]);

  /* =======================================================
     TOOLTIP ENTER
     ======================================================= */

  const handleMouseEnter =
    useCallback(
      (
        event: React.MouseEvent,
        d: ClimateDataPoint
      ) => {
        if (
          tooltipTimerRef.current
        ) {
          clearTimeout(
            tooltipTimerRef.current
          );

          tooltipTimerRef.current =
            null;
        }

        const mouseX =
          event.clientX;

        const mouseY =
          event.clientY;

        setTooltip({
          x: mouseX + 15,
          y: mouseY - 10,
          year: d.year,
          value: d.value,
        });

        setHoveredPoint(
          d.year
        );
      },
      []
    );

  /* =======================================================
     TOOLTIP LEAVE
     ======================================================= */

  const handleMouseLeave =
    useCallback(() => {
      tooltipTimerRef.current =
        setTimeout(() => {
          setTooltip(null);
          setHoveredPoint(null);
        }, 100);
    }, []);

  /* =======================================================
     CLEANUP
     ======================================================= */

  useEffect(() => {
    return () => {
      if (
        tooltipTimerRef.current
      ) {
        clearTimeout(
          tooltipTimerRef.current
        );
      }
    };
  }, []);

  /* =======================================================
     NO DATA
     ======================================================= */

  if (
    !processedData.length
  ) {
    return null;
  }

  return (
    <div className="w-full relative">

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="text-center mb-6">

        {title && (
          <div className="text-base font-semibold text-slate-800 mb-2">
            {title}
          </div>
        )}

        {stats && (
          <div className="mt-2 text-sm text-slate-600">

            <span className="font-medium">
              {selectedCountry}
            </span>

            {" · "}

            <span className="font-medium">
              {chartLabel}
            </span>

            {" · "}

            <span
              className={
                stats.trend ===
                "relatively stable"
                  ? "text-slate-600 font-semibold"
                  : stats.trend.includes(
                      "cooling"
                    ) ||
                    stats.trend.includes(
                      "decreasing"
                    ) ||
                    stats.trend.includes(
                      "falling"
                    )
                  ? "text-blue-600 font-semibold"
                  : "text-red-600 font-semibold"
              }
            >
              {stats.trend}
            </span>

          </div>
        )}

        {/* =================================================
            CHANGE OVER PERIOD
            ================================================= */}

        {stats && (
          <div className="mt-2 text-xs text-slate-500">

            {stats.period > 0 ? (
              <>
                Change over{" "}
                {stats.period} years:{" "}
                <span className="font-semibold text-slate-700">
                  {stats.absoluteChange >=
                  0
                    ? "+"
                    : ""}
                  {stats.absoluteChange.toFixed(
                    decimalPlaces
                  )}{" "}
                  {unit}
                </span>
              </>
            ) : (
              <>
                Observation:{" "}
                <span className="font-semibold text-slate-700">
                  {stats.last.toFixed(
                    decimalPlaces
                  )}{" "}
                  {unit}
                </span>
              </>
            )}

          </div>
        )}

        {/* =================================================
            TREND PER DECADE
            ================================================= */}

        {stats &&
          processedData.length >=
            2 &&
          stats.period > 0 && (
            <div className="mt-1 text-xs text-slate-400">

              Linear trend:{" "}
              <span className="font-medium text-slate-500">

                {stats.trendPerDecade >=
                0
                  ? "+"
                  : ""}

                {stats.trendPerDecade.toFixed(
                  decimalPlaces
                )}{" "}
                {unit} / decade

              </span>

            </div>
          )}

        {/* =================================================
            RAINFALL RANGE
            ================================================= */}

        {stats &&
          dataType ===
            "precipitationAnomaly" && (
            <div className="mt-1 text-xs text-slate-400">

              Observed anomaly range:{" "}
              <span className="font-medium text-slate-500">

                {stats.minValue.toFixed(
                  decimalPlaces
                )}

                {" to "}

                {stats.maxValue.toFixed(
                  decimalPlaces
                )}{" "}
                {unit}

              </span>

            </div>
          )}

      </div>

      {/* ===================================================
          TOOLTIP
          =================================================== */}

      {tooltip && (
        <div
          className="fixed z-50 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform:
              "translate(0, 0)",
          }}
        >

          <div className="font-semibold text-amber-300">
            {selectedCountry}
          </div>

          <div className="text-slate-300">
            {chartLabel}
          </div>

          <div className="text-slate-300">
            Year:{" "}
            {tooltip.year}
          </div>

          <div className="text-slate-300">
            Value:{" "}
            {tooltip.value.toFixed(
              decimalPlaces
            )}{" "}
            {unit}
          </div>

        </div>
      )}

      {/* ===================================================
          CHART
          =================================================== */}

      <div className="relative">

        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="overflow-visible"
        >

          <g
            transform={`translate(${MARGIN.left},${MARGIN.top})`}
          >

            {/* =============================================
                AREA
                ============================================= */}

            {areaPath && (
              <path
                d={areaPath}
                fill="rgba(37, 99, 235, 0.1)"
                opacity={1}
              />
            )}

            {/* =============================================
                LINE
                ============================================= */}

            {linePath && (
              <LineItem
                path={linePath}
                color="#8d95a7"
                strokeWidth={3}
                opacity={1}
              />
            )}

            {/* =============================================
                DATA POINTS
                ============================================= */}

            {processedData.map(
              (d, i) => {
                const x =
                  xScale(d.year);

                const y =
                  yScale(d.value);

                const isHovered =
                  hoveredPoint ===
                  d.year;

                const pointRadius =
                  isHovered
                    ? 8
                    : 5;

                return (
                  <g
                    key={`${d.year}-${i}`}
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        e,
                        d
                      )
                    }
                    onMouseLeave={
                      handleMouseLeave
                    }
                    style={{
                      cursor:
                        "pointer",
                    }}
                  >

                    {/* Hover glow */}

                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r={
                          pointRadius +
                          4
                        }
                        fill="#b1b5be"
                        opacity={0.2}
                      />
                    )}

                    {/* Main point */}

                    <circle
                      cx={x}
                      cy={y}
                      r={pointRadius}
                      fill="#b0b5c1"
                      stroke="#fff"
                      strokeWidth={2.5}
                    />

                    {/* Year label */}

                    {isHovered && (
                      <text
                        x={x}
                        y={
                          y + 18
                        }
                        textAnchor="middle"
                        fontSize={9}
                        fill="#a8afbf"
                        fontWeight="600"
                      >
                        {d.year}
                      </text>
                    )}

                  </g>
                );
              }
            )}

            {/* =============================================
                X AXIS TICKS
                ============================================= */}

            {xAxisTicks.map(
              (year) => {
                const x =
                  xScale(year);

                const isHighlighted =
                  processedData.some(
                    (d) =>
                      d.year ===
                      year
                  );

                return (
                  <g
                    key={year}
                  >

                    <line
                      x1={x}
                      y1={
                        boundsHeight
                      }
                      x2={x}
                      y2={
                        boundsHeight +
                        5
                      }
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />

                    <text
                      x={x}
                      y={
                        boundsHeight +
                        20
                      }
                      fontSize={10}
                      textAnchor="middle"
                      fill={
                        isHighlighted
                          ? "#475569"
                          : "#94a3b8"
                      }
                    >
                      {year}
                    </text>

                  </g>
                );
              }
            )}

            {/* =============================================
                Y AXIS TICKS
                ============================================= */}

            {yScale
              .ticks(5)
              .map(
                (value) => {
                  const y =
                    yScale(
                      value
                    );

                  return (
                    <g
                      key={value}
                    >

                      <line
                        x1={-5}
                        y1={y}
                        x2={0}
                        y2={y}
                        stroke="#94a3b8"
                        strokeWidth="1"
                      />

                      <text
                        x={-8}
                        y={
                          y + 4
                        }
                        fontSize={10}
                        textAnchor="end"
                        fill="#94a3b8"
                      >
                        {value.toFixed(
                          decimalPlaces
                        )}
                      </text>

                    </g>
                  );
                }
              )}

            {/* =============================================
                X AXIS LABEL
                ============================================= */}

            <text
              x={
                boundsWidth / 2
              }
              y={
                boundsHeight +
                55
              }
              textAnchor="middle"
              fontSize={12}
              fill="#64748b"
            >
              {xAxisLabel}
            </text>

            {/* =============================================
                Y AXIS LABEL
                ============================================= */}

            <text
              x={
                -boundsHeight / 2
              }
              y={-55}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize={12}
              fill="#64748b"
            >
              {yAxisLabel ||
                `${chartLabel} (${unit})`}
            </text>

          </g>

        </svg>

      </div>

      {/* ===================================================
          INTERPRETATION / METHOD NOTE
          =================================================== */}

      <div className="mt-4 text-xs text-slate-400 text-center max-w-3xl mx-auto leading-relaxed">

        {dataType ===
        "precipitationAnomaly" ? (
          <>
            Rainfall is shown as an anomaly relative to
            its underlying reference period. The fitted
            trend describes the direction of the historical
            series, while the range shows how strongly
            individual observations vary.
          </>
        ) : (
          <>
            The trend is estimated from a linear fit across
            the observations shown. Change over the period
            is reported in the original measurement unit,
            rather than as a percentage of the starting
            anomaly.
          </>
        )}

      </div>

    </div>
  );
};
