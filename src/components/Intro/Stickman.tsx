import React from 'react';

interface StickmanProps {
  isWalking: boolean;
  isCelebrating?: boolean;
  className?: string;
}

export const Stickman: React.FC<StickmanProps> = ({
  isWalking,
  isCelebrating = false,
  className = '',
}) => {
  return (
    <div
      className={`stickman-container ${isWalking ? 'stickman-walking' : ''} ${
        isCelebrating ? 'stickman-celebrating' : ''
      } ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 60 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {/* Head with hand-drawn warmth */}
        <circle
          cx="30"
          cy="15"
          r="9.5"
          stroke="#171717"
          strokeWidth="2.5"
          fill="#FAF9F6"
        />

        {/* Torso / Body */}
        <line
          x1="30"
          y1="25"
          x2="30"
          y2="54"
          stroke="#171717"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Arms */}
        {isCelebrating ? (
          <>
            {/* Left arm raised in quiet triumph */}
            <line
              x1="30"
              y1="32"
              x2="16"
              y2="16"
              stroke="#171717"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="stickman-arm-celebrate-left"
            />
            {/* Right arm raised in quiet triumph */}
            <line
              x1="30"
              y1="32"
              x2="44"
              y2="16"
              stroke="#171717"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="stickman-arm-celebrate-right"
            />
          </>
        ) : (
          <>
            {/* Left arm */}
            <line
              x1="30"
              y1="32"
              x2="15"
              y2="46"
              stroke="#171717"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="stickman-left-arm"
            />
            {/* Right arm */}
            <line
              x1="30"
              y1="32"
              x2="45"
              y2="46"
              stroke="#171717"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="stickman-right-arm"
            />
          </>
        )}

        {/* Left leg */}
        <line
          x1="30"
          y1="54"
          x2="18"
          y2="82"
          stroke="#171717"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stickman-left-leg"
        />

        {/* Right leg */}
        <line
          x1="30"
          y1="54"
          x2="42"
          y2="82"
          stroke="#171717"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stickman-right-leg"
        />
      </svg>
    </div>
  );
};

