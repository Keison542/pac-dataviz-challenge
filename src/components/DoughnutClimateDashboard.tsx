"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

// =====================================================
// TYPES
// =====================================================

interface ClimateReferenceRange {
  min: number;
  max: number;
}

interface ClimateReferenceRanges {
  temp: ClimateReferenceRange;

  sea_surface_temperature:
    ClimateReferenceRange;

  rainfall:
    ClimateReferenceRange;

  sea:
    ClimateReferenceRange;
}

interface DoughnutClimateDashboardProps {
  kpis: any;

  deltas?: any;

  selectedCountry: string;

  isLoading?: boolean;

  climateReferenceRanges:
    ClimateReferenceRanges;
}

// =====================================================
// BOUND VALUE TO 0–100
// =====================================================
//
// IMPORTANT:
//
// This is ONLY a visual position within the
// observed reference range.
//
// It is NOT:
// - a climate-risk score
// - an anomaly percentage
// - a probability
// - a causal effect
//
// =====================================================

const normalizeToReferenceRange = (
  value: number,
  min: number,
  max: number
) => {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max)
  ) {
    return 0;
  }

  if (max === min) {
    return 50;
  }

  const score =
    ((value - min) /
      (max - min)) *
    100;

  return Math.max(
    0,
    Math.min(100, score)
  );
};

// =====================================================
// METRIC METADATA
// =====================================================

const metricMeta = {
  temp: {
    label: "Air Temperature",
    unit: "°C",
    color: "#f97316",
  },

  sea_surface_temperature: {
    label:
      "Sea Surface Temperature",
    unit: "°C",
    color: "#0ea5e9",
  },

  rainfall: {
    label: "Rainfall Anomaly",
    unit: "mm",
    color: "#06b6d4",
  },

  sea: {
    label: "Sea Level Rise",
    unit: "m",
    color: "#2563eb",
  },
};

// =====================================================
// COMPONENT
// =====================================================

