export type DisasterLossRecord = {
  country: string;
  year: number;
  value: number; // USD loss
};

export const disasterEconomicLoss: DisasterLossRecord[] = [
  { country: "Kiribati", year: 2014, value: 268950 },
  { country: "Kiribati", year: 2020, value: 30750 },
  { country: "Samoa", year: 2016, value: 22048411 },
  { country: "Micronesia", year: 2016, value: 20310000 },
  { country: "Micronesia", year: 2018, value: 196875 },
  { country: "Micronesia", year: 2019, value: 8270325 },
  { country: "Fiji", year: 2010, value: 24623058 },
  { country: "Fiji", year: 2011, value: 1224504 },
  { country: "Fiji", year: 2012, value: 141400784 },
  { country: "Fiji", year: 2016, value: 374109863 },
  { country: "Fiji", year: 2018, value: 50247780 },
  { country: "Fiji", year: 2019, value: 1090125 },
  { country: "Fiji", year: 2020, value: 24247724 },
  { country: "Tonga", year: 2010, value: 4676174 },
  { country: "Tonga", year: 2011, value: 1113801 },
  { country: "Tonga", year: 2014, value: 18560063 },
  { country: "Tonga", year: 2016, value: 3050475 },
  { country: "Tonga", year: 2018, value: 8579025 },
  { country: "French Polynesia", year: 2016, value: 30220000 },
  { country: "Palau", year: 2012, value: 6190257 },
  { country: "Palau", year: 2016, value: 6 },
  { country: "Vanuatu", year: 2010, value: 3071588 },
  { country: "Vanuatu", year: 2011, value: 1470068 },
  { country: "Vanuatu", year: 2012, value: 281580 },
  { country: "Vanuatu", year: 2014, value: 245100 },
  { country: "Vanuatu", year: 2016, value: 81.7 },
  { country: "Vanuatu", year: 2018, value: 64500000 },
  { country: "Papua New Guinea", year: 2012, value: 1077375 },
  { country: "Papua New Guinea", year: 2013, value: 1713195 },
  { country: "Papua New Guinea", year: 2016, value: 9.57 },
  { country: "Papua New Guinea", year: 2020, value: 1593750 },
  { country: "New Caledonia", year: 2016, value: 20310000 },
  { country: "Marshall Islands", year: 2007, value: 4.9 },
  { country: "Marshall Islands", year: 2014, value: 454125 },
  { country: "Marshall Islands", year: 2016, value: 1781682 },
  { country: "Solomon Islands", year: 2010, value: 5826567 },
  { country: "Solomon Islands", year: 2011, value: 129938 },
  { country: "Solomon Islands", year: 2012, value: 1091496 },
  { country: "Solomon Islands", year: 2013, value: 12626951 }
];