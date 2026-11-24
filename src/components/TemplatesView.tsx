import React, { useState, useMemo } from "react";
import {
  Search,
  Sparkles,
  Eye,
  SlidersHorizontal,
  X,
  ArrowRight,
  Check,
  LayoutTemplate,
  Calendar,
  Layers,
  ChevronDown,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  filterTemplates,
  type TemplateItem,
  type TemplateCategory,
} from "@/lib/templates";
import { SocialFeedPreview, type SocialFeedPlatform } from "@/components/social";

interface TemplatesViewProps {
  businessName: string;
  onSelectTemplate: (template: TemplateItem) => void;
}

const OCCASIONS = [
  "All",
  "Feature Launch",
  "Product Update",
  "Product Drop",
  "Weekend Promo",
  "Holiday Sale",
  "Sports Event",
  "Financing Offer",
  "Testimonial",
  "Food Special",
  "Milestone",
  "Weekly Tips",
  "Case Study",
  "Weekly Inspiration",
  "Contest",
];

export function TemplatesView({ businessName, onSelectTemplate }: TemplatesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("All");
  const [selectedOccasion, setSelectedOccasion] = useState<string>("All");
  const [selectedStyle, setSelectedStyle] = useState<string>("All");
  const [selectedRatio, setSelectedRatio] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"most_used" | "newest" | "title">("most_used");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [previewTab, setPreviewTab] = useState<"poster" | "instagram" | "facebook">("poster");

  const filteredTemplates = useMemo(() => {
    let list = filterTemplates({
      query: searchQuery,
      category: selectedCategory,
      style: selectedStyle,
      aspectRatio: selectedRatio,
    });

    if (selectedOccasion !== "All") {
      list = list.filter((t) => t.occasion?.toLowerCase() === selectedOccasion.toLowerCase());
    }

    if (sortBy === "title") {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [searchQuery, selectedCategory, selectedOccasion, selectedStyle, selectedRatio, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedOccasion !== "All" ||
    selectedStyle !== "All" ||
    selectedRatio !== "All";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedOccasion("All");
    setSelectedStyle("All");
    setSelectedRatio("All");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
            <LayoutTemplate className="h-3.5 w-3.5" />
            INSPIRATION & DESIGN LIBRARY
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-foreground">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore commercial flyer designs crafted for {businessName}. Pick any template to prefill layout, prompt, and style.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/[0.1] bg-card/60 px-3.5 py-1 text-xs font-semibold text-muted-foreground">
            {filteredTemplates.length} designs available
          </span>
        </div>
      </div>

      {/* Search & Filter Controls (Matching Screenshots 8 & 9) */}
      <div className="space-y-3.5 rounded-2xl border border-white/[0.08] bg-card/50 p-4 sm:p-5 backdrop-blur-md shadow-lg shadow-black/20">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search templates (try "diwali offer", "saas", "sale", "cricket", "new arrival")...'
            className="h-11 pl-10 pr-10 text-sm bg-secondary/50 border-white/[0.08] focus:bg-background/90"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Bar with Dropdowns and Dismissible Active Pills (Screenshots 8 & 9) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Occasion Dropdown */}
            <select
              aria-label="Filter by occasion"
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="h-8.5 rounded-xl border border-white/[0.1] bg-secondary/50 px-3 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            >
              <option value="All">Occasion ⌄</option>
              {OCCASIONS.filter((o) => o !== "All").map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory)}
              className="h-8.5 rounded-xl border border-white/[0.1] bg-secondary/50 px-3 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            >
              <option value="All">Category ⌄</option>
              {TEMPLATE_CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Style Dropdown */}
            <select
              aria-label="Filter by style"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="h-8.5 rounded-xl border border-white/[0.1] bg-secondary/50 px-3 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            >
              <option value="All">Style ⌄</option>
              <option value="Bold">Bold</option>
              <option value="Minimal">Minimal</option>
              <option value="Festive">Festive</option>
              <option value="Elegant">Elegant</option>
            </select>

            {/* Size Dropdown */}
            <select
              aria-label="Filter by size"
              value={selectedRatio}
              onChange={(e) => setSelectedRatio(e.target.value)}
              className="h-8.5 rounded-xl border border-white/[0.1] bg-secondary/50 px-3 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            >
              <option value="All">Size ⌄</option>
              <option value="4:5">4:5 · Portrait</option>
              <option value="1:1">1:1 · Square</option>
              <option value="9:16">9:16 · Story</option>
            </select>

            {/* Selected Active Category Tag (Orange dismissible pill matching Screenshot 8 & 9) */}
            {selectedCategory !== "All" && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/15 px-3 py-1.5 text-xs font-semibold text-orange-400 animate-in fade-in">
                {selectedCategory}
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className="hover:text-white"
                  title="Remove category filter"
                >
                  <X className="h-3 w-3 stroke-[2.5]" />
                </button>
              </span>
            )}

            {/* Selected Active Occasion Tag */}
            {selectedOccasion !== "All" && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary animate-in fade-in">
                {selectedOccasion}
                <button
                  type="button"
                  onClick={() => setSelectedOccasion("All")}
                  className="hover:text-white"
                  title="Remove occasion filter"
                >
                  <X className="h-3 w-3 stroke-[2.5]" />
                </button>
              </span>
            )}

            {/* Clear All */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-primary font-semibold hover:underline ml-1"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
            <span>Sort:</span>
            <select
              aria-label="Sort templates"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8.5 rounded-xl border border-white/[0.1] bg-secondary/50 px-3 text-xs text-foreground font-medium focus:outline-none cursor-pointer"
            >
              <option value="most_used">Most used ⌄</option>
              <option value="newest">Newest ⌄</option>
              <option value="title">Alphabetical ⌄</option>
            </select>
          </div>
        </div>

        {/* Quick Category Quick-Select Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.04]">
          {["All", "Offers & sales", "SaaS & software", "New arrival", "Events & invites", "Menu & products", "Customer reviews"].map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat as TemplateCategory)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                  active
                    ? "bg-primary text-white font-semibold shadow-xs"
                    : "border border-white/[0.06] bg-card/40 text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Designs Count Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>{filteredTemplates.length} designs</span>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-card/60 overflow-hidden shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-primary/10"
            >
              {/* Image Preview Container */}
              <div
                className="relative cursor-pointer overflow-hidden bg-black/40 aspect-[4/5]"
                onClick={() => {
                  setPreviewTemplate(template);
                  setPreviewTab("poster");
                }}
              >
                <img
                  src={template.previewUrl}
                  alt={template.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                  <span className="rounded-md border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                    {template.category}
                  </span>
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-950/70 px-2 py-0.5 text-[10px] font-bold text-cyan-300 backdrop-blur-md">
                    {template.aspectRatio}
                  </span>
                </div>

                {/* Bottom Overlay Info on Preview */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  {template.occasion && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                      {template.occasion}
                    </span>
                  )}
                  <p className="text-xs font-semibold text-white line-clamp-1">
                    {template.subtitle}
                  </p>
                </div>

                {/* Eye Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/30 bg-black/70 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md shadow-lg">
                    <Eye className="h-3.5 w-3.5" /> Quick Preview
                  </span>
                </div>
              </div>

              {/* Card Footer Content */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {template.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-9 gap-1.5 text-xs font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white hover:brightness-110 shadow-md shadow-cyan-500/20"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <Sparkles className="h-3.5 w-3.5 stroke-[2.2]" />
                    Use template
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-2.5 text-xs border-white/[0.1] bg-card/60 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setPreviewTemplate(template);
                      setPreviewTab("poster");
                    }}
                    title="Inspect template details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-card/30 py-16 text-center">
          <LayoutTemplate className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold text-foreground">No matching templates found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Try tweaking your search term or clear active filters to browse the full template catalog.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={clearAllFilters}
            className="mt-4 border-white/[0.1] text-xs"
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Full Preview Modal with Social Feed Mockup Tabs */}
      {previewTemplate && (
        <Dialog open={Boolean(previewTemplate)} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto border-white/[0.1] bg-card/95 backdrop-blur-2xl">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-white/20 bg-secondary/70 px-2 py-0.5 text-[10px] font-bold text-foreground">
                    {previewTemplate.category}
                  </span>
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-950/70 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                    {previewTemplate.aspectRatio} · {previewTemplate.format}
                  </span>
                  <span className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Style: {previewTemplate.style}
                  </span>
                </div>

                {/* View Tabs: Poster / Instagram / Facebook */}
                <div className="flex items-center gap-1 rounded-xl border border-white/[0.1] bg-secondary/50 p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("poster")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      previewTab === "poster"
                        ? "bg-primary text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Flyer View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("instagram")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      previewTab === "instagram"
                        ? "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Instagram className="h-3 w-3" /> Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("facebook")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      previewTab === "facebook"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-white text-[8px] font-black text-blue-600">
                      f
                    </span>
                    Facebook
                  </button>
                </div>
              </div>

              <DialogTitle className="font-display text-2xl font-bold mt-2 text-foreground">
                {previewTemplate.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {previewTemplate.description}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-2 my-2">
              {/* Preview Container: either Raw Poster or Social Feed Mockup */}
              <div className="rounded-2xl overflow-hidden border border-white/[0.1] bg-black/60 p-2 flex items-center justify-center min-h-[400px]">
                {previewTab === "poster" ? (
                  <img
                    src={previewTemplate.previewUrl}
                    alt={previewTemplate.title}
                    className="max-h-[460px] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                  />
                ) : (
                  <SocialFeedPreview
                    platform={previewTab === "facebook" ? "Facebook" : "Instagram"}
                    imageUrl={previewTemplate.previewUrl}
                    businessName={businessName}
                    headline={previewTemplate.title}
                    caption={previewTemplate.defaultPrompt}
                    format={previewTemplate.format}
                    showPlatformToggle={false}
                    className="w-full"
                  />
                )}
              </div>

              {/* Template Specs */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Preloaded AI Prompt
                    </span>
                    <p className="mt-1 text-xs text-foreground/90 bg-secondary/40 p-3 rounded-xl border border-white/[0.06] leading-relaxed">
                      {previewTemplate.defaultPrompt}
                    </p>
                  </div>

                  {previewTemplate.wordsOnImage && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Typography on Image
                      </span>
                      <pre className="mt-1 text-xs text-foreground/90 bg-secondary/40 p-3 rounded-xl border border-white/[0.06] whitespace-pre-wrap font-sans">
                        {previewTemplate.wordsOnImage}
                      </pre>
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tags & Occasions
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {previewTemplate.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08]">
                  <Button
                    className="w-full h-11 gap-2 font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white hover:brightness-110 shadow-lg shadow-cyan-500/25"
                    onClick={() => {
                      const t = previewTemplate;
                      setPreviewTemplate(null);
                      onSelectTemplate(t);
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Use this template for {businessName}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
