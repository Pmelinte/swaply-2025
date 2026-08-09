# Swaply — SEO Meta Copy

## Canonical public domain

All canonical public URLs use:

```text
https://www.swaply.world
```

Locale-prefixed public pages follow:

```text
https://www.swaply.world/[locale]/[page]
```

No unverified `swaply.io` URL, social handle, country count, courier count or paid-plan price should be emitted in metadata or structured data.

---

## Page Meta Tags

### Homepage

- **Meta Title:** Swaply — Swap What You Have for What You Need
- **Meta Description:** Discover listings, discuss an exchange and manage voluntary swaps on Swaply.
- **OG Description:** A platform for discovering and arranging voluntary exchanges of objects, properties, services and events.

### Objects

- **Meta Title:** Browse Objects to Swap | Swaply
- **Meta Description:** Browse objects offered for exchange and discover possible swaps on Swaply.

### Matching

- **Meta Title:** Matching | Swaply
- **Meta Description:** Review possible matches and matching signals for your listings. Matching results are suggestions, not guarantees.

### Chat

- **Meta Title:** Messages | Swaply
- **Meta Description:** Discuss exchange details with other Swaply participants using in-app messaging.

### Exchange

- **Meta Title:** Manage Your Exchanges | Swaply
- **Meta Description:** Review proposals, active exchanges and completion states in one place.

### About

- **Meta Title:** About Swaply — Built in Romania
- **Meta Description:** Learn about Swaply and its approach to voluntary exchange, product transparency and global-first design.

### Pricing

- **Meta Title:** Pricing | Swaply
- **Meta Description:** Core swapping is presented without a Swaply commission on the basic user-to-user swap. No unverified paid-plan price is advertised.

### Blog

- **Meta Title:** Swaply Blog — Guides & Stories
- **Meta Description:** Read guides, product updates and stories about exchange and the circular economy.

### Partners

- **Meta Title:** Partner with Swaply
- **Meta Description:** Contact Swaply about possible future logistics, travel, payment or service-provider collaboration. A provider conversation is not presented as a live integration.

### Login

- **Meta Title:** Sign In | Swaply
- **Meta Description:** Sign in to access your Swaply account and exchange workflows.

### Register

- **Meta Title:** Create Account | Swaply
- **Meta Description:** Create a Swaply account to list, discover and arrange voluntary exchanges.

### Profile

- **Meta Title:** Your Profile | Swaply
- **Meta Description:** Manage your Swaply profile, listings, reputation signals and account settings.

---

## Structured Data

### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Swaply",
  "url": "https://www.swaply.world",
  "logo": "https://www.swaply.world/logo-swaply.svg",
  "description": "Swaply is a web platform for discovering and arranging voluntary exchanges.",
  "foundingDate": "2025",
  "foundingLocation": {
    "@type": "Place",
    "name": "Romania"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "support@swaply.world",
    "contactType": "Customer support"
  }
}
```

Do not publish `sameAs` entries until ownership of each social account is verified.

### WebApplication

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Swaply",
  "url": "https://www.swaply.world",
  "applicationCategory": "Marketplace",
  "operatingSystem": "Web",
  "description": "Web platform for discovering and arranging voluntary exchanges."
}
```

Do not publish an aggregate rating with a zero or unverified rating count. Do not publish a paid price unless it is approved and tied to a verified Production offering.

---

## Robots and canonical guidance

```text
User-agent: *
Allow: /
Disallow: /api/
Disallow: /chat
Disallow: /profile

Sitemap: https://www.swaply.world/sitemap.xml
```

Each public page should have one canonical URL on `www.swaply.world` and locale-aware `hreflang` alternates. Authenticated/private content should not be intentionally indexed.