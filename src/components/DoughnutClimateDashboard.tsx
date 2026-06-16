"use client";
import { useState } from "react";

interface DoughnutClimateDashboardProps {
  kpis: any;
  deltas: any;
  selectedCountry: string;
  isLoading?: boolean;
}

const thresholds: Record<string, any> = {
  temp: { max: 2.0, unit: "°C", label: "Surface Temp", isReversed: false },
  sea_surface_temperature: { max: 2.0, unit: "°C", label: "Sea Surface Temp", isReversed: false },
  rainfall: { max: 200, unit: "mm", label: "Rainfall", isReversed: false },
  sea: { max: 0.5, unit: "cm", label: "Sea Level", isReversed: false, multiplier: 100 },
  climate_altering_land: { max: 100000, unit: "ha", label: "Land Cover", isReversed: false, multiplier: 0.001, displayUnit: "K ha" },
  crop_yield: { max: 10, unit: "t/ha", label: "Crop Yield", isReversed: true },
  lifestock_yield: { max: 20, unit: "t", label: "Livestock", isReversed: true },
  loss: { max: 1e8, unit: "M USD", label: "Economic Loss", isReversed: true, multiplier: 1e-6, displayUnit: "M" },
  tourist_arrival: { max: 1e6, unit: "K", label: "Tourist Arrivals", isReversed: false, multiplier: 0.001, displayUnit: "K" },
  people: { max: 1e5, unit: "K", label: "People Affected", isReversed: true, multiplier: 0.001, displayUnit: "K" },
  population_growth: { max: 3, unit: "%", label: "Population Growth", isReversed: false },
};

export function DoughnutClimateDashboard({
  kpis,
  selectedCountry,
  isLoading
}: DoughnutClimateDashboardProps) {

  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  const climateKeys = ["temp", "sea_surface_temperature", "rainfall", "sea"];
  const impactKeys = ["loss", "people", "crop_yield", "lifestock_yield"];

  const safeKpis = kpis || {
    temp: 0, sea_surface_temperature: 0, rainfall: 0, sea: 0,
    climate_altering_land: 0, crop_yield: 0, lifestock_yield: 0,
    loss: 0, tourist_arrival: 0, people: 0, population_growth: 0,
  };

  const metrics = [
    { key: "temp", value: safeKpis.temp },
    { key: "sea_surface_temperature", value: safeKpis.sea_surface_temperature },
    { key: "rainfall", value: safeKpis.rainfall },
    { key: "sea", value: safeKpis.sea },
    { key: "climate_altering_land", value: safeKpis.climate_altering_land },
    { key: "crop_yield", value: safeKpis.crop_yield },
    { key: "lifestock_yield", value: safeKpis.lifestock_yield },
    { key: "loss", value: safeKpis.loss },
    { key: "tourist_arrival", value: safeKpis.tourist_arrival },
    { key: "people", value: safeKpis.people },
    { key: "population_growth", value: safeKpis.population_growth },
  ];

  const handleMetricEnter = (key: string) => {
    if (hoverTimer) clearTimeout(hoverTimer);
    setActiveMetric(key);
  };

  const handleMetricLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    const timer = setTimeout(() => setActiveMetric(null), 100);
    setHoverTimer(timer);
  };

  const getSafeValue = (key: string) => safeKpis[key] ?? 0;

  const hasData = metrics.some(m => Math.abs(m.value) > 0.01);
  if (isLoading || !hasData) return null;

  const MetricCircle = ({ m, group }: { m: any; index: number; group: string }) => {
    const t = thresholds[m.key];

    const val =
      group === "climate"
        ? Math.abs(m.value)
        : m.value;

    const pct =
      group === "climate"
        ? Math.min(100, (val / t.max) * 100)
        : t.isReversed
        ? 100 - Math.min(100, (val / t.max) * 100)
        : Math.min(100, (val / t.max) * 100);

    const displayVal =
      t.multiplier
        ? (m.value * t.multiplier).toFixed(1)
        : (m.value).toFixed(1);

    const isActive = activeMetric === m.key;
    const isClimateCore = climateKeys.includes(m.key);
    const isImpact = impactKeys.includes(m.key);

    return (
      <div
        className={`flex items-center gap-2 cursor-pointer transition-all duration-300
          ${isActive ? "scale-110" : isClimateCore ? "scale-105" : "scale-100"}
          ${isClimateCore ? "opacity-100" : "opacity-80"}
        `}
        onMouseEnter={() => handleMetricEnter(m.key)}
        onMouseLeave={handleMetricLeave}
      >
        <div className="relative w-12 h-12">
          <svg className={`w-12 h-12 transform -rotate-90 ${isClimateCore ? "animate-pulse" : ""}`}>
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3.5"
            />
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke={t.color}
              strokeWidth={isClimateCore ? "5" : "3.5"}
              strokeDasharray={2 * Math.PI * 18}
              strokeDashoffset={2 * Math.PI * 18 * (1 - pct / 100)}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
            {displayVal}
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs font-medium">
            {t.icon} {t.label}
          </div>
          <div className="text-[10px] text-slate-400">
            {group === "climate"
              ? `${pct.toFixed(0)}% signal strength`
              : `Impact indicator`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto mb-12">

      {/* HEADER (UPGRADED STORY LAYER) */}
      <div className="text-center mb-6">
        <div className="text-sm font-semibold tracking-wide text-slate-500">
          SIGNAL DETECTION · {selectedCountry}
        </div>

        <h3 className="text-lg font-bold text-slate-800 mt-1">
          A clear climate signal is emerging
        </h3>

        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
          Climate drivers form the primary signal, while environmental,
          economic, and human impacts reflect downstream effects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* CLIMATE DRIVERS (PRIMARY SIGNAL) */}
        <div className="rounded-xl border border-orange-200 p-3">
          <span className="text-sm font-semibold">Climate Signal</span>

          <div className="space-y-3 mt-3">
            {metrics.slice(0, 4).map((m, i) =>
              <MetricCircle key={m.key} m={m} index={i} group="climate" />
            )}
          </div>
        </div>

        {/* ENVIRONMENTAL */}
        <div className="bg-teal-50 rounded-xl border border-teal-200 p-3 opacity-90">
          <span className="text-sm font-semibold">Environmental Response</span>

          <div className="space-y-3 mt-3">
            {metrics.slice(4, 7).map((m, i) =>
              <MetricCircle key={m.key} m={m} index={i} group="environmental" />
            )}
          </div>
        </div>

        {/* ECONOMIC */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 opacity-80">
          <span className="text-sm font-semibold">Economic Impact</span>

          <div className="space-y-3 mt-3">
            {metrics.slice(7, 9).map((m, i) =>
              <MetricCircle key={m.key} m={m} index={i} group="economic" />
            )}
          </div>
        </div>

        {/* HUMAN */}
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 opacity-80">
          <span className="text-sm font-semibold">Human Consequences</span>

          <div className="space-y-3 mt-3">
            {metrics.slice(9, 11).map((m, i) =>
              <MetricCircle key={m.key} m={m} index={i} group="human" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
