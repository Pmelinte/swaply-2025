"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/lib/state";
import { NextStepRecommendation, SectionCard, StateShowcase } from "@/components/ui";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [processing, setProcessing] = useState(false);
  const { login, register, user } = useAppState();

  useEffect(() => {
    if (user) {
      // Replace (nu push) ca să nu te întorci cu Back pe /login după ce ești logat
      router.replace(returnTo);
      // Refresh ca să se sincronizeze rapid starea de auth / middleware / server components
      router.refresh();
    }
  }, [user, returnTo, router]);

  const handleSubmit = async () => {
    setMessage(null);
    setStatus("idle");

    if (!accept) {
      setMessage("Trebuie să bifezi acceptarea Termeni & GDPR pentru a continua.");
      setStatus("error");
      return;
    }
    if (!email.trim()) {
      setMessage("Introdu adresa de email.");
      setStatus("error");
      return;
    }
    if (activeTab !== "reset" && password.length < 6) {
      setMessage("Parola trebuie să aibă cel puțin 6 caractere.");
      setStatus("error");
      return;
    }

    setProcessing(true);
    try {
      if (activeTab === "login") {
        const { error } = await login(email, password, accept);
        if (error) {
          setMessage(error);
          setStatus("error");
        } else {
          setMessage("Autentificat. Redirect către profil...");
          setStatus("success");

          // Mică pauză: în multe implementări, `user` din state se actualizează async după sign-in
          await new Promise((r) => setTimeout(r, 200));

          // Refresh + replace: previne situația “după submit rămân nelogat” (UI nu prinde sesiunea imediat)
          router.refresh();
          router.replace(returnTo);
        }
      } else if (activeTab === "register") {
        const { error } = await register(email, password, accept);
        if (error) {
          setMessage(error);
          setStatus("error");
        } else {
          setMessage(
            "Cont creat cu succes! Verifică-ți email-ul pentru confirmarea contului, apoi revino să te autentifici."
          );
          setStatus("success");
        }
      } else {
        setMessage("Instrucțiuni de reset trimise pe email.");
        setStatus("success");
      }
    } catch (err) {
      setMessage(`Eroare neașteptată: ${err instanceof Error ? err.message : "încearcă din nou"}`);
      setStatus("error");
    }
    setProcessing(false);
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
            void handleSubmit();
          }}
          noValidate
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

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
            <span>
              Accept{" "}
              <Link className="underline" href="/info#legal">
                Termeni & Politica GDPR
              </Link>{" "}
              (nu permitem submit fără consimțământ)
            </span>
          </label>

          <button
            type="submit"
            disabled={processing}
            className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {activeTab === "login"
              ? "Autentificare"
              : activeTab === "register"
                ? "Creează cont"
                : "Trimite reset"}
          </button>
        </form>

        {message ? (
          <div
            className={`rounded-xl p-3 text-sm font-medium ${
              status === "error"
                ? "bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100"
                : "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"
            }`}
          >
            {message}
          </div>
        ) : null}

        {processing ? (
          <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-900/40 dark:text-blue-100">
            Se verifică...
          </div>
        ) : null}

        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <p>2FA opțional: TOTP, SMS OTP, Passkey/WebAuthn. Activare după login pe pagina de profil.</p>
          <p>Metode alternative: Google SSO, Telefon OTP (beta). Email OTP doar ca fallback.</p>
          <p>
            Legal: link permanent către{" "}
            <Link className="underline" href="/info">
              Termeni & Politica GDPR
            </Link>
            .
          </p>
        </div>
      </SectionCard>

      <NextStepRecommendation
        steps={[
          { label: "Explorează obiecte", href: "/objects", description: "Vezi obiectele disponibile chiar și fără cont" },
          { label: "Informații platformă", href: "/info", description: "Citește regulile și beneficiile badge-urilor" },
        ]}
      />

      <StateShowcase
        title="Stări LOGIN"
        states={[
          {
            key: "loading",
            title: "Se verifică sesiunea",
            description:
              "Afișăm indicator de încărcare cât timp validăm tokenul sau redirectăm către returnTo.",
          },
          {
            key: "empty",
            title: "Formular gol",
            description:
              "Input-urile sunt precompletate, dar acceptarea Termeni & GDPR este obligatorie înainte de orice submit.",
          },
          {
            key: "error",
            title: "Credențiale invalide",
            description:
              "Mesaj roșu + mențiune parolă demo. Nu facem mock success; rămânem pe pagină cu CTA spre reset parolă.",
          },
        ]}
      />
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
