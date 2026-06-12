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
  
  const safeKpis = kpis || { temp: 0, sea_surface_temperature: 0, rainfall: 0, sea: 0, climate_altering_land: 0, crop_yield: 0, lifestock_yield: 0, loss: 0, tourist_arrival: 0, people: 0, population_growth: 0, tubercolosis_incidence: 0 };
  const safeDeltas = deltas || { temp: 0, sea_surface_temperature: 0, rainfall: 0, sea: 0, climate_altering_land: 0, crop_yield: 0, lifestock_yield: 0, loss: 0, tourist_arrival: 0, people: 0, population_growth: 0, tubercolosis_incidence: 0 };
  
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

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <span className="text-sm font-medium text-slate-600">📍 {selectedCountry} at a Glance</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Column 1: Climate Drivers */}
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-3">
          <div className="bg-orange-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold">🌡️ Climate Drivers</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(0, 4).map(m => {
              const t = thresholds[m.key];
              const val = Math.abs(m.value);
              const pct = Math.min(100, (val / t.max) * 100);
              return (
                <div key={m.key} className="flex items-center gap-2 cursor-pointer" onMouseEnter={() => setActiveMetric(m.key)} onMouseLeave={() => setActiveMetric(null)}>
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle cx="24" cy="24" r="18" fill="none" stroke={t.color} strokeWidth="4" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - pct / 100)} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{val.toFixed(1)}</div>
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
        {/* Column 2: Environmental */}
        <div className="bg-teal-50 rounded-xl border border-teal-200 p-3">
          <div className="bg-teal-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold">🌿 Environmental</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(4, 7).map(m => {
              const t = thresholds[m.key];
              const val = m.value;
              const pct = t.isReversed ? 100 - Math.min(100, (val / t.max) * 100) : Math.min(100, (val / t.max) * 100);
              const displayVal = t.multiplier ? (val * t.multiplier).toFixed(1) : val.toFixed(1);
              return (
                <div key={m.key} className="flex items-center gap-2">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle cx="24" cy="24" r="18" fill="none" stroke={t.color} strokeWidth="4" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - pct / 100)} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{displayVal}</div>
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
        {/* Column 3: Economic */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3">
          <div className="bg-amber-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold">💰 Economic</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(7, 9).map(m => {
              const t = thresholds[m.key];
              const val = m.value;
              const displayVal = t.multiplier ? (val * t.multiplier).toFixed(1) : (val / 1e6).toFixed(1);
              const pct = t.isReversed ? 100 - Math.min(100, (val / t.max) * 100) : Math.min(100, (val / t.max) * 100);
              return (
                <div key={m.key} className="flex items-center gap-2">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle cx="24" cy="24" r="18" fill="none" stroke={t.color} strokeWidth="4" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - pct / 100)} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">{displayVal}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{t.icon} {t.label}</div>
                    <div className="text-[10px] text-slate-400">Threshold: {t.max}{t.displayUnit || t.unit}</div>
                  </div>
                </div>
              );
            })}
            <div className="mt-2 pt-2 text-center border-t border-amber-200">
              <div className="text-lg font-bold text-amber-700">${(safeKpis.loss / 1e6).toFixed(0)}M</div>
              <div className="text-[9px] text-slate-500">Total economic impact</div>
            </div>
          </div>
        </div>
        {/* Column 4: Human */}
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-3">
          <div className="bg-purple-500 -mt-3 -mx-3 mb-3 px-3 py-2 rounded-t-xl">
            <span className="text-white text-sm font-semibold">👥 Human</span>
          </div>
          <div className="space-y-3">
            {metrics.slice(9, 12).map(m => {
              const t = thresholds[m.key];
              const val = m.value;
              const displayVal = t.multiplier ? (val * t.multiplier).toFixed(1) : val.toFixed(0);
              const pct = t.isReversed ? 100 - Math.min(100, (val / t.max) * 100) : Math.min(100, (val / t.max) * 100);
              return (
                <div key={m.key} className="flex items-center gap-2">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle cx="24" cy="24" r="18" fill="none" stroke={t.color} strokeWidth="4" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - pct / 100)} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">{displayVal}</div>
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
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl animate-fade-in">
          {activeMetric === "temp" && `🌡️ Surface Temperature: ${safeKpis.temp > 0 ? `+${safeKpis.temp.toFixed(2)}°C` : `${safeKpis.temp.toFixed(2)}°C`} above baseline`}
        </div>
      )}
      <style>{`@keyframes fade-in{from{opacity:0}to{opacity:1}}.animate-fade-in{animation:fade-in 0.2s ease-out}`}</style>
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
  const hasData = dataMap.temp.length > 0 || dataMap.sea.length > 0 || dataMap.rainfall.length > 0;

  if (!isClient) return <main style={S.page}><div style={S.container}><LoadingSkeleton /></div></main>;

  return (
    <main style={S.page}>
      <div style={S.container}>
        {/* HERO */}
        <div style={S.hero}>
          <div style={S.kicker}>Pacific Community · SPC NMDI Data Platform</div>
          <h1 style={S.h1}>The Pacific Climate Cascade</h1>
          <p style={S.subhead}>From rising temperatures to rising seas, from extreme rain to devastated communities — follow the chain of climate impacts across 20+ Pacific Island nations.</p>
          <div style={S.pillRow}>{countries.map(c => <CountryPill key={c} label={c} active={c === selectedCountry} onClick={() => setSelectedCountry(c)} />)}</div>
        </div>

        {!hasData ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "1rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>No Climate Data Available</h3>
          </div>
        ) : (
          <>
            {/* CHAPTER 1: Doughnut Dashboard */}
            <div style={S.storySection}>
              <DoughnutClimateDashboard kpis={kpis} deltas={deltas} selectedCountry={selectedCountry} isLoading={false} />
            </div>

            {/* CHAPTER 2: Climate Drivers */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>🌡️ The Drivers of Change</div>
                <div style={S.storySubtitle}>Surface temperatures have {tempTrend > 0 ? `risen ${tempTrend.toFixed(1)}%` : tempTrend < 0 ? `fallen ${Math.abs(tempTrend).toFixed(1)}%` : "remained stable"} over the recorded period.</div>
              </div>
              <div style={S.twoColumnGrid}>
                <div style={S.chartPanel}><div style={S.chartHead}><span style={S.chartIcon}>🌡️</span><span style={S.chartTitle}>Surface Temperature</span></div><LineChart width={chartWidth} height={260} data={dataMap.temp} /></div>
                <div style={S.chartPanel}><div style={S.chartHead}><span style={S.chartIcon}>🌊</span><span style={S.chartTitle}>Sea Level Anomaly</span></div><LineChart width={chartWidth} height={260} data={dataMap.sea} /></div>
                <div style={S.chartPanel}><div style={S.chartHead}><span style={S.chartIcon}>🌊</span><span style={S.chartTitle}>Sea Surface Temperature</span></div><LineChart width={chartWidth} height={260} data={dataMap.sea_surface_temperature} /></div>
                <div style={S.chartPanel}><div style={S.chartHead}><span style={S.chartIcon}>☔</span><span style={S.chartTitle}>Precipitation Anomaly</span></div><LineChart width={chartWidth} height={260} data={dataMap.rainfall} /></div>
              </div>
            </div>

            {/* CHAPTER 3: The Human, Economic & Socioeconomic Toll */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>💔 The Human, Economic & Socioeconomic Toll</div>
                <div style={S.storySubtitle}>{selectedCountry} has suffered ${(lossTotal / 1e6).toFixed(0)}M in losses and impacted {(peopleTotal / 1000).toFixed(0)}K people.</div>
              </div>
              
              <div style={S.twoColumnGrid}>
                <div style={S.chartPanel}>
                  <div style={S.chartHead}><span style={S.chartIcon}>💰</span><span style={S.chartTitle}>Economic Loss</span></div>
                  <TrendLine width={chartWidth} height={260} data={dataMap.loss} dataType="loss" setSelectedCountry={setSelectedCountry} />
                </div>
                <div style={S.chartPanel}>
                  <div style={S.chartHead}><span style={S.chartIcon}>👥</span><span style={S.chartTitle}>People Affected</span></div>
                  <BubbleChart width={chartWidth} height={260} data={dataMap.people} />
                </div>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <div style={S.chartPanel}>
                  <div style={S.chartHead}>
                    <span style={S.chartIcon}>📊</span>
                    <span style={S.chartTitle}>Crop Yield, Livestock & Tourism Trends</span>
                  </div>
                  <TimeSeriesDashboard width={chartWidth * 2 + 20} height={480} data={timeSeriesData} selectedCountry={selectedCountry} />
                </div>
              </div>
            </div>

            {/* CHAPTER 4: Regional Comparison */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>🌏 Regional Perspective</div>
                <div style={S.storySubtitle}>How does {selectedCountry} compare to {countries.length} other Pacific nations?</div>
              </div>
              <div style={S.chartPanel}>
                <MultiMetricRankedDashboard width={chartWidth * 2 + 20} height={520} data={rankedData} />
              </div>
            </div>

            {/* CHAPTER 5: Causal Chain Explorer */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>🔬 Explore the Climate Cascade</div>
                <div style={S.storySubtitle}>Toggle between Sankey flow diagram and beeswarm distribution.</div>
                <div style={S.tabContainer}>
                  <button onClick={() => setActiveView("sankey")} style={S.tabButton(activeView === "sankey")}>🔀 Sankey Flow</button>
                  <button onClick={() => setActiveView("beeswarm")} style={S.tabButton(activeView === "beeswarm")}>🐝 Beeswarm</button>
                </div>
              </div>
              <div style={S.chartPanel}>
                {activeView === "sankey" && <TimeSankey width={chartWidth * 2 + 20} height={400} data={climateFlowData} selectedCountry={selectedCountry} />}
                {activeView === "beeswarm" && <BeeswarmChart width={chartWidth * 2 + 20} height={500} data={beeswarmData} />}
              </div>
            </div>

            {/* CHAPTER 6: Full Timeline */}
            <div style={S.storySection}>
              <div style={S.storyHeader}>
                <div style={S.storyTitle}>📈 Complete Timeline</div>
                <div style={S.storySubtitle}>All indicators on a single canvas.</div>
              </div>
              <div style={S.chartPanel}>
                <MultiLineChart width={chartWidth * 2 + 20} height={400} data={multiLineData} series={climateSeries} title="Climate Anomalies" yAxisLabel="Anomaly Value" selectedCountry={selectedCountry} />
              </div>
            </div>

            {/* CONCLUSION */}
            <div style={S.conclusion}>
              <div style={S.conclusionTitle}>🌿 The Evidence Is Unequivocal</div>
              <div style={S.conclusionText}>The data confirms the complete causal chain for {selectedCountry}. {seaTrend > 0 && `Sea levels have risen ${seaTrend.toFixed(1)}% — and the trend is accelerating.`}</div>
              <div style={{ ...S.conclusionText, marginTop: "1rem", fontWeight: 500 }}>The question is no longer "Is climate change real?" but "How will we respond?"</div>
            </div>
          </>
        )}
        <footer style={S.footer}>🌊 Data Source: Pacific Community (SPC) · Covering {countries.length} Pacific nations</footer>
      </div>
    </main>
  );
}