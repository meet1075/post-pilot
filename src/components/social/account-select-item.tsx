import React from "react";
import { Check } from "lucide-react";
import { SocialPlatformIcon, normalizePlatform } from "./social-platform-icon";

export interface AccountSelectItemData {
  id?: string;
  platform: string;
  handle: string;
  status?: string;
  externalAccountId?: string;
}

interface AccountSelectItemProps {
  account: AccountSelectItemData;
  isSelected: boolean;
  onToggle: () => void;
  layout?: "pill" | "card";
  disabled?: boolean;
}

/**
 * Reusable AccountSelectItem for selecting target accounts in CreateFlow & other posting views.
 * Supports compact "pill" layout (Step 1) and full "card" layout (Step 3).
 */
export function AccountSelectItem({
  account,
  isSelected,
  onToggle,
  layout = "pill",
  disabled = false,
}: AccountSelectItemProps) {
  const normPlatform = normalizePlatform(account.platform);
  const isExpired = account.status === "expired" || account.status === "failed";

  if (layout === "pill") {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={isSelected}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
          isSelected
            ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/40 shadow-xs"
            : "border-white/[0.08] bg-background/80 text-muted-foreground hover:border-primary/40 hover:text-foreground"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
            isSelected
              ? "border-primary bg-primary text-white"
              : "border-muted-foreground/40"
          }`}
        >
          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
        </div>
        <span className="flex items-center gap-1.5">
          <SocialPlatformIcon platform={normPlatform} size="xs" />
          <span className="font-medium">@{account.handle}</span>
        </span>
        <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
          {normPlatform}
        </span>
      </button>
    );
  }

  // layout === "card"
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isSelected}
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
        isSelected
          ? "border-primary bg-primary/15 shadow-sm ring-1 ring-primary/40 font-semibold"
          : "border-white/[0.08] bg-secondary/30 hover:border-primary/40 text-muted-foreground hover:text-foreground"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
            isSelected
              ? "border-primary bg-primary text-white"
              : "border-muted-foreground/40"
          }`}
        >
          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
            <SocialPlatformIcon platform={normPlatform} size="xs" />
            <span className="truncate">@{account.handle}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              {normPlatform}
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground">
              {isExpired ? "Token expired" : "Connected & Ready"}
            </span>
          </div>
        </div>
      </div>
      <div className="ml-2 shrink-0">
        <span
          className={`h-2 w-2 rounded-full inline-block ${
            isExpired ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
          }`}
        />
      </div>
    </button>
  );
}
