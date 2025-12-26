import { nanoid } from "nanoid";
import { Announcement, Conversation, InfoStats, Item, MatchCandidate, SwapIntent, UserProfile } from "./types";

export const mockUser: UserProfile = {
  id: "user-1",
  email: "ana.swaply@example.com",
  displayName: "Ana Popescu",
  firstName: "Ana",
  avatarUrl: "https://ui-avatars.com/api/?name=Ana+Popescu",
  bio: "Găsesc obiecte noi pentru proiecte DIY și donez ce nu mai folosesc.",
  languages: ["ro", "en"],
  badge: "premium",
  location: {
    country: "România",
    region: "Cluj",
    city: "Cluj-Napoca",
    postalCode: "400000",
    coordinates: { lat: 46.77, lng: 23.59 },
    travelRadiusKm: 50,
  },
  visibility: {
    publicProfile: true,
    itemsVisibility: "public",
    showExactLocation: false,
    showLastSeen: true,
  },
  notifications: {
    email: true,
    push: true,
    chat: true,
    matches: true,
    swapUpdates: true,
  },
  swapPreferences: {
    logistics: "flexible",
    notes: "Prefer întâlniri în zone publice. Curier doar pentru obiecte mici.",
  },
  security: {
    twoFactorEnabled: true,
    method: "totp",
    passkeysEnabled: true,
  },
  stats: {
    tokens: 240,
    reputation: "trusted",
    completedSwaps: 12,
    activeListings: 4,
  },
};

const nowIso = new Date().toISOString();

export const mockItems: Item[] = [
  {
    id: "item-1",
    ownerId: mockUser.id,
    title: "Bicicletă urbană hibrid",
    category: "Sport & Outdoor",
    condition: "good",
    description: "Cadru ușor, nevoie de reglaj frâne. Ideală pentru oraș.",
    wishlist: "Accesorii camping sau un monitor 24”",
    status: "active",
    isActive: true,
    createdAt: nowIso,
    location: "Cluj-Napoca",
    aiSuggestedTags: ["bicicletă", "transport", "outdoor"],
    userFinalTags: ["bicicletă", "urban", "second-hand"],
    photos: ["https://images.unsplash.com/photo-1529429617124-aee4a233f16b?w=400"],
  },
  {
    id: "item-2",
    ownerId: mockUser.id,
    title: "Set Lego Technic incomplet",
    category: "Hobby & Jocuri",
    condition: "used",
    description: "Lipsesc câteva piese, potrivit pentru proiecte custom.",
    wishlist: "Jocuri de societate sau puzzle-uri mari",
    status: "reserved",
    isActive: true,
    createdAt: nowIso,
    location: "Cluj-Napoca",
    aiSuggestedTags: ["lego", "technic", "piese"],
    userFinalTags: ["lego", "technic"],
    photos: ["https://images.unsplash.com/photo-1582719478248-54e9f2a41349?w=400"],
  },
  {
    id: "item-3",
    ownerId: "user-2",
    title: "Monitor 24'' IPS",
    category: "Electronice",
    condition: "good",
    description: "Funcționează perfect, fără pixeli morți. Include cablu HDMI.",
    wishlist: "Bicicletă urbană sau aparat foto instant",
    status: "active",
    isActive: true,
    createdAt: nowIso,
    location: "Brașov",
    aiSuggestedTags: ["monitor", "office"],
    userFinalTags: ["monitor", "24-inch"],
    photos: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"],
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    message: "Funcție nouă: badge-urile Premium apar pe hartă cu vizibilitate extinsă.",
    priority: "info",
  },
  {
    id: "ann-2",
    message: "Profil incomplet – adaugă locația pentru a vedea utilizatori apropiați.",
    priority: "warning",
  },
];

export const mockMatches: MatchCandidate[] = [
  {
    id: "match-1",
    itemOffered: mockItems[0],
    itemRequested: mockItems[2],
    compatibilityScore: 92,
    reason:
      "Ambele obiecte sunt listate în aceeași regiune, iar preferințele de schimb se aliniază (bicicletă ↔ monitor).",
    aiTrace: "hf:swaply-matcher-v1",
  },
  {
    id: "match-2",
    itemOffered: mockItems[1],
    itemRequested: mockItems[0],
    compatibilityScore: 75,
    reason:
      "Interese complementare detectate de AI; fallback manual dacă serviciul nu răspunde.",
    manualFallbackReason: "Recomandare manuală bazată pe categorie și locație similară.",
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    participantId: "user-2",
    participantName: "Mihai Georgescu",
    participantBadge: "free",
    lastMessage: "Ne vedem la mall vineri?",
    updatedAt: nowIso,
    translationEnabled: true,
    messages: [
      {
        id: nanoid(),
        conversationId: "conv-1",
        senderId: "user-2",
        content: "Salut! Interesat de bicicleta ta.",
        createdAt: nowIso,
        attachments: [],
      },
      {
        id: nanoid(),
        conversationId: "conv-1",
        senderId: mockUser.id,
        content: "Putem discuta la mall vineri seara?",
        createdAt: nowIso,
        translated: true,
        attachments: [
          { id: nanoid(), name: "traseu.pdf", safe: true },
        ],
      },
    ],
  },
  {
    id: "conv-2",
    participantId: "user-3",
    participantName: "Ioana M.",
    participantBadge: "platinum",
    lastMessage: "Atașament verificat, putem confirma swap-ul.",
    updatedAt: nowIso,
    translationEnabled: false,
    messages: [
      {
        id: nanoid(),
        conversationId: "conv-2",
        senderId: "user-3",
        content: "Atașez dovada de expediere (scanează automat).",
        createdAt: nowIso,
        attachments: [
          { id: nanoid(), name: "awb.png", safe: true },
        ],
        moderated: true,
      },
    ],
  },
];

export const mockSwaps: SwapIntent[] = [
  {
    id: "swap-1",
    requesterId: mockUser.id,
    responderId: "user-2",
    requesterItemId: mockItems[0].id,
    responderItemId: mockItems[2].id,
    status: "scheduled",
    logistics: {
      locationType: "public_spot",
      meetupPoint: "Iulius Mall, intrarea principală",
    },
    notifications: [
      "Notificare chat trimisă",
      "Remind cu 24h înainte de întâlnire",
    ],
    feedback: undefined,
  },
];

export const mockInfoStats: InfoStats = {
  globalSwaps: 8421,
  activeUsers: 3560,
  premiumShare: 0.38,
  tokensIssued: 52300,
};

export const mockFeatureToggles = {
  aiEnabled: true,
  mapsEnabled: false,
  cloudinaryEnabled: false,
  supabaseConfigured: false,
};

export function createEmptyItem(ownerId: string): Item {
  return {
    id: nanoid(),
    ownerId,
    title: "",
    category: "General",
    condition: "good",
    description: "",
    wishlist: "",
    status: "active",
    isActive: true,
    createdAt: new Date().toISOString(),
    location: "",
    photos: [],
  };
}
