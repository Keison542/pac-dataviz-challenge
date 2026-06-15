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
  setSelectedCountry 
}: HumanEconomicSectionProps) {
  const hasEconomicData = dataMap.loss.length > 0;
  const hasHumanData = dataMap.people.length > 0;
  const hasSocioeconomicData = timeSeriesData.length > 0;

  return (
    <div className="mb-12">
      <div className="text-center mb-6">
        <div className="text-[1.75rem] font-semibold mb-3 text-slate-900">The Human, Economic & Socioeconomic Toll</div>
        <div className="text-sm text-slate-500 max-w-[680px] mx-auto">
          {selectedCountry} has suffered ${(lossTotal / 1e6).toFixed(0)}M in losses and impacted {(peopleTotal / 1000).toFixed(0)}K people.
        </div>
        <div className="text-sm mt-2 font-medium">Each disaster has a price tag — and a human face. Climate affects food security, livelihoods, and economic stability.</div>
      </div>
      
      {(hasEconomicData || hasHumanData) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasEconomicData && (
            <div className="p-2">
              <div className="font-semibold text-base text-slate-800 mb-2">Economic Loss</div>
              <TrendLine width={chartWidth} height={260} data={dataMap.loss} dataType="loss" setSelectedCountry={setSelectedCountry} />
            </div>
          )}
          {hasHumanData && (
            <div className="p-2">
              <div className="font-semibold text-base text-slate-800 mb-2">People Affected</div>
              <BubbleChart width={chartWidth} height={260} data={dataMap.people} />
            </div>
          )}
        </div>
      )}

      {hasSocioeconomicData && (
        <div className="mt-6">
          <div className="p-2">
            <div className="font-semibold text-base text-slate-800 mb-2">Crop Yield, Livestock & Tourism Trends</div>
            <TimeSeriesDashboard width={chartWidth * 2 + 20} height={480} data={timeSeriesData} selectedCountry={selectedCountry} />
          </div>
        </div>
      )}
    </div>
  );
}
