import React from "react";
import { render, screen } from "@testing-library/react";
import ProgressRadialChart from "@/components/ProgressRadialChart";

const radialChartSpy = vi.fn();

vi.mock("recharts", () => {
  const React = require("react");

  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    RadialBar: (props: any) => <div data-testid="radial-bar" data-props={JSON.stringify(props)} />,
    RadialBarChart: ({ children, ...props }: any) => {
      radialChartSpy(props);
      return <div data-testid="radial-bar-chart">{children}</div>;
    },
  };
});

describe("ProgressRadialChart", () => {
  beforeEach(() => {
    radialChartSpy.mockClear();
  });

  it("uses the percentage value to compute the chart end angle", () => {
    render(<ProgressRadialChart value={75} />);

    expect(radialChartSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        startAngle: 90,
        endAngle: 360,
      })
    );
  });

  it("shows the icon by default", () => {
    const { container } = render(<ProgressRadialChart value={40} />);

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByTestId("radial-bar-chart")).toBeInTheDocument();
  });

  it("renders the score view when showScore is enabled", () => {
    render(
      <ProgressRadialChart
        value={88}
        showIcon={false}
        showScore
        scoreValue={8.4}
        label="Learning"
        sublabel="Score"
      />
    );

    expect(screen.getByText("Learning")).toBeInTheDocument();
    expect(screen.getByText("8.4")).toBeInTheDocument();
    expect(screen.getByText("Score")).toBeInTheDocument();
  });
});
