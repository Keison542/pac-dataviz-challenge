import { LineChart } from "@/vizualization/lineChart/LineChart";

interface ClimateDriversSectionProps {
  dataMap: any;
  tempTrend: number;
  chartWidth: number;
  selectedCountry: string;  // ← ADD THIS
}

export function ClimateDriversSection({ dataMap, tempTrend, chartWidth, selectedCountry }: ClimateDriversSectionProps) {
  const hasTempData = dataMap.temp && dataMap.temp.length > 0;
  const hasSeaData = dataMap.sea && dataMap.sea.length > 0;
  const hasSSTData = dataMap.sea_surface_temperature && dataMap.sea_surface_temperature.length > 0;
  const hasRainfallData = dataMap.rainfall && dataMap.rainfall.length > 0;

  if (!hasTempData && !hasSeaData && !hasSSTData && !hasRainfallData) return null;

  return (
    <div className="mb-12">
      <div className="text-center mb-6">
        {/* <div className="text-[1.75rem] font-semibold mb-3 text-slate-900">The Drivers of Change</div> */}
        <div className="text-sm text-slate-500 max-w-[680px] mx-auto">
          Surface temperatures have {tempTrend > 0 ? `risen ${tempTrend.toFixed(1)}%` : tempTrend < 0 ? `fallen ${Math.abs(tempTrend).toFixed(1)}%` : "remained stable"} over the recorded period.
          However, deeper dive into individual driver of change per country has uncovered both emerging and stable signals of climate variation since 1950
        </div>
        <div className="text-sm mt-2 font-medium">Hotter air → warmer oceans → more energy for storms → heavier rain</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hasTempData && (
          <div className="p-2">
            {/* <div className="font-semibold text-base text-slate-800 mb-2">Surface Temperature</div> */}
            <LineChart 
              width={chartWidth} 
              height={260} 
              data={dataMap.temp} 
              dataType="surfaceTempAnomaly" 
              selectedCountry={selectedCountry} 
            />
          </div>
        )}
        {hasSeaData && (
          <div className="p-2">
            {/* <div className="font-semibold text-base text-slate-800 mb-2">Sea Level</div> */}
            <LineChart 
              width={chartWidth} 
              height={260} 
              data={dataMap.sea} 
              dataType="seaLevelAnomaly" 
              selectedCountry={selectedCountry} 
            />
          </div>
        )}
        {hasSSTData && (
          <div className="p-2">
            {/* <div className="font-semibold text-base text-slate-800 mb-2">Sea Surface Temperature</div> */}
            <LineChart 
              width={chartWidth} 
              height={260} 
              data={dataMap.sea_surface_temperature} 
              dataType="seaSurfaceTempAnomaly" 
              selectedCountry={selectedCountry} 
            />
          </div>
        )}
        {hasRainfallData && (
          <div className="p-2">
            {/* <div className="font-semibold text-base text-slate-800 mb-2">Precipitation</div> */}
            <LineChart 
              width={chartWidth} 
              height={260} 
              data={dataMap.rainfall} 
              dataType="precipitationAnomaly" 
              selectedCountry={selectedCountry} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
