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
  } = useClimateData();

  const chartWidth = 520;

  if (!isClient) return <LoadingSkeleton />;

  return (
    <main className="bg-white text-slate-900 overflow-x-hidden">

      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}

      <section className="min-h-screen flex flex-col justify-center">
        <div className="max-w-[1200px] mx-auto px-6 w-full">
          <Hero
            countries={countries}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
          />
        </div>
      </section>

      {/* ========================================================= */}
      {/* CLIMATE SIGNAL INTRO */}
      {/* ========================================================= */}

      <section className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <h2 className="text-4xl md:text-6xl font-light leading-tight">
            <>
              The Pacific helped create little of the climate crisis. Yet its nations stand on the front line of its consequences. 
            </>
          </h2>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CLIMATE DASHBOARD */}
      {/* ========================================================= */}

      {hasClimateData && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1200px] mx-auto px-6 py-24"
        >
          <DoughnutClimateDashboard
            kpis={kpis}
            deltas={deltas}
            selectedCountry={selectedCountry}
          />
        </motion.section>
      )}

      {/* ========================================================= */}
      {/* TEMPERATURE + SEA LEVEL */}
      {/* ========================================================= */}

      {hasClimateData && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1200px] mx-auto px-6 py-24"
        >
          <ClimateDriversSection
            dataMap={dataMap}
            tempTrend={tempTrend}
            chartWidth={chartWidth}
            selectedCountry={selectedCountry}
          />
        </motion.section>
      )}

      {/* ========================================================= */}
      {/* HUMAN IMPACT INTRO */}
      {/* ========================================================= */}

      <section className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <h2 className="text-5xl md:text-7xl font-light leading-tight">
            Climate change is often measured in degrees and centimetres, but its consequences are measured in disrupted lives.
          </h2>

          <p className="mt-10 text-xl text-slate-500">
            In other words, the consequences appear when environmental change reaches people,
            livelihoods and economies.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* BIG NUMBER */}
      {/* ========================================================= */}

      <section className="min-h-screen flex items-center justify-center px-6 border-y border-slate-100">
        <div className="text-center">
          <div className="text-6xl md:text-8xl font-bold">
            {peopleTotal.toLocaleString()} lives disrupted
          </div>

          <div className="mt-6 text-xl text-slate-500">
            by climate-related disasters in {selectedCountry}. 
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* HUMAN + ECONOMIC */}
      {/* ========================================================= */}

      {(hasEconomicData || hasHumanData || hasSocioeconomicData) && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1200px] mx-auto px-6 py-24"
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

      {/* ========================================================= */}
      {/* REGIONAL CONTEXT INTRO */}
      {/* ========================================================= */}

      <section className="min-h-[80vh] flex items-center justify-center px-6 border-t border-slate-100">
        <div className="max-w-5xl text-center">
          <h2 className="text-5xl md:text-7xl font-light leading-tight">
            But are these pressures unique to {selectedCountry}?
          </h2>

          <p className="mt-10 text-xl text-slate-500">
            To answer that question, we need to step back and compare climate
            vulnerability across the Pacific. While every nation faces
            environmental change, the capacity to absorb and recover from
            climate shocks differs dramatically.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* REGIONAL COMPARISON */}
      {/* ========================================================= */}

      {hasRegionalData && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1200px] mx-auto px-6 py-24"
        >
          <RegionalComparisonSection
            selectedCountry={selectedCountry}
            countriesCount={countries.length}
            rankedData={rankedData}
            chartWidth={chartWidth}
          />
        </motion.section>
      )}

      {/* ========================================================= */}
      {/* SYSTEM INTRO - UPDATED */}
      {/* ========================================================= */}

      <section className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <h2 className="text-5xl md:text-7xl font-light leading-tight">
            Why does vulnerability emerge?
          </h2>

          <p className="mt-10 text-xl text-slate-500">
            The answer lies in how climate drivers interact. Temperature,
            rainfall, sea-level rise and ocean warming rarely operate in
            isolation. Together they create cascading effects that amplify
            risk across environmental, economic and human systems.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CAUSAL CHAIN */}
      {/* ========================================================= */}

      {hasCausalData && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-[1200px] mx-auto px-6 py-32"
        >
          <CausalChainSection
            climateFlowData={climateFlowData}
            beeswarmData={beeswarmData}
            selectedCountry={selectedCountry}
            chartWidth={chartWidth}
          />
        </motion.section>
      )}

      {/* ========================================================= */}
      {/* CONCLUSION */}
      {/* ========================================================= */}

      {(hasClimateData ||
        hasEconomicData ||
        hasHumanData ||
        hasSocioeconomicData ||
        hasRegionalData ||
        hasCausalData ||
        hasTimelineData) && (
        <section className="max-w-[1200px] mx-auto px-6 py-24 border-t">
          <Conclusion
            selectedCountry={selectedCountry}
            seaTrend={seaTrend}
            countriesCount={countries.length}
          />
        </section>
      )}

      {/* ========================================================= */}
      {/* FOOTER */}
      {/* ========================================================= */}

      <footer className="text-center py-16 border-t border-slate-200 text-xs text-slate-400">
        <p>
          Pacific Dataviz Challenge 2026 · {countries.length} Pacific Island
          countries analyzed
        </p>
      </footer>
    </main>
  );
}
