import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";

// Mock state module
const mockLogin = vi.fn().mockResolvedValue({ error: null });
const mockRegister = vi.fn().mockResolvedValue({ error: null });
const mockResetPassword = vi.fn().mockResolvedValue({ error: null });
const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() };

vi.mock("@/lib/state", () => ({
  useAppState: () => ({
    login: mockLogin,
    register: mockRegister,
    resetPassword: mockResetPassword,
    user: null,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/login",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
  useRouter: () => mockRouter,
  usePathname: () => "/login",
  redirect: vi.fn(),
  getPathname: vi.fn(),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Eye: (props: Record<string, unknown>) => React.createElement("span", { "data-testid": "eye-icon", ...props }, "Eye"),
  EyeOff: (props: Record<string, unknown>) => React.createElement("span", { "data-testid": "eyeoff-icon", ...props }, "EyeOff"),
}));

// Mock the UI components from @/components/ui
vi.mock("@/components/ui", () => ({
  SectionCard: ({ title, children }: { title: string; children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "section-card" }, React.createElement("h2", null, title), children),
  NextStepRecommendation: () => React.createElement("div", { "data-testid": "next-step" }),
  StateShowcase: () => React.createElement("div", { "data-testid": "state-showcase" }),
}));

// Need to import after mocks
import LoginPage from "@/app/[locale]/login/page";

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderLogin() {
    return render(<LoginPage />);
  }

  it("renders login form with title", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(screen.getByText("authOrRegister")).toBeTruthy();
    });
  });

  it("renders three tabs: login, register, reset", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(screen.getByText("authentication")).toBeTruthy();
      expect(screen.getByText("registration")).toBeTruthy();
      expect(screen.getByText("resetPassword")).toBeTruthy();
    });
  });

  it("renders email input", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      const emailInputs = document.querySelectorAll('input[type="email"]');
      expect(emailInputs.length).toBeGreaterThan(0);
    });
  });

  it("renders password input", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBeGreaterThan(0);
    });
  });

  it("renders terms checkbox", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  it("renders submit button", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(screen.getByText("loginButton")).toBeTruthy();
    });
  });

  it("clicking register tab shows register button", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(screen.getByText("registration")).toBeTruthy();
    });
    await act(async () => {
      fireEvent.click(screen.getByText("registration"));
    });
    await waitFor(() => {
      expect(screen.getByText("createAccount")).toBeTruthy();
    });
  });

  it("clicking reset tab hides password field", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(screen.getByText("resetPassword")).toBeTruthy();
    });
    await act(async () => {
      fireEvent.click(screen.getByText("resetPassword"));
    });
    await waitFor(() => {
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBe(0);
    });
  });

  it("shows error when terms not accepted", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(document.querySelector('input[type="email"]')).toBeTruthy();
    });
    await act(async () => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: "test@test.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(screen.getByText("loginButton"));
    });
    await waitFor(() => {
      expect(screen.getByText("mustAcceptTerms")).toBeTruthy();
    });
  });

  it("shows error for empty email", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(document.querySelector('input[type="checkbox"]')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.click(document.querySelector('input[type="checkbox"]') as HTMLInputElement);
      fireEvent.click(screen.getByText("loginButton"));
    });
    await waitFor(() => {
      expect(screen.getByText("enterEmail")).toBeTruthy();
    });
  });

  it("shows error for short password", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(document.querySelector('input[type="email"]')).toBeTruthy();
    });
    await act(async () => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: "test@test.com" } });
      fireEvent.change(passwordInput, { target: { value: "abc" } });
      fireEvent.click(checkbox);
      fireEvent.click(screen.getByText("loginButton"));
    });
    await waitFor(() => {
      expect(screen.getByText("passwordMinLength")).toBeTruthy();
    });
  });

  it("calls login function on valid submit", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(document.querySelector('input[type="email"]')).toBeTruthy();
    });
    await act(async () => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: "test@test.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(checkbox);
      fireEvent.click(screen.getByText("loginButton"));
    });
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@test.com", "password123", true);
    });
  });

  it("calls register function on register tab submit", async () => {
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(screen.getByText("registration")).toBeTruthy();
    });
    await act(async () => {
      fireEvent.click(screen.getByText("registration"));
    });
    await waitFor(() => {
      expect(document.querySelector('input[type="email"]')).toBeTruthy();
    });
    await act(async () => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: "new@test.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(checkbox);
      fireEvent.click(screen.getByText("createAccount"));
    });
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("new@test.com", "password123", true);
    });
  });

  it("displays login error from backend", async () => {
    mockLogin.mockResolvedValueOnce({ error: "Invalid credentials" });
    await act(async () => { renderLogin(); });
    await waitFor(() => {
      expect(document.querySelector('input[type="email"]')).toBeTruthy();
    });
    await act(async () => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: "test@test.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(checkbox);
      fireEvent.click(screen.getByText("loginButton"));
    });
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeTruthy();
    });
  });
});
