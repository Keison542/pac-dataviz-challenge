"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DoughnutClimateDashboardProps {
  kpis: any;
  deltas?: any;
  selectedCountry: string;
  isLoading?: boolean;
}

// =====================================================
// WINNING IMPROVEMENT: DATA-DRIVEN NORMALIZATION
// =====================================================
const normalize = (value: number, min: number, max: number) => {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
};

// =====================================================
// BASELINE-AWARE STATISTICAL RANGES (replace thresholds)
// In a real upgrade, compute from historical dataset
// =====================================================
const stats = {
  temp: { min: -1, max: 2 },
  sea_surface_temperature: { min: -1, max: 2 },
  rainfall: { min: -100, max: 200 },
  sea: { min: 0, max: 0.5 },
};

const metricMeta = {
  temp: { label: "Air Temperature", color: "#f97316" },
  sea_surface_temperature: { label: "Sea Surface Temp", color: "#0ea5e9" },
  rainfall: { label: "Rainfall Anomaly", color: "#06b6d4" },
  sea: { label: "Sea Level Rise", color: "#2563eb" },
};

export function DoughnutClimateDashboard({
  kpis,
  selectedCountry,
  isLoading,
}: DoughnutClimateDashboardProps) {

  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [shock, setShock] = useState(false);

  const safeKpis = kpis || {};

  // =====================================================
  // WINNING IMPROVEMENT: ANOMALY-BASED INDEX
  // =====================================================
  const climateIndex = useMemo(() => {
    const temp = Math.abs(safeKpis.temp ?? 0);
    const seaTemp = Math.abs(safeKpis.sea_surface_temperature ?? 0);
    const rainfall = Math.abs(safeKpis.rainfall ?? 0);
    const sea = Math.abs(safeKpis.sea ?? 0);

    const tempScore = normalize(temp, stats.temp.min, stats.temp.max);
    const seaTempScore = normalize(seaTemp, stats.sea_surface_temperature.min, stats.sea_surface_temperature.max);
    const rainfallScore = normalize(rainfall, stats.rainfall.min, stats.rainfall.max);
    const seaScore = normalize(sea, stats.sea.min, stats.sea.max);

    return Math.round(
      tempScore * 0.35 +
      seaTempScore * 0.25 +
      rainfallScore * 0.2 +
      seaScore * 0.2
    );
  }, [safeKpis]);

  const signal =
    climateIndex < 25
      ? { label: "Low Instability", color: "text-slate-500" }
      : climateIndex < 50
      ? { label: "Moderate Instability", color: "text-blue-500" }
      : climateIndex < 75
      ? { label: "High Instability", color: "text-orange-500" }
      : { label: "Critical Instability", color: "text-red-500" };

  // shock effect (system instability moment)
  useEffect(() => {
    if (climateIndex > 70) {
      setShock(true);
      const t = setTimeout(() => setShock(false), 600);
      return () => clearTimeout(t);
    }
  }, [climateIndex]);

  const metrics = [
    { key: "temp", value: safeKpis.temp ?? 0 },
    { key: "sea_surface_temperature", value: safeKpis.sea_surface_temperature ?? 0 },
    { key: "rainfall", value: safeKpis.rainfall ?? 0 },
    { key: "sea", value: safeKpis.sea ?? 0 },
  ];

  const hasData = metrics.some(m => Math.abs(m.value) > 0.01);
  if (isLoading || !hasData) return null;

  const MetricCircle = ({ m }: any) => {
    const meta = metricMeta[m.key];
    const val = Math.abs(m.value);

    const pct = normalize(val, stats[m.key as keyof typeof stats].min, stats[m.key as keyof typeof stats].max);

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        onMouseEnter={() => setActiveMetric(m.key)}
        onMouseLeave={() => setActiveMetric(null)}
        className="flex items-center gap-3 cursor-pointer"
      >
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />

            <motion.circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke={meta.color}
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 18}
              initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 18 * (1 - pct / 100),
              }}
              transition={{ duration: 0.6 }}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
            {m.value.toFixed(1)}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium">
            {meta.icon} {meta.label}
          </div>
          <div className="text-[10px] text-slate-400">
            {pct.toFixed(0)}% anomaly intensity
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      animate={{
        backgroundColor: shock ? "rgba(239, 68, 68, 0.04)" : "transparent",
      }}
      className="w-full max-w-6xl mx-auto mb-12 rounded-xl"
    >

      {/* ===================== HEADER ===================== */}
      <div className="text-center mb-8">

        {/* WINNING ADDITION: CONTEXT */}
        {/* <div className="text-[10px] uppercase tracking-widest text-slate-400">
          baseline: 1950–1980 climate normal
        </div> */}

        <div className="text-xs font-semibold tracking-widest text-slate-500 mt-2">
        Let's begin with the numbers to understand the scale of climate-related consequences. Numbers rarely tell the whole story, but they provide a clear signal of rising climate pressures across the Pacific. This is evident in a climate anomaly index derived for each country from historical trends in temperature, rainfall, sea surface temperature, and sea level.
        </div>

        <div className="flex items-center justify-center gap-3 mt-2">

          <AnimatePresence mode="wait">
            <motion.div
              key={climateIndex}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{
                opacity: 1,
                scale: shock ? 1.15 : 1,
                color: shock ? "#dc2626" : "#0f172a",
              }}
              className="text-5xl font-bold"
            >
              {climateIndex}
            </motion.div>
          </AnimatePresence>

          <div className={`text-sm font-semibold ${signal.color}`}>
            {signal.label}
          </div>

        </div>

        {/* <div className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
          Composite deviation from historical climate norms across temperature, rainfall, sea surface temperature, and sea level.
        </div> */}

        <div className="w-full max-w-xs mx-auto mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 via-orange-400 to-red-500"
            animate={{ width: `${climateIndex}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>

        {climateIndex > 70 && (
          <div className="mt-3 text-sm font-semibold text-red-600">
            System entering high instability regime
          </div>
        )}

        <div className="text-sm font-semibold mt-6">
          SIGNAL DETECTION · {selectedCountry}
        </div>

      </div>

      {/* ===================== METRICS ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <MetricCircle key={m.key} m={m} />
        ))}
      </div>

       <p>
          A measurable climate anomaly is emerging. Could this be a warning that the ocean and climate related disaster such as {" "}
              <a
                href="https://www.pacificmet.net/news/el-nino-likely-mid-2026-pacific-islands-climate-outlook-forum-18-warns"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-700 underline underline-offset-2"
              >
                current El Niño
              </a>{" "}
              across the countries in the Pacific including PNG is sending a warning. 
        </p>

    </motion.div>
  );
}
