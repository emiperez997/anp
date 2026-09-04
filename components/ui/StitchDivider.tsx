export function StitchDivider({ className }: { className?: string }) {
  return <div className={`stitch-divider ${className ?? ""}`} aria-hidden="true" />;
}
