"use client";

import React from "react";

type ChartContainerProps = {
  title?: string;
  ariaLabel?: string;
  data?: any[];
  filename?: string;
  children: React.ReactNode;
};

export function ChartContainer({ title, ariaLabel, data, filename = "data.csv", children }: ChartContainerProps) {
  function downloadCSV() {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(","), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section role="region" aria-label={ariaLabel || title || "Chart"} className="mb-8">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}

      <div className="relative">
        <div className="overflow-hidden rounded-md">{children}</div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
        <div>
          <button onClick={downloadCSV} className="underline" aria-label="Download chart data as CSV">
            Download data (CSV)
          </button>
        </div>
        <div className="italic">Tip: use keyboard focus and arrow keys to explore interactive charts.</div>
      </div>
    </section>
  );
}
