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
  sea_surface_temperature: { max: 2.0, unit: "°C", label: "Sea Surface Temp", icon: "", color: "#2AA7FF", isReversed: false },
  rainfall: { max: 200, unit: "mm", label: "Rainfall", icon: "", color: "#2E86AB", isReversed: false },
  sea: { max: 0.5, unit: "cm", label: "Sea Level", icon: "", color: "#185FA5", isReversed: false, multiplier: 100 },
  climate_altering_land: { max: 100000, unit: "ha", label: "Land Cover", icon: "", color: "#2E86AB", isReversed: false, multiplier: 0.001, displayUnit: "K ha" },
  crop_yield: { max: 10, unit: "t/ha", label: "Crop Yield", icon: "", color: "#3D9970", isReversed: true },
  lifestock_yield: { max: 20, unit: "t", label: "Livestock", icon: "", color: "#FFC107", isReversed: true },
  loss: { max: 1e8, unit: "M USD", label: "Economic Loss", icon: "", color: "#EF9F27", isReversed: true, multiplier: 1e-6, displayUnit: "M" },
  tourist_arrival: { max: 1e6, unit: "K", label: "Tourist Arrivals", icon: "", color: "#F5A623", isReversed: false, multiplier: 0.001, displayUnit: "K" },
  people: { max: 1e5, unit: "K", label: "People Affected", icon: "", color: "#7F77DD", isReversed: true, multiplier: 0.001, displayUnit: "K" },
  population_growth: { max: 3, unit: "%", label: "Population Growth", icon: "", color: "#9C27B0", isReversed: false },
};

