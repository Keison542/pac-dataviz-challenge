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

  return (
    <div ref={sectionRef} className="relative py-8">

      {/* =========================
          STORY HEADER
      ========================== */}

        <p className="text-center">
          The pathway from environmental change to human impact is rarely direct. Climate pressures first place strain on economies, reducing productivity, damaging infrastructure, and increasing recovery costs. These economic stresses eventually reach households, where they affect income security, employment, food access, and resilience.
        </p>

      

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
        <div className="text-sm font-medium text-slate-700 mb-1">
          1. Economic Stress Signal
        </div>

        <div className="text-xs text-slate-400 mb-2">
          Total losses:
          <span className="font-semibold text-slate-600 ml-1">
            {formatLoss(lossTotal)}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 mb-4 max-w-md mx-auto">
          Climate impacts first emerge as financial shocks through damaged
          infrastructure, agricultural losses, and rising recovery costs.
        </div>

        <div className="flex justify-center">
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
        <div className="text-sm font-medium text-slate-700 mb-1">
          2. Human Exposure
        </div>

        <div className="text-xs text-slate-400 mb-2">
          People affected:
          <span className="font-semibold text-slate-600 ml-1">
            {formatPeople(peopleTotal)}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 mb-4 max-w-md mx-auto">
          Economic stress ultimately becomes a human story—affecting
          livelihoods, increasing displacement risk, and exposing communities
          to long-term vulnerability.
        </div>

        <div className="flex justify-center">
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
        <div className="text-sm font-medium text-slate-700 mb-1">
          3. Structural System Shift
        </div>

        <div className="text-[11px] text-slate-400 mb-4 max-w-md mx-auto">
          Long-term socioeconomic indicators reveal how climate pressure
          gradually reshapes national economic structures and adaptive
          capacity.
        </div>
        <div className="flex justify-center">
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
      <div className="text-center text-xs text-slate-400 mt-12 mb-24 max-w-xl mx-auto">
        This sequence demonstrates a causal chain: climate stress → economic loss → human vulnerability → structural transformation.
      </div>
    </div>
  );
}
