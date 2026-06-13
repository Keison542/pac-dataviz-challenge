"use client";
import { useMemo, useCallback, useState, useEffect } from "react";
import { LineChart } from "@/dataviz/lineChart/LineChart";
import { TrendLine } from "@/dataviz/lineChart/trendLine";
import { BubbleChart } from "@/dataviz/bubbleChart/BubbleChart";
import { surfaceTempAnomalies } from "@/data/climate_drivers/surface_temp_anomalies";
import { rainfallAnomalies } from "@/data/climate_drivers/rainfall_anomalies";
import { seaLevelAnomalies } from "@/data/climate_drivers/sea_level_anomalies";
import { disasterEconomicLoss } from "@/data/economic_consequence/direct_disaster_economic_loss";
import { affectedPersons } from "@/data/human_consequence/number_of_persons_affected";
import { seaSurfaceTempAnomalies } from "@/data/climate_drivers/sea_surface_temp_anomalies";
import { MultiLineChart } from "@/dataviz/lineChart/MultiLineChart";
import { buildMultiLineData } from "@/data/climate_drivers/buildMultiLineData";
import { climateSeries } from "@/data/climate_drivers/climateSeries";
import { crop_yield } from "@/data/environmental_impact/crop_yield";
import { tourist_arrival } from "@/data/economic_consequence/tourist_arrival";
import { climate_altering_land } from "@/data/environmental_impact/climate_altering_land";
import { lifestock_yield } from "@/data/environmental_impact/lifestock_yield";
import { population_growth } from "@/data/human_consequence/population_growth";
import TimeSeriesDashboard from "@/dataviz/bubbleChart/TimeSeries";
import { MultiMetricRankedDashboard } from "@/dataviz/barplot/BarChart";
import TimeSankey from "@/dataviz/sankey/TimeSankey";
import BeeswarmChart from "@/dataviz/beeswarm/BeeswarmChart";
import { buildClimateRecords } from "@/lib/mergedClimateRecord";

// ============================================================================
// TYPES
// ============================================================================
interface TimeSeriesPoint { country: string; year: number; value: number; }

const CONTAINER_WIDTH = 1200;

