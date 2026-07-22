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
      {/* ─── Pacific Map ─── */}
      <div className="mt-12 w-full max-w-7xl mx-auto px-4">
        <PacificClimateStoryMap data={rankedData} />
      </div>
    </div>
  );
}
