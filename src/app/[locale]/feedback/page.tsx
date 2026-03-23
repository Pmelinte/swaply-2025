"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { SectionCard } from "@/components/ui";
import { MessageSquare, Bug, Lightbulb, Star, Send, CheckCircle2, Camera, ThumbsUp, Clock, ChevronUp } from "lucide-react";

type FeedbackType = "bug" | "suggestion" | "general" | "rating";
type FeedbackStatus = "pending" | "reviewing" | "planned" | "done";

interface FeedbackEntry {
  id: string;
  type: FeedbackType;
  message: string;
  status: FeedbackStatus;
  votes: number;
  voted: boolean;
  date: string;
}

// Mock previous feedback for the voting/status tracking feature
const MOCK_FEEDBACK: FeedbackEntry[] = [
  { id: "f1", type: "suggestion", message: "Dark mode toggle in top bar", status: "done", votes: 42, voted: false, date: "2026-01-15" },
  { id: "f2", type: "suggestion", message: "Push notifications for new matches", status: "planned", votes: 28, voted: false, date: "2026-02-01" },
  { id: "f3", type: "bug", message: "Image upload fails on Safari mobile", status: "reviewing", votes: 15, voted: false, date: "2026-02-10" },
  { id: "f4", type: "suggestion", message: "Add QR code for meetup confirmation", status: "done", votes: 31, voted: false, date: "2025-12-20" },
  { id: "f5", type: "suggestion", message: "Multi-language AI chat translation", status: "planned", votes: 19, voted: false, date: "2026-02-05" },
];

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  reviewing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  planned: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

export default function FeedbackPage() {
  const { user, trackEvent } = useAppState();
  const t = useTranslations("feedback");

  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState(user?.email ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [hover, setHover] = useState(0);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [feedbackList, setFeedbackList] = useState(MOCK_FEEDBACK);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB max
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVote = (id: string) => {
    setFeedbackList((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, votes: f.voted ? f.votes - 1 : f.votes + 1, voted: !f.voted }
          : f,
      ),
    );
  };

  const handleSubmit = () => {
    if (!message.trim()) return;
    trackEvent("feedback_submitted", {
      type,
      rating,
      messageLength: message.length,
      hasEmail: !!email,
      hasScreenshot: !!screenshot,
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
              setScreenshot(null);
              setScreenshotPreview(null);
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

        {/* Screenshot upload (for bugs) */}
        {type === "bug" && (
          <SectionCard title={t("screenshotTitle")} description={t("screenshotDesc")}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleScreenshot}
              className="hidden"
            />
            {screenshotPreview ? (
              <div className="relative">
                <img src={screenshotPreview} alt="Screenshot" className="max-h-48 rounded-lg border border-zinc-200 dark:border-zinc-700" />
                <button
                  type="button"
                  onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                >
                  <span className="text-xs font-bold">X</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-zinc-600 dark:text-zinc-400"
              >
                <Camera className="h-4 w-4" />
                {t("uploadScreenshot")}
              </button>
            )}
          </SectionCard>
        )}

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

        {/* ── Feature Voting ── */}
        <SectionCard title={t("featureVoting")} description={t("featureVotingDesc")}>
          <div className="space-y-2">
            {[...feedbackList].sort((a, b) => b.votes - a.votes).map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <button
                  type="button"
                  onClick={() => handleVote(f.id)}
                  className={`flex flex-col items-center rounded-lg px-2 py-1 ${
                    f.voted
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-700"
                  }`}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">{f.votes}</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{f.message}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[f.status]}`}>
                      {t(`status${f.status.charAt(0).toUpperCase() + f.status.slice(1)}` as Parameters<typeof t>[0])}
                    </span>
                    <span className="text-[10px] text-zinc-400">{f.date}</span>
                  </div>
                </div>
                {f.status === "done" && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                {f.status === "reviewing" && <Clock className="h-4 w-4 shrink-0 text-amber-500" />}
                {f.status === "planned" && <ThumbsUp className="h-4 w-4 shrink-0 text-blue-500" />}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
