"use client";

import { useRef, useState } from "react";

type RepCoreButtonProps = {
  onComplete: () => void | Promise<void>;
  disabled?: boolean;
};

export default function RepCoreButton({
  onComplete,
  disabled = false,
}: RepCoreButtonProps) {
  const HOLD_DURATION = 2000; // 2 seconds

  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  // -------------------------
  // SOUND
  // -------------------------

  const playSuccessSound = () => {
    try {
      const audio = new Audio("/sounds/rep-success.mp3");
      audio.volume = 0.5;
      audio.play();
    } catch {}
  };

  // -------------------------
  // TEXT
  // -------------------------

  const getText = () => {
    if (!holding) return "+ REP";

    if (progress < 0.25) return "Focus";

    if (progress < 0.5) return "Commit";

    if (progress < 0.8) return "Lock In";

    if (progress < 1) return "Execute";

    return "Complete";
  };

  // -------------------------
  // HOLD START
  // -------------------------

  const startHold = () => {
    if (disabled) return;

    setHolding(true);
    setProgress(0);

    const startedAt = Date.now();

    intervalRef.current = setInterval(async () => {
      const elapsed = Date.now() - startedAt;

      const pct = Math.min(
        elapsed / HOLD_DURATION,
        1
      );

      setProgress(pct);

      if (pct >= 1) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        playSuccessSound();

        await onComplete();

        setHolding(false);
        setProgress(0);
      }
    }, 16);
  };

  // -------------------------
  // HOLD CANCEL
  // -------------------------

  const cancelHold = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setHolding(false);
    setProgress(0);
  };

  // -------------------------
  // UI
  // -------------------------

  return (
    <button
      disabled={disabled}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      className="relative select-none touch-manipulation"
      style={{
        width: 150,
        height: 150,
        borderRadius: "9999px",
        background: "white",
        color: "black",
        fontWeight: 700,
        transition: "all 0.05s linear",

        transform: `scale(${1 - progress * 0.08})`,

        boxShadow:
          progress > 0
            ? `0 0 ${progress * 40}px rgba(99,102,241,0.75)`
            : "0 0 0px rgba(99,102,241,0)",
      }}
    >
      {/* Background Ring */}

      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
      >
        <circle
          cx="75"
          cy="75"
          r={radius}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="6"
          fill="none"
        />

        <circle
          cx="75"
          cy="75"
          r={radius}
          stroke="black"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={
            circumference -
            progress * circumference
          }
          style={{
            transition:
              "stroke-dashoffset 0.016s linear",
          }}
        />
      </svg>

      {/* Center Text */}

      <span
        className="relative z-10"
        style={{
          fontSize: 14,
          letterSpacing: "0.05em",
        }}
      >
        {getText()}
      </span>
    </button>
  );
}