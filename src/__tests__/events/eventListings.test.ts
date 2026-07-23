import { describe, expect, it } from "vitest";
import { filterEventListings } from "@/lib/events/eventListings";

const now = new Date("2026-07-22T12:00:00Z");
const rows = [
  { id: "expired", title: "Old concert", status: "active", start_date: "2026-07-01", end_date: "2026-07-02", city: "Paris", capacity_available: 10, created_at: "2026-07-01" },
  { id: "concert", title: "Jazz night", status: "active", event_type_l1: "Concert", start_date: "2026-08-10", city: "Cluj", country: "Romania", capacity_available: 2, created_at: "2026-07-20" },
  { id: "sport", title: "Final match", status: "active", event_type_l1: "Sport", start_date: "2026-07-25", city: "Cluj", country: "Romania", capacity_available: 6, created_at: "2026-07-21" },
  { id: "paused", title: "Private event", status: "paused", start_date: "2026-07-25", city: "Cluj", capacity_available: 10, created_at: "2026-07-22" },
];

describe("filterEventListings", () => {
  it("keeps only active upcoming events by default", () => {
    expect(filterEventListings(rows, { sort: "soonest" }, now).map((r) => r.id)).toEqual(["sport", "concert"]);
  });

  it("filters by type, date, location and minimum seats", () => {
    expect(filterEventListings(rows, { type: "sport", location: "cluj", dateFrom: "2026-07-22", dateTo: "2026-07-31", minSeats: 5 }, now).map((r) => r.id)).toEqual(["sport"]);
  });

  it("sorts by available seats", () => {
    expect(filterEventListings(rows, { sort: "seats" }, now).map((r) => r.id)).toEqual(["sport", "concert"]);
  });
});
