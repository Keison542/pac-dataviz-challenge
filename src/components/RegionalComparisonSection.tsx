import { MultiMetricRankedDashboard } from "@/vizualization/barplot/BarChart";

interface RegionalComparisonSectionProps {
  selectedCountry: string;
  countriesCount: number;
  rankedData: any;
  chartWidth: number;
}

export function RegionalComparisonSection({ selectedCountry, countriesCount, rankedData, chartWidth }: RegionalComparisonSectionProps) {
  return (
    <div className="mb-12">
      <div className="text-center mb-6">
        {/* <div className="text-[1.75rem] font-semibold mb-3 text-slate-900">A Regional Perspective</div> */}
        <div className="text-sm text-slate-500 max-w-[680px] mx-auto">
          How does {selectedCountry} compare to {countriesCount} other Pacific nations across 7 key metrics?
        </div>
      </div>
      <div className="p-2">
        <MultiMetricRankedDashboard width={chartWidth * 2 + 20} height={520} data={rankedData} />
      </div>

       <div className="mt-12 w-full">
        <PacificClimateStoryMap />
      </div>
      
    </div>
  );
}
