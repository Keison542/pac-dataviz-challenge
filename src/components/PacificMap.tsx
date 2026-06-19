"use client";

export default function PacificMap() {
  return (
    <div className="w-full">
      <svg
        viewBox="0 0 1200 760"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="ocean" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#eff6ff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ocean */}
        <rect width="1200" height="760" fill="url(#ocean)" />

        {/* Ocean Label */}
        <text
          x="600"
          y="340"
          textAnchor="middle"
          fontSize="60"
          fontWeight="300"
          fill="#0f172a"
          opacity="0.12"
        >
          PACIFIC OCEAN
        </text>

        {/* =====================================
            DISASTER PULSES
        ===================================== */}

        <g opacity="0.35">
          <circle cx="470" cy="470" r="18" fill="#ef4444">
            <animate
              attributeName="r"
              values="10;30;10"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0;0.8"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>

          <circle cx="740" cy="560" r="18" fill="#ef4444">
            <animate
              attributeName="r"
              values="10;30;10"
              dur="5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0;0.8"
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>

          <circle cx="600" cy="280" r="18" fill="#0ea5e9">
            <animate
              attributeName="r"
              values="10;30;10"
              dur="4.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0;0.8"
              dur="4.5s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* =====================================
            MELANESIA
        ===================================== */}

        <ellipse
          cx="180"
          cy="340"
          rx="45"
          ry="18"
          fill="#1e293b"
        />

        <text x="115" y="315" fontSize="15" fill="#334155">
          Papua New Guinea
        </text>

        <circle cx="260" cy="380" r="5" fill="#1e293b" />
        <circle cx="275" cy="390" r="4" fill="#1e293b" />
        <circle cx="290" cy="400" r="3" fill="#1e293b" />

        <text x="215" y="430" fontSize="14" fill="#334155">
          Solomon Islands
        </text>

        <circle cx="330" cy="470" r="5" fill="#1e293b" />
        <circle cx="338" cy="495" r="4" fill="#1e293b" />

        <text x="300" y="530" fontSize="14" fill="#334155">
          Vanuatu
        </text>

        <circle cx="470" cy="470" r="6" fill="#1e293b" />

        <circle cx="490" cy="480" r="4" fill="#1e293b" />

        <text x="445" y="520" fontSize="15" fill="#334155">
          Fiji
        </text>

        {/* Cyclone */}
        <text
          x="505"
          y="455"
          fontSize="26"
          filter="url(#glow)"
        >
          🌪
        </text>

        {/* =====================================
            MICRONESIA
        ===================================== */}

        <circle cx="240" cy="210" r="5" fill="#1e293b" />

        <text x="210" y="190" fontSize="13" fill="#334155">
          Palau
        </text>

        <circle cx="350" cy="220" r="5" fill="#1e293b" />
        <circle cx="390" cy="215" r="4" fill="#1e293b" />
        <circle cx="430" cy="225" r="4" fill="#1e293b" />

        <text x="305" y="180" fontSize="13" fill="#334155">
          Micronesia
        </text>

        <circle cx="520" cy="230" r="4" fill="#1e293b" />
        <circle cx="540" cy="220" r="3" fill="#1e293b" />

        <text x="470" y="190" fontSize="13" fill="#334155">
          Marshall Islands
        </text>

        <circle cx="470" cy="310" r="4" fill="#1e293b" />

        <text x="445" y="290" fontSize="13" fill="#334155">
          Nauru
        </text>

        <circle cx="600" cy="280" r="4" fill="#1e293b" />
        <circle cx="690" cy="260" r="4" fill="#1e293b" />
        <circle cx="770" cy="240" r="4" fill="#1e293b" />

        <text x="595" y="220" fontSize="13" fill="#334155">
          Kiribati
        </text>

        {/* Flood */}
        <text
          x="620"
          y="260"
          fontSize="26"
          filter="url(#glow)"
        >
          🌊
        </text>

        {/* =====================================
            POLYNESIA
        ===================================== */}

        <circle cx="560" cy="390" r="4" fill="#1e293b" />

        <text x="535" y="370" fontSize="13" fill="#334155">
          Tuvalu
        </text>

        <circle cx="700" cy="470" r="5" fill="#1e293b" />

        <text x="670" y="450" fontSize="13" fill="#334155">
          Samoa
        </text>

        <circle cx="740" cy="560" r="4" fill="#1e293b" />

        <text x="715" y="600" fontSize="13" fill="#334155">
          Tonga
        </text>

        <circle cx="860" cy="470" r="4" fill="#1e293b" />

        <text x="810" y="450" fontSize="13" fill="#334155">
          Cook Islands
        </text>

        <circle cx="820" cy="520" r="4" fill="#1e293b" />

        <text x="795" y="550" fontSize="13" fill="#334155">
          Niue
        </text>

        <circle cx="760" cy="420" r="3" fill="#1e293b" />

        <text x="730" y="400" fontSize="13" fill="#334155">
          Tokelau
        </text>

        {/* Drought */}
        <text
          x="690"
          y="505"
          fontSize="26"
          filter="url(#glow)"
        >
          ☀️
        </text>

        {/* Region Labels */}

        <text
          x="250"
          y="620"
          fontSize="22"
          fontWeight="600"
          fill="#64748b"
        >
          Melanesia
        </text>

        <text
          x="350"
          y="120"
          fontSize="22"
          fontWeight="600"
          fill="#64748b"
        >
          Micronesia
        </text>

        <text
          x="760"
          y="650"
          fontSize="22"
          fontWeight="600"
          fill="#64748b"
        >
          Polynesia
        </text>

        {/* =====================================
            TIMELINE
        ===================================== */}

        <line
          x1="120"
          y1="700"
          x2="1080"
          y2="700"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {[
          [120, "1980"],
          [320, "1990"],
          [520, "2000"],
          [720, "2010"],
          [920, "2020"],
          [1080, "2025"],
        ].map(([x, label]) => (
          <g key={label}>
            <line
              x1={Number(x)}
              y1="690"
              x2={Number(x)}
              y2="710"
              stroke="#64748b"
            />
            <text
              x={Number(x)}
              y="730"
              textAnchor="middle"
              fontSize="13"
              fill="#475569"
            >
              {label}
            </text>
          </g>
        ))}

        {/* Timeline Events */}

        <text x="260" y="685" fontSize="22">
          🌪
        </text>

        <text x="500" y="685" fontSize="22">
          🌊
        </text>

        <text x="720" y="685" fontSize="22">
          ☀️
        </text>

        <text x="900" y="685" fontSize="22">
          🌧
        </text>

        <text x="1030" y="685" fontSize="22">
          🌪
        </text>
      </svg>

      <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm text-slate-600">
        <div>🌪 Cyclones</div>
        <div>🌊 Coastal Flooding</div>
        <div>☀️ Drought</div>
        <div>🌧 Extreme Rainfall</div>
      </div>
    </div>
  );
}
