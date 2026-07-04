export const REAL_USER_FLOWS = [
  {
    key: "signup",
    label: "Signup",
    route: "/login",
    goal: "A new user can create an account or reach the registration mode.",
    status: "needs-auth-test",
  },
  {
    key: "profile-onboarding",
    label: "Profile onboarding",
    route: "/profile",
    goal: "A signed-in user can complete the minimum profile required for exchanges.",
    status: "needs-auth-test",
  },
  {
    key: "add-object",
    label: "Add object",
    route: "/objects",
    goal: "A signed-in user can add, edit and deactivate an object.",
    status: "needs-auth-test",
  },
  {
    key: "upload-images",
    label: "Upload images",
    route: "/objects",
    goal: "Object images upload or fallback rendering is reliable.",
    status: "needs-storage-test",
  },
  {
    key: "ai-classification",
    label: "AI classification",
    route: "/objects",
    goal: "AI can suggest category, title, description and value metadata.",
    status: "needs-api-test",
  },
  {
    key: "explore-feed",
    label: "Explore feed",
    route: "/explore",
    goal: "Users can browse available objects and domains with stable cards.",
    status: "public-smoke-ready",
  },
  {
    key: "express-interest",
    label: "Express interest",
    route: "/matching",
    goal: "A user can express interest in a possible swap.",
    status: "needs-auth-test",
  },
  {
    key: "matching",
    label: "Matching",
    route: "/matching",
    goal: "Matching suggestions persist and can convert to a swap.",
    status: "needs-data-test",
  },
  {
    key: "chat",
    label: "Chat",
    route: "/chat",
    goal: "Participants can exchange messages inside a conversation.",
    status: "needs-data-test",
  },
  {
    key: "exchange-completion",
    label: "Exchange completion",
    route: "/exchange",
    goal: "A swap can move through logistics, confirmation, completion and feedback.",
    status: "needs-data-test",
  },
] as const;

export type RealUserFlow = (typeof REAL_USER_FLOWS)[number];
