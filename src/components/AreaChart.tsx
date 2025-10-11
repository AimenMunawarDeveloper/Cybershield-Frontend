"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", sales: 500, previous: 200 },
  { month: "Feb", sales: 180, previous: 150 },
  { month: "Mar", sales: 280, previous: 180 },
  { month: "Apr", sales: 350, previous: 250 },
  { month: "May", sales: 420, previous: 240 },
  { month: "Jun", sales: 450, previous: 220 },
  { month: "Jul", sales: 380, previous: 200 },
  { month: "Aug", sales: 320, previous: 180 },
  { month: "Sep", sales: 280, previous: 160 },
  { month: "Oct", sales: 250, previous: 100 },
  { month: "Nov", sales: 320, previous: 120 },
  { month: "Dec", sales: 400, previous: 140 },
];

export default function AreaChart() {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--neon-blue)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--neon-blue)"
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--electric-blue)"
                stopOpacity={0.6}
              />
              <stop
                offset="95%"
                stopColor="var(--electric-blue)"
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--medium-grey)", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--medium-grey)", fontSize: 12 }}
            domain={[0, 500]}
            ticks={[0, 100, 200, 300, 400, 500]}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="var(--neon-blue)"
            strokeWidth={2}
            fill="url(#salesGradient)"
          />
          <Area
            type="monotone"
            dataKey="previous"
            stroke="var(--electric-blue)"
            strokeWidth={2}
            fill="url(#previousGradient)"
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
