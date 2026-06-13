"use client";

export type TooltipProps = {
  x: number;
  y: number;
  content?: string;
};

export function Tooltip({ x, y, content }: TooltipProps) {
  if (!content) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x + 10,
        top: y + 10,
        pointerEvents: "none",
      }}
      className="
        bg-slate-900 text-white text-xs
        px-2 py-1 rounded-md
        shadow-lg
      "
    >
      {content}
    </div>
  );
}