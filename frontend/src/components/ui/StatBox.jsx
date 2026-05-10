export function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}

export function modStr(score) {
  const m = abilityMod(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

export default function StatBox({ name, value, onChange, className = "" }) {
  const mod = abilityMod(value);
  const sign = mod >= 0 ? "+" : "";

  return (
    <div className={`flex flex-col items-center gap-0.5 bg-parchment-deep border border-parchment-edge rounded-sheet p-2 min-w-[60px] ${className}`}>
      <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">{name}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.min(30, Math.max(1, Number(e.target.value) || 10)))}
        className="w-full text-center text-2xl font-display bg-transparent text-ink focus:outline-none focus:border-b focus:border-burgundy tabular-nums"
        min={1}
        max={30}
      />
      <span className="font-display text-sm font-bold text-ink border border-parchment-edge rounded-full w-8 h-8 flex items-center justify-center bg-parchment">
        {sign}{mod}
      </span>
    </div>
  );
}
