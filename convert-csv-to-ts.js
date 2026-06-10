// Call "node convert-csv-to-ts.js" to convert .csv file to .ts but first ensure path is correct

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputDir = path.resolve(__dirname, "C:/Users/MY PC/Downloads/pacific-challenge-main/src/data/economic_consequence");
const outputDir = path.resolve(__dirname, "C:/Users/MY PC/Downloads/pacific-challenge-main/src/data/economic_consequence");

// Mapping
const datasetConfig = {
  "population_growth.csv": {
    outputFile: "population_growth.ts",
    valueField: "OBS_VALUE",
    countryField: "Pacific Island Countries and territories",
    yearField: "TIME_PERIOD",
  },

   "tubercolosis_incidence.csv": {
    outputFile: "tubercolosis_incidence.ts",
    valueField: "OBS_VALUE",
    countryField: "Pacific Island Countries and territories",
    yearField: "TIME_PERIOD",
  },

    "climate_altering_land.csv": {
    outputFile: "climate_altering_land.ts",
    valueField: "OBS_VALUE",
    countryField: "Pacific Island Countries and territories",
    yearField: "TIME_PERIOD",
  },

  "crop_yield.csv": {
    outputFile: "crop_yield.ts",
    valueField: "OBS_VALUE",
    countryField: "Pacific Island Countries and territories",
    yearField: "TIME_PERIOD",
  },

  "lifestock_yield.csv": {
    outputFile: "lifestock_yield.ts",
    valueField: "OBS_VALUE",
    countryField: "Pacific Island Countries and territories",
    yearField: "TIME_PERIOD",
  },

   "tourist_arrival.csv": {
    outputFile: "tourist_arrival.ts",
    valueField: "OBS_VALUE",
    countryField: "Pacific Island Countries and territories",
    yearField: "TIME_PERIOD",
  },

};

// Ensure output dir exists
fs.mkdirSync(outputDir, { recursive: true });

function convertCsv(csvFile, config) {
  return new Promise((resolve, reject) => {
    const csvPath = path.join(inputDir, csvFile);

    if (!fs.existsSync(csvPath)) {
      console.log(`Skipping ${csvFile} - file not found`);
      return resolve();
    }

    const results = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (data) => {
        const country = data[config.countryField];
        const year = parseInt(data[config.yearField]);
        const value = parseFloat(data[config.valueField]);

        if (!country) return;

        if (Number.isFinite(year) && Number.isFinite(value)) {
          results.push({ country, year, value });
        }
      })
      .on("end", () => {
        const varName = config.outputFile
          .replace(".ts", "")
          .replace(/[^a-zA-Z0-9_]/g, "_");

        const tsContent = `// Auto-generated from ${csvFile}
export type ${config.typeName} = {
  country: string;
  year: number;
  value: number;
};

export const ${varName}: ${config.typeName}[] = ${JSON.stringify(
          results,
          null,
          2
        )};
`;

        const outputPath = path.join(outputDir, config.outputFile);
        fs.writeFileSync(outputPath, tsContent);

        console.log(`✅ Converted ${csvFile} → ${config.outputFile} (${results.length} records)`);
        resolve();
      })
      .on("error", reject);
  });
}

// Run all conversions sequentially (safe)
async function run() {
  for (const [csvFile, config] of Object.entries(datasetConfig)) {
    await convertCsv(csvFile, config);
  }

  console.log("🎉 All CSV conversions completed");
}

run().catch((err) => {
  console.error("❌ Conversion failed:", err);
});