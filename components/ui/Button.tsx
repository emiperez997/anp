import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "accent" | "outline-sage" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

/**
 * Variantes:
 * - accent: el botón de llamar. Usar UNA sola vez por pantalla — es el
 *   elemento dominante, no compite con nada más.
 * - outline-sage: acciones secundarias positivas ("Pedir acceso",
 *   "Autorizar").
 * - ghost: acciones terciarias / de salida ("No autorizar", "Cancelar").
 */
export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "accent", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "w-full rounded-2xl py-4 px-4 text-base font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
          {
            "bg-accent text-white": variant === "accent",
            "border border-sage text-sage-dark bg-transparent":
              variant === "outline-sage",
            "text-ink-muted bg-transparent": variant === "ghost",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
