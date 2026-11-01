import React from "react";
import { Instagram } from "lucide-react";

export type SupportedPlatform = "Instagram" | "Facebook" | "X" | "Twitter" | string;

interface SocialPlatformIconProps {
  platform: SupportedPlatform;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "icon" | "badge" | "pill";
  className?: string;
  showLabel?: boolean;
}

export function normalizePlatform(platform?: string): "Instagram" | "Facebook" | "X" {
  if (!platform) return "Instagram";
  const lower = platform.toLowerCase().trim();
  if (lower === "facebook" || lower === "fb") return "Facebook";
  if (lower === "x" || lower === "twitter") return "X";
  return "Instagram";
}

/**
 * High-fidelity vector Facebook 'f' icon
 */
export function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/**
 * High-fidelity vector X / Twitter icon
 */
export function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * Reusable SocialPlatformIcon with multiple variants
 */
export function SocialPlatformIcon({
  platform,
  size = "sm",
  variant = "icon",
  className = "",
  showLabel = false,
}: SocialPlatformIconProps) {
  const norm = normalizePlatform(platform);

  const sizeClasses = {
    xs: { icon: "h-3 w-3", badge: "h-5 w-5", text: "text-[10px]" },
    sm: { icon: "h-3.5 w-3.5", badge: "h-7 w-7", text: "text-xs" },
    md: { icon: "h-5 w-5", badge: "h-9 w-9", text: "text-sm" },
    lg: { icon: "h-6 w-6", badge: "h-12 w-12", text: "text-base" },
  }[size];

  // Raw icon render
  const renderIcon = () => {
    switch (norm) {
      case "Instagram":
        return <Instagram className={`${sizeClasses.icon} text-rose-500 shrink-0`} />;
      case "Facebook":
        return (
          <span className="text-[#1877F2] shrink-0 inline-flex items-center justify-center">
            <FacebookIcon className={sizeClasses.icon} />
          </span>
        );
      case "X":
        return (
          <span className="text-foreground shrink-0 inline-flex items-center justify-center">
            <XIcon className={sizeClasses.icon} />
          </span>
        );
    }
  };

  if (variant === "icon") {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        {renderIcon()}
        {showLabel && <span className={sizeClasses.text}>{norm}</span>}
      </span>
    );
  }

  if (variant === "badge") {
    let bgStyle = "";
    let innerIcon = null;

    if (norm === "Instagram") {
      bgStyle = "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm";
      innerIcon = <Instagram className={`${sizeClasses.icon} text-white`} />;
    } else if (norm === "Facebook") {
      bgStyle = "bg-[#1877F2] text-white shadow-sm";
      innerIcon = <FacebookIcon className={`${sizeClasses.icon} text-white`} />;
    } else {
      bgStyle = "bg-neutral-900 text-white border border-white/20 shadow-sm";
      innerIcon = <XIcon className={`${sizeClasses.icon} text-white`} />;
    }

    return (
      <span
        className={`inline-flex ${sizeClasses.badge} shrink-0 items-center justify-center rounded-xl ${bgStyle} ${className}`}
        title={norm}
      >
        {innerIcon}
      </span>
    );
  }

  // variant === "pill"
  let pillBorder = "";
  if (norm === "Instagram") {
    pillBorder = "border-rose-500/30 bg-rose-500/10 text-rose-300";
  } else if (norm === "Facebook") {
    pillBorder = "border-blue-500/30 bg-blue-500/10 text-blue-300";
  } else {
    pillBorder = "border-neutral-500/30 bg-neutral-500/10 text-neutral-300";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${pillBorder} ${className}`}
    >
      {renderIcon()}
      <span>{norm}</span>
    </span>
  );
}
