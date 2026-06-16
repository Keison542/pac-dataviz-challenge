"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DoughnutClimateDashboardProps {
  kpis: any;
  deltas: any;
  selectedCountry: string;
  isLoading?: boolean;
}

const thresholds: Record<string, any> = {
  temp: { max: 2.0, unit: "°C", label: "Surface Temp", isReversed: false, color: "#f97316", icon: "🌡️" },
  sea_surface_temperature: { max: 2.0, unit: "°C", label: "Sea Surface Temp", isReversed: false, color: "#0ea5e9", icon: "🌊" },
  rainfall: { max: 200, unit: "mm", label: "Rainfall", isReversed: false, color: "#06b6d4", icon: "🌧️" },
  sea: { max: 0.5, unit: "cm", label: "Sea Level", isReversed: false, color: "#2563eb", icon: "🌊", multiplier: 100 },

  climate_altering_land: {
    max: 100000,
    unit: "ha",
    label: "Land Cover",
    isReversed: false,
    color: "#84cc16",
    icon: "🌿",
    multiplier: 0.001,
  },

  crop_yield: { max: 10, unit: "t/ha", label: "Crop Yield", isReversed: true, color: "#eab308", icon: "🌾" },
  lifestock_yield: { max: 20, unit: "t", label: "Livestock", isReversed: true, color: "#f59e0b", icon: "🐄" },

  loss: {
    max: 1e8,
    unit: "M USD",
    label: "Economic Loss",
    isReversed: true,
    multiplier: 1e-6,
    color: "#ef4444",
    icon: "💸",
  },

  tourist_arrival: {
    max: 1e6,
    unit: "K",
    label: "Tourist Arrivals",
    isReversed: false,
    multiplier: 0.001,
    color: "#8b5cf6",
    icon: "✈️",
  },

  people: {
    max: 1e5,
    unit: "K",
    label: "People Affected",
    isReversed: true,
    multiplier: 0.001,
    color: "#dc2626",
    icon: "👥",
  },

  population_growth: {
    max: 3,
    unit: "%",
    label: "Population Growth",
    isReversed: false,
    color: "#64748b",
    icon: "📈",
  },
};

export function DoughnutClimateDashboard({
  kpis,
  selectedCountry,
  isLoading,
}: DoughnutClimateDashboardProps) {
  const [activeMetric, setActiveMetric] = useState<string | null>(null);

  const safeKpis = kpis || {};

  const metrics = [
    { key: "temp", value: safeKpis.temp ?? 0 },
    { key: "sea_surface_temperature", value: safeKpis.sea_surface_temperature ?? 0 },
    { key: "rainfall", value: safeKpis.rainfall ?? 0 },
    { key: "sea", value: safeKpis.sea ?? 0 },
    { key: "climate_altering_land", value: safeKpis.climate_altering_land ?? 0 },
    { key: "crop_yield", value: safeKpis.crop_yield ?? 0 },
    { key: "lifestock_yield", value: safeKpis.lifestock_yield ?? 0 },
    { key: "loss", value: safeKpis.loss ?? 0 },
    { key: "tourist_arrival", value: safeKpis.tourist_arrival ?? 0 },
    { key: "people", value: safeKpis.people ?? 0 },
    { key: "population_growth", value: safeKpis.population_growth ?? 0 },
  ];

  const climateIndex =
    metrics.reduce((acc, m) => {
      const t = thresholds[m.key];
      const normalized = Math.min(100, (Math.abs(m.value) / t.max) * 100);
      return acc + normalized;
    }, 0) / metrics.length;

  const MetricRing = ({ m }: any) => {
    const t = thresholds[m.key];

    const pct = t.isReversed
      ? 100 - Math.min(100, (Math.abs(m.value) / t.max) * 100)
      : Math.min(100, (Math.abs(m.value) / t.max) * 100);

    const displayVal = t.multiplier
      ? (m.value * t.multiplier).toFixed(1)
      : m.value.toFixed(1);

    return (
      <motion.div
        layout
        onMouseEnter={() => setActiveMetric(m.key)}
        onMouseLeave={() => setActiveMetric(null)}
        className="flex items-center gap-3 cursor-pointer"
        whileHover={{ scale: 1.03 }}
      >
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />

            <motion.circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke={t.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 18}
              initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 18 * (1 - pct / 100),
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
            <AnimatePresence mode="wait">
              <motion.span
                key={displayVal}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                {displayVal}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div>
          <div className="text-xs font-medium">
            {t.icon} {t.label}
          </div>
          <div className="text-[10px] text-slate-400">
            {pct.toFixed(0)}% intensity
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mb-12">

      {/* ================= HEADER ================= */}
      <div className="text-center mb-8">
        <span className="text-sm text-slate-500">{selectedCountry}</span>

        {/* CLIMATE SIGNAL INDEX */}
        <div className="mt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCountry}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-5xl font-bold text-slate-900"
            >
              {climateIndex.toFixed(0)}
            </motion.div>
          </AnimatePresence>

          <div className="text-xs text-slate-500 mt-1">
            Climate Signal Index
          </div>
        </div>
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricRing key={m.key} m={m} />
        ))}
      </div>
    </div>
  );
}
