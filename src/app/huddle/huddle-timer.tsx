"use client";

// A countdown for the huddle's time frame. Client-side only so the clock can tick; it holds no figures of its own beyond
// the minutes it is given, sends nothing and records nothing.

import { useEffect, useState } from "react";

const SECONDS_PER_MINUTE = 60;
const TICK_MS = 1000;

export function HuddleTimer({ minutes, initial }: { minutes: number; initial: string }) {
  const [left, setLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, (l ?? minutes * SECONDS_PER_MINUTE) - 1)), TICK_MS);
    return () => clearInterval(id);
  }, [running, minutes]);

  const seconds = left ?? minutes * SECONDS_PER_MINUTE;
  const text = left === null ? initial : `${String(Math.floor(seconds / SECONDS_PER_MINUTE)).padStart(2, "0")}:${String(seconds % SECONDS_PER_MINUTE).padStart(2, "0")}`;
  return (
    <div className="timer" role="timer" aria-live="off">
      <span className="timer-clock">{text}</span>
      <button type="button" className="secondary" onClick={() => setRunning((r) => !r)}>
        {running ? "Pause" : left === null ? "Start the huddle" : "Resume"}
      </button>
      <button type="button" className="secondary" onClick={() => { setRunning(false); setLeft(null); }}>
        Reset
      </button>
    </div>
  );
}