export function DoughnutClimateDashboard({ kpis, selectedCountry, isLoading }: DoughnutClimateDashboardProps) {
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  
  const safeKpis = kpis || { 
    temp: 0, sea_surface_temperature: 0, rainfall: 0, sea: 0, 
    climate_altering_land: 0, crop_yield: 0, lifestock_yield: 0, 
    loss: 0, tourist_arrival: 0, people: 0, population_growth: 0, 
  };

  const getMetricValue = (key: string) => safeKpis[key] ?? 0;

  const metrics = [
    { key: "temp", value: getMetricValue("temp") },
    { key: "sea_surface_temperature", value: getMetricValue("sea_surface_temperature") },
    { key: "rainfall", value: getMetricValue("rainfall") },
    { key: "sea", value: getMetricValue("sea") },
    { key: "climate_altering_land", value: getMetricValue("climate_altering_land") },
    { key: "crop_yield", value: getMetricValue("crop_yield") },
    { key: "lifestock_yield", value: getMetricValue("lifestock_yield") },
    { key: "loss", value: getMetricValue("loss") },
    { key: "tourist_arrival", value: getMetricValue("tourist_arrival") },
    { key: "people", value: getMetricValue("people") },
    { key: "population_growth", value: getMetricValue("population_growth") },
  ];

  const clearHoverTimer = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  const handleMetricEnter = (key: string) => {
    clearHoverTimer();
    setActiveMetric(key);
  };

  const handleMetricLeave = () => {
    clearHoverTimer();
    const timer = setTimeout(() => setActiveMetric(null), 100);
    setHoverTimer(timer);
  };

  const getSafeValue = (key: string) => safeKpis[key] ?? 0;

  const hasData = metrics.some(m => Math.abs(m.value) > 0.01);
  if (isLoading || !hasData) return null;

  const MetricCircle = ({ m, index, group }: { m: any; index: number; group: string }) => {
    const t = thresholds[m.key];
    const val = group === "climate" ? Math.abs(m.value) : m.value;
    const pct = group === "climate" 
      ? Math.min(100, (val / t.max) * 100)
      : t.isReversed 
        ? 100 - Math.min(100, (val / t.max) * 100)
        : Math.min(100, (val / t.max) * 100);
    const displayVal = t.multiplier ? (m.value * t.multiplier).toFixed(1) : (group === "economic" && m.key === "loss") ? (m.value / 1e6).toFixed(1) : m.value.toFixed(1);
    const isActive = activeMetric === m.key;

    return (
      <div 
        className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${isActive ? 'scale-105' : 'scale-100'}`}
        onMouseEnter={() => handleMetricEnter(m.key)}
        onMouseLeave={handleMetricLeave}
      >
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke={t.color}
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 18}
              strokeDashoffset={2 * Math.PI * 18 * (1 - pct / 100)}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
            {displayVal}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium">{t.icon} {t.label}</div>
          <div className="text-[10px] text-slate-400">{group === "climate" ? `${pct.toFixed(0)}% of threshold` : `Target: ${t.max}${t.unit}`}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto mb-12">
      <div className="text-center mb-6">
        <span className="text-sm font-medium text-slate-600">{selectedCountry} at a Glance</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* CLIMATE DRIVERS */}
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-3">
          <div className="bg-orange-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold">Climate Drivers</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(0, 4).map((m, i) => <MetricCircle key={m.key} m={m} index={i} group="climate" />)}
          </div>
        </div>

        {/* ENVIRONMENTAL IMPACT */}
        <div className="bg-teal-50 rounded-xl border border-teal-200 p-3">
          <div className="bg-teal-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold"> Environmental Impacts</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(4, 7).map((m, i) => <MetricCircle key={m.key} m={m} index={i} group="environmental" />)}
          </div>
        </div>

        {/* ECONOMIC CONSEQUENCE */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3">
          <div className="bg-amber-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold"> Economic Impacts</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(7, 9).map((m, i) => <MetricCircle key={m.key} m={m} index={i} group="economic" />)}
          </div>
        </div>

        {/* HUMAN CONSEQUENCE */}
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-3">
          <div className="bg-purple-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold">Human Impacts</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(9, 11).map((m, i) => <MetricCircle key={m.key} m={m} index={i} group="human" />)}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {activeMetric && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-2 rounded-lg shadow-xl">
          {activeMetric === "temp" && `Surface Temperature: ${getSafeValue("temp") > 0 ? `+${getSafeValue("temp").toFixed(2)}°C` : `${getSafeValue("temp").toFixed(2)}°C`} above pre-industrial baseline`}
          {activeMetric === "sea_surface_temperature" && `Sea Surface Temperature: ${getSafeValue("sea_surface_temperature").toFixed(2)}°C - affects marine ecosystems`}
          {activeMetric === "rainfall" && `Rainfall Anomaly: ${getSafeValue("rainfall").toFixed(0)}mm - affects water security`}
          {activeMetric === "sea" && `Sea Level Rise: ${(getSafeValue("sea") * 100).toFixed(0)}cm - threatens coastal communities`}
          {activeMetric === "climate_altering_land" && ` Land Cover Change: ${(getSafeValue("climate_altering_land") / 1000).toFixed(0)}K ha altered`}
          {activeMetric === "crop_yield" && ` Crop Yield: ${getSafeValue("crop_yield").toFixed(1)} t/ha - food security indicator`}
          {activeMetric === "lifestock_yield" && `🐄 Livestock Yield: ${getSafeValue("lifestock_yield").toFixed(1)} tons - agricultural output`}
          {activeMetric === "loss" && ` Economic Loss: $${(getSafeValue("loss") / 1e6).toFixed(1)}M in disaster damages`}
          {activeMetric === "tourist_arrival" && ` Tourist Arrivals: ${(getSafeValue("tourist_arrival") / 1000).toFixed(0)}K visitors`}
          {activeMetric === "people" && ` People Affected: ${(getSafeValue("people") / 1000).toFixed(0)}K individuals impacted`}
          {activeMetric === "population_growth" && `📈 Population Growth: ${getSafeValue("population_growth").toFixed(1)}% annually`}
        </div>
      )}
    </div>
  );
}
