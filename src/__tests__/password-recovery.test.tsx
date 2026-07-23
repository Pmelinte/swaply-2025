import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { requestPasswordRecovery, updateRecoveredPassword } from "@/lib/auth/password";

const mockUpdateUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({ auth: { updateUser: mockUpdateUser } }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

vi.mock("@/components/ui-custom", () => ({
  SectionCard: ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) =>
    React.createElement("section", null, React.createElement("h2", null, title), React.createElement("p", null, description), children),
}));

import ResetPasswordPage from "@/app/[locale]/reset-password/page";

describe("password recovery helpers", () => {
  it("rejects an empty recovery email", async () => {
    await expect(requestPasswordRecovery(null, "  ", "https://swaply.test/reset-password")).resolves.toEqual({
      error: "Introduceți adresa de email.",
    });
  });

  it("uses Supabase recovery with the reset password redirect", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    await requestPasswordRecovery({ auth: { resetPasswordForEmail } } as never, "user@example.com", "https://swaply.test/reset-password");
    expect(resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "https://swaply.test/reset-password",
    });
  });

  it("rejects mismatched recovered passwords", async () => {
    await expect(updateRecoveredPassword(null, "password1", "password2")).resolves.toEqual({
      error: "Parolele nu se potrivesc.",
    });
  });
});

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it("updates the password and shows a success state", async () => {
    render(<ResetPasswordPage />);
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
    fireEvent.change(passwordInputs[1], { target: { value: "password123" } });
    fireEvent.click(screen.getByText("submit"));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "password123" });
      expect(screen.getByText("success")).toBeTruthy();
    });
  });
});
