const BASE =
  "inline-flex items-center justify-center gap-2 font-display uppercase tracking-wider rounded-sheet transition select-none disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS = {
  primary: "bg-burgundy text-parchment border border-burgundy hover:bg-burgundy-dark",
  ghost: "bg-transparent text-ink border border-parchment-edge hover:bg-parchment-deep",
  danger: "bg-transparent text-burgundy border border-burgundy/40 hover:bg-burgundy/10",
  gold: "bg-gold-wash text-ink border border-gold hover:bg-gold/30",
};

const SIZES = {
  sm: "text-xs px-2.5 py-1",
  md: "text-sm px-4 py-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  type = "button",
  ...rest
}) {
  const cls = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
  return (
    <button type={type} className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
}
