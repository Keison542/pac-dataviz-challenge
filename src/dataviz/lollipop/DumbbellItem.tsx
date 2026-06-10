"use client";

import { sexColorScale, climateColorScale } from "@/lib/utils";
import { useSpring, animated } from "@react-spring/web";
import { useState } from "react";

type DumbbellItemProps = {
  xValue1: number;
  xValue2: number;
  y: number;
  label?: string;
  color1?: string;
  color2?: string;
  category1?: string;
  category2?: string;
  onHover?: (data: { value1: number; value2: number; label: string; y: number } | null) => void;
  isAnimated?: boolean;
  showDifference?: boolean;
  differenceFormatter?: (diff: number) => string;
};

type AnimatedProps = {
  barWidth: number;
  xValue1: number;
  xValue2: number;
  valueOpacity: number;
  y: number;
  lineOpacity: number;
};

export const DumbbellItem = ({ 
  xValue1, 
  xValue2, 
  y, 
  label,
  color1,
  color2,
  category1 = "Male",
  category2 = "Female",
  onHover,
  isAnimated = true,
  showDifference = false,
  differenceFormatter,
}: DumbbellItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.({ value1: xValue1, value2: xValue2, label: label || "", y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
  };

  const colorOne = color1 || sexColorScale(category1);
  const colorTwo = color2 || sexColorScale(category2);

  const springProps = useSpring<AnimatedProps>({
    from: {
      xValue1: 0,
      xValue2: 0,
      valueOpacity: 0,
      lineOpacity: 0,
      y,
    },
    to: {
      xValue1: xValue1,
      xValue2: xValue2,
      valueOpacity: 1,
      lineOpacity: 0.7,
      y,
    },
    config: {
      friction: 100,
      tension: 200,
    },
    delay: isAnimated ? 0 : 0,
    immediate: !isAnimated,
  });

  // Hover animation for circles
  const circle1Spring = useSpring({
    from: { r: 5 },
    to: { r: isHovered ? 7 : 5 },
    config: { friction: 60, tension: 200 },
  });

  const circle2Spring = useSpring({
    from: { r: 5 },
    to: { r: isHovered ? 7 : 5 },
    config: { friction: 60, tension: 200 },
  });

  const lineSpring = useSpring({
    from: { strokeWidth: 1 },
    to: { strokeWidth: isHovered ? 2 : 1 },
    config: { friction: 60, tension: 200 },
  });

  // Calculate difference
  const difference = xValue2 - xValue1;
  const isPositive = difference > 0;
  const percentChange = xValue1 !== 0 ? ((difference / xValue1) * 100).toFixed(1) : "0";

  // Format difference text
  const getDifferenceText = () => {
    if (differenceFormatter) {
      return differenceFormatter(difference);
    }
    const absDiff = Math.abs(difference);
    if (absDiff >= 1e6) return `${(absDiff / 1e6).toFixed(1)}M`;
    if (absDiff >= 1e3) return `${(absDiff / 1e3).toFixed(1)}K`;
    return `${absDiff.toFixed(0)}`;
  };

  // Determine if values are valid
  const isValid = !isNaN(xValue1) && !isNaN(xValue2) && !isNaN(y);

  if (!isValid) return null;

  return (
    <g>
      {/* Connecting line */}
      <animated.line
        x1={springProps.xValue1}
        y1={springProps.y}
        y2={springProps.y}
        x2={springProps.xValue2}
        opacity={springProps.lineOpacity}
        stroke="grey"
        strokeWidth={lineSpring.strokeWidth}
        strokeLinecap="round"
      />

      {/* Difference indicator on the line */}
      {showDifference && !isHovered && Math.abs(difference) > 0 && (
        <animated.text
          x={(springProps.xValue1.valueOf() + springProps.xValue2.valueOf()) / 2}
          y={springProps.y.valueOf() - 12}
          textAnchor="middle"
          fontSize={10}
          fill={isPositive ? "#2ca02c" : "#d62728"}
          opacity={springProps.valueOpacity}
          pointerEvents="none"
        >
          {isPositive ? `+${getDifferenceText()}` : `-${getDifferenceText()}`}
          <tspan fontSize={8} dy={-2}> ({percentChange}%)</tspan>
        </animated.text>
      )}

      {/* Hover tooltip for difference */}
      {isHovered && showDifference && Math.abs(difference) > 0 && (
        <animated.text
          x={(springProps.xValue1.valueOf() + springProps.xValue2.valueOf()) / 2}
          y={springProps.y.valueOf() - 12}
          textAnchor="middle"
          fontSize={11}
          fontWeight="bold"
          fill={isPositive ? "#2ca02c" : "#d62728"}
          opacity={springProps.valueOpacity}
          pointerEvents="none"
        >
          {isPositive ? `+${getDifferenceText()}` : `-${getDifferenceText()}`}
        </animated.text>
      )}

      {/* Circle 1 (Left/First value) */}
      <animated.circle
        cy={springProps.y}
        cx={springProps.xValue1}
        opacity={springProps.valueOpacity}
        stroke={colorOne}
        fill={colorOne}
        strokeWidth={isHovered ? 2 : 1}
        r={circle1Spring.r}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: "pointer" }}
      />

      {/* Circle 2 (Right/Second value) */}
      <animated.circle
        cy={springProps.y}
        cx={springProps.xValue2}
        opacity={springProps.valueOpacity}
        stroke={colorTwo}
        fill={colorTwo}
        strokeWidth={isHovered ? 2 : 1}
        r={circle2Spring.r}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: "pointer" }}
      />

      {/* Label for the dumbbell item */}
      {label && (isHovered || !showDifference) && (
        <animated.text
          x={springProps.xValue1.valueOf() - 10}
          y={springProps.y.valueOf()}
          textAnchor="end"
          alignmentBaseline="middle"
          fontSize={isHovered ? 12 : 11}
          fontWeight={isHovered ? "bold" : "normal"}
          fill="#333"
          opacity={springProps.valueOpacity}
          pointerEvents="none"
        >
          {label}
        </animated.text>
      )}

      {/* Value labels on hover */}
      {isHovered && (
        <>
          <animated.text
            x={springProps.xValue1.valueOf() + 8}
            y={springProps.y.valueOf() - 8}
            textAnchor="start"
            fontSize={10}
            fill={colorOne}
            opacity={springProps.valueOpacity}
            pointerEvents="none"
          >
            {category1}: {xValue1 >= 1000 ? `${(xValue1 / 1000).toFixed(1)}K` : xValue1.toFixed(0)}
          </animated.text>
          <animated.text
            x={springProps.xValue2.valueOf() + 8}
            y={springProps.y.valueOf() - 8}
            textAnchor="start"
            fontSize={10}
            fill={colorTwo}
            opacity={springProps.valueOpacity}
            pointerEvents="none"
          >
            {category2}: {xValue2 >= 1000 ? `${(xValue2 / 1000).toFixed(1)}K` : xValue2.toFixed(0)}
          </animated.text>
        </>
      )}
    </g>
  );
};