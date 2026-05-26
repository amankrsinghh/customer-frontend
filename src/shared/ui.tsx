// Reusable premium UI primitives used across customer + admin.
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

export function Button({
  variant = "rosegold",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "rosegold" | "ink" | "ghost" | "outline";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    rosegold: "btn-rosegold",
    ink: "btn-ink",
    ghost: "text-ink hover:bg-blush/60",
    outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-white",
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Input({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-ink/60">
          {label}
        </span>
      )}
      <input
        className={cn(
          "w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-gold focus:ring-2 focus:ring-rose-gold/20",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function Textarea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-ink/60">
          {label}
        </span>
      )}
      <textarea
        className={cn(
          "w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-gold focus:ring-2 focus:ring-rose-gold/20",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-ink/60">
          {label}
        </span>
      )}
      <select
        className={cn(
          "w-full appearance-none rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-gold focus:ring-2 focus:ring-rose-gold/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({
  children,
  tone = "rose",
}: { children: ReactNode; tone?: "rose" | "ink" | "green" | "amber" | "red" }) {
  const tones: Record<string, string> = {
    rose:  "bg-blush text-rose-gold-dark",
    ink:   "bg-ink/5 text-ink",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red:   "bg-rose-50 text-rose-700",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", tones[tone])}>
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-white shadow-sm ring-1 ring-ink/5", className)}>
      {children}
    </div>
  );
}

/** Tiny toast system (top-right) */
type Toast = { id: number; msg: string; tone: "ok" | "err" };
let toastSetter: ((t: Toast[]) => void) | null = null;
let toastList: Toast[] = [];
export function toast(msg: string, tone: "ok" | "err" = "ok") {
  toastList = [...toastList, { id: Date.now() + Math.random(), msg, tone }];
  toastSetter?.(toastList);
  setTimeout(() => {
    toastList = toastList.slice(1);
    toastSetter?.(toastList);
  }, 3000);
}
export function ToastHost() {
  const [list, setList] = useState<Toast[]>([]);
  useEffect(() => { toastSetter = setList; return () => { toastSetter = null; }; }, []);
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[200] flex flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={cn(
            "fade-in pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg ring-1",
            t.tone === "ok"
              ? "bg-white text-ink ring-rose-gold/20"
              : "bg-rose-50 text-rose-700 ring-rose-200",
          )}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export function Empty({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white/60 px-6 py-16 text-center">
      <div className="mb-3 text-3xl">✦</div>
      <div className="font-serif text-2xl text-ink">{title}</div>
      {subtitle && <p className="mt-1 max-w-md text-sm text-ink/60">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
