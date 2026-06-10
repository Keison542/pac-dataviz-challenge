"use client";
import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { animated, useTransition, useSpring } from "@react-spring/web";
import { LineChart } from "@/dataviz/lineChart/LineChart";
import { Barplot } from "@/dataviz/barplot/Barplot";
import { BubbleChart } from "@/dataviz/bubbleChart/BubbleChart";
import { geoData } from "@/data/pacificGeoData";
import { surfaceTempAnomalies } from "@/data/climate_drivers/surface_temp_anomalies";
import { rainfallAnomalies } from "@/data/climate_drivers/rainfall_anomalies";
import { seaLevelAnomalies } from "@/data/climate_drivers/sea_level_anomalies";
import { disasterEconomicLoss } from "@/data/economic_consequence/direct_disaster_economic_loss";
import { affectedPersons } from "@/data/human_consequence/number_of_persons_affected";
import {seaSurfaceTempAnomalies} from "@/data/climate_drivers/sea_surface_temp_anomalies";
import { RankedBarChart } from "@/dataviz/barplot/RankedBarChart";
import { CountryComparison } from "@/dataviz/barplot/CountryComparison";
import TimeSankey from "@/dataviz/sankey/TimeSankey";
import AlluvialDiagram from "@/dataviz/sankey/AlluvialDiagram";
import BeeswarmChart from "@/dataviz/beeswarm/BeeswarmChart";
import { buildClimateRecords } from "@/lib/mergedClimateRecord";
import { MultiLineChart } from "@/dataviz/lineChart/MultiLineChart";
import { buildMultiLineData } from "@/data/climate_drivers/buildMultiLineData";
import { climateSeries } from "@/data/climate_drivers/climateSeries";
import {crop_yield} from "@/data/environmental_impact/crop_yield"
import {tourist_arrival} from "@/data/economic_consequence/tourist_arrival";
import { climate_altering_land } from "@/data/environmental_impact/climate_altering_land";
import { lifestock_yield } from "@/data/environmental_impact/lifestock_yield";
import { population_growth } from "@/data/human_consequence/population_growth";
import {tubercolosis_incidence} from "@/data/human_consequence/tubercolosis_incidence";

// ============================================================================
// TYPES
// ============================================================================

interface IslandSelectPayload { event: string; country: string; countryName: string; position: { x: number; y: number }; timestamp: string; }
interface TimeSeriesPoint { country: string; year: number; value: number; }
interface KpiSet { temp: number; sea: number; loss: number; people: number; rainfall: number; sea_surface_temperature: number; crop_yield: number; tourist_arrival: number; climate_altering_land: number; lifestock_yield: number; population_growth: number; tubercolosis_incidence: number; }

const CONTAINER_WIDTH = 1200;

// ============================================================================
// STYLES
// ============================================================================

