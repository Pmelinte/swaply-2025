/**
 * Trust & Safety System
 * Computes trust scores, detects scams in chat, enforces adaptive friction.
 */

/* ─── Trust Score (0–100) ─── */

export interface TrustSignals {
  accountAgeDays: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  completedSwaps: number;
  averageRating: number;        // 0–5, 0 = no ratings yet
  totalRatingsReceived: number;
  reportsAgainst: number;       // pending or confirmed
  reportsDismissed: number;     // reports that were dismissed (false positives)
  isBlocked: boolean;           // currently blocked by admin/system
  profileCompleteness: number;  // 0–100
  hasAvatar: boolean;
  hasLocation: boolean;
  consecutiveLoginDays: number;
}

export interface TrustScore {
  score: number;           // 0–100
  level: TrustLevel;
  breakdown: TrustBreakdown;
}

export type TrustLevel = "new" | "basic" | "trusted" | "verified" | "ambassador";

export interface TrustBreakdown {
  accountAge: number;      // 0–15
  verification: number;    // 0–15
  swapHistory: number;     // 0–25
  ratings: number;         // 0–20
  behavior: number;        // 0–15 (negative = reports, positive = clean)
  engagement: number;      // 0–10
}

export function computeTrustScore(signals: TrustSignals): TrustScore {
  if (signals.isBlocked) {
    return {
      score: 0,
      level: "new",
      breakdown: { accountAge: 0, verification: 0, swapHistory: 0, ratings: 0, behavior: 0, engagement: 0 },
    };
  }

  // 1. Account age (0–15)
  const accountAge = Math.min(15, Math.floor(signals.accountAgeDays / 30) * 3);

  // 2. Verification (0–15)
  let verification = 0;
  if (signals.emailVerified) verification += 8;
  if (signals.phoneVerified) verification += 7;

  // 3. Swap history (0–25)
  const swapHistory = Math.min(25, signals.completedSwaps * 2.5);

  // 4. Ratings (0–20)
  let ratings = 0;
  if (signals.totalRatingsReceived > 0) {
    const ratingBase = (signals.averageRating / 5) * 15;
    const volumeBonus = Math.min(5, signals.totalRatingsReceived);
    ratings = Math.min(20, ratingBase + volumeBonus);
  }

  // 5. Behavior (0–15, can be negative)
  let behavior = 10; // start with baseline trust
  behavior -= signals.reportsAgainst * 5;  // each active report hurts
  behavior += signals.reportsDismissed * 2; // dismissed = false reports
  behavior = Math.max(-10, Math.min(15, behavior));

  // 6. Engagement (0–10)
  let engagement = 0;
  if (signals.hasAvatar) engagement += 2;
  if (signals.hasLocation) engagement += 2;
  engagement += Math.min(3, Math.floor(signals.profileCompleteness / 33));
  engagement += Math.min(3, Math.floor(signals.consecutiveLoginDays / 7));

  const score = Math.max(0, Math.min(100, Math.round(
    accountAge + verification + swapHistory + ratings + behavior + engagement,
  )));

  const breakdown = { accountAge, verification, swapHistory, ratings, behavior, engagement };

  return { score, level: trustLevel(score), breakdown };
}

function trustLevel(score: number): TrustLevel {
  if (score >= 85) return "ambassador";
  if (score >= 65) return "verified";
  if (score >= 40) return "trusted";
  if (score >= 15) return "basic";
  return "new";
}

/* ─── Trust Level Labels ─── */

export const TRUST_LEVEL_CONFIG: Record<TrustLevel, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  new: {
    label: "Nou",
    color: "text-zinc-500",
    bgColor: "bg-zinc-100 dark:bg-zinc-800",
    description: "Cont recent — în curs de verificare",
  },
  basic: {
    label: "Bază",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    description: "Identitate de bază confirmată",
  },
  trusted: {
    label: "De încredere",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    description: "Istoric pozitiv de schimburi",
  },
  verified: {
    label: "Verificat",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    description: "Profil complet verificat și de încredere",
  },
  ambassador: {
    label: "Ambasador",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    description: "Membru exemplar al comunității",
  },
};

/* ─── Adaptive Friction ─── */

export interface FrictionLimits {
  maxMessagesPerDay: number;
  maxChatsPerDay: number;
  maxSwapProposalsPerDay: number;
  canSendLinks: boolean;
  canShareLocation: boolean;
  canSendImages: boolean;
  requiresModeration: boolean; // messages go through moderation before sending
  autoHold: boolean;           // account on hold pending review
  holdReason?: string;
}

