import { MultiLineChart } from "@/vizualization/lineChart/MultiLineChart";
import { climateSeries } from "@/climatedata/climate_drivers/climateSeries";

interface FullTimelineSectionProps {
  selectedCountry: string;
  multiLineData: any[];
  chartWidth: number;
}

export function FullTimelineSection({ selectedCountry, multiLineData, chartWidth }: FullTimelineSectionProps) {
  return (
    <div className="mb-12">
      <div className="text-center mb-6">
        <div className="text-[1.75rem] font-semibold mb-3 text-slate-900">A Complete Timeline— the full story of climate change</div>
      </div>
      <div className="p-2">
        <MultiLineChart 
          width={chartWidth * 2 + 20} 
          height={400} 
          data={multiLineData} 
          series={climateSeries} 
          title="Climate Anomalies Over Time" 
          yAxisLabel="Anomaly Value" 
          selectedCountry={selectedCountry} 
        />
      </div>
    </div>
  );
}
