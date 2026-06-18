"use client";

import ClimateInteractionMatrix from "@/vizualization/ClimateInteractionMatrix";

interface Props {
  climateFlowData: any[];
  selectedCountry: string;
  chartWidth: number;
}

export function CausalChainSection({
  climateFlowData,
  selectedCountry,
  chartWidth,
}: Props) {
  return (
    <div className="mb-14">

      {/* HEADER (story-first) */}
      <div className="text-center mb-6">
        {/* <h2 className="text-2xl font-semibold text-slate-900">
          Climate System Interactions
        </h2> */}

        <p className="text-sm text-slate-500 max-w-2xl mx-auto mt-2">
          Climate impacts are not linear. Each driver reinforces multiple systems at once —
          creating feedback loops across environment, economy, and society.
        </p>
      </div>

      {/* CONTENT FRAME */}
      <div className="p-3 bg-white rounded-xl border shadow-sm">
        <ClimateInteractionMatrix
          data={climateFlowData}
          selectedCountry={selectedCountry}
          width={chartWidth * 2 + 40}
        />
      </div>
    </div>
  );
}
