import React from "react";
import { render, screen } from "@testing-library/react";
import BarChartCard from "@/components/BarChart";

vi.mock("recharts", () => {
  const React = require("react");

  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    Bar: () => <div data-testid="bar-series" />,
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
  };
});

describe("BarChartCard", () => {
  it("renders the chart shell and summary heading", () => {
    render(<BarChartCard />);

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
  });

  it("renders all metric cards", () => {
    render(<BarChartCard />);

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Clicks")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("Items")).toBeInTheDocument();
  });
});
