import React from 'react';

/**
 * Renders the custom right-panel flat-vector illustration for the Coffee Ninja Sign-In split card.
 * Combines the bold-outlined neo-geometric aesthetic from the reference design (dot-matrix grid,
 * flying paper plane, inquiry envelope, stars, and plus markers) with Coffee Ninja's identity
 * (steaming espresso cup with ninja headband & shuriken emblem).
 *
 * @returns Responsive SVG illustration panel element.
 */
export function CoffeeNinjaIllustration(): React.JSX.Element {
  return (
    <div className="relative flex h-full min-h-[380px] w-full flex-col items-center justify-center overflow-hidden bg-[#72d6be] p-8 transition-colors duration-200 dark:bg-[#133b35] lg:min-h-[600px]">
      {/* Decorative Vector Canvas */}
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Coffee Ninja customer inquiry workflow illustration"
        className="h-full max-h-[430px] w-full max-w-[430px] select-none"
      >
        {/* Top-left small plus & star (matches reference composition) */}
        <g stroke="#1e2422" strokeWidth="2.5" strokeLinecap="round">
          <line x1="48" y1="62" x2="58" y2="62" />
          <line x1="53" y1="57" x2="53" y2="67" />
        </g>
        <polygon
          points="45,92 48,99 56,99 50,104 52,111 45,107 38,111 40,104 34,99 42,99"
          fill="#ffffff"
        />

        {/* Upper-center plus sign */}
        <g stroke="#1e2422" strokeWidth="3.2" strokeLinecap="round">
          <line x1="215" y1="115" x2="229" y2="115" />
          <line x1="222" y1="108" x2="222" y2="122" />
        </g>

        {/* Upper-right star */}
        <polygon
          points="432,88 436,97 446,98 438,104 441,114 432,109 423,114 426,104 418,98 428,97"
          fill="#ffffff"
        />

        {/* Middle-right plus sign */}
        <g stroke="#1e2422" strokeWidth="3.2" strokeLinecap="round">
          <line x1="406" y1="304" x2="420" y2="304" />
          <line x1="413" y1="297" x2="413" y2="311" />
        </g>

        {/* Lower-right white star */}
        <polygon
          points="358,365 362,374 372,375 364,381 367,391 358,386 349,391 352,381 344,375 354,374"
          fill="#ffffff"
        />

        {/* Bottom-right warm golden crema circle */}
        <circle cx="445" cy="442" r="18" fill="#f5d142" />

        {/* Bottom-left small white star */}
        <polygon
          points="66,462 68,467 74,468 70,471 71,477 66,474 61,477 62,471 58,468 64,467"
          fill="#ffffff"
        />

        {/* Bottom-left 12x6 Dot Matrix Grid */}
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 12 }).map((__, col) => (
            <circle
              key={`dot-${row}-${col}`}
              cx={84 + col * 10}
              cy={385 + row * 9}
              r="1.8"
              fill="#1e2422"
            />
          ))
        )}

        {/* Small Customer/Staff Avatar Badge (upper-left of envelope) */}
        <g>
          <circle
            cx="162"
            cy="202"
            r="9"
            fill="#fae588"
            stroke="#1e2422"
            strokeWidth="3.2"
          />
          <path
            d="M148 228 C148 216, 176 216, 176 228 L176 234 L148 234 Z"
            fill="#f5d142"
            stroke="#1e2422"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
        </g>

        {/* Flying Paper Plane (Fast Inquiry Dispatch/Resolution - upper-right) */}
        <g>
          {/* Motion dashes */}
          <line
            x1="316"
            y1="176"
            x2="332"
            y2="160"
            stroke="#1e2422"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="331"
            y1="192"
            x2="344"
            y2="179"
            stroke="#1e2422"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="347"
            y1="196"
            x2="355"
            y2="188"
            stroke="#1e2422"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Main Coral/Rose Paper Plane */}
          <polygon
            points="398,118 326,144 354,158 374,190"
            fill="#ef6c86"
            stroke="#1e2422"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <line
            x1="398"
            y1="118"
            x2="354"
            y2="158"
            stroke="#1e2422"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>

        {/* Centerpiece: Open Customer Inquiry Envelope + Coffee Ninja Cup Emblem */}
        <g>
          {/* Open Envelope Back Flap (Warm Gold) */}
          <path
            d="M168 250 L242 190 Q252 182 262 190 L336 250 L336 352 L168 352 Z"
            fill="#f5d142"
            stroke="#1e2422"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />

          {/* Inquiry Card + Coffee Ninja Cup rising inside Envelope */}
          <rect
            x="192"
            y="212"
            width="120"
            height="108"
            rx="8"
            fill="#fffdf7"
            stroke="#1e2422"
            strokeWidth="3.4"
          />

          {/* Aromatic Coffee Steam Wisps above the Cup */}
          <path
            d="M238 176 Q233 168 239 160"
            stroke="#1e2422"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M252 173 Q247 164 253 155"
            stroke="#1e2422"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M266 176 Q261 168 267 160"
            stroke="#1e2422"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Mini Coffee Ninja Takeaway Cup Badge inside the Inquiry Card */}
          <g>
            {/* Cup lid */}
            <rect
              x="228"
              y="224"
              width="48"
              height="8"
              rx="3"
              fill="#563420"
              stroke="#1e2422"
              strokeWidth="2.8"
            />
            {/* Cup body */}
            <polygon
              points="232,232 272,232 267,274 237,274"
              fill="#eaddd7"
              stroke="#1e2422"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            {/* Ninja Headband Sleeve across the cup */}
            <polygon
              points="234,244 270,244 268,260 236,260"
              fill="#1e2422"
            />
            {/* Ninja headband tails */}
            <path
              d="M270 248 L283 243 M269 254 L282 256"
              stroke="#1e2422"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* Tiny Golden Ninja Star / Coffee Bean in center of headband */}
            <polygon
              points="252,247 254,250 258,252 254,254 252,257 250,254 246,252 250,250"
              fill="#f5d142"
            />
          </g>

          {/* Inquiry Text Lines below cup */}
          <line
            x1="216"
            y1="286"
            x2="288"
            y2="286"
            stroke="#1e2422"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <line
            x1="226"
            y1="296"
            x2="278"
            y2="296"
            stroke="#72d6be"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Envelope Left & Right Inner Fold Triangles (Soft Cream-Yellow) */}
          <polygon
            points="168,250 252,312 168,352"
            fill="#fae89c"
            stroke="#1e2422"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          <polygon
            points="336,250 252,312 336,352"
            fill="#fae89c"
            stroke="#1e2422"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />

          {/* Envelope Bottom Front Flap (Rich Gold) */}
          <path
            d="M168 352 L242 298 Q252 291 262 298 L336 352 Z"
            fill="#f5d142"
            stroke="#1e2422"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* Subtle Brand Caption Pill */}
      <div className="mt-2 rounded-full bg-black/10 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-stone-900 backdrop-blur-sm dark:bg-white/10 dark:text-zinc-100">
        Brewed for clarity • Every customer inquiry tracked end-to-end
      </div>
    </div>
  );
}

