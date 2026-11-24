import { describe, it, expect } from "vitest";
import { prisma, getPrisma } from "./prisma";

describe("Prisma ORM Client", () => {
  it("exports a valid Prisma client singleton instance", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe("object");
    expect(getPrisma()).toBe(prisma);
  });

  it("registers all required schema models on the client", () => {
    // Workspace & core models
    expect(prisma.user).toBeDefined();
    expect(typeof prisma.user.findMany).toBe("function");

    expect(prisma.business).toBeDefined();
    expect(typeof prisma.business.findMany).toBe("function");

    expect(prisma.brandKit).toBeDefined();
    expect(typeof prisma.brandKit.findMany).toBe("function");

    // Social accounts
    expect(prisma.socialAccount).toBeDefined();
    expect(typeof prisma.socialAccount.findMany).toBe("function");

    expect(prisma.connectedAccount).toBeDefined();
    expect(typeof prisma.connectedAccount.findMany).toBe("function");

    // Posts & poster generation
    expect(prisma.post).toBeDefined();
    expect(typeof prisma.post.findMany).toBe("function");

    expect(prisma.posterGeneration).toBeDefined();
    expect(typeof prisma.posterGeneration.findMany).toBe("function");

    expect(prisma.captionSuggestion).toBeDefined();
    expect(typeof prisma.captionSuggestion.findMany).toBe("function");

    // Logs & auth
    expect(prisma.auditLog).toBeDefined();
    expect(typeof prisma.auditLog.findMany).toBe("function");

    expect(prisma.apiLog).toBeDefined();
    expect(typeof prisma.apiLog.findMany).toBe("function");

    expect(prisma.betterUser).toBeDefined();
    expect(typeof prisma.betterUser.findMany).toBe("function");
  });
});

