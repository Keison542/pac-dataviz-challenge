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
import { useClimateData } from "@/hooks/useClimateData";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
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
    <main className="relative min-h-screen bg-white font-sans text-slate-900">

      <div className="fixed inset-0 z-0 pointer-events-none opacity-5" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8">

        {/* =========================
            HERO (UNCHANGED BUT FIRST IMPACT)
        ========================== */}
        <Hero
          countries={countries}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
        />

        <div className="mt-6 mb-10 text-center max-w-3xl mx-auto text-slate-600">
          The Pacific is not just changing — it is transforming under accelerating climate pressure.
        </div>

        {/* =========================
            1. CLIMATE SIGNAL (FADE-IN)
        ========================== */}
        {hasClimateData && (
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="py-16"
          >
            <h2 className="text-2xl font-semibold mb-2">
              1. A clear climate signal is emerging
            </h2>

            <p className="text-slate-600 mb-8 max-w-2xl">
              Temperature and sea level trends show consistent, long-term change across Pacific nations.
            </p>

            <DoughnutClimateDashboard
              kpis={kpis}
              deltas={deltas}
              selectedCountry={selectedCountry}
            />

            <div className="mt-10">
              <ClimateDriversSection
                dataMap={dataMap}
                tempTrend={tempTrend}
                chartWidth={chartWidth}
                selectedCountry={selectedCountry}
              />
            </div>
          </motion.section>
        )}

        {/* =========================
            2. HUMAN IMPACT
        ========================== */}
        {(hasEconomicData || hasHumanData || hasSocioeconomicData) && (
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="py-20 border-t border-slate-100"
          >
            <h2 className="text-2xl font-semibold mb-2">
              2. Climate change is already affecting livelihoods
            </h2>

            <p className="text-slate-600 mb-8 max-w-2xl">
              Agricultural losses, human exposure, and economic stress are rising alongside climate indicators.
            </p>

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

        {/* =========================
            3. SYSTEM VIEW (MOST IMPORTANT SECTION)
        ========================== */}
        {hasCausalData && (
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="py-20 bg-slate-50 rounded-2xl px-6"
          >
            <h2 className="text-2xl font-semibold mb-2">
              3. These impacts are interconnected
            </h2>

            <p className="text-slate-600 mb-8 max-w-2xl">
              Climate drivers cascade into environmental and socio-economic consequences.
            </p>

            <CausalChainSection
              climateFlowData={climateFlowData}
              beeswarmData={beeswarmData}
              selectedCountry={selectedCountry}
              chartWidth={chartWidth}
            />
          </motion.section>
        )}

        {/* =========================
            4. INEQUALITY MOMENT
        ========================== */}
        {hasRegionalData && (
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="py-20"
          >
            <h2 className="text-2xl font-semibold mb-2">
              4. Impact is not evenly distributed
            </h2>

            <p className="text-slate-600 mb-8 max-w-2xl">
              Some Pacific nations face significantly higher vulnerability than others.
            </p>

            <RegionalComparisonSection
              selectedCountry={selectedCountry}
              countriesCount={countries.length}
              rankedData={rankedData}
              chartWidth={chartWidth}
            />
          </motion.section>
        )}

        {/* =========================
            5. CONCLUSION (EMOTIONAL PEAK)
        ========================== */}
        {(hasClimateData ||
          hasEconomicData ||
          hasHumanData ||
          hasSocioeconomicData ||
          hasRegionalData ||
          hasCausalData ||
          hasTimelineData) && (
          <motion.section
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="py-24 text-center border-t"
          >
            <Conclusion
              selectedCountry={selectedCountry}
              seaTrend={seaTrend}
              countriesCount={countries.length}
            />

            <div className="mt-10 max-w-2xl mx-auto text-slate-500">
              The Pacific contributed least to global emissions — yet faces some of the most severe consequences.
            </div>
          </motion.section>
        )}

        {/* FOOTER */}
        <footer className="text-center pt-10 mt-10 border-t border-slate-200 text-xs text-slate-400">
          <p>
            Pacific Dataviz Challenge 2026 · {countries.length} Pacific Island countries analyzed
          </p>
        </footer>

      </div>
    </main>
  );
}
