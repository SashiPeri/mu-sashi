type PremiumButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function PremiumButton({
  variant = "primary",
  className = "",
  children,
  type,
  ...props
}: PremiumButtonProps) {
  const base =
    "w-full rounded-2xl px-4 py-3 text-sm font-semibold tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "border border-amber-200/30 bg-gradient-to-r from-amber-100 to-zinc-100 text-zinc-950 hover:from-white hover:to-amber-50"
      : "border border-zinc-700 bg-zinc-950/60 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100";

  const rest = props;
  return (
    <button type={type ?? "button"} className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
