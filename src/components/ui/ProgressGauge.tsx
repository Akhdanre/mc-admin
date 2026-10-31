import { cn } from "@/lib/cn";

export interface ProgressGaugeProps {
  value: number; // 0 to 100
  size?: "sm" | "md" | "lg";
  tone?: "auto" | "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
  showPercent?: boolean;
}

export function ProgressGauge({
  value,
  size = "md",
  tone = "auto",
  className,
  showPercent = false,
}: ProgressGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  let barTone = "bg-primary";
  if (tone === "auto") {
    if (clamped >= 90) barTone = "bg-danger";
    else if (clamped >= 75) barTone = "bg-warning";
    else barTone = "bg-emerald-500";
  } else if (tone === "primary") {
    barTone = "bg-primary";
  } else if (tone === "success") {
    barTone = "bg-emerald-500";
  } else if (tone === "warning") {
    barTone = "bg-warning";
  } else if (tone === "danger") {
    barTone = "bg-danger";
  } else if (tone === "info") {
    barTone = "bg-sky-500";
  }

  const heightClass = size === "sm" ? "h-1" : size === "lg" ? "h-2.5" : "h-1.5";

  return (
    <div className={cn("w-full flex items-center gap-2", className)}>
      <div className={cn("flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden", heightClass)}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", barTone)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showPercent && (
        <span className="text-xs font-mono text-muted-foreground w-8 text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
