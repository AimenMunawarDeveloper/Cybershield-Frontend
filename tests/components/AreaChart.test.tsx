import React from "react";
import { render, screen } from "@testing-library/react";
import AreaChart from "@/components/AreaChart";

const chartSpy = vi.fn();

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (text: string) => text,
  }),
}));

vi.mock("recharts", () => {
  const React = require("react");

  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    XAxis: (props: any) => <div data-testid="x-axis" data-props={JSON.stringify(props)} />,
    YAxis: (props: any) => <div data-testid="y-axis" data-props={JSON.stringify(props)} />,
    Area: (props: any) => <div data-testid={`area-${props.dataKey}`} data-props={JSON.stringify(props)} />,
    AreaChart: ({ data, children, ...props }: any) => {
      chartSpy({ data, ...props });
      return (
        <div data-testid="area-chart" data-length={data.length}>
          {children}
        </div>
      );
    },
  };
});

describe("AreaChart", () => {
  beforeEach(() => {
    chartSpy.mockClear();
  });

  it("renders default static data for the default role", () => {
    render(<AreaChart />);

    expect(screen.getByTestId("area-chart")).toHaveAttribute("data-length", "12");
    expect(chartSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ month: "Jan", current: 0, previous: 0 }),
        ]),
      })
    );
  });

  it("transforms affiliated weekly data into chart series", () => {
    render(
      <AreaChart
        userRole="affiliated"
        data={[
          { week: "Week 1", completions: 2, cumulative: 2 },
          { week: "Week 2", completions: 3, cumulative: 5 },
        ]}
      />
    );

    expect(chartSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          { month: "Week 1", current: 2, previous: 2 },
          { month: "Week 2", current: 3, previous: 5 },
        ],
      })
    );
  });

  it("computes y-axis ticks from the maximum affiliated value", () => {
    render(
      <AreaChart
        userRole="affiliated"
        data={[
          { week: "Week 1", completions: 1, cumulative: 1 },
          { week: "Week 2", completions: 4, cumulative: 7 },
        ]}
      />
    );

    const yAxisProps = JSON.parse(screen.getByTestId("y-axis").getAttribute("data-props") || "{}");
    expect(yAxisProps.domain).toEqual([0, 10]);
    expect(yAxisProps.ticks).toEqual([0, 2, 4, 6, 8, 10]);
  });
});
