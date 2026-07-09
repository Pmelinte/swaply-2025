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
    expect(containsForbiddenLoginWallCopy("You must be logged in to view this page")).toBe(true);
    expect(containsForbiddenLoginWallCopy("This page requires authentication")).toBe(true);
    expect(containsForbiddenLoginWallCopy("Login required")).toBe(true);
    expect(containsForbiddenLoginWallCopy("Sign in is required to view this page")).toBe(true);
  });

  it("does not reject normal public CTAs that mention login or sign in", () => {
    expect(containsForbiddenLoginWallCopy("Create a free account to start swapping when you are ready.")).toBe(false);
    expect(containsForbiddenLoginWallCopy("Log in to send a proposal after previewing the match.")).toBe(false);
    expect(containsForbiddenLoginWallCopy("Sign in to continue after reading the public preview.")).toBe(false);
    expect(containsForbiddenLoginWallCopy("Sign in to continue")).toBe(false);
  });
});
