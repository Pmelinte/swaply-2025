import type { AdvancedSwapProposal } from "./swapModeTypes";

export const ADVANCED_SWAP_PROPOSAL_EXAMPLES = [
  {
    id: "swap-demo-object-service",
    mode: "object_for_service",
    participants: [
      {
        userId: "demo-owner-camera",
        status: "accepted",
        givesAssetIds: ["asset-camera"],
        receivesAssetIds: ["asset-photo-repair-service"],
      },
      {
        userId: "demo-service-provider",
        status: "accepted",
        givesAssetIds: ["asset-photo-repair-service"],
        receivesAssetIds: ["asset-camera"],
      },
    ],
    offeredAssets: [
      {
        assetId: "asset-camera",
        ownerId: "demo-owner-camera",
        domain: "objects",
        label: "Compact camera",
        estimatedValue: 120,
        currency: "EUR",
      },
    ],
    requestedAssets: [
      {
        assetId: "asset-photo-repair-service",
        ownerId: "demo-service-provider",
        domain: "services",
        label: "Photo repair service",
        estimatedValue: 120,
        currency: "EUR",
      },
    ],
    tokenAdjustment: null,
    status: "awaiting_participant_consent",
    aiExplanation: null,
    requiresAllParticipantConsent: true,
  },
  {
    id: "swap-demo-circular-three",
    mode: "circular_swap_3_users",
    participants: [
      {
        userId: "demo-a",
        status: "accepted",
        givesAssetIds: ["asset-bike"],
        receivesAssetIds: ["asset-laptop"],
      },
      {
        userId: "demo-b",
        status: "accepted",
        givesAssetIds: ["asset-laptop"],
        receivesAssetIds: ["asset-camera"],
      },
      {
        userId: "demo-c",
        status: "invited",
        givesAssetIds: ["asset-camera"],
        receivesAssetIds: ["asset-bike"],
      },
    ],
    offeredAssets: [
      { assetId: "asset-bike", ownerId: "demo-a", domain: "objects", label: "Bike", estimatedValue: 180, currency: "EUR" },
      { assetId: "asset-laptop", ownerId: "demo-b", domain: "objects", label: "Laptop", estimatedValue: 220, currency: "EUR" },
      { assetId: "asset-camera", ownerId: "demo-c", domain: "objects", label: "Camera", estimatedValue: 160, currency: "EUR" },
    ],
    requestedAssets: [],
    tokenAdjustment: null,
    status: "ai_suggested",
    aiExplanation: null,
    requiresAllParticipantConsent: true,
  },
  {
    id: "swap-demo-token-adjusted",
    mode: "token_adjusted_swap",
    participants: [
      {
        userId: "demo-tablet-owner",
        status: "confirmed",
        givesAssetIds: ["asset-tablet"],
        receivesAssetIds: ["asset-headphones", "asset-swapleni-adjustment"],
      },
      {
        userId: "demo-headphones-owner",
        status: "confirmed",
        givesAssetIds: ["asset-headphones", "asset-swapleni-adjustment"],
        receivesAssetIds: ["asset-tablet"],
      },
    ],
    offeredAssets: [
      { assetId: "asset-tablet", ownerId: "demo-tablet-owner", domain: "objects", label: "Tablet", estimatedValue: 250, currency: "EUR" },
      { assetId: "asset-headphones", ownerId: "demo-headphones-owner", domain: "objects", label: "Headphones", estimatedValue: 170, currency: "EUR" },
    ],
    requestedAssets: [],
    tokenAdjustment: {
      payerUserId: "demo-headphones-owner",
      receiverUserId: "demo-tablet-owner",
      amount: 80,
      currency: "swapleni",
      reason: "value_gap",
    },
    status: "ready_for_exchange",
    aiExplanation: null,
    requiresAllParticipantConsent: true,
  },
] as const satisfies readonly AdvancedSwapProposal[];
