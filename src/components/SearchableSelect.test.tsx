import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchableSelect } from "./SearchableSelect";

describe("SearchableSelect Component", () => {
  const mockOptions = [
    { value: "usa", label: "United States", flag: "🇺🇸" },
    { value: "canada", label: "Canada", flag: "🇨🇦" },
    { value: "india", label: "India", flag: "🇮🇳" },
  ];

  it("renders trigger with placeholder when no value is selected", () => {
    render(
      <SearchableSelect
        value=""
        onChange={vi.fn()}
        options={mockOptions}
        placeholder="Choose country"
      />
    );

    expect(screen.getByText("Choose country")).toBeInTheDocument();
  });

  it("renders selected option label and flag", () => {
    render(
      <SearchableSelect
        value="india"
        onChange={vi.fn()}
        options={mockOptions}
      />
    );

    expect(screen.getByText("India")).toBeInTheDocument();
    expect(screen.getByText("🇮🇳")).toBeInTheDocument();
  });

  it("opens dropdown popover on click and shows search input", () => {
    render(
      <SearchableSelect
        value="usa"
        onChange={vi.fn()}
        options={mockOptions}
        searchPlaceholder="Filter countries..."
      />
    );

    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    expect(screen.getByPlaceholderText("Filter countries...")).toBeInTheDocument();
    expect(screen.getByText("Canada")).toBeInTheDocument();
  });

  it("filters options when typing in the search input", () => {
    render(
      <SearchableSelect
        value="usa"
        onChange={vi.fn()}
        options={mockOptions}
        searchPlaceholder="Search country..."
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole("button"));

    // Type in search
    const searchInput = screen.getByPlaceholderText("Search country...");
    fireEvent.change(searchInput, { target: { value: "Can" } });

    // Canada should be visible, India should not be visible in filtered list
    expect(screen.getByText("Canada")).toBeInTheDocument();
    expect(screen.queryByText("India")).not.toBeInTheDocument();
  });

  it("calls onChange with selected value when an option is clicked", () => {
    const handleChange = vi.fn();
    render(
      <SearchableSelect
        value="usa"
        onChange={handleChange}
        options={mockOptions}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    const canadaOption = screen.getByText("Canada");
    fireEvent.click(canadaOption);

    expect(handleChange).toHaveBeenCalledWith("canada");
  });

  it("displays only pincode values when configured with postal codes", () => {
    const pincodeOptions = [
      { value: "all", label: "All Pincodes" },
      { value: "380059", label: "380059" },
      { value: "380054", label: "380054" },
      { value: "380015", label: "380015" },
    ];

    render(
      <SearchableSelect
        value="380059"
        onChange={vi.fn()}
        options={pincodeOptions}
      />
    );

    expect(screen.getByText("380059")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("380054")).toBeInTheDocument();
    expect(screen.getByText("380015")).toBeInTheDocument();
  });
});
