const PRODUCTION_NOTE =
  "> **Production availability note:** This article may discuss Swaply's product direction. Provider-dependent services such as payments, escrow, identity verification, staffed mediation, courier integrations, insurance and paid AI are not implied to be live. Current availability is shown by the application itself.";

const RISK_MARKERS = [
  /government[- ]issued ID/i,
  /identity verification/i,
  /Swaply(?:'s)? escrow/i,
  /escrow-style confirmation/i,
  /mediation team/i,
  /paid plans?/i,
  /Premium and Platinum/i,
  /Swaply(?:'s)? data/i,
  /our (?:internal )?data/i,
  /millions of swaps/i,
  /real Swaply users/i,
  /stories (?:come|are based) from real/i,
  /review flagged listings daily/i,
  /within 24 hours/i,
];

const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [
    /Swaply Free vs Premium: Is the Upgrade Worth It\?/gi,
    "Swaply today: free core access and planned optional paid features",
  ],
  [
    /Inside Swaply's AI: How We Find Your Perfect Match/gi,
    "How Swaply matching works: current signals, fallbacks and future AI assistance",
  ],
  [
    /Real Swap Stories That Will Inspire You to Start Trading/gi,
    "Illustrative Swap Scenarios That Can Inspire Better Exchanges",
  ],
  [
    /For traders who want the highest level of trust, Swaply offers optional government ID verification\.[\s\S]*?This badge is the single most powerful trust signal on the platform\./gi,
    "Swaply does not currently offer government-ID or third-party identity verification in Production. Current trust signals are limited to the account, profile, exchange, feedback and safety information actually shown in the application.",
  ],
  [
    /Swaply offers multiple levels of identity verification, each of which adds a trust badge to your profile\.[\s\S]*?landing swaps\./gi,
    "Government-ID and third-party identity verification are roadmap capabilities and are not currently available in Production.",
  ],
  [
    /\*\*Verification\.\*\*[\s\S]*?peer-to-peer trading\./gi,
    "**Verification.** Government-ID verification is planned but is not currently available in Production. Complete only the profile and account checks that the application actually offers.",
  ],
  [
    /On Swaply, verified profiles display a badge indicating that the user has confirmed their identity through email, phone number, or government ID\./gi,
    "Swaply profiles may display account and reputation signals that are actually available in the application; government-ID verification is not currently offered.",
  ],
  [
    /Swaply has built-in safety features like trust scores, profile verification, and reporting tools/gi,
    "Swaply provides the trust, feedback and reporting tools currently visible in the application",
  ],
  [
    /Swaply allows you to link your social media accounts to your profile\.[\s\S]*?gives other traders confidence\./gi,
    "Swaply does not currently offer verified social-account linking in Production. Use only the profile and trust signals actually displayed by the application.",
  ],
  [
    /Swaply's escrow-style confirmation system/gi,
    "Swaply's bilateral in-app confirmation workflow, which is not escrow or custody,",
  ],
  [
    /Swaply's escrow (?:feature|system)/gi,
    "an independent escrow service, not currently provided by Swaply,",
  ],
  [
    /Swaply escrow (?:feature|system)/gi,
    "an independent escrow service, not currently provided by Swaply,",
  ],
  [
    /our escrow feature/gi,
    "an independent escrow service, which Swaply does not currently provide,",
  ],
  [
    /use Swaply's built-in verification/gi,
    "use the bilateral confirmations currently available in Swaply",
  ],
  [
    /Both items must be confirmed as received and satisfactory before the swap is finalized\./gi,
    "Both parties should use the bilateral confirmations available in the exchange flow before treating a swap as completed.",
  ],
  [
    /Swaply's mediation team (?:is available to help resolve the issue|will review the evidence and help find a fair resolution|can step in to help resolve the issue fairly|reviews all evidence and works toward a fair outcome)\./gi,
    "Swaply's in-app dispute tools can record the issue and evidence; no staffed mediation service or guaranteed outcome is currently offered.",
  ],
  [
    /our mediation team (?:reviews all evidence and works toward a fair outcome|will review the evidence[^.]*\.)/gi,
    "the in-app dispute record can preserve relevant evidence, but no staffed mediation service or guaranteed outcome is currently offered",
  ],
  [
    /The mediation team will review the evidence[^.]*\./gi,
    "The in-app dispute record can preserve relevant evidence; no staffed mediation service or guaranteed outcome is currently offered.",
  ],
  [
    /We will mediate between both parties and work toward a fair resolution[^.]*\./gi,
    "The parties may document the issue through the in-app dispute tools; Swaply does not currently promise staffed mediation or a particular remedy.",
  ],
  [
    /dedicated safety team/gi,
    "available reporting and safety tools",
  ],
  [
    /Both Premium and Platinum plans offer a 20 percent discount when billed annually\.[\s\S]*?when you choose annual billing\./gi,
    "Paid Production plans are not currently offered. Any future plan, price or discount will require a separately verified launch.",
  ],
  [
    /Swaply's paid plans are not about paying for basic functionality\.[\s\S]*?accelerate your results\./gi,
    "Swaply's core exchange experience is currently presented without an active paid Production plan. Optional paid capabilities remain part of the product direction and require separate activation.",
  ],
  [
    /On average, a boosted listing receives 4 times more views and 2\.5 times more swap inquiries[^.]*\./gi,
    "Paid listing boosts are not currently offered in Production, so Swaply does not publish verified performance statistics for them.",
  ],
  [
    /Every Swaply user gets AI-powered match suggestions\.[\s\S]*?varies by plan\./gi,
    "Swaply can provide rule-based matching and, when an authorised provider is available, AI-assisted suggestions. Paid plan differentiation is not currently live in Production.",
  ],
  [
    /Swaply's auto-translation feature is available on all plans, but with different levels of service:/gi,
    "Translation uses the available translation and fallback infrastructure; paid service levels are not currently offered:",
  ],
  [
    /Swaply's AI matching engine processes millions of data points[^.]*\./gi,
    "Swaply matching combines structured product signals with optional provider-assisted analysis and deterministic fallbacks.",
  ],
  [
    /Swaply's AI is not static\.[\s\S]*?avoid similar suggestions in the future\./gi,
    "Swaply's AI foundation is designed for evaluation-driven improvement, but it does not currently claim to train itself automatically on every completed or rejected exchange.",
  ],
  [
    /aggregate data from millions of swaps/gi,
    "future privacy-safe aggregate evaluation data",
  ],
  [
    /The AI often finds connections you would not have thought of on your own/gi,
    "Available matching assistance may surface connections that are easy to miss manually",
  ],
  [
    /Swaply's AI goes to work finding compatible swap partners/gi,
    "Swaply's matching system can evaluate available compatibility signals",
  ],
  [
    /Swaply's AI also analyzes images to verify item categories, assess condition, and improve matching accuracy/gi,
    "When an authorised image provider is available, image assistance may suggest categories and condition; the user must review every suggestion",
  ],
  [
    /Swaply's AI-powered valuation tool provides an estimated range[^.]*\./gi,
    "Swaply can provide editable valuation guidance, but it does not guarantee a market price or appraisal.",
  ],
  [
    /Multi-party swaps are orchestrated by Swaply's AI, which identifies compatible chains and coordinates the logistics\./gi,
    "Multi-party exchange support is part of the product direction; it is not currently presented as an automatically orchestrated Production service.",
  ],
  [
    /These five stories come from real Swaply users who agreed to share their experiences\.[\s\S]*?outcomes are authentic\./gi,
    "These are illustrative scenarios created to explain possible exchange patterns. They are not presented as verified completed Swaply exchanges.",
  ],
  [
    /These stories are based on real experiences shared by Swaply users\.[\s\S]*?outcomes are authentic\./gi,
    "These are illustrative scenarios, not verified testimonials from completed Swaply exchanges.",
  ],
  [
    /Swaply's data reveals that 68 percent[^.]*\./gi,
    "Swaply does not yet publish verified platform-scale retention statistics for this claim.",
  ],
  [
    /Our data shows that users with fully completed profiles receive 3 times more swap inquiries[^.]*\./gi,
    "A complete profile can help other participants understand an offer, but Swaply does not yet publish verified conversion statistics for this claim.",
  ],
  [
    /Profiles with photos get 80 percent more responses than faceless accounts\./gi,
    "A clear profile photo may help other participants recognise an account, but results vary.",
  ],
  [
    /Users who respond within an hour have a 60 percent higher swap completion rate\./gi,
    "Timely replies can make coordination easier, but Swaply does not yet publish a verified completion-rate figure for this claim.",
  ],
  [
    /Our internal data shows that badged profiles receive 35 percent more initial messages and have a 20 percent higher swap completion rate[^.]*\./gi,
    "Swaply does not yet publish verified platform-scale statistics for this claim.",
  ],
  [
    /Our data shows that listings with 6 or more photos receive 73 percent more swap inquiries[^.]*\./gi,
    "Multiple clear photos can help participants assess an item, but Swaply does not yet publish verified platform-scale statistics for this claim.",
  ],
  [
    /Swaply data shows that listings where the owner responds within two hours[^.]*\./gi,
    "Timely replies can make coordination easier, but Swaply does not yet publish verified platform-scale statistics for this claim.",
  ],
  [
    /On Swaply, service listings now account for nearly 30 percent of all active swaps[^.]*\./gi,
    "Services are one of Swaply's supported exchange domains; no verified platform-scale percentage is currently published.",
  ],
  [
    /The vast majority of swaps go smoothly/gi,
    "Exchange outcomes vary",
  ],
  [
    /We review flagged listings daily and can provide guidance within 24 hours\./gi,
    "Use the current reporting and support channels; Swaply does not promise a daily review or 24-hour response time.",
  ],
  [
    /Swaply uses a condition grading system for medical equipment that is more detailed than our standard item grading\./gi,
    "Swaply does not certify medical-device condition. Users must follow the current prohibited-items rules and obtain appropriate professional advice.",
  ],
  [
    /you can file a dispute through Swaply's resolution center within seven days of the swap\./gi,
    "you may use the dispute tools currently available in the application; no seven-day resolution guarantee is promised",
  ],
  [
    /Wheelchairs are among the most commonly swapped medical items on Swaply[^.]*\./gi,
    "Swaply does not publish verified statistics about medical-device exchanges and does not certify medical items.",
  ],
];

export function sanitizeBlogPublicTruthText(value: string): string {
  return TEXT_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );
}

export function sanitizeBlogPublicTruthContent(content: string): string {
  const needsNotice = RISK_MARKERS.some((pattern) => pattern.test(content));
  const sanitized = sanitizeBlogPublicTruthText(content).trim();

  if (!needsNotice || sanitized.startsWith(PRODUCTION_NOTE)) return sanitized;
  return `${PRODUCTION_NOTE}\n\n${sanitized}`;
}

export function getBlogProductionNote(): string {
  return PRODUCTION_NOTE;
}
