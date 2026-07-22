import type {
  FeatureCollection,
  Feature,
  Geometry,
  GeoJsonProperties,
} from "geojson";

type PacificFeature = Feature<Geometry, GeoJsonProperties> & {
  id: string;
};

export const geoData: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // ============================================================
    // KIRIBATI
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Kiribati" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[173.0, 1.87], [173.1, 1.87], [173.1, 1.77], [173.0, 1.77], [173.0, 1.87]]],
          [[[172.0, 0.5], [172.1, 0.5], [172.1, 0.4], [172.0, 0.4], [172.0, 0.5]]],
        ],
      },
      id: `KIR-${i}`,
    })),

    // ============================================================
    // PAPUA NEW GUINEA
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Papua New Guinea" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [141.0, -2.0],
            [156.0, -2.0],
            [156.0, -11.0],
            [141.0, -11.0],
            [141.0, -2.0],
          ],
        ],
      },
      id: `PNG-${i}`,
    })),

    // ============================================================
    // AMERICAN SAMOA
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "American Samoa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-170.8, -14.2],
            [-170.6, -14.2],
            [-170.6, -14.4],
            [-170.8, -14.4],
            [-170.8, -14.2],
          ],
        ],
      },
      id: `ASM-${i}`,
    })),

    // ============================================================
    // SAMOA
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Samoa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-172.8, -13.4],
            [-172.0, -13.4],
            [-172.0, -14.0],
            [-172.8, -14.0],
            [-172.8, -13.4],
          ],
        ],
      },
      id: `WSM-${i}`,
    })),

    // ============================================================
    // NIUE
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Niue" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-169.95, -19.0],
            [-169.85, -19.0],
            [-169.85, -19.1],
            [-169.95, -19.1],
            [-169.95, -19.0],
          ],
        ],
      },
      id: `NIU-${i}`,
    })),

    // ============================================================
    // TUVALU
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Tuvalu" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [176.0, -5.5],
            [180.0, -5.5],
            [180.0, -10.0],
            [176.0, -10.0],
            [176.0, -5.5],
          ],
        ],
      },
      id: `TUV-${i}`,
    })),

    // ============================================================
    // FIJI
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Fiji" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[178.0, -16.3], [178.5, -16.3], [178.5, -16.8], [178.0, -16.8], [178.0, -16.3]]],
        ],
      },
      id: `FJI-${i}`,
    })),

    // ============================================================
    // SOLOMON ISLANDS
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Solomon Islands" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[156.5, -6.5], [157.5, -6.5], [157.5, -7.5], [156.5, -7.5], [156.5, -6.5]]],
        ],
      },
      id: `SLB-${i}`,
    })),

    // ============================================================
    // NAURU
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Nauru" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [166.9, -0.5],
            [167.0, -0.5],
            [167.0, -0.55],
            [166.9, -0.55],
            [166.9, -0.5],
          ],
        ],
      },
      id: `NRU-${i}`,
    })),

    // ============================================================
    // COOK ISLANDS
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Cook Islands" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[-159.8, -21.2], [-159.7, -21.2], [-159.7, -21.3], [-159.8, -21.3], [-159.8, -21.2]]],
        ],
      },
      id: `COK-${i}`,
    })),

    // ============================================================
    // TOKELAU
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Tokelau" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[-172.5, -9.0], [-172.4, -9.0], [-172.4, -9.1], [-172.5, -9.1], [-172.5, -9.0]]],
        ],
      },
      id: `TKL-${i}`,
    })),

    // ============================================================
    // NORTHERN MARIANA ISLANDS
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Northern Mariana Islands" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[145.7, 15.1], [145.8, 15.1], [145.8, 15.0], [145.7, 15.0], [145.7, 15.1]]],
        ],
      },
      id: `MNP-${i}`,
    })),

    // ============================================================
    // FRENCH POLYNESIA
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "French Polynesia" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[-149.5, -17.5], [-149.4, -17.5], [-149.4, -17.6], [-149.5, -17.6], [-149.5, -17.5]]],
        ],
      },
      id: `PYF-${i}`,
    })),

    // ============================================================
    // WALLIS AND FUTUNA
    // ============================================================
    // ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
    //   type: "Feature",
    //   properties: { name: "Wallis and Futuna" },
    //   geometry: {
    //     type: "MultiPolygon",
    //     coordinates: [
    //       [[[-178.1, -13.3], [-178.0, -13.3], [-178.0, -13.4], [-178.1, -13.4], [-178.1, -13.3]]],
    //     ],
    //   },
    //   id: `WLF-${i}`,
    // })),

    // ============================================================
    // MARSHALL ISLANDS
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Marshall Islands" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[171.0, 7.0], [171.1, 7.0], [171.1, 6.9], [171.0, 6.9], [171.0, 7.0]]],
        ],
      },
      id: `MHL-${i}`,
    })),

    // ============================================================
    // VANUATU
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Vanuatu" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[168.0, -16.0], [168.5, -16.0], [168.5, -16.5], [168.0, -16.5], [168.0, -16.0]]],
        ],
      },
      id: `VUT-${i}`,
    })),

    // ============================================================
    // MICRONESIA
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Micronesia, Federated States of" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[158.0, 6.8], [158.1, 6.8], [158.1, 6.7], [158.0, 6.7], [158.0, 6.8]]],
        ],
      },
      id: `FSM-${i}`,
    })),

    // ============================================================
    // TONGA
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Tonga" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[-175.2, -21.0], [-175.1, -21.0], [-175.1, -21.2], [-175.2, -21.2], [-175.2, -21.0]]],
        ],
      },
      id: `TON-${i}`,
    })),

    // ============================================================
    // NEW CALEDONIA
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "New Caledonia" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [164.0, -20.0],
            [168.0, -20.0],
            [168.0, -22.5],
            [164.0, -22.5],
            [164.0, -20.0],
          ],
        ],
      },
      id: `NCL-${i}`,
    })),

    // ============================================================
    // GUAM
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Guam" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [144.7, 13.2],
            [144.9, 13.2],
            [144.9, 13.5],
            [144.7, 13.5],
            [144.7, 13.2],
          ],
        ],
      },
      id: `GUM-${i}`,
    })),

    // ============================================================
    // PALAU
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Palau" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[134.4, 7.4], [134.6, 7.4], [134.6, 7.2], [134.4, 7.2], [134.4, 7.4]]],
        ],
      },
      id: `PLW-${i}`,
    })),

    // ============================================================
    // PITCAIRN ISLANDS
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Pitcairn Islands" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-128.4, -25.0],
            [-128.2, -25.0],
            [-128.2, -25.1],
            [-128.4, -25.1],
            [-128.4, -25.0],
          ],
        ],
      },
      id: `PCN-${i}`,
    })),

    // ============================================================
    // NORFOLK ISLAND
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Norfolk Island" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [167.9, -29.0],
            [168.0, -29.0],
            [168.0, -29.1],
            [167.9, -29.1],
            [167.9, -29.0],
          ],
        ],
      },
      id: `NFK-${i}`,
    })),

    // ============================================================
    // CHRISTMAS ISLAND
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Christmas Island" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.6, -10.4],
            [105.7, -10.4],
            [105.7, -10.5],
            [105.6, -10.5],
            [105.6, -10.4],
          ],
        ],
      },
      id: `CXR-${i}`,
    })),

    // ============================================================
    // COCOS (KEELING) ISLANDS
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Cocos (Keeling) Islands" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [96.8, -12.1],
            [96.9, -12.1],
            [96.9, -12.2],
            [96.8, -12.2],
            [96.8, -12.1],
          ],
        ],
      },
      id: `CCK-${i}`,
    })),

    // ============================================================
    // EAST TIMOR
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "East Timor" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [124.0, -8.0],
            [127.0, -8.0],
            [127.0, -9.5],
            [124.0, -9.5],
            [124.0, -8.0],
          ],
        ],
      },
      id: `TLS-${i}`,
    })),

    // ============================================================
    // HAWAII
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Hawaii" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[-155.0, 19.0], [-154.5, 19.0], [-154.5, 18.5], [-155.0, 18.5], [-155.0, 19.0]]],
        ],
      },
      id: `HAW-${i}`,
    })),

    // ============================================================
    // EASTER ISLAND
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Easter Island" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-109.5, -27.05],
            [-109.3, -27.05],
            [-109.3, -27.15],
            [-109.5, -27.15],
            [-109.5, -27.05],
          ],
        ],
      },
      id: `IPC-${i}`,
    })),

    // ============================================================
    // GALAPAGOS ISLANDS
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Galapagos Islands" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[-90.5, -0.5], [-90.4, -0.5], [-90.4, -0.6], [-90.5, -0.6], [-90.5, -0.5]]],
        ],
      },
      id: `GPS-${i}`,
    })),

    // ============================================================
    // BAKER ISLAND
    // ============================================================
    ...Array.from({ length: 31 }, (_, i): PacificFeature => ({
      type: "Feature",
      properties: { name: "Baker Island" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-176.5, 0.18],
            [-176.46, 0.18],
            [-176.46, 0.2],
            [-176.5, 0.2],
            [-176.5, 0.18],
          ],
        ],
      },
      id: `BAK-${i}`,
    })),
  ],
};
