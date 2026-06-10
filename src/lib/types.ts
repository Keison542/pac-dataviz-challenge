// ==================== GEOGRAPHIC TYPES ====================

export type Island = 
  | "Kiribati" 
  | "Marshall Islands" 
  | "Nauru" 
  | "Palau" 
  | "Tonga" 
  | "Tuvalu" 
  | "Vanuatu"
  | "Fiji"
  | "Samoa"
  | "Solomon Islands"
  | "Papua New Guinea"
  | "Cook Islands"
  | "Niue"
  | "Tokelau"
  | "Wallis and Futuna"
  | "American Samoa"
  | "Guam"
  | "New Caledonia"
  | "Northern Mariana Islands"
  | "Pitcairn"
  | "French Polynesia"
  | "Micronesia, Federated State of";

export const allIslandNames: Island[] = [
  "Kiribati", 
  "Marshall Islands", 
  "Nauru", 
  "Palau", 
  "Tonga", 
  "Tuvalu", 
  "Vanuatu",
  "Fiji",
  "Samoa",
  "Solomon Islands",
  "Papua New Guinea",
  "Cook Islands",
  "Niue",
  "Tokelau",
  "Wallis and Futuna",
  "American Samoa",
  "Guam",
  "New Caledonia",
  "Northern Mariana Islands",
  "Pitcairn",
  "French Polynesia",
  "Micronesia, Federated State of"
];

// ==================== DEMOGRAPHIC TYPES ====================

export type Sex = "Male" | "Female";

export type AgeGroup = "25-54" | "55-64";

export type EducationLevel = 
  | "Early childhood education" 
  | "Primary education" 
  | "Lower secondary education" 
  | "Upper secondary education" 
  | "Post-secondary non-tertiary education" 
  | "Tertiary education";

export const allEducationLevels: EducationLevel[] = [
  "Early childhood education", 
  "Primary education", 
  "Lower secondary education", 
  "Upper secondary education", 
  "Post-secondary non-tertiary education", 
  "Tertiary education"
];

// ==================== ECONOMIC TYPES ====================

export type EducationLevelItem = {
  island: Island;
  year: number;
  male: number;
  female: number;
  age: AgeGroup;
  level: EducationLevel;
};

export type GenderPayGapItem = {
  Location: string;
  Urbanization: "National" | string;
  Occupation: string;
  TIME_PERIOD: number;
  OBS_VALUE: number;
};

export type EmploymentRateItem = {
  island: string;
  TIME_PERIOD: number;
  OBS_VALUE: number;
  Sex: Sex | "Total";
  Urbanization: string;
};

// ==================== DISASTER DATA TYPES ====================

export type DisasterLossRecord = {
  country: string;
  year: number;
  value: number; // USD value of economic loss
};

export type AffectedPeopleRecord = {
  country: string;
  year: number;
  value: number; // Number of people affected
};

// ==================== CLIMATE DATA TYPES ====================

export type ClimateRecord = {
  country: string;
  year: number;
  value: number;
};

export type SurfaceTempAnomalyRecord = ClimateRecord & {
  type: "surfaceTempAnomaly";
  unit: "°C";
};

export type SeaSurfaceTempAnomalyRecord = ClimateRecord & {
  type: "seaSurfaceTempAnomaly";
  unit: "°C";
};

export type PrecipitationAnomalyRecord = ClimateRecord & {
  type: "precipitationAnomaly";
  unit: "mm";
};

export type SeaLevelAnomalyRecord = ClimateRecord & {
  type: "seaLevelAnomaly";
  unit: "m";
};

export type GreenhouseGasEmissionRecord = ClimateRecord & {
  type: "greenhouseGasEmission";
  unit: "tonnes CO₂e";
  perCapita: boolean;
};

export type CropYieldRecord = ClimateRecord & {
  type: "cropYield";
  unit: "kg/ha";
  cropType?: string;
};

