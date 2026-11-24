import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplatesView } from "./TemplatesView";

describe("TemplatesView Component", () => {
  it("renders header, search bar, and templates list", () => {
    const handleSelect = vi.fn();
    render(<TemplatesView businessName="Avero Innovations" onSelectTemplate={handleSelect} />);

    expect(screen.getByText("Templates")).toBeDefined();
    expect(screen.getByPlaceholderText(/Search templates/i)).toBeDefined();
    expect(screen.getByText(/designs available/i)).toBeDefined();
  });

  it("filters templates by search term", () => {
    const handleSelect = vi.fn();
    render(<TemplatesView businessName="Avero Innovations" onSelectTemplate={handleSelect} />);

    const searchInput = screen.getByPlaceholderText(/Search templates/i);
    fireEvent.change(searchInput, { target: { value: "cricket" } });

    expect(screen.getByText("Corporate Cricket Championship")).toBeDefined();
  });

  it("triggers onSelectTemplate when clicking Use template", () => {
    const handleSelect = vi.fn();
    render(<TemplatesView businessName="Avero Innovations" onSelectTemplate={handleSelect} />);

    const useButtons = screen.getAllByRole("button", { name: /Use template/i });
    expect(useButtons.length).toBeGreaterThan(0);
    fireEvent.click(useButtons[0]!);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
  });

  it("opens quick preview modal with Instagram and Facebook feed view tabs", () => {
    const handleSelect = vi.fn();
    render(<TemplatesView businessName="Avero Innovations" onSelectTemplate={handleSelect} />);

    // Click on the first preview button
    const previewButtons = screen.getAllByTitle(/Inspect template details/i);
    expect(previewButtons.length).toBeGreaterThan(0);
    fireEvent.click(previewButtons[0]!);

    // Should display Flyer View, Instagram, and Facebook tabs
    expect(screen.getByRole("button", { name: /Flyer View/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Instagram/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Facebook/i })).toBeDefined();

    // Switch to Instagram view
    fireEvent.click(screen.getByRole("button", { name: /Instagram/i }));
    expect(screen.getAllByText(/averoinnovations/i).length).toBeGreaterThanOrEqual(1);

    // Switch to Facebook view
    fireEvent.click(screen.getByRole("button", { name: /Facebook/i }));
    expect(screen.getAllByText(/Like/i).length).toBeGreaterThanOrEqual(1);
  });
});

