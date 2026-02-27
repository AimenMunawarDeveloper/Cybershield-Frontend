"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

interface ProgressRadialChartProps {
  value: number;
  size?: number;
  showIcon?: boolean;
  showScore?: boolean;
  scoreValue?: number;
}

export default function ProgressRadialChart({
  value,
  size = 120,
  showIcon = true,
  showScore = false,
  scoreValue = 0,
}: ProgressRadialChartProps) {
  // Calculate the end angle based on the percentage value
  // 0% = 90°, 100% = 450° (full circle)
  const endAngle = 90 + value * 3.6; // 3.6 degrees per 1%

  const data = [
    {
      value: 100, // Always 100 for the data, we control the arc with endAngle
      fill: "url(#progressGradient)",
    },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          startAngle={90}
          endAngle={endAngle}
          data={data}
        >
          <defs>
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="var(--electric-blue)" stopOpacity={1} />
              <stop offset="50%" stopColor="var(--medium-blue)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--dark-blue)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            fill="url(#progressGradient)"
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center content */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        {showIcon ? (
          <div className="w-12 h-12 bg-[var(--neon-blue)] rounded-full flex items-center justify-center border-2 border-[var(--white)]">
            <svg
              className="w-6 h-6 text-[var(--white)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        ) : showScore ? (
          <div className="text-center">
            <p className="text-xs text-[var(--medium-grey)] mb-1">Awareness</p>
            <p className="text-lg font-bold text-foreground">
              {scoreValue.toFixed(1)}
            </p>
            <p className="text-xs text-[var(--medium-grey)]">Score</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
