"use client";
import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { DoughnutClimateDashboard } from "@/components/DoughnutClimateDashboard";
import { ClimateDriversSection } from "@/components/ClimateDriversSection";
import { HumanEconomicSection } from "@/components/HumanEconomicSection";
import { RegionalComparisonSection } from "@/components/RegionalComparisonSection";
import { CausalChainSection } from "@/components/CausalChainSection";
import { FullTimelineSection } from "@/components/FullTimelineSection";
import { Conclusion } from "@/components/Conclusion";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useClimateData } from "@/hooks/useClimateData";

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
export default function Home() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => { setIsClient(true); }, []);
  
  const {
    selectedCountry,
    setSelectedCountry,
    countries,
    dataMap,
    kpis,
    deltas,
    timeSeriesData,
    climateFlowData,
    rankedData,
    multiLineData,
    beeswarmData,
    tempTrend,
    seaTrend,
    lossTotal,
    peopleTotal,
    hasClimateData,
    hasEconomicData,
    hasHumanData,
    hasSocioeconomicData,
    hasRegionalData,
    hasCausalData,
    hasTimelineData,
  } = useClimateData();

  const chartWidth = 520;

  if (!isClient) return <LoadingSkeleton />;

  return (
    <main className="relative min-h-screen bg-white font-sans text-slate-900">
      {/* Background Patterns */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Cpath fill='%2300b4d8' d='M0,400 Q150,350 300,400 T600,400 T900,400 T1200,400' stroke='%2300b4d8' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
          opacity: 0.3
        }} />
      </div>

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

      <div className="relative z-2 max-w-[1200px] mx-auto px-6 py-8">
        {/* Pacific Dataviz Challenge Badge */}
        <div className="relative z-10 mb-4 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-4 py-2 rounded-full shadow-lg">
            <span className="text-sm">🏆</span>
            <span className="text-xs font-semibold tracking-wide">Pacific Dataviz Challenge 2026 Official Submission</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">Climate Theme</span>
          </div>
        </div>

        <Hero countries={countries} selectedCountry={selectedCountry} onSelectCountry={setSelectedCountry} />

        {hasClimateData && (
          <>
            <DoughnutClimateDashboard kpis={kpis} deltas={deltas} selectedCountry={selectedCountry} />
            <ClimateDriversSection dataMap={dataMap} tempTrend={tempTrend} chartWidth={chartWidth} />
          </>
        )}

        {(hasEconomicData || hasHumanData || hasSocioeconomicData) && (
          <HumanEconomicSection 
            selectedCountry={selectedCountry}
            lossTotal={lossTotal}
            peopleTotal={peopleTotal}
            dataMap={dataMap}
            timeSeriesData={timeSeriesData}
            chartWidth={chartWidth}
            setSelectedCountry={setSelectedCountry}
          />
        )}

        {hasRegionalData && (
          <RegionalComparisonSection 
            selectedCountry={selectedCountry}
            countriesCount={countries.length}
            rankedData={rankedData}
            chartWidth={chartWidth}
          />
        )}

        {hasCausalData && (
          <CausalChainSection 
            climateFlowData={climateFlowData}
            beeswarmData={beeswarmData}
            selectedCountry={selectedCountry}
            chartWidth={chartWidth}
          />
        )}

        {hasTimelineData && (
          <FullTimelineSection 
            selectedCountry={selectedCountry}
            multiLineData={multiLineData}
            chartWidth={chartWidth}
          />
        )}

        {(hasClimateData || hasEconomicData || hasHumanData || hasSocioeconomicData || hasRegionalData || hasCausalData || hasTimelineData) && (
          <Conclusion selectedCountry={selectedCountry} seaTrend={seaTrend} countriesCount={countries.length} />
        )}

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

        <footer className="text-center pt-8 mt-8 border-t border-slate-200 text-xs text-slate-400">
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