import { hpStatus } from "../../utils/hpStatus";

const FILL_CLS = { healthy: "bg-hp-healthy", wounded: "bg-hp-wounded", critical: "bg-hp-critical" };
const TEXT_CLS = { healthy: "text-hp-healthy", wounded: "text-hp-wounded", critical: "text-hp-critical" };

export default function HPBar({ current, max }) {
  const safeMax = Math.max(0, Number(max) || 0);
  const safeCurrent = Math.max(0, Math.min(Number(current) || 0, safeMax));
  const pct = safeMax > 0 ? (safeCurrent / safeMax) * 100 : 0;
  const status = hpStatus(safeCurrent, safeMax);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted shrink-0">HP</span>
      <div className="flex-1 h-2 bg-parchment border border-parchment-edge rounded-sheet overflow-hidden min-w-[40px]">
        <div className={`h-full ${FILL_CLS[status]} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`tabular-nums text-xs shrink-0 ${TEXT_CLS[status]}`}>{safeCurrent}/{safeMax}</span>
    </div>
  );
}
