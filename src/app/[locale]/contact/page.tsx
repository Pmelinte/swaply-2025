"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/ui-custom";
import { Send, CheckCircle2, AlertTriangle, Building2, Mail } from "lucide-react";

type Subject = "technical" | "suggestion" | "partnership" | "other";
type FormStatus = "idle" | "sending" | "success" | "error";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<Subject>("technical");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(data.error ?? "Request failed");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setSubject("technical");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const SUBJECTS: { value: Subject; label: string }[] = [
    { value: "technical", label: t("subjectTechnical") },
    { value: "suggestion", label: t("subjectSuggestion") },
    { value: "partnership", label: t("subjectPartnership") },
    { value: "other", label: t("subjectOther") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Section 1 — Form */}
      <SectionCard title={t("formTitle")}>
        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950/30">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="font-semibold text-green-800 dark:text-green-200">{t("successTitle")}</p>
            <p className="text-sm text-green-600 dark:text-green-400">{t("successText")}</p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              {t("sendAnother")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("labelName")}
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                  placeholder={t("placeholderName")}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("labelEmail")}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                  placeholder={t("placeholderEmail")}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("labelSubject")}
              </label>
              <select
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("labelMessage")}
              </label>
              <textarea
                id="contact-message"
                required
                minLength={10}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                placeholder={t("placeholderMessage")}
              />
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {status === "sending" ? t("sending") : t("submitButton")}
            </button>
          </form>
        )}
      </SectionCard>

      {/* Section 2 — Alternatives */}
      <SectionCard title={t("alternativesTitle")}>
        <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{t("emailDirect")}</p>
              <p className="text-zinc-500 dark:text-zinc-400">contact@swaply.world</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{t("emailPartnerships")}</p>
              <p className="text-zinc-500 dark:text-zinc-400">partnerships@swaply.world</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{t("emailSecurity")}</p>
              <p className="text-zinc-500 dark:text-zinc-400">security@swaply.world</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 3 — Business */}
      <SectionCard title={t("businessTitle")}>
        <div className="flex items-start gap-4 rounded-xl bg-zinc-50 p-5 dark:bg-zinc-800/50">
          <Building2 className="mt-0.5 h-8 w-8 shrink-0 text-blue-500" />
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("businessText")}</p>
            <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">partnerships@swaply.world</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
