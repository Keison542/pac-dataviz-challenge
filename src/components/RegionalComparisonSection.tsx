import { MultiMetricRankedDashboard } from "@/vizualization/barplot/BarChart";
import { PacificClimateStoryMap } from "@/components/PacificMap";

interface RegionalComparisonSectionProps {
  selectedCountry: string;
  countriesCount: number;
  rankedData: any;
  chartWidth: number;
}

export function RegionalComparisonSection({ 
  selectedCountry, 
  countriesCount, 
  rankedData, 
  chartWidth 
}: RegionalComparisonSectionProps) {
  return (
    <div className="mb-12">
      {/* ─── Header ─── */}
      <div className="text-center mb-6">
      </div>

      {/* ─── Ranked Dashboard ─── */}
      <div className="p-2">
        <MultiMetricRankedDashboard 
          width={chartWidth * 2 + 20} 
          height={520} 
          data={rankedData} 
        />
      </div>

      {/* ─── Pacific Map ─── */}
      <div className="mt-12 w-full max-w-7xl mx-auto px-4">
        <PacificClimateStoryMap data={rankedData} />
      </div>
    </div>
  );
}
