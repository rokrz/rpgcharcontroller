const SIZE_CLS = { sm: "text-sm py-0.5", md: "text-base py-1" };

export default function Input({ label, size = "md", className = "", fieldClassName = "", type = "text", ...rest }) {
  const field = (
    <input
      type={type}
      className={`bg-transparent border-0 border-b border-ink/30 px-2 ${SIZE_CLS[size]} text-ink placeholder:text-ink-faded focus:border-burgundy w-full ${fieldClassName}`.trim()}
      {...rest}
    />
  );
  if (!label) return <div className={className}>{field}</div>;
  return (
    <label className={`flex flex-col gap-1 ${className}`.trim()}>
      <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>
      {field}
    </label>
  );
}
