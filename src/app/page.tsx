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

          <div className="max-w-4xl mx-auto text-center mt-10">
            <h1 className="text-5xl md:text-7xl font-light leading-tight">
              Climate change is reshaping the Pacific.
            </h1>

            <p className="mt-8 text-xl text-slate-600">
              The region contributed least to global emissions,
              yet faces some of the fastest-growing climate risks.
            </p>

            <motion.div
              className="mt-20 text-slate-400 text-sm tracking-widest uppercase"
              animate={{ y: [0, 10, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
            >
              Scroll to explore ↓
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CLIMATE SIGNAL INTRO */}
      {/* ========================================================= */}

      <section className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <h2 className="text-4xl md:text-6xl font-light leading-tight">
            A clear climate signal is emerging across Pacific nations.
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
            However, climate signals alone do not explain the full story.
          </h2>

          <p className="mt-10 text-xl text-slate-500">
            The consequences appear when environmental change reaches people,
            livelihoods and economies.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* BIG NUMBER */}
      {/* ========================================================= */}

      <section className="min-h-screen flex items-center justify-center px-6 border-y border-slate-100">
        <div className="text-center">

          <div className="mt-6 text-xl text-slate-500">
            In {selectedCountry}
          </div>
          
          <div className="text-6xl md:text-8xl font-bold">
            {peopleTotal.toLocaleString()}
          </div>

          <div className="mt-6 text-xl text-slate-500">
            people affected by climate-related disasters. Now one could imagine the scale of this impact across the Pacific Island Nations from financial stress → to household exposure → to structural economic change.
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
      {/* SYSTEM INTRO */}
      {/* ========================================================= */}

      <section className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <h2 className="text-5xl md:text-7xl font-light leading-tight">
            These impacts do not occur in isolation.
          </h2>

          <p className="mt-10 text-xl text-slate-500">
            Climate drivers reinforce each other and cascade through the system.
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
      {/* INEQUALITY INTRO */}
      {/* ========================================================= */}

      <section className="min-h-[80vh] flex items-center justify-center px-6 border-t border-slate-100">
        <div className="max-w-5xl text-center">
          <h2 className="text-5xl md:text-7xl font-light leading-tight">
            Climate vulnerability is shaped by inequality.
          </h2>

          <p className="mt-10 text-xl text-slate-500">
            Some Pacific nations face significantly higher exposure and lower
            resilience than others.
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
      {/* BIG LOSS NUMBER */}
      {/* ========================================================= */}

      <section className="min-h-screen flex items-center justify-center px-6 border-y border-slate-100">
        <div className="text-center">
          <div className="text-6xl md:text-8xl font-bold">
            ${Math.round(lossTotal / 1_000_000_000)}B
          </div>

          <div className="mt-6 text-xl text-slate-500">
            estimated economic losses recorded
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FINAL REFLECTION */}
      {/* ========================================================= */}

      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <p className="uppercase tracking-[0.3em] text-slate-400 mb-8">
            Final Reflection
          </p>

          <h2 className="text-5xl md:text-7xl font-light leading-tight">
            The Pacific reveals a global truth.
          </h2>

          <p className="mt-10 text-2xl text-slate-600 leading-relaxed">
            Climate risk is not defined solely by geography.
            It is shaped by resilience, capacity and inequality.
          </p>

          <p className="mt-8 text-lg text-slate-500">
            Nations that contributed least to climate change are often among
            those facing its most severe consequences.
          </p>
        </div>
      </section>

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
