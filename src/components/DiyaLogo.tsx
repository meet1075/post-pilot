import { DIYA_MARK_URL, BRAND_NAME, BRAND_SUBTITLE } from "@/lib/branding";

export function DiyaLogo({
  className = "",
  markClassName = "h-7 sm:h-8",
  textClassName = "text-[9px] sm:text-[10px]",
  subtitle = true,
  align = "center",
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  subtitle?: boolean;
  align?: "left" | "center";
}) {
  const isCenter = align === "center";
  return (
    <div
      className={`flex flex-col ${
        isCenter ? "items-center text-center" : "items-start text-left"
      } leading-none select-none group ${className}`}
    >
      <img
        src={DIYA_MARK_URL}
        alt={BRAND_NAME}
        className={`${markClassName} w-auto object-contain transition-transform duration-200 group-hover:scale-105 active:scale-95 drop-shadow-[0_0_15px_rgba(0,229,255,0.25)]`}
      />
      {subtitle && (
        <span
          className={`mt-1.5 font-extrabold tracking-[0.22em] uppercase bg-gradient-to-r from-violet-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(0,229,255,0.35)] ${textClassName}`}
        >
          {BRAND_SUBTITLE}
        </span>
      )}
    </div>
  );
}

