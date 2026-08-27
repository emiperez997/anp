import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const PhoneInput = forwardRef<HTMLInputElement, Props>(
  (props, ref) => {
    return (
      <input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="11 2345 6789"
        className="w-full rounded-2xl border border-line bg-white px-4 py-4 text-base text-ink placeholder:text-muted outline-none focus:border-accent"
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";