export function computeFriction(trustScore: number, reportsAgainst: number): FrictionLimits {
  // Auto-hold: 3+ reports = automatic account hold
  if (reportsAgainst >= 3) {
    return {
      maxMessagesPerDay: 0,
      maxChatsPerDay: 0,
      maxSwapProposalsPerDay: 0,
      canSendLinks: false,
      canShareLocation: false,
      canSendImages: false,
      requiresModeration: true,
      autoHold: true,
      holdReason: `${reportsAgainst} raportări — cont suspendat pentru verificare`,
    };
  }

  // New users (score 0–14): heavy restrictions
  if (trustScore < 15) {
    return {
      maxMessagesPerDay: 10,
      maxChatsPerDay: 3,
      maxSwapProposalsPerDay: 2,
      canSendLinks: false,
      canShareLocation: false,
      canSendImages: false,
      requiresModeration: true,
      autoHold: false,
    };
  }

  // Basic (15–39): moderate restrictions
  if (trustScore < 40) {
    return {
      maxMessagesPerDay: 30,
      maxChatsPerDay: 8,
      maxSwapProposalsPerDay: 5,
      canSendLinks: false,
      canShareLocation: true,
      canSendImages: true,
      requiresModeration: false,
      autoHold: false,
    };
  }

  // Trusted (40–64): light restrictions
  if (trustScore < 65) {
    return {
      maxMessagesPerDay: 100,
      maxChatsPerDay: 20,
      maxSwapProposalsPerDay: 15,
      canSendLinks: true,
      canShareLocation: true,
      canSendImages: true,
      requiresModeration: false,
      autoHold: false,
    };
  }

  // Verified / Ambassador (65+): no restrictions
  return {
    maxMessagesPerDay: 999,
    maxChatsPerDay: 999,
    maxSwapProposalsPerDay: 999,
    canSendLinks: true,
    canShareLocation: true,
    canSendImages: true,
    requiresModeration: false,
    autoHold: false,
  };
}

/* ─── Chat Scam Detection ─── */

export interface ScamCheckResult {
  blocked: boolean;
  warnings: string[];
  severity: "none" | "low" | "medium" | "high";
  patterns: string[];
}

// Patterns that suggest moving conversation off-platform
const OFF_PLATFORM_PATTERNS = [
  /whatsapp/i, /telegram/i, /viber/i, /signal/i, /messenger/i,
  /trimite\s+pe\s+(whatsapp|telegram)/i,
  /scrie-mi\s+pe/i, /contacteaza-ma\s+pe/i, /numar(ul)?\s+meu/i,
  /da-mi\s+numar/i, /give\s+me\s+your\s+number/i,
];

// Patterns suggesting money transfer
const MONEY_PATTERNS = [
  /trimite\s+bani/i, /transfer\s+ban(car)?/i, /plat(esc|esti|a)\s+pri?n/i,
  /revolut/i, /paypal/i, /iban/i, /western\s+union/i, /cont\s+bancar/i,
  /crypto/i, /bitcoin/i, /eth(ereum)?/i, /send\s+money/i, /wire\s+transfer/i,
  /depozit/i, /avans/i, /deposit/i, /advance\s+payment/i,
];

// Patterns suggesting urgency/pressure
const URGENCY_PATTERNS = [
  /urgent/i, /doar\s+azi/i, /oferta\s+expira/i, /ultimul?\s+/i,
  /grabe(ste|ste-te)/i, /nu\s+mai\s+am\s+timp/i, /hurry/i, /last\s+chance/i,
  /limited\s+time/i, /act\s+now/i,
];

// Suspicious URL patterns
const SUSPICIOUS_URL_PATTERNS = [
  /bit\.ly/i, /tinyurl/i, /goo\.gl/i, /t\.co/i,
  /click\s+here/i, /click\s+link/i, /apasa\s+(pe\s+)?link/i,
  /\.ru\/[a-z]/i, /\.cn\/[a-z]/i,
];

