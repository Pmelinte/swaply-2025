/**
 * Swaply Payments — barrel export for all monetization integrations.
 *
 *  1. Stripe (Visa/MC/Apple Pay/Google Pay) — tokens + subscriptions + one-time
 *  2. PayPal — tokens + subscriptions
 *  3. Courier affiliate (FanCourier/Sameday/Cargus)
 *  4. DHL Express (international shipping)
 *  5. Transport affiliate (Bolt/Uber/Waze)
 *  6. Ground transport (FlixBus/CFR/Omio/BlaBlaCar)
 *  7. Escrow (secure swap transactions)
 *  8. Booking/Airbnb/VRBO (accommodation affiliate)
 *  9. Flight tickets (Kiwi/Skyscanner)
 * 10. Car rental (Rentalcars/DiscoverCars/AutoEurope)
 * 11. Insurance (shipping/travel/property via XCover)
 * 12. Packaging (supplies + Swaply kits)
 * 13. Boost & Featured (via Stripe)
 * 14. Swap Insurance (via Stripe)
 * 15. Business Accounts (via Stripe subscriptions)
 * 16. Ads (AdSense/Carbon/Sponsors)
 * 17. API Keys / White-Label
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

// Courier (Romania)
export {
  isCourierConfigured,
  getAvailableCouriers,
  createAWB,
  getEstimates,
  trackAWB,
} from "./courier";
export type { CourierProvider, AWBRequest, AWBResult, TrackingResult, CourierEstimate, ShippingAddress } from "./courier";

// DHL Express (International)
export {
  isDHLConfigured,
  getDHLRates,
  createDHLShipment,
  trackDHLShipment,
} from "./dhl";
export type { DHLAddress, DHLShipmentRequest, DHLRateEstimate, DHLShipmentResult, DHLTrackingResult } from "./dhl";

// Transport (Ride-hailing)
export {
  getTransportLinks,
  hasTransportAffiliate,
} from "./transport";
export type { TransportProvider, TransportLink } from "./transport";

// Ground Transport (Bus/Train/Carpool)
export {
  isGroundTransportConfigured,
  getGroundTransportLinks,
  estimateGroundTransport,
} from "./ground-transport";
export type { GroundTransportProvider, GroundTransportMode, GroundTransportSearchParams, GroundTransportLink, GroundTransportEstimate } from "./ground-transport";

// Escrow
export {
  isEscrowConfigured,
  createEscrowTransaction,
  performEscrowAction,
  getEscrowStatus,
} from "./escrow";
export type { EscrowStatus, EscrowParty, EscrowCreateRequest, EscrowTransaction, EscrowAction, EscrowActionResult } from "./escrow";

// Accommodation (Booking/Airbnb/VRBO)
export {
  isBookingConfigured,
  isAirbnbConfigured,
  getAccommodationLinks,
  getSuggestedAccommodation,
  getProviderLink,
} from "./booking-affiliate";
export type { AccommodationProvider, AccommodationSearchParams, AccommodationLink } from "./booking-affiliate";

// Flights
export {
  isKiwiConfigured,
  getFlightAffiliateLinks,
  searchFlights,
  estimateFlightPrice,
} from "./flights";
export type { FlightProvider, FlightSearchParams, FlightResult, FlightSearchResponse, FlightAffiliateLink } from "./flights";

// Car Rental
export {
  isCarRentalConfigured,
  getCarRentalLinks,
  suggestCarRental,
} from "./car-rental";
export type { CarRentalProvider, CarRentalSearchParams, CarRentalLink } from "./car-rental";

// Insurance
export {
  isInsuranceConfigured,
  getInsuranceQuote,
  purchaseInsurance,
  fileClaim,
  getTravelInsuranceLinks,
} from "./insurance";
export type { InsuranceType, InsuranceQuoteRequest, InsuranceQuote, InsurancePolicy, InsuranceClaim, InsuranceClaimResult } from "./insurance";

// Packaging
export {
  recommendPackaging,
  getPackagingSupplierLinks,
  getSwapKits,
  getPackagingGuidance,
} from "./packaging";
export type { PackagingSize, PackagingMaterial, PackagingRecommendation, PackagingSupplierLink, PackagingKit } from "./packaging";

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
