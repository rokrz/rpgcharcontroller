const TONE_CLS = {
  buff:    "bg-cond-buff/15 text-cond-buff border-cond-buff/30",
  neutral: "bg-cond-neutral/15 text-cond-neutral border-cond-neutral/30",
  debuff:  "bg-cond-debuff/15 text-cond-debuff border-cond-debuff/30",
  magic:   "bg-cond-magic/15 text-cond-magic border-cond-magic/30",
  burn:    "bg-cond-burn/15 text-cond-burn border-cond-burn/30",
};

export default function Badge({ tone = "neutral", children, onClick, className = "", ...rest }) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-serif border rounded-full transition";
  const toneCls = TONE_CLS[tone] ?? TONE_CLS.neutral;
  const interactive = onClick ? "cursor-pointer hover:brightness-95" : "";
  return (
    <span onClick={onClick} className={`${base} ${toneCls} ${interactive} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
}
