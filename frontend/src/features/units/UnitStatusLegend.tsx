import React from "react";

const LEGEND = [
  { label: "Available", color: "bg-emerald-500" },
  { label: "En Route", color: "bg-amber-400" },
  { label: "On Scene", color: "bg-red-500" },
  { label: "Out of Service", color: "bg-slate-500" },
];

export const UnitStatusLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-dark-300">
      {LEGEND.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 ${item.color} rounded-full`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};
