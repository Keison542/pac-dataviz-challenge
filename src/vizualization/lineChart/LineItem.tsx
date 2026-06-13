"use client";

import { animated, useSpring } from "@react-spring/web";
import { useState } from "react";

type LineItemProps = {
  path: string;
  color: string;
  opacity: number;
  strokeWidth?: number;
  strokeDasharray?: string;
  onHover?: (isHovered: boolean) => void;
  label?: string;
};

export const LineItem = ({
  path,
  color,
  opacity,
  strokeWidth = 2,
  strokeDasharray,
  onHover,
  label,
}: LineItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(false);
  };

  // ✅ SAFE SPRING (only visual hover effects)
  const hoverSpring = useSpring({
    strokeWidth: isHovered ? strokeWidth + 1 : strokeWidth,
    opacity: isHovered ? Math.min(opacity + 0.2, 1) : opacity,
    config: {
      tension: 200,
      friction: 25,
    },
  });

  return (
    <g>
      {/* Glow effect */}
      {isHovered && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 4}
          opacity={0.15}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "blur(3px)" }}
        />
      )}

      {/* Main line */}
      <animated.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={hoverSpring.strokeWidth}
        opacity={hoverSpring.opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: "pointer",
          transition: "stroke-width 0.2s ease, opacity 0.2s ease",
        }}
      />

      {/* Optional label */}
      {label && (
        <text
          x={0}
          y={0}
          fill={color}
          fontSize={12}
          fontWeight={isHovered ? "bold" : "normal"}
          opacity={isHovered ? 1 : 0.7}
          pointerEvents="none"
        >
          {label}
        </text>
      )}
    </g>
  );
};