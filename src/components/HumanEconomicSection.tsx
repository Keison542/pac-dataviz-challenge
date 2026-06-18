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
      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-widest text-slate-400">
          Human & Economic Impact Pathway
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mt-1">
          Climate impacts cascade through interconnected systems
        </h3>

        <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
          From financial stress → to household exposure → to structural economic change
        </p>
      </div>

      {/* =========================
          PARALLAX STACK (REDUCED HEIGHT)
      ========================== */}
      <div className="relative min-h-[1400px]">

        {/* =========================
            1. ECONOMIC
        ========================== */}
        {hasEconomicData && (
          <motion.div
            style={{ opacity: economicOpacity, y: economicY }}
            className="sticky top-20 mb-16"
          >
            <div className="text-center">
              <div className="text-sm font-medium text-slate-700 mb-1">
                1. Economic Stress Signal
              </div>

              <div className="text-xs text-slate-400 mb-2">
                Total losses: <span className="font-semibold text-slate-600">{formatLoss(lossTotal)}</span>
              </div>

              <div className="text-[11px] text-slate-400 mb-3 max-w-md mx-auto">
                Climate impacts first appear as economic shocks: infrastructure damage, agriculture loss, and recovery costs.
              </div>

              <TrendLine
                width={chartWidth * 1.3}
                height={240}
                data={dataMap.loss}
                dataType="loss"
                setSelectedCountry={setSelectedCountry}
              />
            </div>
          </motion.div>
        )}

        {/* =========================
            2. HUMAN
        ========================== */}
        {hasHumanData && (
          <motion.div
            style={{ opacity: humanOpacity, y: humanY }}
            className="sticky top-20 mb-16"
          >
            <div className="text-center">
              <div className="text-sm font-medium text-slate-700 mb-1">
                2. Human Exposure
              </div>

              <div className="text-xs text-slate-400 mb-2">
                People affected: <span className="font-semibold text-slate-600">{formatPeople(peopleTotal)}</span>
              </div>

              <div className="text-[11px] text-slate-400 mb-3 max-w-md mx-auto">
                Economic stress translates into household-level vulnerability, displacement risk, and livelihood disruption.
              </div>

              <BubbleChart
                width={chartWidth * 1.3}
                height={260}
                data={dataMap.people}
              />
            </div>
          </motion.div>
        )}

        {/* =========================
            3. SYSTEM SHIFT
        ========================== */}
        {hasSocioeconomicData && (
          <motion.div
            style={{ opacity: systemOpacity, y: systemY }}
            className="relative mt-32"
          >
            <div className="text-center">
              <div className="text-sm font-medium text-slate-700 mb-1">
                3. Structural System Shift
              </div>

              <div className="text-[11px] text-slate-400 mb-3 max-w-md mx-auto">
                Long-term socioeconomic indicators show how climate pressure reshapes national economic structures.
              </div>

              <TimeSeriesDashboard
                width={chartWidth * 2 + 40}
                height={400}
                data={timeSeriesData}
                selectedCountry={selectedCountry}
              />
            </div>
          </motion.div>
        )}

      </div>

      {/* =========================
          FOOTER INSIGHT
      ========================== */}
      <div className="text-center text-xs text-slate-400 mt-8 max-w-xl mx-auto">
        This sequence demonstrates a causal chain: climate stress → economic loss → human vulnerability → structural transformation.
      </div>
    </div>
  );
}