export type LivestockYieldRecord = ClimateRecord & {
  type: "livestockYield";
  unit: "kg/animal";
  livestockType?: string;
};

export type PowerGenerationRecord = ClimateRecord & {
  type: "powerGeneration";
  unit: "GWh";
  source?: string;
};

export type TourismArrivalsRecord = ClimateRecord & {
  type: "tourismArrivals";
  unit: "visitors";
};

export type MeteorologicalMonitoringRecord = ClimateRecord & {
  type: "meteorologicalMonitoring";
  unit: "stations";
};

export type FisheriesManagementRecord = ClimateRecord & {
  type: "fisheriesManagement";
  unit: "measures";
};

export type EnvironmentalTaxesRecord = ClimateRecord & {
  type: "environmentalTaxes";
  unit: "% of GDP";
};

export type AlteredLandCoverRecord = ClimateRecord & {
  type: "alteredLandCover";
  unit: "%";
};

// ==================== CHART DATA TYPES ====================

export type ChartDataPoint = {
  country: string;
  year: number;
  value: number;
  category?: string;
  unit?: string;
};

export type ComparisonDataPoint = {
  category: string;
  value1: number;
  value2: number;
  year?: number;
};

export type TimeSeriesData = {
  country: string;
  data: ChartDataPoint[];
};

// ==================== UTILITY TYPES ====================

export type ColorScale = (key: string) => string;

export type DataRange = {
  min: number;
  max: number;
};

export type ChartDimensions = {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

// ==================== FILTER OPTIONS ====================

export type TimeRange = {
  startYear: number;
  endYear: number;
};

export type DataFilterOptions = {
  countries?: Island[];
  years?: TimeRange;
  dataType?: string;
  minValue?: number;
  maxValue?: number;
};

// ==================== METADATA TYPES ====================

export type DataMetadata = {
  id: string;
  name: string;
  description: string;
  unit: string;
  source: string;
  lastUpdated: string;
  dataType: string;
};

export const climateDataMetadata: DataMetadata[] = [
  {
    id: "surfaceTempAnomaly",
    name: "Surface Temperature Anomaly",
    description: "Annual surface temperature anomaly relative to baseline",
    unit: "°C",
    source: "SPC Climate Change Indicators",
    lastUpdated: "2024",
    dataType: "temperature",
  },
  {
    id: "seaSurfaceTempAnomaly",
    name: "Sea Surface Temperature Anomaly",
    description: "Annual sea surface temperature anomaly relative to baseline",
    unit: "°C",
    source: "SPC Climate Change Indicators",
    lastUpdated: "2024",
    dataType: "temperature",
  },
  {
    id: "precipitationAnomaly",
    name: "Precipitation Anomaly",
    description: "Annual precipitation anomaly relative to baseline",
    unit: "mm",
    source: "SPC Climate Change Indicators",
    lastUpdated: "2024",
    dataType: "precipitation",
  },
  {
    id: "seaLevelAnomaly",
    name: "Sea Level Anomaly",
    description: "Annual sea level anomaly relative to baseline",
    unit: "m",
    source: "SPC Climate Change Indicators",
    lastUpdated: "2024",
    dataType: "seaLevel",
  },
  {
    id: "greenhouseGasEmission",
    name: "Greenhouse Gas Emissions",
    description: "Annual greenhouse gas emissions per capita",
    unit: "tonnes CO₂e",
    source: "SPC Climate Change Indicators",
    lastUpdated: "2024",
    dataType: "emissions",
  },
  {
    id: "cropYield",
    name: "Crop Yield",
    description: "Annual crop yield per hectare",
    unit: "kg/ha",
    source: "SPC Climate Change Indicators",
    lastUpdated: "2024",
    dataType: "agriculture",
  },
  {
    id: "tourismArrivals",
    name: "Tourism Arrivals",
    description: "Annual international tourism arrivals",
    unit: "visitors",
    source: "SPC Climate Change Indicators",
    lastUpdated: "2024",
    dataType: "tourism",
  },
];