import type { SwaplyStoryDraft } from "./storyTypes";

export const STORY_PREVIEW_SEEDS = [
  {
    id: "story-camera-tripod",
    exchangeId: "exchange-demo-camera-tripod",
    authorId: "demo-author-eu",
    partnerId: "demo-partner-eu",
    domain: "objects",
    title: "A camera found a second life with a young filmmaker",
    body: "A compact camera that was no longer used became part of a student film kit. The exchange stayed simple, respectful and local, with both people confirming the story before publication.",
    media: [],
    visibility: "public",
    anonymous: true,
    sourceLocale: "en",
    status: "pending_moderation",
    consent: {
      author: true,
      partner: true,
      moderated: true,
    },
    publishedAt: "2026-01-12T10:00:00.000Z",
  },
  {
    id: "story-service-property",
    exchangeId: "exchange-demo-service-property",
    authorId: "demo-author-global",
    partnerId: "demo-partner-global",
    domain: "services",
    title: "Design help exchanged for a quiet weekend workspace",
    body: "A designer helped improve a small business presentation and received access to a quiet weekend workspace. The public version keeps the people anonymous and removes exact location details.",
    media: [],
    visibility: "public",
    anonymous: true,
    sourceLocale: "en",
    status: "pending_moderation",
    consent: {
      author: true,
      partner: true,
      moderated: true,
    },
    publishedAt: "2026-02-03T10:00:00.000Z",
  },
] as const satisfies readonly SwaplyStoryDraft[];
