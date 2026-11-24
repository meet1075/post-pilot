import { DIYA_LOGO_URL, BRAND_NAME } from "@/lib/branding";

export function DiyaLogo({
  className = "",
  markClassName = "h-8 sm:h-9",
  textClassName = "",
  subtitle = false,
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
      className={`flex items-center ${
        isCenter ? "justify-center" : "justify-start"
      } leading-none select-none group ${className}`}
    >
      <img
        src={DIYA_LOGO_URL}
        alt={BRAND_NAME}
        className={`${markClassName} w-auto object-contain transition-transform duration-200 group-hover:scale-105 active:scale-95 drop-shadow-[0_0_18px_rgba(0,229,255,0.32)]`}
      />
    </div>
  );
}

