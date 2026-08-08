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
  <>
    <div className="text-center mb-6">
      <p className="text-sm text-slate-500 max-w-2xl mx-auto mt-2">
        Temperature, rainfall, ocean conditions and sea level can affect multiple systems simultaneously. Their combined effects can increase exposure and reduce the ability of communities and economies to recover.
  
      </p>
    </div>
    
    <ClimateInteractionMatrix
      data={climateFlowData}
      selectedCountry={selectedCountry}
      width={chartWidth * 2 + 40}
    />
  </>
);
}
