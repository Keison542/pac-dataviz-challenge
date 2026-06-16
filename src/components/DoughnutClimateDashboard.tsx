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
  sea: { max: 0.5, unit: "cm", label: "Sea Level", isReversed: false },
  climate_altering_land: { max: 100000, unit: "ha", label: "Land Cover", isReversed: false },
  crop_yield: { max: 10, unit: "t/ha", label: "Crop Yield", isReversed: true },
  lifestock_yield: { max: 20, unit: "t", label: "Livestock", isReversed: true },
  loss: { max: 1e8, unit: "M USD", label: "Economic Loss", isReversed: true },
  tourist_arrival: { max: 1e6, unit: "K", label: "Tourist Arrivals", isReversed: false },
  people: { max: 1e5, unit: "K", label: "People Affected", isReversed: true },
  population_growth: { max: 3, unit: "%", label: "Population Growth", isReversed: false },
};

export function DoughnutClimateDashboard({
  kpis,
  selectedCountry,
  isLoading
}: DoughnutClimateDashboardProps) {

  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  const safeKpis = kpis || {};

  // ----------------------------
  // CLIMATE SIGNAL INDEX
  // ----------------------------
  const getClimateSignalIndex = () => {
    const temp = Math.abs(safeKpis.temp ?? 0);
    const seaTemp = Math.abs(safeKpis.sea_surface_temperature ?? 0);
    const rainfall = Math.abs(safeKpis.rainfall ?? 0);
    const sea = Math.abs(safeKpis.sea ?? 0);

    const tempScore = Math.min(100, (temp / 2.0) * 100);
    const seaTempScore = Math.min(100, (seaTemp / 2.0) * 100);
    const rainfallScore = Math.min(100, (rainfall / 200) * 100);
    const seaScore = Math.min(100, ((sea * 100) / 50) * 100);

    return Math.round(
      tempScore * 0.35 +
      seaTempScore * 0.25 +
      rainfallScore * 0.2 +
      seaScore * 0.2
    );
  };

  const climateIndex = getClimateSignalIndex();

  const getSignalLabel = (v: number) => {
    if (v < 25) return { label: "Low", color: "text-slate-500" };
    if (v < 50) return { label: "Moderate", color: "text-blue-500" };
    if (v < 75) return { label: "High", color: "text-orange-500" };
    return { label: "Critical", color: "text-red-500" };
  };

  const signal = getSignalLabel(climateIndex);

  const climateKeys = ["temp", "sea_surface_temperature", "rainfall", "sea"];
  const impactKeys = ["loss", "people", "crop_yield", "lifestock_yield"];

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

  const hasData = metrics.some(m => Math.abs(m.value ?? 0) > 0.01);
  if (isLoading || !hasData) return null;

  const MetricCircle = ({ m, group }: { m: any; group: string }) => {
    const t = thresholds[m.key];
    const val = Math.abs(m.value ?? 0);

    const pct =
      group === "climate"
        ? Math.min(100, (val / t.max) * 100)
        : t.isReversed
        ? 100 - Math.min(100, (val / t.max) * 100)
        : Math.min(100, (val / t.max) * 100);

    const displayVal = (m.value ?? 0).toFixed(1);

    const isActive = activeMetric === m.key;
    const isClimateCore = climateKeys.includes(m.key);

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
            <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
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
            {group === "climate" ? `${pct.toFixed(0)}% signal strength` : `Impact indicator`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto mb-12">

      {/* ========================= */}
      {/* CLIMATE SIGNAL INDEX */}
      {/* ========================= */}
      <div className="text-center mb-8">

        <div className="text-xs font-semibold tracking-widest text-slate-500">
          CLIMATE SIGNAL INDEX
        </div>

        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="text-4xl font-bold text-slate-900">
            {climateIndex}
          </div>

          <div className={`text-sm font-semibold ${signal.color}`}>
            {signal.label}
          </div>
        </div>

        <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Composite indicator of temperature, rainfall, sea temperature and sea level anomalies
        </div>

        <div className="w-full max-w-xs mx-auto mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 via-orange-400 to-red-500 transition-all duration-700"
            style={{ width: `${climateIndex}%` }}
          />
        </div>

        <div className="text-sm font-semibold tracking-wide text-slate-500 mt-6">
          SIGNAL DETECTION · {selectedCountry}
        </div>

        <h3 className="text-lg font-bold text-slate-800 mt-1">
          A measurable climate signal is emerging
        </h3>
      </div>

      {/* ========================= */}
      {/* GRID */}
      {/* ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="rounded-xl border border-orange-200 p-3">
          <span className="text-sm font-semibold">Climate Signal</span>
          <div className="space-y-3 mt-3">
            {metrics.slice(0, 4).map((m) => (
              <MetricCircle key={m.key} m={m} group="climate" />
            ))}
          </div>
        </div>

        <div className="bg-teal-50 rounded-xl border border-teal-200 p-3 opacity-90">
          <span className="text-sm font-semibold">Environmental Response</span>
          <div className="space-y-3 mt-3">
            {metrics.slice(4, 7).map((m) => (
              <MetricCircle key={m.key} m={m} group="environmental" />
            ))}
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 opacity-80">
          <span className="text-sm font-semibold">Economic Impact</span>
          <div className="space-y-3 mt-3">
            {metrics.slice(7, 9).map((m) => (
              <MetricCircle key={m.key} m={m} group="economic" />
            ))}
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 opacity-80">
          <span className="text-sm font-semibold">Human Consequences</span>
          <div className="space-y-3 mt-3">
            {metrics.slice(9, 11).map((m) => (
              <MetricCircle key={m.key} m={m} group="human" />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
