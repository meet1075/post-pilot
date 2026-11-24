import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SocialFeedPreview } from "./SocialFeedPreview";

describe("SocialFeedPreview Component", () => {
  it("renders Instagram feed mockup by default", () => {
    render(
      <SocialFeedPreview
        imageUrl="/showcase/cricket_direction_1.jpg"
        businessName="Avero Innovations"
        headline="Cricket Tournament"
        caption="Match timing 9pm to 1am at Rajpath club"
      />
    );

    expect(screen.getByText("Instagram Feed")).toBeDefined();
    expect(screen.getByText("Facebook Feed")).toBeDefined();
    expect(screen.getAllByText(/averoinnovations/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/INSTAGRAM FEED PREVIEW/i)).toBeDefined();
  });

  it("switches to Facebook feed mockup when selected", () => {
    render(
      <SocialFeedPreview
        imageUrl="/showcase/cricket_direction_1.jpg"
        businessName="Avero Innovations"
        headline="Cricket Tournament"
        caption="Match timing 9pm to 1am at Rajpath club"
      />
    );

    const fbButton = screen.getByRole("button", { name: /Facebook Feed/i });
    fireEvent.click(fbButton);

    expect(screen.getByText("Avero Innovations")).toBeDefined();
    expect(screen.getByRole("button", { name: /^Like/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^Comment/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /^Share/i })).toBeDefined();
  });

  it("handles like toggle interaction", () => {
    render(
      <SocialFeedPreview
        imageUrl="/showcase/cricket_direction_1.jpg"
        businessName="Avero Innovations"
      />
    );

    const likeButton = screen.getByLabelText("Like");
    expect(screen.getByText(/1,284 likes/i)).toBeDefined();

    fireEvent.click(likeButton);
    expect(screen.getByText(/1,285 likes/i)).toBeDefined();
  });

  it("updates view when platform prop changes dynamically", () => {
    const { rerender } = render(
      <SocialFeedPreview
        platform="Facebook"
        imageUrl="/showcase/cricket_direction_1.jpg"
        businessName="Avero Innovations"
        showPlatformToggle={false}
      />
    );

    expect(screen.getByRole("button", { name: /^Like/i })).toBeDefined();

    rerender(
      <SocialFeedPreview
        platform="Instagram"
        imageUrl="/showcase/cricket_direction_1.jpg"
        businessName="Avero Innovations"
        showPlatformToggle={false}
      />
    );

    expect(screen.getByText(/INSTAGRAM FEED PREVIEW/i)).toBeDefined();
  });

  it("renders custom tagged location when provided", () => {
    render(
      <SocialFeedPreview
        imageUrl="/showcase/cricket_direction_1.jpg"
        businessName="Avero Innovations"
        location="Rajpath Club Ground, Ahmedabad"
      />
    );

    expect(screen.getByText("Rajpath Club Ground, Ahmedabad")).toBeDefined();
  });
});
