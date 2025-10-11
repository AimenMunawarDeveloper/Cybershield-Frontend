"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface AreaChartProps {
  userRole?: "system_admin" | "client_admin" | "affiliated" | "non_affiliated";
}

const getRoleBasedData = (role: string) => {
  switch (role) {
    case "system_admin":
      return {
        data: [
          { month: "Jan", current: 4200, previous: 3800 },
          { month: "Feb", current: 4800, previous: 4200 },
          { month: "Mar", current: 5200, previous: 4800 },
          { month: "Apr", current: 5800, previous: 5200 },
          { month: "May", current: 6200, previous: 5800 },
          { month: "Jun", current: 6800, previous: 6200 },
          { month: "Jul", current: 7200, previous: 6800 },
          { month: "Aug", current: 7800, previous: 7200 },
          { month: "Sep", current: 8200, previous: 7800 },
          { month: "Oct", current: 8500, previous: 8200 },
          { month: "Nov", current: 8800, previous: 8500 },
          { month: "Dec", current: 8430, previous: 8800 },
        ],
        currentLabel: "Active Users",
        previousLabel: "Previous Year",
        yDomain: [3000, 9000],
        yTicks: [3000, 4000, 5000, 6000, 7000, 8000, 9000],
      };
    case "client_admin":
      return {
        data: [
          { month: "Jan", current: 280, previous: 250 },
          { month: "Feb", current: 310, previous: 280 },
          { month: "Mar", current: 340, previous: 310 },
          { month: "Apr", current: 360, previous: 340 },
          { month: "May", current: 380, previous: 360 },
          { month: "Jun", current: 400, previous: 380 },
          { month: "Jul", current: 420, previous: 400 },
          { month: "Aug", current: 440, previous: 420 },
          { month: "Sep", current: 460, previous: 440 },
          { month: "Oct", current: 480, previous: 460 },
          { month: "Nov", current: 500, previous: 480 },
          { month: "Dec", current: 342, previous: 500 },
        ],
        currentLabel: "Org Users",
        previousLabel: "Previous Year",
        yDomain: [200, 600],
        yTicks: [200, 300, 400, 500, 600],
      };
    case "affiliated":
      return {
        data: [
          { month: "Jan", current: 2, previous: 0 },
          { month: "Feb", current: 4, previous: 2 },
          { month: "Mar", current: 6, previous: 4 },
          { month: "Apr", current: 8, previous: 6 },
          { month: "May", current: 10, previous: 8 },
          { month: "Jun", current: 12, previous: 10 },
          { month: "Jul", current: 14, previous: 12 },
          { month: "Aug", current: 16, previous: 14 },
          { month: "Sep", current: 18, previous: 16 },
          { month: "Oct", current: 20, previous: 18 },
          { month: "Nov", current: 22, previous: 20 },
          { month: "Dec", current: 8, previous: 22 },
        ],
        currentLabel: "Courses Completed",
        previousLabel: "Target",
        yDomain: [0, 25],
        yTicks: [0, 5, 10, 15, 20, 25],
      };
    case "non_affiliated":
      return {
        data: [
          { month: "Jan", current: 0, previous: 0 },
          { month: "Feb", current: 1, previous: 0 },
          { month: "Mar", current: 2, previous: 1 },
          { month: "Apr", current: 3, previous: 2 },
          { month: "May", current: 4, previous: 3 },
          { month: "Jun", current: 5, previous: 4 },
          { month: "Jul", current: 6, previous: 5 },
          { month: "Aug", current: 7, previous: 6 },
          { month: "Sep", current: 8, previous: 7 },
          { month: "Oct", current: 9, previous: 8 },
          { month: "Nov", current: 10, previous: 9 },
          { month: "Dec", current: 3, previous: 10 },
        ],
        currentLabel: "Courses Completed",
        previousLabel: "Target",
        yDomain: [0, 12],
        yTicks: [0, 2, 4, 6, 8, 10, 12],
      };
    default:
      return {
        data: [
          { month: "Jan", current: 0, previous: 0 },
          { month: "Feb", current: 1, previous: 0 },
          { month: "Mar", current: 2, previous: 1 },
          { month: "Apr", current: 3, previous: 2 },
          { month: "May", current: 4, previous: 3 },
          { month: "Jun", current: 5, previous: 4 },
          { month: "Jul", current: 6, previous: 5 },
          { month: "Aug", current: 7, previous: 6 },
          { month: "Sep", current: 8, previous: 7 },
          { month: "Oct", current: 9, previous: 8 },
          { month: "Nov", current: 10, previous: 9 },
          { month: "Dec", current: 3, previous: 10 },
        ],
        currentLabel: "Courses Completed",
        previousLabel: "Target",
        yDomain: [0, 12],
        yTicks: [0, 2, 4, 6, 8, 10, 12],
      };
  }
};

export default function AreaChart({
  userRole = "non_affiliated",
}: AreaChartProps) {
  const { data, currentLabel, previousLabel, yDomain, yTicks } =
    getRoleBasedData(userRole);
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
            <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
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
            domain={yDomain}
            ticks={yTicks}
          />
          <Area
            type="monotone"
            dataKey="current"
            stroke="var(--neon-blue)"
            strokeWidth={2}
            fill="url(#currentGradient)"
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
