import { describe, expect, it } from "vitest";
import {
  PUBLIC_EVENT_DETAIL_SELECT,
  PUBLIC_PROPERTY_DETAIL_SELECT,
  PUBLIC_SERVICE_DETAIL_SELECT,
  isUuid,
  mapPublicEventDetail,
  mapPublicPropertyDetail,
  mapPublicServiceDetail,
  normalizeListingImages,
} from "@/lib/listings/publicListingDetails";

const LISTING_ID = "11111111-1111-4111-8111-111111111111";
const ITEM_ID = "22222222-2222-4222-8222-222222222222";

describe("canonical public listing details", () => {
  it("accepts UUID route identifiers and rejects unsafe filters", () => {
    expect(isUuid(LISTING_ID)).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("11111111-1111-4111-8111-111111111111,owner_id.not.is.null")).toBe(
      false,
    );
  });

  it("normalizes mixed image payloads and removes duplicates", () => {
    expect(
      normalizeListingImages(
        "https://cdn.example/a.jpg",
        [
          { url: "https://cdn.example/b.jpg" },
          { secure_url: "https://cdn.example/c.jpg" },
          "https://cdn.example/a.jpg",
        ],
      ),
    ).toEqual([
      "https://cdn.example/a.jpg",
      "https://cdn.example/b.jpg",
      "https://cdn.example/c.jpg",
    ]);
  });

  it("maps a property from items plus the dedicated properties row", () => {
    const property = mapPublicPropertyDetail({
      id: LISTING_ID,
      item_id: ITEM_ID,
      owner_id: "private-owner-id",
      property_type: "villa",
      city: "Constanța",
      country_code: "RO",
      bedrooms: 3,
      bathrooms: 2,
      sleeps_max: 6,
      surface_total_sqm: "140",
      has_pool: true,
      photos: [{ url: "https://cdn.example/property.jpg" }],
      address_approximate: "private address",
      lat: 44.1,
      lon: 28.6,
      internal_notes: "private notes",
      items: {
        id: ITEM_ID,
        title: "Seaside villa",
        description: "Temporary home exchange near the sea.",
        status: "active",
        is_active: true,
        swap_wants_description: "A mountain cabin",
        perceived_value_tier: "large",
      },
    });

    expect(property).toMatchObject({
      id: LISTING_ID,
      itemId: ITEM_ID,
      title: "Seaside villa",
      location: "Constanța, RO",
      bedrooms: 3,
      bathrooms: 2,
      sleepsMax: 6,
      surfaceTotalSqm: 140,
      hasPool: true,
      swapWantsDescription: "A mountain cabin",
    });
    expect(JSON.stringify(property)).not.toContain("private address");
    expect(JSON.stringify(property)).not.toContain("private notes");
    expect(JSON.stringify(property)).not.toContain("private-owner-id");
  });

  it("maps a service from items plus services_listings", () => {
    const service = mapPublicServiceDetail({
      id: LISTING_ID,
      item_id: ITEM_ID,
      category_l1: "technical",
      category_l2: "software",
      service_name: "Web development",
      delivery_mode: "remote",
      experience_years: 8,
      certifications: [{ name: "Professional certificate" }],
      available_days: ["mon", "wed"],
      deliverables: ["Working website", "Documentation"],
      service_languages: ["ro", "en"],
      license_number: "private-license-number",
      insurance_provider: "private-insurer",
      items: {
        id: ITEM_ID,
        title: "Build a small website",
        description: "Remote web development offered in exchange for services.",
        status: "active",
        is_active: true,
      },
    });

    expect(service).toMatchObject({
      id: LISTING_ID,
      itemId: ITEM_ID,
      title: "Build a small website",
      deliveryMode: "remote",
      experienceYears: 8,
      certifications: ["Professional certificate"],
      availableDays: ["mon", "wed"],
      deliverables: ["Working website", "Documentation"],
      serviceLanguages: ["ro", "en"],
    });
    expect(JSON.stringify(service)).not.toContain("private-license-number");
    expect(JSON.stringify(service)).not.toContain("private-insurer");
  });

  it("maps an event without leaking transfer credentials or exact location", () => {
    const event = mapPublicEventDetail({
      id: LISTING_ID,
      item_id: ITEM_ID,
      event_group: "tickets",
      event_category: "concert",
      start_date: "2026-09-01",
      end_date: "2026-09-01",
      location_type: "physical",
      city: "Bucharest",
      country_code: "RO",
      capacity_total: 2,
      capacity_available: 1,
      is_transferable: true,
      booking_reference: "PRIVATE-PNR",
      online_url: "https://private.example/ticket",
      address: "private exact address",
      lat: 44.4,
      lon: 26.1,
      venue_seat: "private-seat-22",
      items: {
        id: ITEM_ID,
        title: "Concert ticket",
        description: "One transferable concert ticket.",
        status: "active",
        is_active: true,
      },
    });

    expect(event).toMatchObject({
      id: LISTING_ID,
      itemId: ITEM_ID,
      title: "Concert ticket",
      location: "Bucharest, RO",
      capacityTotal: 2,
      capacityAvailable: 1,
      isTransferable: true,
    });

    const publicPayload = JSON.stringify(event);
    expect(publicPayload).not.toContain("PRIVATE-PNR");
    expect(publicPayload).not.toContain("private.example");
    expect(publicPayload).not.toContain("private exact address");
    expect(publicPayload).not.toContain("private-seat-22");
  });

  it("keeps public database projections explicit and free of legacy JSON columns", () => {
    expect(PUBLIC_PROPERTY_DETAIL_SELECT).toContain("items!inner");
    expect(PUBLIC_SERVICE_DETAIL_SELECT).toContain("services").toBe(false);
    expect(PUBLIC_EVENT_DETAIL_SELECT).toContain("items!inner");

    for (const selection of [
      PUBLIC_PROPERTY_DETAIL_SELECT,
      PUBLIC_SERVICE_DETAIL_SELECT,
      PUBLIC_EVENT_DETAIL_SELECT,
    ]) {
      expect(selection).not.toContain("property_data");
      expect(selection).not.toContain("service_data");
      expect(selection).not.toContain("event_data");
      expect(selection).not.toContain("booking_reference");
      expect(selection).not.toContain("online_url");
      expect(selection).not.toContain("venue_seat");
      expect(selection).not.toContain("internal_notes");
      expect(selection).not.toContain("license_number");
    }
  });
});
