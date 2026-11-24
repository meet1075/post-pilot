import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  subLabel?: string | undefined;
  flag?: string | undefined;
}

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
  id,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected item
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value.toLowerCase() === value.toLowerCase());
  }, [options, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  // Focus search input when popover opens
  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation & escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" && isOpen && filteredOptions.length > 0 && filteredOptions[0]) {
      e.preventDefault();
      onChange(filteredOptions[0].value);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-white/[0.08] bg-background px-2.5 text-xs font-medium text-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          "hover:border-white/20 hover:bg-secondary/40",
          disabled && "cursor-not-allowed opacity-50",
          isOpen && "border-primary ring-1 ring-primary/40",
          className
        )}
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOption ? (
            <>
              {selectedOption.flag && <span className="text-sm">{selectedOption.flag}</span>}
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="text-[10px] text-muted-foreground truncate">({selectedOption.subLabel})</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] rounded-lg border border-white/10 bg-[#12161f] p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95">
          {/* Search Input Box */}
          <div className="relative mb-1 flex items-center border-b border-white/[0.08] px-2 pb-1.5 pt-0.5">
            <Search className="h-3 w-3 shrink-0 text-muted-foreground mr-1.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="h-7 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin scrollbar-thumb-white/10">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-foreground hover:bg-white/[0.08]"
                    )}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {opt.flag && <span className="text-sm">{opt.flag}</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span
                          className={cn(
                            "text-[10px] truncate",
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}
                        >
                          ({opt.subLabel})
                        </span>
                      )}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 ml-1.5" />}
                  </button>
                );
              })
            ) : (
              <div className="py-3 text-center text-[11px] text-muted-foreground">
                No matching results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
