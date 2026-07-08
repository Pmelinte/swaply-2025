import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_PUBLIC_LOGIN_WALL_PATTERNS,
  containsForbiddenLoginWallCopy,
} from "@/lib/public-pages/loginWallGuards";

describe("public login wall guards", () => {
  it("has a focused list of forbidden blank-wall patterns", () => {
    expect(FORBIDDEN_PUBLIC_LOGIN_WALL_PATTERNS.length).toBeGreaterThanOrEqual(5);
  });

  it("detects hard login walls", () => {
    expect(containsForbiddenLoginWallCopy("Please sign in to continue")).toBe(true);
    expect(containsForbiddenLoginWallCopy("This page requires authentication")).toBe(true);
    expect(containsForbiddenLoginWallCopy("Login required")).toBe(true);
  });

  it("does not reject normal public CTAs that mention login", () => {
    expect(containsForbiddenLoginWallCopy("Create a free account to start swapping when you are ready.")).toBe(false);
    expect(containsForbiddenLoginWallCopy("Log in to send a proposal after previewing the match.")).toBe(false);
  });
});
