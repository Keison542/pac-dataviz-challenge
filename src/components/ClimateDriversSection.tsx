import { LineChart } from "@/vizualization/lineChart/LineChart";
import { getChartLabel } from "@/vizualization/lineChart/climateLabels";

interface ClimateDriversSectionProps {
  dataMap: any;
  tempTrend: number;
  chartWidth: number;
  selectedCountry: string;
}

export function ClimateDriversSection({
  dataMap,
  tempTrend,
  chartWidth,
  selectedCountry,
}: ClimateDriversSectionProps) {
  const hasTempData = dataMap.temp && dataMap.temp.length > 0;
  const hasSeaData = dataMap.sea && dataMap.sea.length > 0;
  const hasSSTData =
    dataMap.sea_surface_temperature &&
    dataMap.sea_surface_temperature.length > 0;
  const hasRainfallData =
    dataMap.rainfall && dataMap.rainfall.length > 0;

  if (
    !hasTempData &&
    !hasSeaData &&
    !hasSSTData &&
    !hasRainfallData
  ) {
    return null;
  }

  const chartLabels = [
    hasTempData && getChartLabel("surfaceTempAnomaly"),
    hasSeaData && getChartLabel("seaLevelAnomaly"),
    hasSSTData && getChartLabel("seaSurfaceTempAnomaly"),
    hasRainfallData && getChartLabel("precipitationAnomaly"),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="text-center mb-6">
        <div className="text-sm text-slate-500 max-w-[680px] mx-auto">
         However, the climate signal becomes clearer when each driver is examined individually. Temperature, rainfall, sea surface temperature and sea level do not change at the same rate. Together, they reveal how environmental conditions have evolved across decades. For example, in{" "}
          {selectedCountry}, surface temperatures have{" "}
          {tempTrend > 0
            ? `risen ${tempTrend.toFixed(1)}%`
            : tempTrend < 0
            ? `fallen ${Math.abs(tempTrend).toFixed(1)}%`
            : "remained stable"}{" "}
          over the recorded period.
        </div>

        <div className="text-sm mt-2 font-medium">
          Hotter air → warmer oceans → more energy for storms →
          heavier rain
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hasTempData && (
          <div className="w-full max-w-4xl mx-auto">
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
          <div className="w-full max-w-4xl mx-auto">
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
          <div className="w-full max-w-4xl mx-auto">
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
          <div className="w-full max-w-4xl mx-auto">
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

      <p className="mt-4 text-sm text-slate-600 text-center">
        <strong>Fig 2.</strong> Long-term climate anomalies in{" "}
        {selectedCountry}, showing trends in {chartLabels.toLowerCase()} and
        highlighting emerging climate signals over time.
      </p>
    </>
  );
}