const S = {
  page: { minHeight: "100vh", background: "#ffffff", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  container: { maxWidth: CONTAINER_WIDTH, margin: "0 auto", padding: "2rem 1.5rem" },
  
  hero: { marginBottom: "4rem", textAlign: "center" as const },
  kicker: { fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#D85A30", marginBottom: "1rem" },
  h1: { fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "1rem", color: "#0f172a", lineHeight: 1.2 },
  subhead: { fontSize: "1.1rem", color: "#475569", maxWidth: "680px", margin: "0 auto", lineHeight: 1.5 },
  
  pillRow: { display: "flex", flexWrap: "wrap" as const, gap: "0.5rem", justifyContent: "center", marginTop: "2rem", maxHeight: "180px", overflowY: "auto" as const, padding: "0.5rem" },
  countryPill: (active: boolean, hover: boolean) => ({
    display: "inline-flex", padding: "0.4rem 1.2rem", borderRadius: "2rem", fontSize: "0.8rem", fontWeight: active ? 600 : 400,
    backgroundColor: active ? "#0f172a" : hover ? "#f8fafc" : "#ffffff",
    color: active ? "#ffffff" : "#334155",
    border: "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.15s ease",
  }),
  
  storySection: { marginBottom: "4rem" },
  storyHeader: { marginBottom: "1.5rem", textAlign: "center" as const },
  storyTitle: { fontSize: "1.75rem", fontWeight: 600, marginBottom: "0.75rem", color: "#0f172a" },
  storySubtitle: { fontSize: "0.9rem", color: "#64748b", maxWidth: "680px", margin: "0 auto", lineHeight: 1.5 },
  storyInsight: { fontSize: "0.85rem", color: "#D85A30", marginTop: "0.5rem", fontWeight: 500 },
  
  twoColumnGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" },
  chartPanel: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "1.25rem" },
  chartHead: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" },
  chartIcon: { fontSize: "1.25rem" },
  chartTitle: { fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" },
  chartInsight: { fontSize: "0.7rem", color: "#94a3b8", marginLeft: "auto", fontStyle: "italic" },
  
  comparisonGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem", marginBottom: "2rem" },
  
  tabContainer: { display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "1.5rem", flexWrap: "wrap" as const },
  tabButton: (active: boolean) => ({ padding: "0.5rem 1.5rem", borderRadius: "2rem", fontSize: "0.85rem", fontWeight: 500, background: active ? "#0f172a" : "#ffffff", color: active ? "#ffffff" : "#475569", border: "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.15s ease" }),
  
  conclusion: { textAlign: "center" as const, marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid #e2e8f0" },
  conclusionTitle: { fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" },
  conclusionText: { fontSize: "1rem", color: "#475569", maxWidth: "720px", margin: "0 auto", lineHeight: 1.6 },
  
  footer: { textAlign: "center" as const, paddingTop: "2rem", marginTop: "2rem", borderTop: "1px solid #e2e8f0", fontSize: "0.75rem", color: "#94a3b8" }
};

// ============================================================================
// COMPONENTS
// ============================================================================

const CountryPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => {
  const [hover, setHover] = useState(false);
  return <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={S.countryPill(active, hover)}>{label}</button>;
};

// ============================================================================
// SELECT COUNTRY PROMPT COMPONENT
// ============================================================================

const SelectCountryPrompt = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="text-6xl mb-4">🌏</div>
    <h3 className="text-xl font-semibold text-slate-800 mb-2">Select a Pacific Island Nation</h3>
    <p className="text-slate-500 max-w-md">
      Choose a country from the list above to explore its complete climate impact cascade — 
      from rising temperatures to human consequences.
    </p>
    <div className="mt-6 flex gap-2 justify-center flex-wrap">
      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">🌡️ Climate Drivers</span>
      <span className="text-xs text-slate-400">→</span>
      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">🌿 Environmental</span>
      <span className="text-xs text-slate-400">→</span>
      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">💰 Economic</span>
      <span className="text-xs text-slate-400">→</span>
      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">👥 Human</span>
    </div>
  </div>
);

// ============================================================================
// LOADING SKELETON COMPONENT
// ============================================================================

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto mb-4"></div>
    <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-8"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-100 rounded-xl p-4">
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// DOUGHNUT CHART COMPONENT
// ============================================================================

const DoughnutChart = ({ value, maxValue, color, size = 70, unit, label, isReversed = false }: any) => {
  const percentage = Math.min(100, Math.max(0, (Math.abs(value) / maxValue) * 100));
  const radius = size / 2;
  const circumference = 2 * Math.PI * (radius - 8);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const actualPercentage = isReversed ? 100 - percentage : percentage;
  const actualStrokeDashoffset = circumference - (actualPercentage / 100) * circumference;
  
  const getValueColor = () => {
    if (label === "Surface Temp" || label === "Sea Surface Temp") {
      if (value > 1.5) return "#ef4444";
      if (value > 1.0) return "#f97316";
      if (value > 0.5) return "#eab308";
      return "#22c55e";
    }
    if (label === "Sea Level") {
      if (value > 0.3) return "#ef4444";
      if (value > 0.2) return "#f97316";
      if (value > 0.1) return "#eab308";
      return "#22c55e";
    }
    if (label === "Crop Yield" || label === "Livestock") {
      if (value < 3) return "#ef4444";
      if (value < 5) return "#f97316";
      return "#22c55e";
    }
    if (label === "TB Incidence") {
      if (value > 300) return "#ef4444";
      if (value > 200) return "#f97316";
      if (value > 100) return "#eab308";
      return "#22c55e";
    }
    return color;
  };

  const formatDisplayValue = () => {
    if (label === "Economic Loss") return `$${(value / 1e6).toFixed(1)}M`;
    if (label === "Tourist Arrivals") return `${(value / 1e3).toFixed(0)}K`;
    if (label === "People Affected") return `${(value / 1e3).toFixed(0)}K`;
    if (label === "Land Cover") return `${(value / 1e3).toFixed(0)}K ha`;
    if (label === "Sea Level") return `${(value * 100).toFixed(0)}cm`;
    if (label === "Population Growth") return `${value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`}`;
    return value.toFixed(2);
  };

  return (
    <div className="flex flex-col items-center group">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle cx={radius} cy={radius} r={radius - 8} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx={radius}
            cy={radius}
            r={radius - 8}
            fill="none"
            stroke={getValueColor()}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={actualStrokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color: getValueColor() }}>{formatDisplayValue()}</span>
          <span className="text-[8px] text-slate-400">{unit}</span>
        </div>
      </div>
      <div className="mt-1 text-center">
        <div className="text-[10px] font-medium text-slate-600">{label}</div>
        <div className="text-[8px] text-slate-400">{percentage.toFixed(0)}% of threshold</div>
      </div>
    </div>
  );
};

// ============================================================================
// DOUGHNUT CLIMATE IMPACT DASHBOARD (Depends on selected country)
// ============================================================================

const DoughnutClimateDashboard = ({ kpis, deltas, selectedCountry, isLoading }: any) => {
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  // Define thresholds for each indicator
  const thresholds = {
    temp: { max: 2.0, unit: "°C", label: "Surface Temp", icon: "🌡️", color: "#D85A30", isReversed: false },
    sea_surface_temperature: { max: 2.0, unit: "°C", label: "Sea Surface Temp", icon: "🌊", color: "#2AA7FF", isReversed: false },
    rainfall: { max: 200, unit: "mm", label: "Rainfall", icon: "☔", color: "#2E86AB", isReversed: false },
    sea: { max: 0.5, unit: "cm", label: "Sea Level", icon: "📈", color: "#185FA5", isReversed: false, multiplier: 100 },
    climate_altering_land: { max: 100000, unit: "ha", label: "Land Cover", icon: "🌱", color: "#2E86AB", isReversed: false, multiplier: 0.001, displayUnit: "K ha" },
    crop_yield: { max: 10, unit: "t/ha", label: "Crop Yield", icon: "🌾", color: "#3D9970", isReversed: true },
    lifestock_yield: { max: 20, unit: "t", label: "Livestock", icon: "🐄", color: "#FFC107", isReversed: true },
    loss: { max: 1e8, unit: "M USD", label: "Economic Loss", icon: "💰", color: "#EF9F27", isReversed: true, multiplier: 1e-6, displayUnit: "M" },
    tourist_arrival: { max: 1e6, unit: "K", label: "Tourist Arrivals", icon: "🌴", color: "#F5A623", isReversed: false, multiplier: 0.001, displayUnit: "K" },
    people: { max: 1e5, unit: "K", label: "People Affected", icon: "👥", color: "#7F77DD", isReversed: true, multiplier: 0.001, displayUnit: "K" },
    population_growth: { max: 3, unit: "%", label: "Population Growth", icon: "📈", color: "#9C27B0", isReversed: false },
    tubercolosis_incidence: { max: 500, unit: "/100k", label: "TB Incidence", icon: "🩺", color: "#E91E63", isReversed: true },
  };

  const getDisplayValue = (key: string, value: number) => {
    const t = thresholds[key as keyof typeof thresholds];
    if (t?.multiplier) return (value * t.multiplier).toFixed(1);
    if (key === "sea") return (value * 100).toFixed(0);
    if (key === "loss") return (value / 1e6).toFixed(1);
    if (key === "tourist_arrival" || key === "people") return (value / 1e3).toFixed(0);
    if (key === "climate_altering_land") return (value / 1e3).toFixed(0);
    if (key === "population_growth") return value.toFixed(1);
    return value.toFixed(2);
  };

  const getDisplayUnit = (key: string) => {
    const t = thresholds[key as keyof typeof thresholds];
    if (t?.displayUnit) return t.displayUnit;
    if (key === "sea") return "cm";
    if (key === "loss") return "M";
    if (key === "tourist_arrival" || key === "people") return "K";
    if (key === "climate_altering_land") return "K ha";
    return t?.unit || "";
  };

  const getPercentage = (key: string, value: number) => {
    const t = thresholds[key as keyof typeof thresholds];
    if (!t) return 0;
    let displayValue = value;
    if (key === "sea") displayValue = value * 100;
    if (key === "loss") displayValue = value / 1e6;
    if (key === "tourist_arrival" || key === "people") displayValue = value / 1e3;
    if (key === "climate_altering_land") displayValue = value / 1e3;
    let pct = (displayValue / t.max) * 100;
    if (t.isReversed) pct = 100 - pct;
    return Math.min(100, Math.max(0, pct));
  };

  const getDoughnutColor = (key: string, value: number) => {
    const t = thresholds[key as keyof typeof thresholds];
    if (key === "temp" || key === "sea_surface_temperature") {
      if (value > 1.5) return "#ef4444";
      if (value > 1.0) return "#f97316";
      if (value > 0.5) return "#eab308";
      return "#22c55e";
    }
    if (key === "sea") {
      if (value > 0.3) return "#ef4444";
      if (value > 0.2) return "#f97316";
      if (value > 0.1) return "#eab308";
      return "#22c55e";
    }
    if (key === "crop_yield" || key === "lifestock_yield") {
      if (value < 3) return "#ef4444";
      if (value < 5) return "#f97316";
      return "#22c55e";
    }
    if (key === "tubercolosis_incidence") {
      if (value > 300) return "#ef4444";
      if (value > 200) return "#f97316";
      if (value > 100) return "#eab308";
      return "#22c55e";
    }
    return t?.color || "#3b82f6";
  };

  const metrics = [
    { key: "temp", value: kpis.temp, delta: deltas.temp },
    { key: "sea_surface_temperature", value: kpis.sea_surface_temperature, delta: deltas.sea_surface_temperature },
    { key: "rainfall", value: kpis.rainfall, delta: deltas.rainfall },
    { key: "sea", value: kpis.sea, delta: deltas.sea },
    { key: "climate_altering_land", value: kpis.climate_altering_land, delta: deltas.climate_altering_land },
    { key: "crop_yield", value: kpis.crop_yield, delta: deltas.crop_yield },
    { key: "lifestock_yield", value: kpis.lifestock_yield, delta: deltas.lifestock_yield },
    { key: "loss", value: kpis.loss, delta: deltas.loss },
    { key: "tourist_arrival", value: kpis.tourist_arrival, delta: deltas.tourist_arrival },
    { key: "people", value: kpis.people, delta: deltas.people },
    { key: "population_growth", value: kpis.population_growth, delta: deltas.population_growth },
    { key: "tubercolosis_incidence", value: kpis.tubercolosis_incidence, delta: deltas.tubercolosis_incidence },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <span className="text-sm font-medium text-slate-600">📍 {selectedCountry} at a Glance: Climate Impact Cascade</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-2 inline-block" />
      </div>

      <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100"><span className="text-sm">🌡️</span><span className="text-xs font-medium text-orange-700">Climate Drivers</span></div>
        <span className="text-slate-400 text-lg">→</span>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100"><span className="text-sm">🌿</span><span className="text-xs font-medium text-teal-700">Environmental</span></div>
        <span className="text-slate-400 text-lg">→</span>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100"><span className="text-sm">💰</span><span className="text-xs font-medium text-amber-700">Economic</span></div>
        <span className="text-slate-400 text-lg">→</span>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100"><span className="text-sm">👥</span><span className="text-xs font-medium text-purple-700">Human</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* COLUMN 1: CLIMATE DRIVERS */}
        <div className="bg-gradient-to-b from-orange-50 to-white rounded-xl border border-orange-200 overflow-hidden shadow-sm">
          <div className="bg-orange-500 px-3 py-2"><div className="flex items-center justify-between"><span className="text-white text-sm font-semibold">🌡️ Climate Drivers</span><span className="text-white/70 text-[10px]">4 indicators</span></div></div>
          <div className="p-3 space-y-4">
            {metrics.slice(0, 4).map((metric) => {
              const t = thresholds[metric.key as keyof typeof thresholds];
              const displayValue = getDisplayValue(metric.key, metric.value);
              const unit = getDisplayUnit(metric.key);
              const percentage = getPercentage(metric.key, metric.value);
              const doughnutColor = getDoughnutColor(metric.key, metric.value);
              
              return (
                <div key={metric.key} className="relative group cursor-pointer" onMouseEnter={() => setActiveMetric(metric.key)} onMouseLeave={() => setActiveMetric(null)}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <svg width="70" height="70" viewBox="0 0 70 70" className="transform -rotate-90">
                        <circle cx="35" cy="35" r="27" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                        <circle cx="35" cy="35" r="27" fill="none" stroke={doughnutColor} strokeWidth="5" strokeDasharray={2 * Math.PI * 27} strokeDashoffset={2 * Math.PI * 27 * (1 - percentage / 100)} strokeLinecap="round" className="transition-all duration-1000" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-sm font-bold" style={{ color: doughnutColor }}>{displayValue}</span><span className="text-[8px] text-slate-400">{unit}</span></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1"><span className="text-base">{t?.icon}</span><span className="text-xs font-medium text-slate-700">{t?.label}</span></div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-slate-400">Threshold: {t?.max}{unit === "M" ? "M" : unit}</span>
                        <span className={`text-[9px] ${metric.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{metric.delta !== 0 && `${metric.delta >= 0 ? '▲' : '▼'} ${Math.abs(metric.delta).toFixed(1)}`}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: ENVIRONMENTAL IMPACT */}
        <div className="bg-gradient-to-b from-teal-50 to-white rounded-xl border border-teal-200 overflow-hidden shadow-sm">
          <div className="bg-teal-500 px-3 py-2"><div className="flex items-center justify-between"><span className="text-white text-sm font-semibold">🌿 Environmental</span><span className="text-white/70 text-[10px]">3 indicators</span></div></div>
          <div className="p-3 space-y-4">
            {metrics.slice(4, 7).map((metric) => {
              const t = thresholds[metric.key as keyof typeof thresholds];
              const displayValue = getDisplayValue(metric.key, metric.value);
              const unit = getDisplayUnit(metric.key);
              const percentage = getPercentage(metric.key, metric.value);
              const doughnutColor = getDoughnutColor(metric.key, metric.value);
              
              return (
                <div key={metric.key} className="relative group cursor-pointer" onMouseEnter={() => setActiveMetric(metric.key)} onMouseLeave={() => setActiveMetric(null)}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <svg width="70" height="70" viewBox="0 0 70 70" className="transform -rotate-90">
                        <circle cx="35" cy="35" r="27" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                        <circle cx="35" cy="35" r="27" fill="none" stroke={doughnutColor} strokeWidth="5" strokeDasharray={2 * Math.PI * 27} strokeDashoffset={2 * Math.PI * 27 * (1 - percentage / 100)} strokeLinecap="round" className="transition-all duration-1000" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-sm font-bold" style={{ color: doughnutColor }}>{displayValue}</span><span className="text-[8px] text-slate-400">{unit}</span></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1"><span className="text-base">{t?.icon}</span><span className="text-xs font-medium text-slate-700">{t?.label}</span></div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-slate-400">Target: {t?.max}{unit}</span>
                        <span className={`text-[9px] ${metric.delta >= 0 ? (t?.isReversed ? 'text-red-500' : 'text-emerald-600') : (t?.isReversed ? 'text-emerald-600' : 'text-red-500')}`}>{metric.delta !== 0 && `${metric.delta >= 0 ? '▲' : '▼'} ${Math.abs(metric.delta).toFixed(1)}`}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 3: ECONOMIC CONSEQUENCE */}
        <div className="bg-gradient-to-b from-amber-50 to-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
          <div className="bg-amber-500 px-3 py-2"><div className="flex items-center justify-between"><span className="text-white text-sm font-semibold">💰 Economic</span><span className="text-white/70 text-[10px]">2 indicators</span></div></div>
          <div className="p-3 space-y-4">
            {metrics.slice(7, 9).map((metric) => {
              const t = thresholds[metric.key as keyof typeof thresholds];
              const displayValue = getDisplayValue(metric.key, metric.value);
              const unit = getDisplayUnit(metric.key);
              const percentage = getPercentage(metric.key, metric.value);
              const doughnutColor = getDoughnutColor(metric.key, metric.value);
              
              return (
                <div key={metric.key} className="relative group cursor-pointer" onMouseEnter={() => setActiveMetric(metric.key)} onMouseLeave={() => setActiveMetric(null)}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <svg width="70" height="70" viewBox="0 0 70 70" className="transform -rotate-90">
                        <circle cx="35" cy="35" r="27" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                        <circle cx="35" cy="35" r="27" fill="none" stroke={doughnutColor} strokeWidth="5" strokeDasharray={2 * Math.PI * 27} strokeDashoffset={2 * Math.PI * 27 * (1 - percentage / 100)} strokeLinecap="round" className="transition-all duration-1000" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-sm font-bold" style={{ color: doughnutColor }}>{displayValue}</span><span className="text-[8px] text-slate-400">{unit}</span></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1"><span className="text-base">{t?.icon}</span><span className="text-xs font-medium text-slate-700">{t?.label}</span></div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-slate-400">Threshold: {t?.max}{unit === "M" ? "M" : unit === "K" ? "K" : unit}</span>
                        <span className={`text-[9px] ${metric.delta >= 0 ? (t?.isReversed ? 'text-red-500' : 'text-emerald-600') : (t?.isReversed ? 'text-emerald-600' : 'text-red-500')}`}>{metric.delta !== 0 && `${metric.delta >= 0 ? '▲' : '▼'} ${Math.abs(metric.delta).toFixed(1)}`}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="mt-2 pt-2 border-t border-amber-100"><div className="text-center"><div className="text-lg font-bold text-amber-700">${(kpis.loss / 1e6).toFixed(0)}M</div><div className="text-[9px] text-slate-500">Total economic impact</div></div></div>
          </div>
        </div>

        {/* COLUMN 4: HUMAN CONSEQUENCE */}
        <div className="bg-gradient-to-b from-purple-50 to-white rounded-xl border border-purple-200 overflow-hidden shadow-sm">
          <div className="bg-purple-500 px-3 py-2"><div className="flex items-center justify-between"><span className="text-white text-sm font-semibold">👥 Human</span><span className="text-white/70 text-[10px]">3 indicators</span></div></div>
          <div className="p-3 space-y-4">
            {metrics.slice(9, 12).map((metric) => {
              const t = thresholds[metric.key as keyof typeof thresholds];
              const displayValue = getDisplayValue(metric.key, metric.value);
              const unit = getDisplayUnit(metric.key);
              const percentage = getPercentage(metric.key, metric.value);
              const doughnutColor = getDoughnutColor(metric.key, metric.value);
              
              return (
                <div key={metric.key} className="relative group cursor-pointer" onMouseEnter={() => setActiveMetric(metric.key)} onMouseLeave={() => setActiveMetric(null)}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <svg width="70" height="70" viewBox="0 0 70 70" className="transform -rotate-90">
                        <circle cx="35" cy="35" r="27" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                        <circle cx="35" cy="35" r="27" fill="none" stroke={doughnutColor} strokeWidth="5" strokeDasharray={2 * Math.PI * 27} strokeDashoffset={2 * Math.PI * 27 * (1 - percentage / 100)} strokeLinecap="round" className="transition-all duration-1000" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-sm font-bold" style={{ color: doughnutColor }}>{displayValue}</span><span className="text-[8px] text-slate-400">{unit}</span></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1"><span className="text-base">{t?.icon}</span><span className="text-xs font-medium text-slate-700">{t?.label}</span></div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-slate-400">Threshold: {t?.max}{unit === "/100k" ? "/100k" : unit}</span>
                        <span className={`text-[9px] ${metric.delta >= 0 ? (t?.isReversed ? 'text-red-500' : 'text-emerald-600') : (t?.isReversed ? 'text-emerald-600' : 'text-red-500')}`}>{metric.delta !== 0 && `${metric.delta >= 0 ? '▲' : '▼'} ${Math.abs(metric.delta).toFixed(1)}`}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeMetric && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-2 rounded-lg shadow-xl max-w-md text-center animate-fade-in">
          {activeMetric === "temp" && `🌡️ Surface Temperature: ${kpis.temp > 0 ? `+${kpis.temp.toFixed(2)}°C` : `${kpis.temp.toFixed(2)}°C`} above pre-industrial baseline. Paris Agreement target: 1.5°C`}
          {activeMetric === "sea_surface_temperature" && `🌊 Sea Surface Temperature: ${kpis.sea_surface_temperature > 0 ? `+${kpis.sea_surface_temperature.toFixed(2)}°C` : `${kpis.sea_surface_temperature.toFixed(2)}°C`} - affects marine ecosystems and coral bleaching`}
          {activeMetric === "rainfall" && `☔ Rainfall Anomaly: ${kpis.rainfall > 0 ? `${kpis.rainfall.toFixed(0)}mm above` : `${Math.abs(kpis.rainfall).toFixed(0)}mm below`} normal - affects water security and agriculture`}
          {activeMetric === "sea" && `📈 Sea Level: ${kpis.sea > 0 ? `+${(kpis.sea * 100).toFixed(0)}cm` : `${(kpis.sea * 100).toFixed(0)}cm`} - threatens coastal communities and infrastructure`}
          {activeMetric === "climate_altering_land" && `🌱 Land Cover: ${(kpis.climate_altering_land / 1000).toFixed(0)}K ha altered - affects carbon storage and biodiversity`}
          {activeMetric === "crop_yield" && `🌾 Crop Yield: ${kpis.crop_yield.toFixed(1)} t/ha - ${kpis.crop_yield > 5 ? "Above average productivity" : kpis.crop_yield > 3 ? "Moderate productivity" : "Below average - food security concern"}`}
          {activeMetric === "lifestock_yield" && `🐄 Livestock Yield: ${kpis.lifestock_yield.toFixed(1)} tons - ${kpis.lifestock_yield > 12 ? "Strong production" : "Below potential"}`}
          {activeMetric === "loss" && `💰 Economic Loss: $${(kpis.loss / 1e6).toFixed(1)}M in disaster-related damages - affects GDP and recovery capacity`}
          {activeMetric === "tourist_arrival" && `🌴 Tourist Arrivals: ${(kpis.tourist_arrival / 1000).toFixed(0)}K visitors - ${kpis.tourist_arrival / 1000 < 500 ? "Below average" : "Steady flow"}`}
          {activeMetric === "people" && `👥 People Affected: ${(kpis.people / 1000).toFixed(0)}K individuals directly impacted by climate disasters`}
          {activeMetric === "population_growth" && `📈 Population Growth: ${kpis.population_growth > 0 ? `+${kpis.population_growth.toFixed(1)}%` : `${kpis.population_growth.toFixed(1)}%`} annually - affects infrastructure and service demand`}
          {activeMetric === "tubercolosis_incidence" && `🩺 TB Incidence: ${kpis.tubercolosis_incidence.toFixed(0)} cases per 100,000 people - ${kpis.tubercolosis_incidence > 200 ? "Epidemic level" : kpis.tubercolosis_incidence > 100 ? "High burden" : "Near WHO elimination target"}`}
        </div>
      )}

      <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📖</div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">The Complete Climate Story for {selectedCountry}</div>
            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
              <p>🌡️ <span className="font-medium">Climate Drivers:</span> {kpis.temp.toFixed(2)}°C surface anomaly • Sea level {kpis.sea > 0 ? `+${(kpis.sea * 100).toFixed(0)}cm` : `${(kpis.sea * 100).toFixed(0)}cm`} • {kpis.rainfall > 0 ? `+${kpis.rainfall.toFixed(0)}mm` : `${kpis.rainfall.toFixed(0)}mm`} rainfall anomaly</p>
              <p>🌿 <span className="font-medium">Environmental Impact:</span> {(kpis.climate_altering_land / 1000).toFixed(0)}K ha land altered • {kpis.crop_yield.toFixed(1)} t/ha crops • {kpis.lifestock_yield.toFixed(1)} tons livestock</p>
              <p>💰 <span className="font-medium">Economic Consequence:</span> ${(kpis.loss / 1e6).toFixed(1)}M losses • {(kpis.tourist_arrival / 1000).toFixed(0)}K tourist arrivals</p>
              <p>👥 <span className="font-medium">Human Consequence:</span> {(kpis.people / 1000).toFixed(0)}K affected • Population {kpis.population_growth > 0 ? `+${kpis.population_growth.toFixed(1)}%` : `${kpis.population_growth.toFixed(1)}%`} • TB: {kpis.tubercolosis_incidence.toFixed(0)}/100k</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"alluvial" | "beeswarm">("alluvial");
  const [isClient, setIsClient] = useState(false);
  
  const countries = useMemo(() => {
    const allCountries = new Set<string>();
    surfaceTempAnomalies.forEach(d => allCountries.add(d.country));
    rainfallAnomalies.forEach(d => allCountries.add(d.country));
    seaLevelAnomalies.forEach(d => allCountries.add(d.country));
    disasterEconomicLoss.forEach(d => allCountries.add(d.country));
    affectedPersons.forEach(d => allCountries.add(d.country));
    seaSurfaceTempAnomalies.forEach(d => allCountries.add(d.country));
    crop_yield.forEach(d => allCountries.add(d.country));
    tourist_arrival.forEach(d => allCountries.add(d.country));
    climate_altering_land.forEach(d => allCountries.add(d.country));
    lifestock_yield.forEach(d => allCountries.add(d.country));
    population_growth.forEach(d => allCountries.add(d.country));
    tubercolosis_incidence.forEach(d => allCountries.add(d.country));
    return Array.from(allCountries).sort();
  }, []);
  
  useEffect(() => { setIsClient(true); }, []);
  
  // Regional data - loads immediately (does NOT depend on selected country)
  const regionalLossData = useMemo(() => {
    const latest = new Map<string, TimeSeriesPoint>();
    disasterEconomicLoss.forEach(p => { 
      const existing = latest.get(p.country); 
      if (!existing || p.year > existing.year) latest.set(p.country, p); 
    });
    return Array.from(latest.values()).sort((a, b) => b.value - a.value);
  }, []);

  const regionalAffectedData = useMemo(() => {
    const latest = new Map<string, TimeSeriesPoint>();
    affectedPersons.forEach(p => { 
      const existing = latest.get(p.country); 
      if (!existing || p.year > existing.year) latest.set(p.country, p); 
    });
    return Array.from(latest.values()).sort((a, b) => b.value - a.value);
  }, []);

  const beeswarmData = useMemo(() => buildClimateRecords(), []);
  
  // Data that depends on selected country - only computed when country is selected
  const mapTimeSeries = useCallback((data: TimeSeriesPoint[]) => {
    if (!selectedCountry) return [];
    return data.filter(d => d.country === selectedCountry);
  }, [selectedCountry]);
  
  const dataMap = useMemo(() => ({
    temp: mapTimeSeries(surfaceTempAnomalies),
    rainfall: mapTimeSeries(rainfallAnomalies),
    sea: mapTimeSeries(seaLevelAnomalies),
    loss: mapTimeSeries(disasterEconomicLoss),
    people: mapTimeSeries(affectedPersons),
    sea_surface_temperature: mapTimeSeries(seaSurfaceTempAnomalies),
    crop_yield: mapTimeSeries(crop_yield),
    tourist_arrival: mapTimeSeries(tourist_arrival),
    climate_altering_land: mapTimeSeries(climate_altering_land),
    lifestock_yield: mapTimeSeries(lifestock_yield),
    population_growth: mapTimeSeries(population_growth),
    tubercolosis_incidence: mapTimeSeries(tubercolosis_incidence),
  }), [mapTimeSeries]);

  const kpis = useMemo(() => ({
    temp: dataMap.temp.at(-1)?.value ?? 0,
    rainfall: dataMap.rainfall.at(-1)?.value ?? 0,
    sea: dataMap.sea.at(-1)?.value ?? 0,
    loss: dataMap.loss.at(-1)?.value ?? 0,
    people: dataMap.people.at(-1)?.value ?? 0,
    sea_surface_temperature: dataMap.sea_surface_temperature.at(-1)?.value ?? 0,
    crop_yield: dataMap.crop_yield.at(-1)?.value ?? 0,
    tourist_arrival: dataMap.tourist_arrival.at(-1)?.value ?? 0,
    climate_altering_land: dataMap.climate_altering_land.at(-1)?.value ?? 0,
    lifestock_yield: dataMap.lifestock_yield.at(-1)?.value ?? 0,
    population_growth: dataMap.population_growth.at(-1)?.value ?? 0,
    tubercolosis_incidence: dataMap.tubercolosis_incidence.at(-1)?.value ?? 0,
  }), [dataMap]);
  
  const deltas = useMemo(() => ({
    temp: kpis.temp - (dataMap.temp.at(-2)?.value ?? 0),
    rainfall: kpis.rainfall - (dataMap.rainfall.at(-2)?.value ?? 0),
    sea: kpis.sea - (dataMap.sea.at(-2)?.value ?? 0),
    loss: kpis.loss - (dataMap.loss.at(-2)?.value ?? 0),
    people: kpis.people - (dataMap.people.at(-2)?.value ?? 0),
    sea_surface_temperature: kpis.sea_surface_temperature - (dataMap.sea_surface_temperature.at(-2)?.value ?? 0),
    crop_yield: kpis.crop_yield - (dataMap.crop_yield.at(-2)?.value ?? 0),
    tourist_arrival: kpis.tourist_arrival - (dataMap.tourist_arrival.at(-2)?.value ?? 0),
    climate_altering_land: kpis.climate_altering_land - (dataMap.climate_altering_land.at(-2)?.value ?? 0),
    lifestock_yield: kpis.lifestock_yield - (dataMap.lifestock_yield.at(-2)?.value ?? 0),
    population_growth: kpis.population_growth - (dataMap.population_growth.at(-2)?.value ?? 0),
    tubercolosis_incidence: kpis.tubercolosis_incidence - (dataMap.tubercolosis_incidence.at(-2)?.value ?? 0),
  }), [kpis, dataMap]);

  const tempTrend = dataMap.temp.length > 1 && dataMap.temp[0].value !== 0 
    ? ((dataMap.temp[dataMap.temp.length - 1].value - dataMap.temp[0].value) / Math.abs(dataMap.temp[0].value)) * 100 : 0;
  const seaTrend = dataMap.sea.length > 1 && dataMap.sea[0].value !== 0
    ? ((dataMap.sea[dataMap.sea.length - 1].value - dataMap.sea[0].value) / Math.abs(dataMap.sea[0].value)) * 100 : 0;
  const lossTotal = dataMap.loss.reduce((sum, d) => sum + d.value, 0);
  const peopleTotal = dataMap.people.reduce((sum, d) => sum + d.value, 0);

  const climateFlowData = useMemo(() => {
    if (!selectedCountry) return [];
    const years = new Set<number>();
    [...surfaceTempAnomalies, ...seaSurfaceTempAnomalies, ...seaLevelAnomalies, ...rainfallAnomalies, ...disasterEconomicLoss, ...affectedPersons, ...tourist_arrival]
      .filter(d => d.country === selectedCountry).forEach(d => years.add(d.year));
    return Array.from(years).sort().map(year => ({
      country: selectedCountry, year,
      temp: surfaceTempAnomalies.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      sea: seaLevelAnomalies.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      rainfall: rainfallAnomalies.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      loss: disasterEconomicLoss.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      people: affectedPersons.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      sea_surface_temperature: seaSurfaceTempAnomalies.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      crop_yield: crop_yield.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      tourist_arrival: tourist_arrival.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      climate_altering_land: climate_altering_land.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      lifestock_yield: lifestock_yield.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      population_growth: population_growth.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
      tubercolosis_incidence: tubercolosis_incidence.find(d => d.country === selectedCountry && d.year === year)?.value ?? 0,
    }));
  }, [selectedCountry]);

  const multiLineData = useMemo(() => {
    if (!selectedCountry) return [];
    return buildMultiLineData().filter(d => d.country === selectedCountry);
  }, [selectedCountry]);
  
  const chartWidth = 520;
  const hasData = selectedCountry && (dataMap.temp.length > 0 || dataMap.sea.length > 0 || dataMap.rainfall.length > 0);

  if (!isClient) {
    return (
      <main style={S.page}>
        <div style={S.container}>
          <div style={S.hero}>
            <div style={S.kicker}>Pacific Community · SPC NMDI Data Platform</div>
            <h1 style={S.h1}>The Pacific Climate Cascade</h1>
            <p style={S.subhead}>Loading climate data...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <div style={S.container}>
        
        {/* ========== HERO ========== */}
        <div style={S.hero}>
          <div style={S.kicker}>Pacific Community · SPC NMDI Data Platform</div>
          <h1 style={S.h1}>The Pacific Climate Cascade</h1>
          <p style={S.subhead}>
            From rising temperatures to rising seas, from extreme rain to devastated communities — 
            follow the chain of climate impacts across 20+ Pacific Island nations and territories.
          </p>
          <div style={S.pillRow}>
            {countries.map(c => <CountryPill key={c} label={c} active={c === selectedCountry} onClick={() => setSelectedCountry(c)} />)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "1rem" }}>
            <div style={{ marginBottom: "0.4rem" }}>Data sources: 
            <div style={{ marginBottom: "0.6rem" }}>
              <a href="#" style={{ marginRight: "8px" }}>🌊 Sea Surface Temperature Data</a>
              <a href="#" style={{ marginRight: "8px" }}>☔ Rainfall Data</a>
              <a href="#" style={{ marginRight: "8px" }}>📈 Sea Level Data</a>
              <a href="#" style={{ marginRight: "8px" }}>🌡️ Surface Temperature Data</a>
              <a href="#" style={{ marginRight: "8px" }}>👥 Affected Persons Data</a>
              <a href="#">💰 Direct Disasters Economic Loss Data</a>
            </div>
          </div>    
        </div>
      </div>

        {!selectedCountry ? (
          <>
            {/* ========== SELECT COUNTRY PROMPT ========== */}
            <SelectCountryPrompt />
            
            {/* ========== REGIONAL PERSPECTIVE - Appears AFTER the prompt ========== */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>🌏 A Regional Perspective</div>
                <div style={S.storySubtitle}>
                  How do Pacific nations compare? Select a country from above to see detailed comparison with its neighbors.
                </div>
              </div>
              <div style={S.comparisonGrid}>
                <div style={S.chartPanel}>
                  <div style={S.chartHead}><span style={S.chartIcon}>🏆</span><span style={S.chartTitle}>Economic Loss by Country</span><span style={S.chartInsight}>Who bears the highest cost?</span></div>
                  <RankedBarChart width={chartWidth} height={400} data={regionalLossData} />
                </div>
                <div style={S.chartPanel}>
                  <div style={S.chartHead}><span style={S.chartIcon}>📊</span><span style={S.chartTitle}>People Affected by Country</span><span style={S.chartInsight}>Where is the human toll greatest?</span></div>
                  <CountryComparison data={regionalAffectedData} />
                </div>
              </div>
            </div>
          </>
        ) : !hasData ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "1rem", marginBottom: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>No Climate Data Available</h3>
            <p style={{ color: "#64748b" }}>We don't have sufficient climate indicator data for {selectedCountry} yet. Please select another Pacific Island nation from the list above.</p>
          </div>
        ) : (
          <>
            {/* ========== DOUGHNUT CLIMATE IMPACT DASHBOARD (Depends on selected country) ========== */}
            <div style={S.storySection}>
              <DoughnutClimateDashboard kpis={kpis} deltas={deltas} selectedCountry={selectedCountry} isLoading={false} />
            </div>

            {/* ========== CHAPTER 2: The Drivers (Depends on selected country) ========== */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>🌡️ The Drivers of Change</div>
                <div style={S.storySubtitle}>
                  Surface temperatures in {selectedCountry} have <strong style={{ color: "#D85A30" }}>{tempTrend > 0 ? `risen ${tempTrend.toFixed(1)}%` : tempTrend < 0 ? `fallen ${Math.abs(tempTrend).toFixed(1)}%` : "remained stable"}</strong> over the recorded period. 
                  This heat doesn't disappear — it warms oceans and fuels extreme rainfall.
                </div>
                <div style={S.storyInsight}>💡 Hotter air → warmer oceans → more energy for storms → heavier rain</div>
              </div>
              <div style={S.twoColumnGrid}>
                <div style={S.chartPanel}><div style={S.chartHead}><span style={S.chartIcon}>🌡️</span><span style={S.chartTitle}>Surface Temperature Anomaly</span><span style={S.chartInsight}>The starting point</span></div><LineChart width={chartWidth} height={260} data={dataMap.temp} /></div>
                <div style={S.chartPanel}><div style={S.chartHead}><span style={S.chartIcon}>🌊</span><span style={S.chartTitle}>Sea Level Anomaly</span><span style={S.chartInsight}>Thermal expansion + melting ice</span></div><LineChart width={chartWidth} height={260} data={dataMap.sea} /></div>
                <div style={S.chartPanel}><div style={S.chartHead}><span style={S.chartIcon}>🌊</span><span style={S.chartTitle}>Sea Surface Anomaly</span><span style={S.chartInsight}>Driver of marine heatwaves and ocean warming</span></div><LineChart width={chartWidth} height={260} data={dataMap.sea_surface_temperature} /></div>
                <div style={S.chartPanel}><div style={S.chartHead}><span style={S.chartIcon}>☔</span><span style={S.chartTitle}>Precipitation Anomaly</span><span style={S.chartInsight}>More extreme, less predictable</span></div><LineChart width={chartWidth} height={260} data={dataMap.rainfall} /></div>
              </div>
            </div>

            {/* ========== CHAPTER 3: The Consequences (Depends on selected country) ========== */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>💔 The Human & Economic Toll</div>
                <div style={S.storySubtitle}>
                  Climate change is not an abstract concept. Over the recorded period, {selectedCountry} has suffered 
                  <strong style={{ color: "#EF9F27" }}> ${(lossTotal / 1000000).toFixed(1)}M in disaster-related losses</strong> and 
                  <strong style={{ color: "#7F77DD" }}> impacted over {Math.round(peopleTotal / 1000).toFixed(0)}K people</strong>.
                </div>
                <div style={S.storyInsight}>💡 Each disaster has a price tag — and a human face</div>
              </div>
              <div style={S.twoColumnGrid}>
                <div style={S.chartPanel}><div style={S.chartHead}><span style={S.chartIcon}>💰</span><span style={S.chartTitle}>Direct Disaster Economic Loss</span><span style={S.chartInsight}>The financial burden</span></div><Barplot width={chartWidth} height={260} data={dataMap.loss} dataType="loss" setSelectedCountry={setSelectedCountry} /></div>
                <div style={S.chartPanel}><div style={S.chartHead}><span style={S.chartIcon}>👥</span><span style={S.chartTitle}>Number of People Affected</span><span style={S.chartInsight}>Lives disrupted or destroyed</span></div><BubbleChart width={chartWidth} height={260} data={dataMap.people} /></div>
              </div>
            </div>

            {/* ========== CHAPTER 5: The System (Depends on selected country) ========== */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>🔗 Tracing the Causal Chain</div>
                <div style={S.storySubtitle}>Watch how climate drivers flow through environmental and economic impacts to ultimately affect people.</div>
              </div>
              <div style={S.chartPanel}>
                <div style={S.chartHead}><span style={S.chartIcon}>🔀</span><span style={S.chartTitle}>Climate Drivers → Environmental Impact → Economic Consequence → Human Consequence</span></div>
                <TimeSankey width={chartWidth * 2 + 20} height={320} data={climateFlowData} selectedCountry={selectedCountry} />
              </div>
            </div>

            {/* ========== CHAPTER 6: Explore Your Own Story (Partially depends on selected country) ========== */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>🔬 Explore the Data Yourself</div>
                <div style={S.storySubtitle}>Use these interactive tools to find your own insights across all {countries.length} Pacific nations.</div>
                <div style={S.tabContainer}>
                  <button onClick={() => setActiveView("alluvial")} style={S.tabButton(activeView === "alluvial")}>🔀 Alluvial Flow Diagram</button>
                  <button onClick={() => setActiveView("beeswarm")} style={S.tabButton(activeView === "beeswarm")}>🐝 Beeswarm Distribution</button>
                </div>
              </div>
              <div style={S.chartPanel}>
                {activeView === "alluvial" && <AlluvialDiagram width={chartWidth * 2 + 20} height={360} data={climateFlowData} />}
                {activeView === "beeswarm" && <BeeswarmChart width={chartWidth * 2 + 20} height={360} data={beeswarmData} />}
              </div>
            </div>

            {/* ========== CHAPTER 7: Full Timeline (Depends on selected country) ========== */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>📈 A Complete Timeline</div>
                <div style={S.storySubtitle}>All indicators on a single canvas — the full story of climate change in {selectedCountry}.</div>
              </div>
              <div style={S.chartPanel}>
                <MultiLineChart width={chartWidth * 2 + 20} height={400} data={multiLineData} series={climateSeries} title="Climate Anomalies Over Time" yAxisLabel="Anomaly Value" selectedCountry={selectedCountry} />
              </div>
            </div>

            {/* ========== CONCLUSION ========== */}
            <div style={S.conclusion}>
              <div style={S.conclusionTitle}>🌿 The Evidence Is Unequivocal</div>
              <div style={S.conclusionText}>
                For <strong>{selectedCountry}</strong>, the data confirms the complete causal chain: 
                <strong style={{ color: "#D85A30" }}> rising temperatures</strong> drive <strong style={{ color: "#2E86AB" }}>environmental changes</strong>, 
                which create <strong style={{ color: "#EF9F27" }}>economic losses</strong> and ultimately 
                <strong style={{ color: "#7F77DD" }}> affect human communities</strong>.
                {seaTrend > 0 && ` Sea levels have risen ${seaTrend.toFixed(1)}% — and the trend is accelerating.`}
              </div>
              <div style={{ ...S.conclusionText, marginTop: "1rem", fontWeight: 500, color: "#0f172a" }}>The question is no longer "Is climate change real?" but "How will we respond?"</div>
              <div style={{ ...S.conclusionText, marginTop: "1rem", fontSize: "0.85rem", color: "#64748b" }}>
                📊 Tracking: Climate Drivers → Environmental Impact → Economic Consequence → Human Consequence<br />
                🌏 {countries.length} Pacific Island nations and territories<br />
                📅 Time span: 1850–2025 (175+ years of climate data)
              </div>
            </div>
          </>
        )}

        <footer style={S.footer}>
          🌊 Data Source: Pacific Community (SPC) · National Minimum Development Indicators (NMDI) · PDH.Stat Climate Projections
          <br />
          Covering {countries.length} Pacific Island countries and territories · A data storytelling project exploring the cascading impacts of climate change.
        </footer>
      </div>
    </main>
  );
}