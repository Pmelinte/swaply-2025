"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/lib/state";
import { SectionCard } from "@/components/ui";

const tabs = [
  { key: "login", label: "Autentificare" },
  { key: "register", label: "Înregistrare" },
  { key: "reset", label: "Reset parolă" },
];

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const returnTo = params.get("returnTo") || "/profile";
  const [activeTab, setActiveTab] = useState<string>(tabs[0].key);
  const [email, setEmail] = useState("ana.swaply@example.com");
  const [password, setPassword] = useState("password123");
  const [accept, setAccept] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { login, register, user } = useAppState();

  useEffect(() => {
    if (user) router.push(returnTo);
  }, [user, returnTo, router]);

  const handleSubmit = () => {
    if (activeTab === "login") {
      login(email);
      setMessage("Autentificat. Redirect către profil");
      router.push(returnTo);
    } else if (activeTab === "register") {
      register(email, password, accept);
      setMessage("Cont creat. Confirmă email și configurează 2FA.");
    } else {
      setMessage("Instrucțiuni de reset trimise pe email.");
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Autentificare / Înregistrare"
        description="Email + parolă, cu opțiuni Google și OTP. Return-to păstrat după login."
      >
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Email
            <input
              value={email}
              type="email"
              required
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          {activeTab !== "reset" ? (
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Parolă
              <input
                value={password}
                type="password"
                required
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
          ) : null}

          {activeTab === "register" ? (
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={accept}
                onChange={(e) => setAccept(e.target.checked)}
              />
              Accept Termenii & Politica GDPR (persistăm timestamp + versiune)
            </label>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {activeTab === "login"
              ? "Autentificare"
              : activeTab === "register"
                ? "Creează cont"
                : "Trimite reset"
            }
          </button>
        </form>

        {message ? (
          <div className="rounded-xl bg-green-50 p-3 text-sm text-green-900 dark:bg-green-900/40 dark:text-green-100">
            {message}
          </div>
        ) : null}

        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            2FA opțional: TOTP, SMS OTP, Passkey/WebAuthn. Activare după login pe pagina de profil.
          </p>
          <p>
            Metode alternative: Google SSO, Telefon OTP (beta). Email OTP doar ca fallback.
          </p>
          <p>
            Legal: link permanent către <Link className="underline" href="/info">Termeni & Politica GDPR</Link>.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          Se încarcă formularul de autentificare...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
