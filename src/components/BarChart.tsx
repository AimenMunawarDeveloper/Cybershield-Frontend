"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Users, MousePointer, ShoppingCart, Wrench } from "lucide-react";

const chartData = [
  { name: "1", value: 320 },
  { name: "2", value: 230 },
  { name: "3", value: 120 },
  { name: "4", value: 290 },
  { name: "5", value: 490 },
  { name: "6", value: 390 },
  { name: "7", value: 470 },
  { name: "8", value: 290 },
  { name: "9", value: 170 },
  { name: "10", value: 170 },
];

const metrics = [
  {
    icon: Users,
    label: "Users",
    value: "32,984",
    color: "var(--neon-blue)",
  },
  {
    icon: MousePointer,
    label: "Clicks",
    value: "2,42m",
    color: "var(--neon-blue)",
  },
  {
    icon: ShoppingCart,
    label: "Sales",
    value: "2,400$",
    color: "var(--neon-blue)",
  },
  {
    icon: Wrench,
    label: "Items",
    value: "320",
    color: "var(--neon-blue)",
  },
];

export default function BarChartCard() {
  return (
    <div className="dashboard-card rounded-lg p-6 relative overflow-hidden">
      {/* Bar Chart Section */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 40,
              left: 20,
              bottom: 5,
            }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "transparent", fontSize: 0 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--medium-grey)", fontSize: 12 }}
              domain={[0, 500]}
              ticks={[0, 100, 200, 300, 400, 500]}
            />
            <Bar
              dataKey="value"
              fill="white"
              radius={[8, 8, 0, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Active Users Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-white mb-1">Active Users</h3>
        <p className="text-sm">
          <span className="text-[var(--success-green)]">(+23)</span>
          <span className="text-[var(--medium-grey)]"> than last week</span>
        </p>
      </div>

      {/* Metrics Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="flex flex-col items-center">
              <div className="w-8 h-8 mb-2 flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-white mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-white mb-2">
                {metric.value}
              </p>
              <div
                className="w-8 h-1 rounded-full"
                style={{ backgroundColor: metric.color }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
