/**
 * Swaply Payments — barrel export for all 10 monetization integrations.
 *
 * 1. Stripe (Visa/MC/Apple Pay/Google Pay) — tokens + subscriptions + one-time
 * 2. PayPal — tokens + subscriptions
 * 3. Courier affiliate (FanCourier/Sameday/Cargus)
 * 4. Transport affiliate (Bolt/Uber/Waze)
 * 5. Boost & Featured (via Stripe)
 * 6. Swap Insurance (via Stripe)
 * 7. Business Accounts (via Stripe subscriptions)
 * 8. Ads (AdSense/Carbon/Sponsors)
 * 9. API Keys / White-Label
 * 10. Revenue from all of the above
 */

// Stripe
export {
  getStripe,
  isStripeConfigured,
  createTokenCheckout,
  createSubscriptionCheckout,
  createOneTimePayment,
  constructWebhookEvent,
  createPortalSession,
  ONE_TIME_PRODUCTS,
} from "./stripe";
export type { TokenCheckoutParams, SubscriptionCheckoutParams, OneTimePaymentParams, OneTimePaymentType } from "./stripe";

// PayPal
export {
  isPayPalConfigured,
  createTokenOrder,
  captureOrder,
  createSubscription as createPayPalSubscription,
  verifyWebhook as verifyPayPalWebhook,
} from "./paypal";
export type { PayPalOrderParams, PayPalCaptureResult, PayPalSubscriptionParams } from "./paypal";

// Courier
export {
  isCourierConfigured,
  getAvailableCouriers,
  createAWB,
  getEstimates,
  trackAWB,
} from "./courier";
export type { CourierProvider, AWBRequest, AWBResult, TrackingResult, CourierEstimate, ShippingAddress } from "./courier";

// Transport
export {
  getTransportLinks,
  hasTransportAffiliate,
} from "./transport";
export type { TransportProvider, TransportLink } from "./transport";

// Ads
export {
  isAdsEnabled,
  getAdsenseId,
  getCarbonServe,
  getActiveSponsor,
  AD_PLACEMENTS,
  SPONSOR_BANNERS,
} from "./ads";
export type { AdPlacement, SponsorBanner } from "./ads";

// API Keys
export {
  generateApiKey,
  isRateLimited,
  remainingRequests,
  isValidKeyFormat,
  estimateMonthlyRevenue,
  API_TIERS,
} from "./api-keys";
export type { ApiKey, ApiTier, ApiUsageEntry } from "./api-keys";
