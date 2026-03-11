/**
 * Identity verification hook — email, phone, document, selfie verification.
 */
import { useCallback, useMemo, useState } from "react";
import type { Verification, VerificationBadges, VerificationType } from "../types";
import { nanoid } from "nanoid";

interface UseVerificationParams {
  userId: string | null;
  userEmail?: string;
  trackEvent: (event: string, properties?: Record<string, string | number | boolean>) => void;
}

export function useVerification({ userId, userEmail, trackEvent }: UseVerificationParams) {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  /** Request email verification — sends a code */
  const requestEmailVerification = useCallback(
    async (): Promise<{ error?: string }> => {
      if (!userId || !userEmail) return { error: "Trebuie să fii autentificat." };

      const existing = verifications.find((v) => v.type === "email" && v.status === "verified");
      if (existing) return { error: "Email-ul este deja verificat." };

      // Generate a 6-digit code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setPendingCode(code);

      const verification: Verification = {
        id: nanoid(),
        userId,
        type: "email",
        status: "pending",
        metadata: { email: userEmail, code },
        createdAt: new Date().toISOString(),
      };

      setVerifications((prev) => [
        ...prev.filter((v) => !(v.type === "email" && v.status === "pending")),
        verification,
      ]);

      trackEvent("verification_requested", { type: "email" });

      // In production, this would send an email via /api/email/verify
      if (process.env.NODE_ENV === "development") {
        console.debug(`[verification] Email code for ${userEmail}: ${code}`);
      }

      return {};
    },
    [userId, userEmail, verifications, trackEvent],
  );

  /** Verify email with code */
  const verifyEmailCode = useCallback(
    async (code: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      const pending = verifications.find((v) => v.type === "email" && v.status === "pending");
      if (!pending) return { error: "Nu există o verificare în așteptare." };

      if ((pending.metadata as Record<string, unknown>)?.code !== code) {
        return { error: "Codul este incorect." };
      }

      setVerifications((prev) =>
        prev.map((v) =>
          v.id === pending.id
            ? { ...v, status: "verified" as const, verifiedAt: new Date().toISOString() }
            : v,
        ),
      );
      setPendingCode(null);

      trackEvent("verification_completed", { type: "email" });
      return {};
    },
    [userId, verifications, trackEvent],
  );

  /** Request phone verification */
  const requestPhoneVerification = useCallback(
    async (phoneNumber: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      const cleaned = phoneNumber.replace(/\s+/g, "");
      if (!/^\+?\d{8,15}$/.test(cleaned)) {
        return { error: "Numărul de telefon nu este valid." };
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      setPendingCode(code);

      const verification: Verification = {
        id: nanoid(),
        userId,
        type: "phone",
        status: "pending",
        metadata: { phone: cleaned, code },
        createdAt: new Date().toISOString(),
      };

      setVerifications((prev) => [
        ...prev.filter((v) => !(v.type === "phone" && v.status === "pending")),
        verification,
      ]);

      trackEvent("verification_requested", { type: "phone" });

      if (process.env.NODE_ENV === "development") {
        console.debug(`[verification] Phone code for ${cleaned}: ${code}`);
      }

      return {};
    },
    [userId, verifications, trackEvent],
  );

  /** Verify phone with code */
  const verifyPhoneCode = useCallback(
    async (code: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      const pending = verifications.find((v) => v.type === "phone" && v.status === "pending");
      if (!pending) return { error: "Nu există o verificare în așteptare." };

      if ((pending.metadata as Record<string, unknown>)?.code !== code) {
        return { error: "Codul este incorect." };
      }

      setVerifications((prev) =>
        prev.map((v) =>
          v.id === pending.id
            ? { ...v, status: "verified" as const, verifiedAt: new Date().toISOString() }
            : v,
        ),
      );
      setPendingCode(null);

      trackEvent("verification_completed", { type: "phone" });
      return {};
    },
    [userId, verifications, trackEvent],
  );

  /** Submit ID document for verification */
  const submitIdDocument = useCallback(
    async (documentUrl: string, documentType: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      const verification: Verification = {
        id: nanoid(),
        userId,
        type: "id_document",
        status: "pending",
        metadata: { documentUrl, documentType },
        createdAt: new Date().toISOString(),
      };

      setVerifications((prev) => [
        ...prev.filter((v) => !(v.type === "id_document" && v.status === "pending")),
        verification,
      ]);

      trackEvent("verification_requested", { type: "id_document", documentType });
      return {};
    },
    [userId, trackEvent],
  );

  /** Submit selfie for verification */
  const submitSelfie = useCallback(
    async (selfieUrl: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      const verification: Verification = {
        id: nanoid(),
        userId,
        type: "selfie",
        status: "pending",
        metadata: { selfieUrl },
        createdAt: new Date().toISOString(),
      };

      setVerifications((prev) => [
        ...prev.filter((v) => !(v.type === "selfie" && v.status === "pending")),
        verification,
      ]);

      trackEvent("verification_requested", { type: "selfie" });
      return {};
    },
    [userId, trackEvent],
  );

  /** Computed verification badges */
  const badges = useMemo((): VerificationBadges => {
    const isVerified = (type: VerificationType) =>
      verifications.some((v) => v.type === type && v.status === "verified");

    const email = isVerified("email");
    const phone = isVerified("phone");
    const idDocument = isVerified("id_document");
    const selfie = isVerified("selfie");
    const address = isVerified("address");

    const count = [email, phone, idDocument, selfie, address].filter(Boolean).length;

    let level: VerificationBadges["level"] = "none";
    if (count >= 4) level = "full";
    else if (count >= 2) level = "standard";
    else if (count >= 1) level = "basic";

    return { email, phone, idDocument, selfie, address, count, level };
  }, [verifications]);

  return {
    verifications,
    badges,
    pendingCode,
    requestEmailVerification,
    verifyEmailCode,
    requestPhoneVerification,
    verifyPhoneCode,
    submitIdDocument,
    submitSelfie,
  };
}
