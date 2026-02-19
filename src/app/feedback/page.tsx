"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { SectionCard } from "@/components/ui";
import { MessageSquare, Bug, Lightbulb, Star, Send, CheckCircle2 } from "lucide-react";

type FeedbackType = "bug" | "suggestion" | "general" | "rating";

export default function FeedbackPage() {
  const { user, trackEvent } = useAppState();
  const t = useTranslations("feedback");

  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState(user?.email ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [hover, setHover] = useState(0);

  const handleSubmit = () => {
    if (!message.trim()) return;
    trackEvent("feedback_submitted", {
      type,
      rating,
      messageLength: message.length,
      hasEmail: !!email,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex flex-col items-center rounded-2xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-950/30">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          <h2 className="mt-4 text-xl font-bold text-green-800 dark:text-green-200">{t("thankYou")}</h2>
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">{t("thankYouDesc")}</p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setMessage("");
              setRating(0);
            }}
            className="mt-4 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            {t("sendAnother")}
          </button>
        </div>
      </div>
    );
  }

  const typeOptions: { key: FeedbackType; icon: typeof Bug; titleKey: string; descKey: string }[] = [
    { key: "bug", icon: Bug, titleKey: "typeBug", descKey: "typeBugDesc" },
    { key: "suggestion", icon: Lightbulb, titleKey: "typeSuggestion", descKey: "typeSuggestionDesc" },
    { key: "general", icon: MessageSquare, titleKey: "typeGeneral", descKey: "typeGeneralDesc" },
    { key: "rating", icon: Star, titleKey: "typeRating", descKey: "typeRatingDesc" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>

      <div className="mt-6 space-y-6">
        {/* Type selector */}
        <SectionCard title={t("feedbackType")} description={t("feedbackTypeDesc")}>
          <div className="grid gap-2 sm:grid-cols-2">
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = type === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setType(opt.key)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300 dark:border-blue-700 dark:bg-blue-950/40"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-blue-600" : "text-zinc-400"}`} />
                  <div>
                    <p className={`text-sm font-semibold ${active ? "text-blue-700 dark:text-blue-300" : "text-zinc-700 dark:text-zinc-200"}`}>
                      {t(opt.titleKey)}
                    </p>
                    <p className="text-[10px] text-zinc-500">{t(opt.descKey)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Rating (if type is rating) */}
        {type === "rating" && (
          <SectionCard title={t("overallRating")} description={t("overallRatingDesc")}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  <span className={star <= (hover || rating) ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"}>
                    &#9733;
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Message */}
        <SectionCard title={t("yourMessage")} description={t("yourMessageDesc")}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              type === "bug" ? t("placeholderBug") :
              type === "suggestion" ? t("placeholderSuggestion") :
              type === "rating" ? t("placeholderRating") :
              t("placeholderGeneral")
            }
            rows={5}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </SectionCard>

        {/* Email (optional) */}
        {!user && (
          <SectionCard title={t("contactEmail")} description={t("contactEmailDesc")}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </SectionCard>
        )}

        {/* Submit */}
        <button
          type="button"
          disabled={!message.trim()}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {t("submit")}
        </button>
      </div>
    </div>
  );
}