export function DoughnutClimateDashboard({
  kpis,
  selectedCountry,
  isLoading,
  climateReferenceRanges,
}: DoughnutClimateDashboardProps) {
  const [
    activeMetric,
    setActiveMetric,
  ] = useState<string | null>(
    null
  );

  const safeKpis = kpis || {};

  // =====================================================
  // CURRENT COUNTRY VALUES
  // =====================================================

  const metrics = useMemo(
    () => [
      {
        key: "temp",
        value: Number(
          safeKpis.temp ?? 0
        ),
      },

      {
        key:
          "sea_surface_temperature",
        value: Number(
          safeKpis
            .sea_surface_temperature ??
            0
        ),
      },

      {
        key: "rainfall",
        value: Number(
          safeKpis.rainfall ?? 0
        ),
      },

      {
        key: "sea",
        value: Number(
          safeKpis.sea ?? 0
        ),
      },
    ],
    [safeKpis]
  );

  // =====================================================
  // DATA CHECK
  // =====================================================

  const hasData = metrics.some(
    (m) =>
      Number.isFinite(m.value) &&
      Math.abs(m.value) > 0.01
  );

  if (
    isLoading ||
    !hasData
  ) {
    return null;
  }

  // =====================================================
  // INDIVIDUAL METRIC
  // =====================================================

  const MetricCircle = ({
    m,
  }: {
    m: {
      key: string;
      value: number;
    };
  }) => {
    const meta =
      metricMeta[
        m.key as keyof typeof metricMeta
      ];

    const range =
      climateReferenceRanges[
        m.key as keyof ClimateReferenceRanges
      ];

    const value =
      Number.isFinite(m.value)
        ? m.value
        : 0;

    // ===================================================
    // DATA-DRIVEN REFERENCE POSITION
    // ===================================================

    const pct =
      normalizeToReferenceRange(
        value,
        range.min,
        range.max
      );

    const circumference =
      2 * Math.PI * 18;

    const strokeOffset =
      circumference *
      (1 - pct / 100);

    return (
      <motion.div
        whileHover={{
          scale: 1.04,
        }}
        transition={{
          duration: 0.2,
        }}
        onMouseEnter={() =>
          setActiveMetric(m.key)
        }
        onMouseLeave={() =>
          setActiveMetric(null)
        }
        className="flex items-center gap-3 cursor-pointer"
      >
        {/* =============================================
            VISUAL CIRCLE
        ============================================= */}

        <div className="relative w-14 h-14 flex-shrink-0">
          <svg
            className="w-14 h-14 transform -rotate-90"
            viewBox="0 0 48 48"
          >
            {/* Background ring */}
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3.5"
            />

            {/* Data-driven ring */}
            <motion.circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke={meta.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={
                circumference
              }
              initial={{
                strokeDashoffset:
                  circumference,
              }}
              animate={{
                strokeDashoffset:
                  strokeOffset,
              }}
              transition={{
                duration: 0.7,
                ease: "easeOut",
              }}
            />
          </svg>

          {/* Actual value in circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-800">
              {value.toFixed(1)}
            </span>
          </div>
        </div>

        {/* =============================================
            TEXT INFORMATION
        ============================================= */}

        <div className="min-w-0">
          {/* Indicator name */}
          <div className="text-xs font-medium text-slate-800">
            {meta.label}
          </div>

          {/* Actual measurement */}
          <div className="text-[10px] text-slate-400 mt-0.5">
            {value.toFixed(1)}{" "}
            {meta.unit}
          </div>

          {/* Data-driven position */}
          <div className="text-[10px] text-slate-400">
            Position in regional range:{" "}
            {pct.toFixed(0)}%
          </div>
        </div>
      </motion.div>
    );
  };

  // =====================================================
  // MAIN RETURN
  // =====================================================

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
      }}
      className="w-full max-w-6xl mx-auto mb-12"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="text-center mb-10">

        {/* Section label */}

        <div className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-4">
          Climate Signal ·{" "}
          {selectedCountry}
        </div>

        {/* Main heading */}

        <h3 className="text-3xl md:text-4xl font-semibold text-slate-900">
          Four indicators reveal changing conditions
        </h3>

        {/* Explanation */}

        <p className="mx-auto max-w-3xl mt-4 text-slate-600 leading-relaxed">
          Climate change is measured
          through many signals. For{" "}
          <strong>
            {selectedCountry}
          </strong>
          , temperature, sea surface
          temperature, rainfall and sea
          level reveal different aspects
          of how environmental conditions
          have changed over time.
        </p>

        {/* =================================================
            METHODOLOGY NOTE
        ================================================= */}

        <div className="mx-auto max-w-2xl mt-4 text-xs text-slate-400 leading-relaxed">
          Circle position shows where the
          selected country's latest value
          falls within the observed regional
          reference range. The range is based
          on the 5th–95th percentiles of the
          available historical observations.
        </div>
      </div>

      {/* =================================================
          FOUR CLIMATE INDICATORS
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map(
          (m) => (
            <MetricCircle
              key={m.key}
              m={m}
            />
          )
        )}
      </div>

      {/* =================================================
          ACTIVE METRIC
      ================================================= */}

      <div className="min-h-[32px] mt-6 text-center">
        {activeMetric && (
          <motion.div
            initial={{
              opacity: 0,
              y: 5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="text-xs text-slate-500"
          >
            {
              metricMeta[
                activeMetric as keyof typeof metricMeta
              ]?.label
            }
          </motion.div>
        )}
      </div>

      {/* =================================================
          TRANSITION TO HUMAN CONSEQUENCES
      ================================================= */}

      <p className="mx-auto max-w-3xl text-center text-slate-600 leading-relaxed mt-8">
        These signals describe changing
        environmental conditions—not
        isolated events. Across the
        Pacific, their consequences become
        more visible when climate pressures
        reach economies, livelihoods and
        communities.
      </p>
    </motion.div>
  );
}
