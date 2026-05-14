import { useState, useEffect, useRef } from "react";

const SIZE_CLS = { sm: "text-sm py-0.5", md: "text-base py-1" };

export default function Input({ label, size = "md", className = "", fieldClassName = "", type = "text", value, onChange, onBlur, onFocus, ...rest }) {
  const isNum = type === "number";
  const [raw, setRaw] = useState(isNum ? String(value ?? "") : "");
  const focusedRef = useRef(false);

  useEffect(() => {
    if (isNum && !focusedRef.current) setRaw(String(value ?? ""));
  }, [isNum, value]);

  function handleChange(e) {
    if (isNum) {
      setRaw(e.target.value);
    } else {
      onChange?.(e);
    }
  }

  function handleFocus(e) {
    focusedRef.current = true;
    onFocus?.(e);
  }

  function handleBlur(e) {
    focusedRef.current = false;
    if (isNum) {
      const trimmed = raw.trim();
      const n = Number(trimmed);
      if (trimmed !== "" && !isNaN(n)) {
        onChange?.({ target: { value: n } });
        setRaw(String(n));
      } else {
        setRaw(String(value ?? ""));
      }
    }
    onBlur?.(e);
  }

  const field = (
    <input
      type={isNum ? "text" : type}
      inputMode={isNum ? "numeric" : undefined}
      pattern={isNum ? "-?[0-9]*" : undefined}
      className={`bg-transparent border-0 border-b border-ink/30 px-2 ${SIZE_CLS[size]} text-ink placeholder:text-ink-faded focus:border-burgundy w-full ${fieldClassName}`.trim()}
      value={isNum ? raw : value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
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
