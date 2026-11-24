import { DIYA_SVG_URL, BRAND_NAME, BRAND_SUBTITLE } from "@/lib/branding";

export function DiyaLogo({
  className = "",
  markClassName = "h-7 sm:h-8",
  textClassName = "text-[10.5px] sm:text-[11.5px]",
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
        src={DIYA_SVG_URL}
        alt={BRAND_NAME}
        className={`${markClassName} w-auto object-contain transition-transform duration-200 group-hover:scale-105 active:scale-95 drop-shadow-[0_0_16px_rgba(0,229,255,0.3)]`}
      />
      {subtitle && (
        <span
          className={`mt-1.5 font-black tracking-[0.24em] uppercase bg-gradient-to-r from-violet-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,229,255,0.4)] ${textClassName}`}
        >
          {BRAND_SUBTITLE}
        </span>
      )}
    </div>
  );
}

