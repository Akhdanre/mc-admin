import { cn } from "@/lib/cn";

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
  badge?: number | string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 bg-surface-raised p-0.5 rounded-lg border border-border/80 select-none",
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative inline-flex items-center gap-1.5 font-medium rounded-md transition-all",
              size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
              isSelected
                ? "bg-surface text-heading shadow-xs font-semibold"
                : "text-muted-foreground hover:text-heading hover:bg-surface/50"
            )}
          >
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight",
                  isSelected
                    ? "bg-primary/10 text-primary-muted font-bold"
                    : "bg-surface border border-border text-subtle-foreground"
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
