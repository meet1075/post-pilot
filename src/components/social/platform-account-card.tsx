import React from "react";
import { Button } from "@/components/ui/button";
import { SocialPlatformIcon, normalizePlatform } from "./social-platform-icon";

export interface PlatformAccountItem {
  id?: string;
  platform: string;
  handle: string;
  status?: string;
  externalAccountId?: string;
}

interface PlatformAccountCardProps {
  platform: "Instagram" | "Facebook" | "X";
  title: string;
  description: string;
  businessName: string;
  accounts: PlatformAccountItem[];
  onConnectClick: () => void;
  onDisconnectClick: (accountId?: string) => void;
  onReconnectClick?: (accountId?: string) => void;
  isConnecting?: boolean;
}

/**
 * Reusable PlatformAccountCard used in the Accounts management view.
 * Eliminates duplicate JSX across Instagram, Facebook, and other social integrations.
 */
export function PlatformAccountCard({
  platform,
  title,
  description,
  businessName,
  accounts,
  onConnectClick,
  onDisconnectClick,
  onReconnectClick,
  isConnecting = false,
}: PlatformAccountCardProps) {
  const norm = normalizePlatform(platform);
  const isActive = accounts.length > 0;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-card/60 backdrop-blur-xl p-5 shadow-lg shadow-black/20 transition-all hover:border-white/15">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-secondary/40 text-foreground shadow-sm">
            <SocialPlatformIcon platform={norm} size="md" variant="badge" />
          </span>
          <div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>{title}</span>
              {isActive && (
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  {accounts.length > 1 ? `${accounts.length} Active` : "Active"}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <Button
          className="h-10 rounded-xl gap-2 font-medium"
          onClick={onConnectClick}
          disabled={isConnecting}
        >
          <SocialPlatformIcon platform={norm} size="xs" />
          <span>{isActive ? `Add Another ${norm}` : `Connect ${norm}`}</span>
        </Button>
      </div>

      {/* Connected Accounts List */}
      {accounts.length > 0 && (
        <div className="mt-5 space-y-2.5 border-t border-white/[0.08] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Connected {norm} Handles for {businessName}:
          </p>
          <div className="space-y-2">
            {accounts.map((acc) => {
              const isExpired = acc.status === "expired" || acc.status === "failed";
              return (
                <div
                  key={acc.id || acc.handle}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-secondary/30 p-3.5 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      @
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">@{acc.handle}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isExpired ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                          }`}
                        />
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {isExpired ? "Token Expired" : "Connected & Verified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isExpired && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl text-xs text-amber-500 border-amber-500/40 hover:bg-amber-500/10"
                        onClick={() => onReconnectClick?.(acc.id)}
                      >
                        Reconnect
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-xl text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDisconnectClick(acc.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
