"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { Hero } from "@/components/Hero";
import { DoughnutClimateDashboard } from "@/components/DoughnutClimateDashboard";
import { ClimateDriversSection } from "@/components/ClimateDriversSection";
import { HumanEconomicSection } from "@/components/HumanEconomicSection";
import { RegionalComparisonSection } from "@/components/RegionalComparisonSection";
import { CausalChainSection } from "@/components/CausalChainSection";
import { Conclusion } from "@/components/Conclusion";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { StoryTransition } from "@/components/StoryTransition";
import { useClimateData } from "@/hooks/useClimateData";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
    },
  },
};

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

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
    climateIndex,
    climateSignal,
    anomalyScores,
  } = useClimateData();

  const chartWidth = 520;

  if (!isClient) return <LoadingSkeleton />;

  return (
    <main className="bg-white text-slate-900 overflow-x-hidden">

      <section className="min-h-screen flex flex-col justify-center">
        <div className="max-w-[1200px] mx-auto px-6 w-full">
          <Hero
            countries={countries}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
          />
        </div>
      </section>

        <section className="min-h-[65vh] flex items-center justify-center px-6">
          <div className="max-w-5xl text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-6">
              The Pacific Climate Paradox
            </div>
        
            <h2 className="text-4xl md:text-6xl font-light leading-tight">
              The Pacific contributed little to the climate crisis.
              <span className="block mt-4">
                Yet its nations stand on the front line of its consequences.
              </span>
            </h2>
        
            <p className="mt-8 text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
              Climate pressures are shared across the region, but their consequences
              are not. Differences in exposure, economic resilience, and capacity to
              adapt create unequal climate risks across Pacific nations.
            </p>
          </div>
        </section>

      {hasClimateData && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1200px] mx-auto px-6 py-12"
        >
          <DoughnutClimateDashboard
            kpis={kpis}
            selectedCountry={selectedCountry}
            climateIndex={climateIndex}
            climateSignal={climateSignal}
            anomalyScores={anomalyScores}
          />
        </motion.section>
      )}
  
      {hasClimateData && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1200px] mx-auto px-6 py-12"
        >
          <ClimateDriversSection
            dataMap={dataMap}
            tempTrend={tempTrend}
            chartWidth={chartWidth}
            selectedCountry={selectedCountry}
          />
        </motion.section>
      )}

      <section className="min-h-[50vh] flex items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <h2 className="text-5xl md:text-7xl font-light leading-tight">
            Climate change is often measured in degrees and centimetres, but its consequences are measured in disrupted lives.
          </h2>

          <p className="mt-6 text-xl text-slate-500">
            In other words, the consequences appear when environmental change reaches people,
            livelihoods and economies.
          </p>
        </div>
      </section>

      <section className="min-h-[40vh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-6xl md:text-8xl font-bold">
            {peopleTotal.toLocaleString()} 
          </div>

          <div className="mt-4 text-xl text-slate-500">
            lives disrupted by climate-related disasters in {selectedCountry}. 
          </div>
        </div>
      </section>

      {(hasEconomicData || hasHumanData || hasSocioeconomicData) && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1200px] mx-auto px-6 py-12"
        >
          <HumanEconomicSection
            selectedCountry={selectedCountry}
            lossTotal={lossTotal}
            peopleTotal={peopleTotal}
            dataMap={dataMap}
            timeSeriesData={timeSeriesData}
            chartWidth={chartWidth}
            setSelectedCountry={setSelectedCountry}
          />
        </motion.section>
      )}

      <section className="min-h-[50vh] flex items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <h2 className="text-5xl md:text-7xl font-light leading-tight">
            But does every Pacific country experience these consequences in the same way?
          </h2>
        </div>
      </section>

     
      {hasRegionalData && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1200px] mx-auto px-6 py-12"
        >
          <RegionalComparisonSection
            selectedCountry={selectedCountry}
            countriesCount={countries.length}
            rankedData={rankedData}
            chartWidth={chartWidth}
          />
        </motion.section>
      )}

      <section className="min-h-[50vh] flex items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <h2 className="text-5xl md:text-7xl font-light leading-tight">
            Why does vulnerability emerge?
          </h2>

          <p className="mt-6 text-xl text-slate-500">
            The answer lies in how climate drivers interact. Temperature,
            rainfall, sea-level rise and ocean warming rarely operate in
            isolation. Together they create cascading effects that amplify
            risk across environmental, economic and human systems.
          </p>
        </div>
      </section>

      {hasCausalData && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1200px] mx-auto px-6 py-16"
        >
          <CausalChainSection
            climateFlowData={climateFlowData}
            beeswarmData={beeswarmData}
            selectedCountry={selectedCountry}
            chartWidth={chartWidth}
          />
        </motion.section>
      )}

      {(hasClimateData ||
        hasEconomicData ||
        hasHumanData ||
        hasSocioeconomicData ||
        hasRegionalData ||
        hasCausalData ||
        hasTimelineData) && (
        <section className="max-w-[1200px] mx-auto px-6 py-12">
          <Conclusion
            selectedCountry={selectedCountry}
            seaTrend={seaTrend}
            countriesCount={countries.length}
          />
        </section>
      )}

      
      <footer className="text-center py-12 text-xs text-slate-400">
        <p className="mt-4">
          <strong>
            Pacific Interactive Dataviz Challenge 2026 is created by{" "}
          <a
            href="https://www.linkedin.com/in/keison-tipiou-7a817a6a/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-600"
          >
            <strong>Keison Tipiou</strong>
          </a>{" "}  for {countries.length} Pacific Island
            countries.
          </strong>
        </p>
      
      </footer>
    </main>
  );
}
