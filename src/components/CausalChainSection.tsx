"use client";

import { useState } from "react";
import ClimateInteractionMatrix from "@/vizualization/ClimateInteractionMatrix";
import BeeswarmChart from "@/vizualization/beeswarm/BeeswarmChart";

interface Props {
  climateFlowData: any[];
  beeswarmData: any[];
  selectedCountry: string;
  chartWidth: number;
}

export function CausalChainSection({
  climateFlowData,
  beeswarmData,
  selectedCountry,
  chartWidth,
}: Props) {
  const [activeView, setActiveView] = useState<"matrix" | "beeswarm">("matrix");

  return (
    <div className="mb-14">

      {/* HEADER (story-first) */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          Climate System Interactions
        </h2>

        <p className="text-sm text-slate-500 max-w-2xl mx-auto mt-2">
          Climate impacts are not linear. Each driver reinforces multiple systems at once —
          creating feedback loops across environment, economy, and society.
        </p>

        {/* segmented control */}
        <div className="inline-flex mt-5 bg-slate-100 p-1 rounded-full">
          <button
            onClick={() => setActiveView("matrix")}
            className={`px-5 py-2 text-sm rounded-full transition ${
              activeView === "matrix"
                ? "bg-white shadow text-slate-900"
                : "text-slate-500"
            }`}
          >
            System Coupling Map
          </button>

          <button
            onClick={() => setActiveView("beeswarm")}
            className={`px-5 py-2 text-sm rounded-full transition ${
              activeView === "beeswarm"
                ? "bg-white shadow text-slate-900"
                : "text-slate-500"
            }`}
          >
            Impact Distribution
          </button>
        </div>
      </div>

      {/* CONTENT FRAME */}
      <div className="p-3 bg-white rounded-xl border shadow-sm">
        {activeView === "matrix" && (
          <ClimateInteractionMatrix
            data={climateFlowData}
            selectedCountry={selectedCountry}
            width={chartWidth * 2 + 40}
          />
        )}

        {activeView === "beeswarm" && (
          <BeeswarmChart
            width={chartWidth * 2 + 40}
            height={500}
            data={beeswarmData}
            title="Climate Impact Distribution"
            insight="Each point represents a recorded impact event across systems."
          />
        )}
      </div>
    </div>
  );
}
