import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const OtpInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="000000"
      className="w-full rounded-2xl border border-line bg-white px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] text-ink placeholder:text-muted outline-none focus:border-accent"
      {...props}
    />
  );
});
OtpInput.displayName = "OtpInput";