export function checkMessageForScam(text: string): ScamCheckResult {
  const warnings: string[] = [];
  const patterns: string[] = [];
  let severity: ScamCheckResult["severity"] = "none";

  // Off-platform redirect
  for (const p of OFF_PLATFORM_PATTERNS) {
    if (p.test(text)) {
      warnings.push("Mesajul sugerează mutarea conversației în afara platformei");
      patterns.push("off_platform");
      severity = "medium";
      break;
    }
  }

  // Money transfer
  for (const p of MONEY_PATTERNS) {
    if (p.test(text)) {
      warnings.push("Mesajul menționează transfer de bani — Swaply este doar pentru schimburi, fără bani!");
      patterns.push("money_transfer");
      severity = severity === "medium" ? "high" : "medium";
      break;
    }
  }

  // Urgency/pressure
  for (const p of URGENCY_PATTERNS) {
    if (p.test(text)) {
      warnings.push("Mesajul conține presiune/urgență — fii precaut");
      patterns.push("urgency_pressure");
      if (severity === "none") severity = "low";
      break;
    }
  }

  // Suspicious URLs
  for (const p of SUSPICIOUS_URL_PATTERNS) {
    if (p.test(text)) {
      warnings.push("Link suspect detectat — nu accesa linkuri de la utilizatori necunoscuți");
      patterns.push("suspicious_url");
      severity = severity === "none" ? "medium" : "high";
      break;
    }
  }

  // Multiple phone numbers
  const phoneMatches = text.match(/\d{10,}/g);
  if (phoneMatches && phoneMatches.length > 0) {
    warnings.push("Numere de telefon detectate — partajarea datelor personale e riscantă");
    patterns.push("phone_number");
    if (severity === "none") severity = "low";
  }

  const blocked = severity === "high";

  return { blocked, warnings, severity, patterns };
}

/* ─── Safe Meeting Guidelines ─── */

export interface SafeMeetingChecklist {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

export const SAFE_MEETING_CHECKLIST: SafeMeetingChecklist[] = [
  {
    id: "public_place",
    label: "Loc public și aglomerat",
    description: "Alege un loc public (mall, cafenea, piață) cu camere de supraveghere. Evită locuri izolate.",
    required: true,
  },
  {
    id: "daylight",
    label: "Pe lumină / orar normal",
    description: "Programează întâlnirea în timpul zilei sau într-un loc bine iluminat.",
    required: true,
  },
  {
    id: "tell_someone",
    label: "Anunță pe cineva",
    description: "Spune unui prieten sau membru al familiei unde te duci și cu cine te întâlnești.",
    required: true,
  },
  {
    id: "verify_item",
    label: "Verifică obiectul la întâlnire",
    description: "Inspectează obiectul înainte de a confirma schimbul. Verifică starea, funcționalitatea.",
    required: true,
  },
  {
    id: "no_money",
    label: "Fără bani în avans",
    description: "Nu trimite niciodată bani înainte de întâlnire. Swaply este gratuit — schimburi fără bani.",
    required: true,
  },
  {
    id: "use_swap_code",
    label: "Folosește codul de confirmare",
    description: "Folosește codul din aplicație pentru a confirma schimbul. Ambele părți trebuie să confirme.",
    required: false,
  },
  {
    id: "take_photos",
    label: "Fotografiază obiectele",
    description: "Fă poze la ambele obiecte înainte și după schimb — dovadă în caz de dispută.",
    required: false,
  },
  {
    id: "report_issues",
    label: "Raportează probleme",
    description: "Dacă ceva nu e în regulă, raportează imediat în aplicație. Echipa va investiga.",
    required: false,
  },
];

/* ─── Trust score helpers for state integration ─── */

export function defaultTrustSignals(): TrustSignals {
  return {
    accountAgeDays: 0,
    emailVerified: false,
    phoneVerified: false,
    completedSwaps: 0,
    averageRating: 0,
    totalRatingsReceived: 0,
    reportsAgainst: 0,
    reportsDismissed: 0,
    isBlocked: false,
    profileCompleteness: 0,
    hasAvatar: false,
    hasLocation: false,
    consecutiveLoginDays: 0,
  };
}

export function buildTrustSignals(
  user: {
    avatarUrl?: string;
    location?: { city?: string; country?: string };
    bio?: string;
    stats: { completedSwaps: number };
  },
  extra: {
    accountAgeDays?: number;
    emailVerified?: boolean;
    reportsAgainst?: number;
    averageRating?: number;
    totalRatingsReceived?: number;
    consecutiveLoginDays?: number;
  } = {},
): TrustSignals {
  const profileChecks = [
    !!user.avatarUrl,
    !!user.location?.city,
    !!user.location?.country,
    !!user.bio && user.bio.length >= 10,
  ];
  const profileCompleteness = Math.round(
    (profileChecks.filter(Boolean).length / profileChecks.length) * 100,
  );

  return {
    accountAgeDays: extra.accountAgeDays ?? 1,
    emailVerified: extra.emailVerified ?? true,
    phoneVerified: false,
    completedSwaps: user.stats.completedSwaps,
    averageRating: extra.averageRating ?? 0,
    totalRatingsReceived: extra.totalRatingsReceived ?? 0,
    reportsAgainst: extra.reportsAgainst ?? 0,
    reportsDismissed: 0,
    isBlocked: false,
    profileCompleteness,
    hasAvatar: !!user.avatarUrl,
    hasLocation: !!user.location?.city,
    consecutiveLoginDays: extra.consecutiveLoginDays ?? 1,
  };
}
