"use client";

export default function PacificMap() {
  return (
    <svg
      viewBox="0 0 1400 800"
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Ocean */}
      <rect width="1400" height="800" fill="#dbeafe" />

      {/* =========================
          AUSTRALIA
      ========================= */}
      <path
        d="
          M120 520
          L170 470
          L260 450
          L330 470
          L350 520
          L320 580
          L250 610
          L180 600
          L130 560
          Z
        "
        fill="#d9c97b"
        stroke="#a68a52"
        strokeWidth="2"
      />

      {/* Tasmania */}
      <ellipse
        cx="290"
        cy="650"
        rx="18"
        ry="12"
        fill="#d9c97b"
        stroke="#a68a52"
      />

      {/* =========================
          NEW ZEALAND
      ========================= */}

      <path
        d="
          M460 620
          L490 650
          L510 690
          L495 730
          L470 700
          L450 650
          Z
        "
        fill="#d9c97b"
        stroke="#a68a52"
      />

      <path
        d="
          M530 660
          L550 690
          L560 730
          L540 760
          L520 720
          Z
        "
        fill="#d9c97b"
        stroke="#a68a52"
      />

      {/* =========================
          PNG / INDONESIA
      ========================= */}

      <path
        d="
          M60 430
          L130 400
          L220 400
          L260 430
          L230 460
          L120 470
          Z
        "
        fill="#d9c97b"
        stroke="#a68a52"
      />

      {/* =========================
          ASIA EDGE
      ========================= */}

      <path
        d="
          M0 0
          L260 0
          L240 120
          L220 220
          L160 270
          L90 250
          L30 190
          L0 130
          Z
        "
        fill="#d9c97b"
        stroke="#a68a52"
      />

      {/* Japan */}
      <path
        d="
          M250 170
          L270 200
          L285 235
          L275 270
          L255 245
          L245 210
          Z
        "
        fill="#d9c97b"
        stroke="#a68a52"
      />

      {/* =========================
          NORTH AMERICA
      ========================= */}

      <path
        d="
          M1140 0
          L1400 0
          L1400 420
          L1320 390
          L1250 330
          L1210 250
          L1170 140
          Z
        "
        fill="#d9c97b"
        stroke="#a68a52"
      />

      {/* Central America */}
      <path
        d="
          M1170 420
          L1230 460
          L1260 500
          L1230 520
          L1170 470
          Z
        "
        fill="#d9c97b"
        stroke="#a68a52"
      />

      {/* =========================
          SOUTH AMERICA
      ========================= */}

      <path
        d="
          M1270 520
          L1340 540
          L1380 620
          L1360 760
          L1320 800
          L1270 760
          L1240 650
          L1240 560
          Z
        "
        fill="#d9c97b"
        stroke="#a68a52"
      />

      {/* =========================
          PACIFIC ISLANDS
      ========================= */}

      {/* Hawaii */}
      <circle cx="720" cy="270" r="4" fill="#444" />
      <circle cx="740" cy="280" r="3" fill="#444" />
      <circle cx="755" cy="290" r="2" fill="#444" />

      {/* Marshall Islands */}
      <circle cx="470" cy="360" r="2.5" fill="#444" />
      <circle cx="490" cy="370" r="2" fill="#444" />
      <circle cx="510" cy="355" r="2" fill="#444" />

      {/* Micronesia */}
      <circle cx="390" cy="410" r="3" fill="#444" />
      <circle cx="420" cy="420" r="2" fill="#444" />

      {/* Nauru */}
      <circle cx="500" cy="470" r="2.5" fill="#444" />

      {/* Kiribati */}
      <circle cx="580" cy="470" r="2.5" fill="#444" />
      <circle cx="650" cy="430" r="2" fill="#444" />
      <circle cx="710" cy="390" r="2" fill="#444" />

      {/* Solomon Islands */}
      <circle cx="360" cy="520" r="3" fill="#444" />
      <circle cx="390" cy="535" r="2.5" fill="#444" />
      <circle cx="420" cy="550" r="2" fill="#444" />

      {/* Vanuatu */}
      <circle cx="420" cy="590" r="3" fill="#444" />
      <circle cx="430" cy="620" r="2" fill="#444" />

      {/* Fiji */}
      <circle cx="520" cy="590" r="3" fill="#444" />
      <circle cx="540" cy="600" r="2" fill="#444" />

      {/* Tonga */}
      <circle cx="580" cy="660" r="2.5" fill="#444" />

      {/* Samoa */}
      <circle cx="620" cy="580" r="3" fill="#444" />

      {/* Cook Islands */}
      <circle cx="720" cy="600" r="2.5" fill="#444" />

      {/* French Polynesia */}
      <circle cx="860" cy="620" r="3" fill="#444" />
      <circle cx="900" cy="610" r="2" fill="#444" />
      <circle cx="940" cy="630" r="2" fill="#444" />

      {/* =========================
          OCEAN LABEL
      ========================= */}

      <text
        x="700"
        y="430"
        textAnchor="middle"
        fontSize="56"
        fontWeight="300"
        fill="#0f172a"
      >
        PACIFIC OCEAN
      </text>

      {/* =========================
          REGION LABELS
      ========================= */}

      <text x="530" y="590" fontSize="18" fill="#334155">
        Fiji
      </text>

      <text x="610" y="575" fontSize="18" fill="#334155">
        Samoa
      </text>

      <text x="400" y="610" fontSize="18" fill="#334155">
        Vanuatu
      </text>

      <text x="350" y="540" fontSize="18" fill="#334155">
        Solomon Islands
      </text>

      <text x="460" y="350" fontSize="18" fill="#334155">
        Marshall Islands
      </text>

      <text x="700" y="250" fontSize="18" fill="#334155">
        Hawaiian Islands
      </text>

      <text x="130" y="690" fontSize="22" fill="#334155">
        Australia
      </text>

      <text x="450" y="780" fontSize="22" fill="#334155">
        New Zealand
      </text>

      <text x="1060" y="160" fontSize="26" fill="#334155">
        North America
      </text>

      <text x="1270" y="650" fontSize="26" fill="#334155">
        South America
      </text>

      <text x="80" y="90" fontSize="26" fill="#334155">
        Asia
      </text>
    </svg>
  );
}