// ============================================================================
// STYLES
// ============================================================================
const S = {
  page: { minHeight: "100vh", background: "#ffffff", fontFamily: "'Inter', system-ui, sans-serif", color: "#0f172a" },
  container: { maxWidth: CONTAINER_WIDTH, margin: "0 auto", padding: "2rem 1.5rem", position: "relative" as const, zIndex: 2 },
  hero: { marginBottom: "3rem", textAlign: "center" as const, position: "relative" as const, zIndex: 2 },
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
  storySection: { marginBottom: "3rem", position: "relative" as const, zIndex: 2 },
  storyHeader: { marginBottom: "1.5rem", textAlign: "center" as const },
  storyTitle: { fontSize: "1.75rem", fontWeight: 600, marginBottom: "0.75rem", color: "#0f172a" },
  storySubtitle: { fontSize: "0.9rem", color: "#64748b", maxWidth: "680px", margin: "0 auto", lineHeight: 1.5 },
  storyInsight: { fontSize: "0.85rem", color: "#D85A30", marginTop: "0.5rem", fontWeight: 500 },
  twoColumnGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" },
  chartWrapper: { background: "transparent", padding: "0.5rem" },
  chartTitle: { fontWeight: 600, fontSize: "1rem", color: "#1e293b", marginBottom: "0.5rem" },
  tabContainer: { display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "1.5rem", flexWrap: "wrap" as const },
  tabButton: (active: boolean) => ({ padding: "0.5rem 1.5rem", borderRadius: "2rem", fontSize: "0.85rem", fontWeight: 500, background: active ? "#0f172a" : "#ffffff", color: active ? "#ffffff" : "#475569", border: "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.15s ease" }),
  conclusion: { textAlign: "center" as const, marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid #e2e8f0" },
  conclusionTitle: { fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" },
  conclusionText: { fontSize: "1rem", color: "#475569", maxWidth: "720px", margin: "0 auto", lineHeight: 1.6 },
  footer: { textAlign: "center" as const, paddingTop: "2rem", marginTop: "2rem", borderTop: "1px solid #e2e8f0", fontSize: "0.75rem", color: "#94a3b8" }
};

const CountryPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => {
  const [hover, setHover] = useState(false);
  return <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={S.countryPill(active, hover)}>{label}</button>;
};

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
// DOUGHNUT CLIMATE IMPACT DASHBOARD
// ============================================================================
const DoughnutClimateDashboard = ({ kpis, deltas, selectedCountry, isLoading }: any) => {
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  
  const safeKpis = kpis || { 
    temp: 0, sea_surface_temperature: 0, rainfall: 0, sea: 0, 
    climate_altering_land: 0, crop_yield: 0, lifestock_yield: 0, 
    loss: 0, tourist_arrival: 0, people: 0, population_growth: 0, 
    tubercolosis_incidence: 0 
  };
  const safeDeltas = deltas || { 
    temp: 0, sea_surface_temperature: 0, rainfall: 0, sea: 0, 
    climate_altering_land: 0, crop_yield: 0, lifestock_yield: 0, 
    loss: 0, tourist_arrival: 0, people: 0, population_growth: 0, 
    tubercolosis_incidence: 0 
  };
  
  if (isLoading) return <LoadingSkeleton />;
  
  const thresholds: Record<string, any> = {
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

  const getMetricValue = (key: string) => {
    const val = safeKpis[key];
    return val !== undefined && val !== null ? val : 0;
  };

  const metrics = [
    { key: "temp", value: getMetricValue("temp"), delta: getMetricValue("temp") },
    { key: "sea_surface_temperature", value: getMetricValue("sea_surface_temperature"), delta: getMetricValue("sea_surface_temperature") },
    { key: "rainfall", value: getMetricValue("rainfall"), delta: getMetricValue("rainfall") },
    { key: "sea", value: getMetricValue("sea"), delta: getMetricValue("sea") },
    { key: "climate_altering_land", value: getMetricValue("climate_altering_land"), delta: getMetricValue("climate_altering_land") },
    { key: "crop_yield", value: getMetricValue("crop_yield"), delta: getMetricValue("crop_yield") },
    { key: "lifestock_yield", value: getMetricValue("lifestock_yield"), delta: getMetricValue("lifestock_yield") },
    { key: "loss", value: getMetricValue("loss"), delta: getMetricValue("loss") },
    { key: "tourist_arrival", value: getMetricValue("tourist_arrival"), delta: getMetricValue("tourist_arrival") },
    { key: "people", value: getMetricValue("people"), delta: getMetricValue("people") },
    { key: "population_growth", value: getMetricValue("population_growth"), delta: getMetricValue("population_growth") },
    { key: "tubercolosis_incidence", value: getMetricValue("tubercolosis_incidence"), delta: getMetricValue("tubercolosis_incidence") },
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
    const timer = setTimeout(() => {
      setActiveMetric(null);
    }, 100);
    setHoverTimer(timer);
  };

  const getSafeTemp = () => safeKpis.temp ?? 0;
  const getSafeSeaSurfaceTemp = () => safeKpis.sea_surface_temperature ?? 0;
  const getSafeRainfall = () => safeKpis.rainfall ?? 0;
  const getSafeSea = () => safeKpis.sea ?? 0;
  const getSafeClimateAlteringLand = () => safeKpis.climate_altering_land ?? 0;
  const getSafeCropYield = () => safeKpis.crop_yield ?? 0;
  const getSafeLifestockYield = () => safeKpis.lifestock_yield ?? 0;
  const getSafeLoss = () => safeKpis.loss ?? 0;
  const getSafeTouristArrival = () => safeKpis.tourist_arrival ?? 0;
  const getSafePeople = () => safeKpis.people ?? 0;
  const getSafePopulationGrowth = () => safeKpis.population_growth ?? 0;
  const getSafeTubercolosisIncidence = () => safeKpis.tubercolosis_incidence ?? 0;

  const hasData = metrics.some(m => Math.abs(m.value) > 0.01);
  if (!hasData) return null;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <span className="text-sm font-medium text-slate-600">📍 {selectedCountry} at a Glance</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* CLIMATE DRIVERS */}
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-3 transition-all duration-200 hover:shadow-md">
          <div className="bg-orange-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold">🌡️ Climate Drivers</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(0, 4).map(m => {
              const t = thresholds[m.key];
              const val = Math.abs(m.value);
              const pct = Math.min(100, (val / t.max) * 100);
              const isActive = activeMetric === m.key;
              
              return (
                <div 
                  key={m.key} 
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
                      {val.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{t.icon} {t.label}</div>
                    <div className="text-[10px] text-slate-400">{pct.toFixed(0)}% of threshold</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ENVIRONMENTAL IMPACT */}
        <div className="bg-teal-50 rounded-xl border border-teal-200 p-3 transition-all duration-200 hover:shadow-md">
          <div className="bg-teal-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold">🌿 Environmental</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(4, 7).map(m => {
              const t = thresholds[m.key];
              const val = m.value;
              const pct = t.isReversed ? 100 - Math.min(100, (val / t.max) * 100) : Math.min(100, (val / t.max) * 100);
              const displayVal = t.multiplier ? (val * t.multiplier).toFixed(1) : val.toFixed(1);
              const isActive = activeMetric === m.key;
              
              return (
                <div 
                  key={m.key} 
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
                    <div className="text-[10px] text-slate-400">Target: {t.max}{t.unit}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ECONOMIC CONSEQUENCE */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 transition-all duration-200 hover:shadow-md">
          <div className="bg-amber-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold">💰 Economic</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(7, 9).map(m => {
              const t = thresholds[m.key];
              const val = m.value;
              const displayVal = t.multiplier ? (val * t.multiplier).toFixed(1) : (val / 1e6).toFixed(1);
              const pct = t.isReversed ? 100 - Math.min(100, (val / t.max) * 100) : Math.min(100, (val / t.max) * 100);
              const isActive = activeMetric === m.key;
              
              return (
                <div 
                  key={m.key} 
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
                    <div className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                      {displayVal}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{t.icon} {t.label}</div>
                    <div className="text-[10px] text-slate-400">Threshold: {t.max}{t.displayUnit || t.unit}</div>
                  </div>
                </div>
              );
            })}
            <div className="mt-2 pt-2 text-center border-t border-amber-200">
              <div className="text-lg font-bold text-amber-700">${(getSafeLoss() / 1e6).toFixed(0)}M</div>
              <div className="text-[9px] text-slate-500">Total economic impact</div>
            </div>
          </div>
        </div>

        {/* HUMAN CONSEQUENCE */}
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 transition-all duration-200 hover:shadow-md">
          <div className="bg-purple-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold">👥 Human</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(9, 12).map(m => {
              const t = thresholds[m.key];
              const val = m.value;
              const displayVal = t.multiplier ? (val * t.multiplier).toFixed(1) : val.toFixed(0);
              const pct = t.isReversed ? 100 - Math.min(100, (val / t.max) * 100) : Math.min(100, (val / t.max) * 100);
              const isActive = activeMetric === m.key;
              
              return (
                <div 
                  key={m.key} 
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
                    <div className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                      {displayVal}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{t.icon} {t.label}</div>
                    <div className="text-[10px] text-slate-400">Threshold: {t.max}{t.unit}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeMetric && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-2 rounded-lg shadow-xl">
          {activeMetric === "temp" && `🌡️ Surface Temperature: ${getSafeTemp() > 0 ? `+${getSafeTemp().toFixed(2)}°C` : `${getSafeTemp().toFixed(2)}°C`} above pre-industrial baseline`}
          {activeMetric === "sea_surface_temperature" && `🌊 Sea Surface Temperature: ${getSafeSeaSurfaceTemp().toFixed(2)}°C - affects marine ecosystems`}
          {activeMetric === "rainfall" && `☔ Rainfall Anomaly: ${getSafeRainfall().toFixed(0)}mm - affects water security`}
          {activeMetric === "sea" && `📈 Sea Level Rise: ${(getSafeSea() * 100).toFixed(0)}cm - threatens coastal communities`}
          {activeMetric === "climate_altering_land" && `🌱 Land Cover Change: ${(getSafeClimateAlteringLand() / 1000).toFixed(0)}K ha altered`}
          {activeMetric === "crop_yield" && `🌾 Crop Yield: ${getSafeCropYield().toFixed(1)} t/ha - food security indicator`}
          {activeMetric === "lifestock_yield" && `🐄 Livestock Yield: ${getSafeLifestockYield().toFixed(1)} tons - agricultural output`}
          {activeMetric === "loss" && `💰 Economic Loss: $${(getSafeLoss() / 1e6).toFixed(1)}M in disaster damages`}
          {activeMetric === "tourist_arrival" && `🌴 Tourist Arrivals: ${(getSafeTouristArrival() / 1000).toFixed(0)}K visitors`}
          {activeMetric === "people" && `👥 People Affected: ${(getSafePeople() / 1000).toFixed(0)}K individuals impacted`}
          {activeMetric === "population_growth" && `📈 Population Growth: ${getSafePopulationGrowth().toFixed(1)}% annually`}
          {activeMetric === "tubercolosis_incidence" && `🩺 TB Incidence: ${getSafeTubercolosisIncidence().toFixed(0)} cases per 100,000`}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState("Fiji");
  const [activeView, setActiveView] = useState<"sankey" | "beeswarm">("sankey");
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => { setIsClient(true); }, []);
  
  const countries = useMemo(() => {
    const all = new Set<string>();
    surfaceTempAnomalies.forEach(d => all.add(d.country));
    rainfallAnomalies.forEach(d => all.add(d.country));
    seaLevelAnomalies.forEach(d => all.add(d.country));
    disasterEconomicLoss.forEach(d => all.add(d.country));
    affectedPersons.forEach(d => all.add(d.country));
    seaSurfaceTempAnomalies.forEach(d => all.add(d.country));
    crop_yield.forEach(d => all.add(d.country));
    tourist_arrival.forEach(d => all.add(d.country));
    climate_altering_land.forEach(d => all.add(d.country));
    lifestock_yield.forEach(d => all.add(d.country));
    population_growth.forEach(d => all.add(d.country));
    return Array.from(all).sort();
  }, []);
  
  useEffect(() => {
    if (countries.length && !countries.includes(selectedCountry)) setSelectedCountry(countries[0]);
  }, [countries, selectedCountry]);
  
  const mapTimeSeries = useCallback((data: TimeSeriesPoint[]) => data.filter(d => d.country === selectedCountry), [selectedCountry]);
  
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
  }), [mapTimeSeries]);

  const kpis = useMemo(() => ({
    temp: dataMap.temp.at(-1)?.value ?? 0, rainfall: dataMap.rainfall.at(-1)?.value ?? 0,
    sea: dataMap.sea.at(-1)?.value ?? 0, loss: dataMap.loss.at(-1)?.value ?? 0,
    people: dataMap.people.at(-1)?.value ?? 0, sea_surface_temperature: dataMap.sea_surface_temperature.at(-1)?.value ?? 0,
    crop_yield: dataMap.crop_yield.at(-1)?.value ?? 0, tourist_arrival: dataMap.tourist_arrival.at(-1)?.value ?? 0,
    climate_altering_land: dataMap.climate_altering_land.at(-1)?.value ?? 0, lifestock_yield: dataMap.lifestock_yield.at(-1)?.value ?? 0,
    population_growth: dataMap.population_growth.at(-1)?.value ?? 0,
  }), [dataMap]);
  
  const deltas = useMemo(() => ({
    temp: kpis.temp - (dataMap.temp.at(-2)?.value ?? 0), rainfall: kpis.rainfall - (dataMap.rainfall.at(-2)?.value ?? 0),
    sea: kpis.sea - (dataMap.sea.at(-2)?.value ?? 0), loss: kpis.loss - (dataMap.loss.at(-2)?.value ?? 0),
    people: kpis.people - (dataMap.people.at(-2)?.value ?? 0), sea_surface_temperature: kpis.sea_surface_temperature - (dataMap.sea_surface_temperature.at(-2)?.value ?? 0),
    crop_yield: kpis.crop_yield - (dataMap.crop_yield.at(-2)?.value ?? 0), tourist_arrival: kpis.tourist_arrival - (dataMap.tourist_arrival.at(-2)?.value ?? 0),
    climate_altering_land: kpis.climate_altering_land - (dataMap.climate_altering_land.at(-2)?.value ?? 0), lifestock_yield: kpis.lifestock_yield - (dataMap.lifestock_yield.at(-2)?.value ?? 0),
    population_growth: kpis.population_growth - (dataMap.population_growth.at(-2)?.value ?? 0),
  }), [kpis, dataMap]);

  const tempTrend = dataMap.temp.length > 1 && dataMap.temp[0].value !== 0 ? ((dataMap.temp[dataMap.temp.length - 1].value - dataMap.temp[0].value) / Math.abs(dataMap.temp[0].value)) * 100 : 0;
  const seaTrend = dataMap.sea.length > 1 && dataMap.sea[0].value !== 0 ? ((dataMap.sea[dataMap.sea.length - 1].value - dataMap.sea[0].value) / Math.abs(dataMap.sea[0].value)) * 100 : 0;
  const lossTotal = dataMap.loss.reduce((sum, d) => sum + d.value, 0);
  const peopleTotal = dataMap.people.reduce((sum, d) => sum + d.value, 0);

  const timeSeriesData = useMemo(() => {
    const years = new Set<number>();
    crop_yield.filter(d => d.country === selectedCountry).forEach(d => years.add(d.year));
    lifestock_yield.filter(d => d.country === selectedCountry).forEach(d => years.add(d.year));
    tourist_arrival.filter(d => d.country === selectedCountry).forEach(d => years.add(d.year));
    return Array.from(years).sort().map(year => ({
      year,
      cropYield: crop_yield.find(d => d.country === selectedCountry && d.year === year)?.value || 0,
      livestockYield: lifestock_yield.find(d => d.country === selectedCountry && d.year === year)?.value || 0,
      touristArrivals: tourist_arrival.find(d => d.country === selectedCountry && d.year === year)?.value || 0
    }));
  }, [selectedCountry]);

  const climateFlowData = useMemo(() => {
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
    }));
  }, [selectedCountry]);

  const rankedData = useMemo(() => {
    const economicLossMap = new Map<string, number>();
    disasterEconomicLoss.forEach(d => economicLossMap.set(d.country, (economicLossMap.get(d.country) || 0) + d.value));
    const cropYieldMap = new Map<string, number>();
    crop_yield.forEach(d => cropYieldMap.set(d.country, (cropYieldMap.get(d.country) || 0) + d.value));
    const touristMap = new Map<string, number>();
    tourist_arrival.forEach(d => touristMap.set(d.country, (touristMap.get(d.country) || 0) + d.value));
    const livestockMap = new Map<string, number>();
    lifestock_yield.forEach(d => livestockMap.set(d.country, (livestockMap.get(d.country) || 0) + d.value));
    const climateMap = new Map<string, number>();
    climate_altering_land.forEach(d => climateMap.set(d.country, (climateMap.get(d.country) || 0) + d.value));
    const populationMap = new Map<string, number>();
    population_growth.forEach(d => populationMap.set(d.country, (populationMap.get(d.country) || 0) + d.value));
    const affectedMap = new Map<string, number>();
    affectedPersons.forEach(d => affectedMap.set(d.country, (affectedMap.get(d.country) || 0) + d.value));
    
    return {
      economicLoss: Array.from(economicLossMap.entries()).map(([country, value]) => ({ country, value })),
      cropYield: Array.from(cropYieldMap.entries()).map(([country, value]) => ({ country, value })),
      touristArrivals: Array.from(touristMap.entries()).map(([country, value]) => ({ country, value })),
      livestockYield: Array.from(livestockMap.entries()).map(([country, value]) => ({ country, value })),
      climateAlteringLand: Array.from(climateMap.entries()).map(([country, value]) => ({ country, value })),
      populationGrowth: Array.from(populationMap.entries()).map(([country, value]) => ({ country, value })),
      affectedPersons: Array.from(affectedMap.entries()).map(([country, value]) => ({ country, value }))
    };
  }, []);

  const multiLineData = useMemo(() => buildMultiLineData().filter(d => d.country === selectedCountry), [selectedCountry]);
  const beeswarmData = useMemo(() => buildClimateRecords(), []);
  const chartWidth = 520;
  
  const hasClimateData = dataMap.temp.length > 0 || dataMap.sea.length > 0 || dataMap.rainfall.length > 0 || dataMap.sea_surface_temperature.length > 0;
  const hasEconomicData = dataMap.loss.length > 0;
  const hasHumanData = dataMap.people.length > 0;
  const hasSocioeconomicData = timeSeriesData.length > 0;
  const hasRegionalData = rankedData.economicLoss.length > 0 || rankedData.cropYield.length > 0;
  const hasCausalData = climateFlowData.length > 0;
  const hasTimelineData = multiLineData.length > 0;

  if (!isClient) return <main style={S.page}><div style={S.container}><LoadingSkeleton /></div></main>;

  return (
    <main style={S.page} className="relative">
      {/* Ocean Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Cpath fill='%2300b4d8' d='M0,400 Q150,350 300,400 T600,400 T900,400 T1200,400' stroke='%2300b4d8' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
          opacity: 0.3
        }} />
      </div>

      {/* Tapa Pattern Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='none'/%3E%3Cpath d='M20,20 L30,30 M70,20 L80,30 M20,70 L30,80 M70,70 L80,80' stroke='%238B4513' stroke-width='2'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "60px"
      }} />

      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] z-0 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/40 via-blue-800/30 to-transparent" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1573771496294-73c48b9b6e8a?w=1600&h=500&fit=crop")`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          opacity: 0.15
        }} />
        <div className="absolute bottom-10 right-10 text-white/10 text-8xl">⛵</div>
        <div className="absolute top-20 left-10 text-white/10 text-6xl rotate-12">🌊</div>
        <div className="absolute bottom-20 left-1/4 text-white/10 text-5xl -rotate-12">🌴</div>
      </div>

      <div style={S.container}>
        {/* Pacific Dataviz Challenge Badge */}
        <div className="relative z-10 mb-4 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-4 py-2 rounded-full shadow-lg">
            <span className="text-sm">🏆</span>
            <span className="text-xs font-semibold tracking-wide">Pacific Dataviz Challenge 2026 Official Submission</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">Climate Theme</span>
          </div>
        </div>

        {/* HERO */}
        <div style={S.hero} className="relative z-10">
          <div style={S.kicker}>Pacific Community · SPC NMDI Data Platform</div>
          <h1 style={S.h1}>The Pacific Climate Cascade</h1>
          <p style={S.subhead}>
            From rising temperatures to rising seas, from extreme rain to devastated communities — 
            follow the chain of climate impacts across 20+ Pacific Island nations and territories.
          </p>
          
          {/* Country Selector Pills */}
          <div style={S.pillRow}>
            {countries.map(c => (
              <CountryPill key={c} label={c} active={c === selectedCountry} onClick={() => setSelectedCountry(c)} />
            ))}
          </div>

          {/* Data Sources Links */}
          <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "1rem" }}>
            <div style={{ marginBottom: "0.4rem" }}>📊 Official datasets from <span className="font-semibold">Pacific Data Hub from 1850–2025 (175+ years of climate data)</span>:</div>
            <div style={{ marginBottom: "0.6rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
              <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.SST_ANOM.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">🌊 Sea Surface Temperature</a>
              <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.RAIN_ANOM.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">☔ Rainfall Data</a>
              <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.SEA_LVL.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">📈 Sea Level Data</a>
              <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.ST_ANOM.&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">🌡️ Surface Temperature</a>
              <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_11&df[ag]=SPC&df[vs]=3.0&dq=A.VC_DSR_AFFCT.........&pd=,&to[TIME_PERIOD]=false&lb=bt" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">👥 Affected Persons</a>
              <a href="https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_11&df[ag]=SPC&df[vs]=3.0&dq=A.VC_DSR_AALT...._T.....&pd=,&to[TIME_PERIOD]=false" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">💰 Economic Loss</a>
            </div>
          </div>
        </div>

        {/* CHAPTER 1: Doughnut Dashboard */}
        {hasClimateData && (
          <div style={S.storySection}>
            <DoughnutClimateDashboard kpis={kpis} deltas={deltas} selectedCountry={selectedCountry} isLoading={false} />
          </div>
        )}

        {/* CHAPTER 2: Climate Drivers - NO CARDS */}
        {hasClimateData && (
          <div style={S.storySection}>
            <div style={S.storyHeader}>
              <div style={S.storyTitle}>🌡️ The Drivers of Change</div>
              <div style={S.storySubtitle}>Surface temperatures have {tempTrend > 0 ? `risen ${tempTrend.toFixed(1)}%` : tempTrend < 0 ? `fallen ${Math.abs(tempTrend).toFixed(1)}%` : "remained stable"} over the recorded period.</div>
              <div style={S.storyInsight}>💡 Hotter air → warmer oceans → more energy for storms → heavier rain</div>
            </div>
            <div style={S.twoColumnGrid}>
              {dataMap.temp.length > 0 && (
                <div style={S.chartWrapper}>
                  <div style={S.chartTitle}>🌡️ Surface Temperature</div>
                  <LineChart width={chartWidth} height={260} data={dataMap.temp} />
                </div>
              )}
              {dataMap.sea.length > 0 && (
                <div style={S.chartWrapper}>
                  <div style={S.chartTitle}>🌊 Sea Level Anomaly</div>
                  <LineChart width={chartWidth} height={260} data={dataMap.sea} />
                </div>
              )}
              {dataMap.sea_surface_temperature.length > 0 && (
                <div style={S.chartWrapper}>
                  <div style={S.chartTitle}>🌊 Sea Surface Temperature</div>
                  <LineChart width={chartWidth} height={260} data={dataMap.sea_surface_temperature} />
                </div>
              )}
              {dataMap.rainfall.length > 0 && (
                <div style={S.chartWrapper}>
                  <div style={S.chartTitle}>☔ Precipitation Anomaly</div>
                  <LineChart width={chartWidth} height={260} data={dataMap.rainfall} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAPTER 3: Human, Economic & Socioeconomic Toll - NO CARDS */}
        {(hasEconomicData || hasHumanData || hasSocioeconomicData) && (
          <div style={S.storySection}>
            <div style={S.storyHeader}>
              <div style={S.storyTitle}>💔 The Human, Economic & Socioeconomic Toll</div>
              <div style={S.storySubtitle}>{selectedCountry} has suffered ${(lossTotal / 1e6).toFixed(0)}M in losses and impacted {(peopleTotal / 1000).toFixed(0)}K people.</div>
              <div style={S.storyInsight}>💡 Each disaster has a price tag — and a human face. Climate affects food security, livelihoods, and economic stability.</div>
            </div>
            
            {(hasEconomicData || hasHumanData) && (
              <div style={S.twoColumnGrid}>
                {hasEconomicData && (
                  <div style={S.chartWrapper}>
                    <div style={S.chartTitle}>💰 Economic Loss</div>
                    <TrendLine width={chartWidth} height={260} data={dataMap.loss} dataType="loss" setSelectedCountry={setSelectedCountry} />
                  </div>
                )}
                {hasHumanData && (
                  <div style={S.chartWrapper}>
                    <div style={S.chartTitle}>👥 People Affected</div>
                    <BubbleChart width={chartWidth} height={260} data={dataMap.people} />
                  </div>
                )}
              </div>
            )}

            {hasSocioeconomicData && (
              <div style={{ marginTop: "1.5rem" }}>
                <div style={S.chartWrapper}>
                  <div style={S.chartTitle}>📊 Crop Yield, Livestock & Tourism Trends</div>
                  <TimeSeriesDashboard width={chartWidth * 2 + 20} height={480} data={timeSeriesData} selectedCountry={selectedCountry} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHAPTER 4: Regional Comparison - NO CARD */}
        {hasRegionalData && (
          <div style={S.storySection}>
            <div style={S.storyHeader}>
              <div style={S.storyTitle}>🌏 A Regional Perspective</div>
              <div style={S.storySubtitle}>How does {selectedCountry} compare to {countries.length} other Pacific nations across 7 key metrics?</div>
              <div style={S.storyInsight}>💡 Click on any metric to see country rankings. Thicker bars indicate higher impact.</div>
            </div>
            <div style={S.chartWrapper}>
              <MultiMetricRankedDashboard width={chartWidth * 2 + 20} height={520} data={rankedData} />
            </div>
          </div>
        )}

        {/* CHAPTER 5: Causal Chain Explorer - NO CARD */}
        {hasCausalData && (
          <div style={S.storySection}>
            <div style={S.storyHeader}>
              <div style={S.storyTitle}>🔗 Tracing the Causal Chain</div>
              <div style={S.storySubtitle}>Toggle between Sankey flow diagram and beeswarm distribution to explore the complete climate cascade.</div>
              <div style={S.tabContainer}>
                <button onClick={() => setActiveView("sankey")} style={S.tabButton(activeView === "sankey")}>🔀 Sankey Flow Diagram</button>
                <button onClick={() => setActiveView("beeswarm")} style={S.tabButton(activeView === "beeswarm")}>🐝 Beeswarm Distribution</button>
              </div>
            </div>
            <div style={S.chartWrapper}>
              {activeView === "sankey" && <TimeSankey width={chartWidth * 2 + 20} height={420} data={climateFlowData} selectedCountry={selectedCountry} title="Climate Impact Flow" insight="This diagram traces the causal chain from climate drivers to human impacts. Thicker lines indicate stronger connections." />}
              {activeView === "beeswarm" && <BeeswarmChart width={chartWidth * 2 + 20} height={500} data={beeswarmData} title="Climate Impact Distribution" insight="Each dot represents a climate impact measurement. Size shows magnitude, color indicates type. Dots cluster by country (vertical) and decade (horizontal)." />}
            </div>
          </div>
        )}

        {/* CHAPTER 6: Full Timeline - NO CARD */}
        {hasTimelineData && (
          <div style={S.storySection}>
            <div style={S.storyHeader}>
              <div style={S.storyTitle}>📈 A Complete Timeline</div>
              <div style={S.storySubtitle}>All indicators on a single canvas — the full story of climate change in {selectedCountry}.</div>
            </div>
            <div style={S.chartWrapper}>
              <MultiLineChart width={chartWidth * 2 + 20} height={400} data={multiLineData} series={climateSeries} title="Climate Anomalies Over Time" yAxisLabel="Anomaly Value" selectedCountry={selectedCountry} />
            </div>
          </div>
        )}

        {/* CONCLUSION */}
        {(hasClimateData || hasEconomicData || hasHumanData || hasSocioeconomicData || hasRegionalData || hasCausalData || hasTimelineData) && (
          <div style={S.conclusion}>
            <div className="relative">
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-5xl opacity-20">🌊</div>
              <div style={S.conclusionTitle}>🌿 The Evidence Is Unequivocal</div>
              <div style={S.conclusionText}>
                For <strong>{selectedCountry}</strong>, the data confirms the complete causal chain: 
                <strong style={{ color: "#D85A30" }}> rising temperatures</strong> drive <strong style={{ color: "#2E86AB" }}>environmental changes</strong>, 
                which create <strong style={{ color: "#EF9F27" }}>economic losses</strong> and ultimately 
                <strong style={{ color: "#7F77DD" }}> affect human communities</strong>.
                {seaTrend > 0 && ` Sea levels have risen ${seaTrend.toFixed(1)}% — and the trend is accelerating.`}
              </div>
              <div style={{ ...S.conclusionText, marginTop: "1rem", fontWeight: 500, color: "#0f172a" }}>
                The question is no longer "Is climate change real?" but "How will we respond?"
              </div>
              <div style={{ ...S.conclusionText, marginTop: "1rem", fontSize: "0.85rem", color: "#64748b" }}>
                📊 Tracking: Climate Drivers → Environmental Impact → Economic Consequence → Human Consequence<br />
                🌏 {countries.length} Pacific Island nations and territories<br />
              </div>
            </div>
          </div>
        )}

        {/* No data message */}
        {!hasClimateData && !hasEconomicData && !hasHumanData && !hasSocioeconomicData && !hasRegionalData && !hasCausalData && !hasTimelineData && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 opacity-30">🌊</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Climate Data Available</h3>
            <p className="text-sm text-slate-400 max-w-md">
              No climate impact data is currently available for {selectedCountry}. 
              Please try selecting another Pacific Island nation from the list above.
              <img 
                src="/images/erosion-map.png" 
                alt="Coastal erosion map showing shoreline change rates"
                className="w-full h-auto rounded-lg mt-4"
              />
            </p>
          </div>
        )}

        <footer style={S.footer}>
          <div className="flex flex-col items-center gap-2">
            <p>
              Covering {countries.length} Pacific Island countries and territories · A data storytelling project for the <strong className="text-cyan-600">Pacific Dataviz Challenge 2026</strong>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}