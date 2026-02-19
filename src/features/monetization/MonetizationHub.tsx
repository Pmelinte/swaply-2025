"use client";

/**
 * Monetization Hub — Central dashboard for all 20 monetization capabilities.
 * Sections: Pricing, Token Shop, Streaks, Referrals, Milestones, Themes.
 */

import { useState, useMemo } from "react";
import { useAppState } from "@/lib/state";
import {
  TOKEN_PACKAGES,
  SUBSCRIPTION_PLANS,
  PROFILE_THEMES,
  yearlyDiscount,
  pricePerToken,
  REFERRAL_REWARD_REFERRER,
  REFERRAL_REWARD_REFERRED,
  referralLink,
  FEATURED_COST,
  INSURANCE_COST,
  VERIFIED_BADGE_COST,
  BUSINESS_UPGRADE_COST,
} from "@/lib/monetization";
import type { ShopItem } from "@/lib/types";
import {
  Award,
  Check,
  Copy,
  Crown,
  Flame,
  Gift,
  Lock,
  Palette,
  Shield,
  Share2,
  ShoppingBag,
  Star,
  Trophy,
  Zap,
} from "lucide-react";

type Tab = "pricing" | "shop" | "streak" | "referrals" | "milestones" | "themes";

export function MonetizationHub() {
  const {
    user, tokenBalance, tokenLedger, shopItems, purchaseShopItem,
    loginStreak, claimDailyReward, referralCode, referrals, sendReferralInvite,
    giftTokens, purchaseFeaturedSlot, purchaseInsurance,
    purchaseVerifiedBadge, purchaseTheme, activateTheme,
    purchaseBusinessUpgrade, subscription, activePromotions,
    swapMilestones, loyaltyMilestones, tierBenefits,
    activeTheme, isVerified, isBusiness, hasFeature,
  } = useAppState();

  const [tab, setTab] = useState<Tab>("pricing");
  const [referralEmail, setReferralEmail] = useState("");
  const [giftRecipient, setGiftRecipient] = useState("");
  const [giftAmount, setGiftAmount] = useState(10);
  const [giftMessage, setGiftMessage] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [shopFilter, setShopFilter] = useState<ShopItem["category"] | "all">("all");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [copied, setCopied] = useState(false);

  const filteredShop = useMemo(() =>
    shopFilter === "all" ? shopItems : shopItems.filter((i) => i.category === shopFilter),
    [shopItems, shopFilter],
  );

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "pricing", label: "Abonamente", icon: <Crown className="h-4 w-4" /> },
    { id: "shop", label: "Token Shop", icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "streak", label: "Streak", icon: <Flame className="h-4 w-4" /> },
    { id: "referrals", label: "Referrals", icon: <Gift className="h-4 w-4" /> },
    { id: "milestones", label: "Milestone", icon: <Trophy className="h-4 w-4" /> },
    { id: "themes", label: "Teme", icon: <Palette className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Feedback toast */}
      {feedbackMsg && (
        <div className="fixed right-4 top-20 z-50 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {feedbackMsg}
        </div>
      )}

      {/* Header with balance */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Monetizare</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gestionează abonamentul, tokens și recompensele tale
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 px-4 py-2 dark:bg-amber-950/30">
            <p className="text-xs text-amber-600 dark:text-amber-400">Balanță</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{tokenBalance} tokens</p>
          </div>
          {isVerified && (
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Verificat
            </span>
          )}
          {isBusiness && (
            <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              Business
            </span>
          )}
        </div>
      </div>

      {/* Active promotions banner */}
      {activePromotions.length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 p-4 text-white">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span className="font-bold">{activePromotions[0].name}</span>
          </div>
          <p className="mt-1 text-sm opacity-90">{activePromotions[0].description}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === tabItem.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {tabItem.icon}
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* ── Pricing Tab ── */}
      {tab === "pricing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${billingCycle === "monthly" ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}
            >
              Lunar
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${billingCycle === "yearly" ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}
            >
              Anual (-20%)
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const price = billingCycle === "yearly" ? plan.priceYearly / 12 : plan.priceMonthly;
              const isActive = subscription.planId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-5 ${
                    plan.recommended
                      ? "border-blue-400 bg-blue-50/50 shadow-md dark:border-blue-600 dark:bg-blue-950/20"
                      : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  }`}
                >
                  {plan.recommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold text-white">
                      Recomandat
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                      {price === 0 ? "Gratuit" : `$${price.toFixed(2)}`}
                    </span>
                    {price > 0 && <span className="text-sm text-zinc-500">/lună</span>}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    disabled={isActive}
                  >
                    {isActive ? "Plan curent" : price === 0 ? "Plan gratuit" : "Upgrade"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Token packages */}
          <h3 className="mt-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Cumpără Tokens</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            {TOKEN_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-xl border p-4 text-center ${
                  pkg.popular
                    ? "border-amber-400 bg-amber-50/50 dark:border-amber-600 dark:bg-amber-950/20"
                    : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    Popular
                  </span>
                )}
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{pkg.tokens}</p>
                <p className="text-xs text-zinc-500">tokens</p>
                <p className="mt-2 text-lg font-semibold text-emerald-600">${pkg.priceUsd}</p>
                <p className="text-[10px] text-zinc-400">${pricePerToken(pkg).toFixed(4)}/token</p>
                <button className="mt-3 w-full rounded-lg bg-emerald-600 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  Cumpără
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Shop Tab ── */}
      {tab === "shop" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "boost", "badge", "theme", "premium", "business"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setShopFilter(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  shopFilter === cat
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {cat === "all" ? "Toate" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredShop.map((item) => {
              const canBuy = tokenBalance >= item.cost;
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">{item.cost}</p>
                    <button
                      onClick={async () => {
                        const res = await purchaseShopItem(item.id);
                        showFeedback(res.error || `${item.title} achiziționat!`);
                      }}
                      disabled={!canBuy}
                      className="mt-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                      {canBuy ? "Cumpără" : "Insuficient"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gift tokens section */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h4 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
              <Gift className="h-4 w-4 text-pink-500" />
              Trimite Tokens Cadou
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={giftRecipient}
                onChange={(e) => setGiftRecipient(e.target.value)}
                placeholder="ID utilizator"
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <input
                type="number"
                value={giftAmount}
                onChange={(e) => setGiftAmount(Number(e.target.value))}
                min={5}
                max={1000}
                className="w-20 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <input
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Mesaj (opțional)"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                onClick={async () => {
                  const res = await giftTokens(giftRecipient, giftAmount, giftMessage);
                  showFeedback(res.error || `${giftAmount} tokens trimiși!`);
                  if (!res.error) { setGiftRecipient(""); setGiftAmount(10); setGiftMessage(""); }
                }}
                className="rounded-lg bg-pink-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-pink-700"
              >
                Trimite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Streak Tab ── */}
      {tab === "streak" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6 dark:border-orange-900 dark:from-orange-950/20 dark:to-amber-950/20">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                  {loginStreak.currentStreak} zile
                </p>
                <p className="text-sm text-orange-600/70 dark:text-orange-400/70">
                  Streak curent — Record: {loginStreak.longestStreak} zile
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Recompensa de mâine: <span className="font-bold text-amber-600">{loginStreak.nextReward} tokens</span>
                </p>
              </div>
              <button
                onClick={async () => {
                  const res = await claimDailyReward();
                  if ("tokens" in res) showFeedback(`+${res.tokens} tokens revendicat!`);
                  else showFeedback(res.error);
                }}
                disabled={loginStreak.todayClaimed}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                  loginStreak.todayClaimed
                    ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                    : "bg-orange-600 text-white hover:bg-orange-700 shadow-sm"
                }`}
              >
                {loginStreak.todayClaimed ? "Revendicat azi" : "Revendică"}
              </button>
            </div>
          </div>

          {/* Streak calendar preview */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const dayNum = loginStreak.currentStreak - 6 + i;
              const isPast = dayNum > 0 && dayNum <= loginStreak.currentStreak;
              const isToday = dayNum === loginStreak.currentStreak;
              return (
                <div
                  key={i}
                  className={`flex h-12 items-center justify-center rounded-lg text-sm font-semibold ${
                    isToday
                      ? "bg-orange-500 text-white ring-2 ring-orange-300"
                      : isPast
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                  }`}
                >
                  {dayNum > 0 ? dayNum : ""}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Referrals Tab ── */}
      {tab === "referrals" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">
              Invită prieteni, câștigă tokens!
            </h4>
            <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
              Tu primești <strong>{REFERRAL_REWARD_REFERRER} tokens</strong> per invitat.
              Prietenul tău primește <strong>{REFERRAL_REWARD_REFERRED} tokens bonus</strong>.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-emerald-300 bg-white px-4 py-2 font-mono text-sm text-emerald-800 dark:border-emerald-700 dark:bg-zinc-900 dark:text-emerald-200">
                {referralCode}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(referralLink(referralCode));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiat!" : "Copiază link"}
              </button>
            </div>

            {/* Share buttons: WhatsApp, native share, copy */}
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hei! Alătură-te Swaply și fă schimb de obiecte! Folosește codul meu: ${referralCode}\n${referralLink(referralCode)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.634-1.215A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.592-5.928-1.622l-.424-.254-2.75.721.734-2.684-.278-.442A9.8 9.8 0 012.182 12c0-5.419 4.399-9.818 9.818-9.818S21.818 6.581 21.818 12c0 5.419-4.399 9.818-9.818 9.818z"/></svg>
                WhatsApp
              </a>
              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  onClick={() => {
                    void navigator.share({
                      title: "Swaply — Schimb de obiecte",
                      text: `Alătură-te Swaply! Cod referral: ${referralCode}`,
                      url: referralLink(referralCode),
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Share2 className="h-4 w-4" />
                  Distribuie
                </button>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                placeholder="Email prieten"
                type="email"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                onClick={async () => {
                  const res = await sendReferralInvite(referralEmail);
                  showFeedback(res.error || `Invitație trimisă la ${referralEmail}!`);
                  if (!res.error) setReferralEmail("");
                }}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Invită
              </button>
            </div>
          </div>

          {/* Referral stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-zinc-900">
              <p className="text-2xl font-bold text-emerald-600">{referrals.length}</p>
              <p className="text-xs text-zinc-500">Invitații trimise</p>
            </div>
            <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-zinc-900">
              <p className="text-2xl font-bold text-emerald-600">
                {referrals.filter((r) => r.status !== "pending").length}
              </p>
              <p className="text-xs text-zinc-500">Înregistrați</p>
            </div>
            <div className="rounded-xl bg-white p-4 text-center shadow-sm dark:bg-zinc-900">
              <p className="text-2xl font-bold text-amber-600">
                {referrals.reduce((s, r) => s + r.tokensEarned, 0)}
              </p>
              <p className="text-xs text-zinc-500">Tokens câștigați</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Milestones Tab ── */}
      {tab === "milestones" && (
        <div className="space-y-6">
          {/* Swap milestones */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              <Award className="h-5 w-5 text-amber-500" />
              Milestone-uri Swap
            </h3>
            <div className="mt-3 space-y-2">
              {swapMilestones.map((m) => (
                <div
                  key={m.swapCount}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    m.achieved
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
                      : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {m.achieved ? (
                      <Trophy className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-zinc-400" />
                    )}
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{m.label}</p>
                      <p className="text-xs text-zinc-500">{m.swapCount} swapuri completate</p>
                    </div>
                  </div>
                  <span className={`font-bold ${m.achieved ? "text-emerald-600" : "text-zinc-400"}`}>
                    +{m.bonusTokens} tokens
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty milestones */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              <Star className="h-5 w-5 text-blue-500" />
              Milestone-uri Loialitate
            </h3>
            <div className="mt-3 space-y-2">
              {loyaltyMilestones.map((m) => (
                <div
                  key={m.daysActive}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    m.achieved
                      ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
                      : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {m.achieved ? (
                      <Check className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-zinc-400" />
                    )}
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{m.daysActive} zile active</p>
                      <p className="text-xs text-zinc-500">{m.reward}</p>
                    </div>
                  </div>
                  <span className={m.achieved ? "text-blue-600 font-bold" : "text-zinc-400"}>
                    {m.achieved ? "Deblocat" : "Blocat"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid gap-3 sm:grid-cols-2">
            {!isVerified && (
              <button
                onClick={async () => {
                  const res = await purchaseVerifiedBadge();
                  showFeedback(res.error || "Badge verificat activat!");
                }}
                className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white p-4 text-left hover:bg-blue-50 dark:border-blue-800 dark:bg-zinc-900 dark:hover:bg-blue-950/20"
              >
                <Shield className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">Badge Verificat</p>
                  <p className="text-xs text-zinc-500">{VERIFIED_BADGE_COST} tokens — identitate verificată permanent</p>
                </div>
              </button>
            )}
            {!isBusiness && (
              <button
                onClick={async () => {
                  const res = await purchaseBusinessUpgrade("My Business");
                  showFeedback(res.error || "Business account activat!");
                }}
                className="flex items-center gap-3 rounded-xl border border-purple-200 bg-white p-4 text-left hover:bg-purple-50 dark:border-purple-800 dark:bg-zinc-900 dark:hover:bg-purple-950/20"
              >
                <Crown className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">Business Account</p>
                  <p className="text-xs text-zinc-500">{BUSINESS_UPGRADE_COST} tokens — 200 listări, bulk upload, branding</p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Themes Tab ── */}
      {tab === "themes" && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Personalizează-ți profilul cu o temă unică. Fiecare temă schimbă culorile profilului tău.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROFILE_THEMES.map((theme) => {
              const owned = shopItems.some((s) => s.id === theme.id) || false;
              const isActive = activeTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  className={`rounded-xl border p-4 ${
                    isActive
                      ? "border-blue-400 ring-2 ring-blue-200 dark:border-blue-600"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                  style={{ backgroundColor: theme.colors.bg }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{theme.icon}</span>
                    {isActive && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">Activ</span>}
                  </div>
                  <p className="mt-2 font-semibold" style={{ color: theme.colors.primary }}>{theme.name}</p>
                  <div className="mt-2 flex gap-1">
                    {Object.values(theme.colors).slice(0, 3).map((c, i) => (
                      <div key={i} className="h-5 w-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <button
                    onClick={async () => {
                      if (isActive) {
                        activateTheme("");
                        return;
                      }
                      const res = await purchaseTheme(theme.id);
                      if (res.error && res.error !== "Deja cumpărat") {
                        showFeedback(res.error);
                      } else {
                        activateTheme(theme.id);
                        showFeedback(`Tema ${theme.name} activată!`);
                      }
                    }}
                    className="mt-3 w-full rounded-lg py-1.5 text-sm font-semibold transition"
                    style={{
                      backgroundColor: isActive ? "#e5e7eb" : theme.colors.primary,
                      color: isActive ? "#6b7280" : "white",
                    }}
                  >
                    {isActive ? "Dezactivează" : `${theme.cost} tokens`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Token ledger history */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h4 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Istoric Tokens</h4>
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {tokenLedger.slice().reverse().slice(0, 20).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between border-b border-zinc-100 py-1.5 last:border-0 dark:border-zinc-800">
              <div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{entry.description}</p>
                <p className="text-[10px] text-zinc-400">{new Date(entry.createdAt).toLocaleDateString("ro-RO")}</p>
              </div>
              <span className={`font-bold ${entry.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {entry.amount >= 0 ? "+" : ""}{entry.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
