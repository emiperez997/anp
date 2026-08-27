import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  emphasis?: boolean; // true para datos que importan en una emergencia (alergias)
  icon?: React.ReactNode;
};

export function Tag({ children, emphasis, icon }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-tag px-2.5 py-1 font-mono text-xs",
        emphasis
          ? "bg-[var(--anp-tag-accent-bg)] text-accent-dark"
          : "bg-[var(--anp-tag-bg)] text-ink"
      )}
    >
      {icon}
      {children}
    </span>
  );
}
