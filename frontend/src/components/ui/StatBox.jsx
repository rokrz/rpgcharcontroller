import { useState, useEffect, useRef } from "react";

export function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}

export function modStr(score) {
  const m = abilityMod(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

export default function StatBox({ name, value, onChange, className = "" }) {
  const [raw, setRaw] = useState(String(value ?? ""));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setRaw(String(value ?? ""));
  }, [value]);

  const mod = abilityMod(value);
  const sign = mod >= 0 ? "+" : "";

  function handleBlur() {
    focusedRef.current = false;
    const trimmed = raw.trim();
    const n = Number(trimmed);
    if (trimmed !== "" && !isNaN(n)) {
      const clamped = Math.min(30, Math.max(1, n));
      onChange(clamped);
      setRaw(String(clamped));
    } else {
      setRaw(String(value ?? ""));
    }
  }

  return (
    <div className={`flex flex-col items-center gap-0.5 bg-parchment-deep border border-parchment-edge rounded-sheet p-2 min-w-[60px] ${className}`}>
      <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">{name}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={raw}
        onFocus={() => { focusedRef.current = true; }}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={handleBlur}
        className="w-full text-center text-2xl font-display bg-transparent text-ink focus:outline-none focus:border-b focus:border-burgundy tabular-nums"
      />
      <span className="font-display text-sm font-bold text-ink border border-parchment-edge rounded-full w-8 h-8 flex items-center justify-center bg-parchment">
        {sign}{mod}
      </span>
    </div>
  );
}
