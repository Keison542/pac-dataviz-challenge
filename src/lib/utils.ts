import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  EducationLevel, 
  Island, 
  allIslandNames,
  Sex,
  ClimateRecord,
  DisasterLossRecord,
  AffectedPeopleRecord,
  ChartDataPoint,
  TimeSeriesData,
  DataRange,
} from "./types";
import { scaleOrdinal, scaleLinear } from "d3-scale";

// ==================== TAILWIND UTILS ====================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== COLOR SCALES ====================

export const sexColorScale = scaleOrdinal()
  .domain(["Female", "Male"])
  .range(["#9d174d", "#60b3a2"]);

export const islandColorScale = scaleOrdinal<string>()
  .domain(allIslandNames)
  .range([
    "#FED789FF", "#023743FF", "#72874EFF", "#476F84FF", 
    "#A4BED5FF", "#453947FF", "#E8A598FF", "#6B8E23FF",
    "#CD5C5CFF", "#4682B4FF", "#DAA520FF", "#7B68EEFF",
    "#20B2AAFF", "#FF69B4FF", "#8B4513FF", "#2E8B57FF",
    "#9370DBFF", "#DC143CFF", "#00CED1FF", "#FFD700FF",
    "#32CD32FF", "#FF4500FF"
  ]);

// Climate data color scales
export const climateColorScale = scaleOrdinal()
  .domain([
    "surfaceTempAnomaly", "seaSurfaceTempAnomaly", "precipitationAnomaly",
    "seaLevelAnomaly", "greenhouseGasEmission", "cropYield",
    "livestockYield", "powerGeneration", "tourismArrivals",
    "meteorologicalMonitoring", "fisheriesManagement", 
    "environmentalTaxes", "alteredLandCover", "default"
  ])
  .range([
    "#d62728", "#ff7f0e", "#2ca02c", "#1f77b4", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    "#98df8a", "#c5b0d5", "#ff9896", "#393b79"
  ]);

// Disaster data color scale
export const disasterColorScale = scaleOrdinal()
  .domain(["economicLoss", "affectedPersons"])
  .range(["#d62728", "#ff7f0e"]);

// ==================== EDUCATION LEVELS ====================

export const educationLevelItems: { label: string; value: EducationLevel }[] = [
  {
    label: "Childhood",
    value: "Early childhood education",
  },
  {
    label: "Primary",
    value: "Primary education",
  },
  {
    label: "Lower 2nd",
    value: "Lower secondary education",
  },
  {
    label: "Upper 2nd",
    value: "Upper secondary education",
  },
  {
    label: "Post 2nd",
    value: "Post-secondary non-tertiary education",
  },
  {
    label: "Tertiary",
    value: "Tertiary education",
  },
];

// ==================== ISLAND COORDINATES ====================

type IslandItem = {
  name: Island;
  coordinates: [number, number];
};

export const islandCoordinates: IslandItem[] = [
  {
    name: "Kiribati",
    coordinates: [-157.3625, 1.8639],
  },
  {
    name: "Marshall Islands",
    coordinates: [171.1845, 7.1315],
  },
  {
    name: "Nauru",
    coordinates: [166.9315, -0.5228],
  },
  {
    name: "Palau",
    coordinates: [134.5825, 7.5150],
  },
  {
    name: "Tonga",
    coordinates: [-175.1982, -21.1790],
  },
  {
    name: "Tuvalu",
    coordinates: [179.1940, -7.1095],
  },
  {
    name: "Vanuatu",
    coordinates: [167.9547, -15.3767],
  },
  {
    name: "Fiji",
    coordinates: [178.0, -18.0],
  },
  {
    name: "Samoa",
    coordinates: [-172.0, -13.5],
  },
  {
    name: "Solomon Islands",
    coordinates: [160.0, -9.5],
  },
  {
    name: "Papua New Guinea",
    coordinates: [147.0, -6.5],
  },
  {
    name: "Cook Islands",
    coordinates: [-159.0, -21.0],
  },
  {
    name: "Niue",
    coordinates: [-169.0, -19.0],
  },
  {
    name: "Tokelau",
    coordinates: [-171.0, -9.0],
  },
  {
    name: "Wallis and Futuna",
    coordinates: [-176.0, -13.5],
  },
  {
    name: "American Samoa",
    coordinates: [-170.0, -14.5],
  },
  {
    name: "Guam",
    coordinates: [144.0, 13.5],
  },
  {
    name: "New Caledonia",
    coordinates: [165.0, -21.0],
  },
  {
    name: "Northern Mariana Islands",
    coordinates: [145.0, 15.0],
  },
  {
    name: "Pitcairn",
    coordinates: [-130.0, -25.0],
  },
  {
    name: "French Polynesia",
    coordinates: [-149.0, -17.5],
  },
  {
    name: "Micronesia, Federated State of",
    coordinates: [158.0, 6.5],
  },
];

