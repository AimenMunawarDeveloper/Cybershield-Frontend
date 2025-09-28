"use client";

interface ArcProps {
  value: number;
  maxValue?: number;
}

export default function Arc({
  value,
  maxValue = 100,
}: ArcProps) {
  const percentage = (value / maxValue) * 100;
  const startAngle = 180;
  const endAngle = 180 - percentage * 1.8; // 180 degrees for 100%

  // SVG path for the progress arc
  const radius = 60;
  const strokeWidth = 12;
  const centerX = 80;
  const centerY = 80;

  // Calculate coordinates for the arc
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;

  const x1 = centerX + radius * Math.cos(startAngleRad);
  const y1 = centerY + radius * Math.sin(startAngleRad);
  const x2 = centerX + radius * Math.cos(endAngleRad);
  const y2 = centerY + radius * Math.sin(endAngleRad);

  // Large arc flag (1 if arc should be greater than 180 degrees)
  const largeArcFlag = percentage > 50 ? 1 : 0;

  const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        className="transform -rotate-90"
      >
        {/* Define gradient */}
        <defs>
          <linearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="var(--neon-blue)" />
            <stop offset="100%" stopColor="var(--navy-blue-lighter)" />
          </linearGradient>
        </defs>

        {/* Background semi-circle */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${
            centerX + radius
          } ${centerY}`}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress arc with gradient */}
        <path
          d={pathData}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
