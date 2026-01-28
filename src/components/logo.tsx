export function Logo({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="156 156 190 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
          <feOffset dx="4" dy="6" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform="translate(106, 106) scale(1.0)">
        <path
          d="M 50 160 L 100 120 L 120 170 L 70 210 Z"
          fill="#BFA2D6"
        />
        <path
          d="M 150 120 L 190 220 L 140 220 L 120 170 Z"
          fill="#654EA3"
        />
        <path
          d="M 150 50 L 240 260 L 190 260 L 150 150 L 110 260 L 60 260 Z"
          fill="#FFFFFF"
          filter="url(#dropShadow)"
        />
      </g>
    </svg>
  );
}
