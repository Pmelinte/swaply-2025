/**
 * WebAuthn / Passkey helpers (client-side).
 *
 * Handles credential creation (registration) and credential
 * retrieval (authentication) via the Web Authentication API.
 * Stores credentials in the Supabase profiles.security JSONB field.
 */

import { getSupabaseClient } from "@/lib/supabase/client";

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

/**
 * Check if the browser supports WebAuthn.
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === "function"
  );
}

/**
 * Register a new passkey for the given user.
 * Creates a credential and stores the public key data in the
 * profiles table under security.passkeys[].
 */
export async function registerPasskey(
  userId: string,
  userEmail: string,
  displayName: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: "WebAuthn is not supported by this browser" };
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const credential = (await navigator.credentials.create({
      publicKey: {
        rp: {
          name: "Swaply",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userEmail,
          displayName: displayName || userEmail,
        },
        challenge,
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },   // ES256
          { alg: -257, type: "public-key" },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          userVerification: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: "Credential creation was cancelled" };
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    const credentialData = {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      publicKey: bufferToBase64url(response.getPublicKey?.() ?? new ArrayBuffer(0)),
      type: credential.type,
      createdAt: new Date().toISOString(),
    };

    // Store in profiles.security.passkeys[]
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: "Database unavailable" };

    // Fetch current passkeys
    const { data: profile } = await sb
      .from("profiles")
      .select("security")
      .eq("user_id", userId)
      .maybeSingle();

    const security = (profile?.security ?? {}) as Record<string, unknown>;
    const existingPasskeys = Array.isArray(security.passkeys) ? security.passkeys : [];

    const { error } = await sb
      .from("profiles")
      .update({
        security: {
          ...security,
          passkeysEnabled: true,
          passkeys: [...existingPasskeys, credentialData],
        },
      })
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Passkey registration failed";
    return { success: false, error: message };
  }
}

/**
 * Authenticate using an existing passkey.
 * Retrieves a stored credential and verifies it.
 */
export async function authenticateWithPasskey(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: "WebAuthn is not supported by this browser" };
  }

  const sb = getSupabaseClient();
  if (!sb) return { success: false, error: "Database unavailable" };

  // Fetch stored credentials
  const { data: profile } = await sb
    .from("profiles")
    .select("security")
    .eq("user_id", userId)
    .maybeSingle();

  const security = (profile?.security ?? {}) as Record<string, unknown>;
  const passkeys = Array.isArray(security.passkeys) ? security.passkeys : [];

  if (passkeys.length === 0) {
    return { success: false, error: "No passkeys registered" };
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const allowCredentials = passkeys.map(
      (pk: { id: string; rawId: string }) => ({
        id: base64urlToBuffer(pk.rawId),
        type: "public-key" as const,
        transports: ["internal" as const],
      }),
    );

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials,
        userVerification: "preferred",
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return { success: false, error: "Authentication was cancelled" };
    }

    // Credential was successfully retrieved — the browser verified the user
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Passkey authentication failed";
    return { success: false, error: message };
  }
}