// ==================== DATA FORMATTERS ====================

export const formatNumber = (value: number, decimals: number = 0): string => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
  return value.toFixed(decimals);
};

export const formatCurrency = (value: number): string => {
  return `$${formatNumber(value, 2)}`;
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatTemperature = (value: number): string => {
  return `${value.toFixed(2)}°C`;
};

export const formatPrecipitation = (value: number): string => {
  return `${value.toFixed(1)}mm`;
};

export const formatSeaLevel = (value: number): string => {
  return `${value.toFixed(3)}m`;
};

export const formatEmissions = (value: number): string => {
  return `${value.toFixed(2)}t CO₂e`;
};

export const formatYield = (value: number): string => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}t/ha`;
  return `${value.toFixed(0)}kg/ha`;
};

export const formatPowerGeneration = (value: number): string => {
  if (value >= 1000) return `${(value / 1000).toFixed(2)}GWh`;
  return `${value.toFixed(2)}MWh`;
};

// Generic value formatter based on data type
export const formatValueByType = (value: number, dataType: string): string => {
  switch (dataType) {
    case "economicLoss":
      return formatCurrency(value);
    case "affectedPersons":
      return formatNumber(value, 0);
    case "surfaceTempAnomaly":
    case "seaSurfaceTempAnomaly":
      return formatTemperature(value);
    case "precipitationAnomaly":
      return formatPrecipitation(value);
    case "seaLevelAnomaly":
      return formatSeaLevel(value);
    case "greenhouseGasEmission":
      return formatEmissions(value);
    case "cropYield":
    case "livestockYield":
      return formatYield(value);
    case "powerGeneration":
      return formatPowerGeneration(value);
    case "environmentalTaxes":
    case "alteredLandCover":
      return formatPercentage(value);
    default:
      return formatNumber(value, 2);
  }
};

// ==================== DATA PROCESSING HELPERS ====================

export const groupDataByCountry = (data: ClimateRecord[]): Map<string, ClimateRecord[]> => {
  const grouped = new Map<string, ClimateRecord[]>();
  data.forEach(item => {
    if (!grouped.has(item.country)) {
      grouped.set(item.country, []);
    }
    grouped.get(item.country)!.push(item);
  });
  return grouped;
};

export const groupDataByYear = (data: ClimateRecord[]): Map<number, ClimateRecord[]> => {
  const grouped = new Map<number, ClimateRecord[]>();
  data.forEach(item => {
    if (!grouped.has(item.year)) {
      grouped.set(item.year, []);
    }
    grouped.get(item.year)!.push(item);
  });
  return grouped;
};

export const getDataRange = (data: ClimateRecord[]): DataRange => {
  const values = data.map(d => d.value);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

export const getYearRange = (data: ClimateRecord[]): DataRange => {
  const years = data.map(d => d.year);
  return {
    min: Math.min(...years),
    max: Math.max(...years),
  };
};

export const filterDataByCountry = (
  data: ClimateRecord[], 
  country: string
): ClimateRecord[] => {
  return data.filter(d => d.country === country);
};

export const filterDataByYearRange = (
  data: ClimateRecord[], 
  startYear: number, 
  endYear: number
): ClimateRecord[] => {
  return data.filter(d => d.year >= startYear && d.year <= endYear);
};

export const sortDataByYear = (data: ClimateRecord[]): ClimateRecord[] => {
  return [...data].sort((a, b) => a.year - b.year);
};

// Convert to time series format
export const toTimeSeries = (data: ClimateRecord[]): TimeSeriesData[] => {
  const grouped = groupDataByCountry(data);
  return Array.from(grouped.entries()).map(([country, records]) => ({
    country,
    data: sortDataByYear(records).map(r => ({
      country: r.country,
      year: r.year,
      value: r.value,
    })),
  }));
};

// Calculate statistics
export const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

export const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const calculateTrend = (data: ClimateRecord[]): number => {
  if (data.length < 2) return 0;
  const x = data.map((_, i) => i);
  const y = data.map(d => d.value);
  const n = data.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
};

// ==================== CHART HELPERS ====================

export const getAxisTickValues = (domain: [number, number], count: number): number[] => {
  const step = (domain[1] - domain[0]) / count;
  return Array.from({ length: count + 1 }, (_, i) => domain[0] + i * step);
};

export const truncateLabel = (label: string, maxLength: number = 20): string => {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + "...";
};

// ==================== ANOMALY HELPERS ====================

export const isPositiveAnomaly = (value: number): boolean => value > 0;
export const isNegativeAnomaly = (value: number): boolean => value < 0;
export const getAnomalyColor = (value: number): string => 
  value > 0 ? "#d62728" : value < 0 ? "#2ca02c" : "#7f7f7f";

// ==================== EXPORT HELPERS ====================

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))
  ];
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};