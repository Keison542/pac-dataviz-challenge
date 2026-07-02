"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TrendLine } from "@/vizualization/lineChart/trendLine";
import { BubbleChart } from "@/vizualization/bubbleChart/BubbleChart";
import TimeSeriesDashboard from "@/vizualization/bubbleChart/TimeSeries";

interface HumanEconomicSectionProps {
  selectedCountry: string;
  lossTotal: number;
  peopleTotal: number;
  dataMap: any;
  timeSeriesData: any[];
  chartWidth: number;
  setSelectedCountry: (country: string) => void;
}

export function HumanEconomicSection({
  selectedCountry,
  lossTotal,
  peopleTotal,
  dataMap,
  timeSeriesData,
  chartWidth,
  setSelectedCountry,
}: HumanEconomicSectionProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // =========================
  // PARALLAX LAYERS - REDUCED EFFECT
  // =========================
  const economicOpacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 1, 0]);
  const economicY = useTransform(scrollYProgress, [0, 0.5], [0, -30]);

  const humanOpacity = useTransform(scrollYProgress, [0.2, 0.4, 0.7], [0, 1, 0]);
  const humanY = useTransform(scrollYProgress, [0.2, 0.7], [20, -20]);

  const systemOpacity = useTransform(scrollYProgress, [0.5, 0.7, 1], [0, 1, 1]);
  const systemY = useTransform(scrollYProgress, [0.5, 1], [30, 0]);

  const hasEconomicData = dataMap.loss && dataMap.loss.length > 0;
  const hasHumanData = dataMap.people && dataMap.people.length > 0;
  const hasSocioeconomicData = timeSeriesData && timeSeriesData.length > 0;

  const formatLoss = (v: number) => `$${(v / 1e6).toFixed(0)}M`;
  const formatPeople = (v: number) => `${(v / 1000).toFixed(0)}K`;

  // ─── Find peak years for each metric ───
  const findPeakYear = (data: any[], valueKey: string) => {
    if (!data || data.length === 0) return null;
    let maxValue = -Infinity;
    let peakYear = null;
    data.forEach((d: any) => {
      const val = d[valueKey] || d.value || 0;
      if (val > maxValue) {
        maxValue = val;
        peakYear = d.year;
      }
    });
    return peakYear;
  };

  const economicPeakYear = findPeakYear(dataMap.loss, 'value');
  const humanPeakYear = findPeakYear(dataMap.people, 'value');

  // ─── Find peak year for structural shift (using timeSeriesData) ───
  const structuralPeakYear = (() => {
    if (!timeSeriesData || timeSeriesData.length === 0) return null;
    let maxTotal = -Infinity;
    let peakYear = null;
    timeSeriesData.forEach((d: any) => {
      const total = (d.cropYield || 0) + (d.livestockYield || 0) + (d.touristArrivals || 0);
      if (total > maxTotal) {
        maxTotal = total;
        peakYear = d.year;
      }
    });
    return peakYear;
  })();

  return (
    <div ref={sectionRef} className="relative py-8">
      {/* ─── INTRO TEXT ─── */}
      <div className="text-center w-full max-w-4xl mx-auto px-4">
        <p className="text-center">
          The pathway from environmental change to human impact is rarely direct. Climate pressures first place strain on economies, reducing productivity, damaging infrastructure, and increasing recovery costs. These economic stresses eventually reach households, where they affect income security, employment, food access, and resilience.
        </p>
        <p className="text-center mt-4">
          Historical records show that vulnerability is not evenly distributed. Certain years and locations emerge as recurring hotspots where communities face repeated exposure to climate-related hazards. For many Pacific Island nations, the challenge is not a single disaster, but the cumulative effect of multiple shocks over time.
        </p>
      </div>

      {/* =========================
          SCROLL NARRATIVE
      ========================= */}
      <div className="relative min-h-[1400px]">

        {/* =========================
            1. ECONOMIC
        ========================== */}
        {hasEconomicData && (
          <motion.div
            style={{ opacity: economicOpacity, y: economicY }}
            className="sticky top-20 mb-20 flex justify-center"
          >
            <div className="text-center w-full max-w-5xl px-4">
              <p className="text-center">
                Climate shocks first place strain on national economies.  Between 2010 to 2020, {selectedCountry}, recorded approximately {formatLoss(lossTotal)} in disaster-related losses.
                Damage to infrastructure, agriculture and public assets increased recovery costs and reduced economic resilience.
                 The peak of economic disruption occurred in {economicPeakYear}, 
                  when losses reached their highest recorded level, straining national 
                  recovery capacity and exposing critical infrastructure gaps.
                
              </p>

              <div className="flex justify-center mt-4">
                <TrendLine
                  width={Math.min(chartWidth * 1.3, 1100)}
                  height={240}
                  data={dataMap.loss}
                  dataType="loss"
                  setSelectedCountry={setSelectedCountry}
                  className="w-full max-w-4xl"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================
            2. HUMAN
        ========================== */}
        {hasHumanData && (
          <motion.div
            style={{ opacity: humanOpacity, y: humanY }}
            className="sticky top-20 mb-20 flex justify-center"
          >
            <div className="text-center w-full max-w-5xl px-4">
              <p className="text-center">
                Economic losses eventually reach households. Across the last decade, more than {formatPeople(peopleTotal)} people in {selectedCountry} experienced direct impacts from climate-related disasters through displacement, livelihood disruption, food insecurity or reduced access to essential services.
               The most severe year was {humanPeakYear}, when exposure reached its 
                  peak, highlighting the urgent need for targeted humanitarian support and 
                  long-term resilience building in the most affected communities.
              </p>

              <div className="flex justify-center mt-4">
                <BubbleChart
                  width={Math.min(chartWidth * 1.3, 1100)}
                  height={260}
                  data={dataMap.people}
                  className="w-full max-w-4xl"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================
            3. STRUCTURAL SHIFT
            NOT STICKY
        ========================== */}
        {hasSocioeconomicData && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7 }}
            className="mt-32 flex justify-center"
          >
            <div className="text-center w-full max-w-6xl px-4">
              <p className="text-center">
               Climate shocks leave impacts that extend far beyond the immediate recovery period. Each event adds pressure to livelihoods, 
                infrastructure, and economic systems, gradually transforming how communities in {selectedCountry} live 
                and adapt. Around {structuralPeakYear}, these pressures converged into a critical turning point, where mounting 
                economic losses and population displacement began reshaping the nation's development trajectory and its capacity 
                to withstand future climate risks.

               
              </p>

              <div className="flex justify-center mt-4">
                <TimeSeriesDashboard
                  width={Math.min(chartWidth * 2 + 40, 1400)}
                  height={500}
                  data={timeSeriesData}
                  selectedCountry={selectedCountry}
                  className="w-full max-w-5xl"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* =========================
          FOOTER INSIGHT
      ========================== */}
    <div className="text-center w-full max-w-6xl px-4">
      <br />
      <p>
        This sequence in Fig 2, 3, 4 and 5 demonstrates a causal chain: climate stress → economic loss → human vulnerability → structural transformation.
        Over the longer term, these pressures begin to reshape national systems. Trends in food production, livelihood assets, and income diversification reveal how countries gradually adapt to changing environmental conditions. Some sectors expand, others contract, and communities develop new strategies to manage risk and sustain livelihoods.
      </p>
    </div>
    </div>
  );
}
