import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Share2,
  Globe,
  Instagram,
  CheckCircle2,
  Smile,
  X,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type SocialFeedPlatform = "Instagram" | "Facebook";

export interface SocialFeedPreviewProps {
  platform?: SocialFeedPlatform | undefined;
  imageUrl: string;
  businessName?: string | undefined;
  handle?: string | undefined;
  caption?: string | undefined;
  headline?: string | undefined;
  logoUrl?: string | null | undefined;
  location?: string | undefined;
  format?: "Square" | "Portrait 4:5" | "Story" | string | undefined;
  showPlatformToggle?: boolean | undefined;
  onPlatformChange?: ((platform: SocialFeedPlatform) => void) | undefined;
  className?: string | undefined;
}

export function SocialFeedPreview({
  platform: initialPlatform = "Instagram",
  imageUrl,
  businessName,
  handle,
  caption,
  headline,
  logoUrl,
  location,
  format = "Portrait 4:5",
  showPlatformToggle = true,
  onPlatformChange,
  className = "",
}: SocialFeedPreviewProps) {
  const [activePlatform, setActivePlatform] = useState<SocialFeedPlatform>(initialPlatform);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(1284);

  // Synchronize activePlatform whenever parent changes the platform prop
  React.useEffect(() => {
    if (initialPlatform) {
      setActivePlatform(initialPlatform);
    }
  }, [initialPlatform]);

  const cleanHandle = (handle || (businessName || "").toLowerCase().replace(/[^a-z0-9._]/g, "") || "brand")
    .replace(/^@/, "");

  const displayLocation = location !== undefined ? location : "Ahmedabad, India";

  const handleToggleLike = () => {
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handlePlatformSelect = (p: SocialFeedPlatform) => {
    setActivePlatform(p);
    onPlatformChange?.(p);
  };

  const aspectClass =
    format === "Square"
      ? "aspect-square"
      : format === "Story"
      ? "aspect-[9/16]"
      : "aspect-[4/5]";

  const fullCaption = [
    headline?.trim(),
    caption?.trim() || "Check out our latest update! Turn ideas into scalable marketing with automated posters and smart scheduling. #Marketing #Growth",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Platform Selector Tabs */}
      {showPlatformToggle && (
        <div className="mb-4 flex items-center gap-1.5 rounded-2xl border border-white/[0.1] bg-card/80 p-1.5 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => handlePlatformSelect("Instagram")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              activePlatform === "Instagram"
                ? "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white shadow-md shadow-pink-500/20"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Instagram className="h-4 w-4" />
            Instagram Feed
          </button>
          <button
            type="button"
            onClick={() => handlePlatformSelect("Facebook")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              activePlatform === "Facebook"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-black text-blue-600">
              f
            </span>
            Facebook Feed
          </button>
        </div>
      )}

      {/* FEED MOCKUP CONTAINER */}
      <div className="w-full max-w-[430px] rounded-3xl border border-white/[0.12] bg-[#0c0f17] text-white shadow-2xl shadow-black/80 overflow-hidden font-sans">
        {/* ─── INSTAGRAM VIEW ────────────────────────────────────────── */}
        {activePlatform === "Instagram" && (
          <div className="flex flex-col">
            {/* Instagram Header */}
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                {/* Story Gradient Ring around Avatar */}
                <div className="h-10 w-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
                  <div className="h-full w-full rounded-full bg-black overflow-hidden flex items-center justify-center border border-black">
                    {logoUrl ? (
                      <img src={logoUrl} alt={businessName || "Brand"} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white uppercase">
                        {(businessName || "AI").slice(0, 2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-xs font-bold tracking-tight text-white hover:underline cursor-pointer">
                      {cleanHandle}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    <span className="text-[11px] font-semibold text-primary cursor-pointer hover:underline">
                      Follow
                    </span>
                  </div>
                  {displayLocation ? (
                    <span className="text-[10px] text-muted-foreground/90 truncate max-w-[190px]">
                      {displayLocation}
                    </span>
                  ) : null}
                </div>
              </div>
              <button type="button" className="text-muted-foreground hover:text-white p-1">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Generated Image in Aspect Ratio */}
            <div className={`relative w-full ${aspectClass} bg-black/60 overflow-hidden flex items-center justify-center group`}>
              <img
                src={imageUrl}
                alt="Instagram post preview"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`transition-transform duration-150 active:scale-125 ${
                    isLiked ? "text-rose-500 fill-rose-500" : "text-white hover:text-rose-400"
                  }`}
                  aria-label="Like"
                >
                  <Heart className={`h-6 w-6 stroke-[1.8] ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
                <button type="button" className="text-white hover:text-muted-foreground" aria-label="Comment">
                  <MessageCircle className="h-6 w-6 stroke-[1.8]" />
                </button>
                <button type="button" className="text-white hover:text-muted-foreground" aria-label="Share">
                  <Send className="h-6 w-6 stroke-[1.8]" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                className={`transition-transform active:scale-125 ${
                  isSaved ? "text-white fill-white" : "text-white hover:text-muted-foreground"
                }`}
                aria-label="Save"
              >
                <Bookmark className={`h-6 w-6 stroke-[1.8] ${isSaved ? "fill-white" : ""}`} />
              </button>
            </div>

            {/* Likes count */}
            <div className="px-3.5 text-xs font-semibold text-white">
              {likeCount.toLocaleString()} likes
            </div>

            {/* Caption Section */}
            <div className="px-3.5 pt-1.5 pb-2 text-xs leading-relaxed">
              <span className="font-bold text-white mr-1.5">{cleanHandle}</span>
              <span className="text-neutral-200 whitespace-pre-wrap">{fullCaption}</span>
            </div>

            {/* Comments & Date */}
            <div className="px-3.5 pb-3.5 space-y-1">
              <p className="text-[11px] text-muted-foreground hover:text-neutral-300 cursor-pointer">
                View all 48 comments
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                2 HOURS AGO · INSTAGRAM FEED PREVIEW
              </p>
            </div>
          </div>
        )}

        {/* ─── FACEBOOK VIEW ─────────────────────────────────────────── */}
        {activePlatform === "Facebook" && (
          <div className="flex flex-col">
            {/* Facebook Header */}
            <div className="flex items-center justify-between p-3.5 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName || "Brand"} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white uppercase">
                      {(businessName || "AI").slice(0, 2)}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white border border-[#0c0f17]">
                    f
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white hover:underline cursor-pointer">
                      {businessName}
                    </span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/20" />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span>Just now</span>
                    <span>·</span>
                    <Globe className="h-3 w-3 stroke-[2]" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <button type="button" className="p-1 hover:text-white rounded-md">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Facebook Post Text (renders ABOVE the image) */}
            <div className="px-3.5 pb-3 text-xs leading-relaxed text-neutral-100 whitespace-pre-wrap">
              {fullCaption}
            </div>

            {/* Generated Image */}
            <div className={`relative w-full ${aspectClass} bg-black/60 overflow-hidden flex items-center justify-center`}>
              <img
                src={imageUrl}
                alt="Facebook post preview"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Engagement Counter Bar */}
            <div className="flex items-center justify-between px-3.5 py-2 text-[11px] text-muted-foreground border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <span className="flex -space-x-1">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] text-white">
                    👍
                  </span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] text-white">
                    ❤️
                  </span>
                </span>
                <span className="text-white font-medium">{likeCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>38 comments</span>
                <span>·</span>
                <span>14 shares</span>
              </div>
            </div>

            {/* Action Buttons (Like / Comment / Share) */}
            <div className="grid grid-cols-3 divide-x divide-white/[0.06] py-1 text-xs font-semibold text-muted-foreground">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex items-center justify-center gap-1.5 py-2 hover:bg-white/[0.04] transition-colors ${
                  isLiked ? "text-blue-500 font-bold" : "text-muted-foreground hover:text-white"
                }`}
              >
                <ThumbsUp className={`h-4 w-4 stroke-[2] ${isLiked ? "fill-blue-500 text-blue-500" : ""}`} />
                Like
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 py-2 hover:bg-white/[0.04] text-muted-foreground hover:text-white transition-colors"
              >
                <MessageCircle className="h-4 w-4 stroke-[2]" />
                Comment
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 py-2 hover:bg-white/[0.04] text-muted-foreground hover:text-white transition-colors"
              >
                <Share2 className="h-4 w-4 stroke-[2]" />
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

