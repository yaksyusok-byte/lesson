import { useEffect, useState } from "react";
/** Keep incomplete keyboard input local; only valid numbers update the document. */
export function NumberInput({
  value,
  min,
  max,
  integer = false,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  integer?: boolean;
  onChange: (v: number) => void;
  label?: string;
}) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => setRaw(String(value)), [value]);
  function commit() {
    const n = raw.trim() === "" ? value : Number(raw);
    const v = Math.min(
      max,
      Math.max(min, Number.isFinite(n) ? (integer ? Math.round(n) : n) : value),
    );
    setRaw(String(v));
    onChange(v);
  }
  return (
    <input
      type="number"
      aria-label={label}
      min={min}
      max={max}
      step={integer ? 1 : 0.5}
      value={raw}
      onChange={(e) => {
        const s = e.target.value;
        setRaw(s);
        const n = Number(s);
        if (
          s !== "" &&
          Number.isFinite(n) &&
          n >= min &&
          n <= max &&
          (!integer || Number.isInteger(n))
        )
          onChange(n);
      }}
      onBlur={commit}
    />
  );
}
