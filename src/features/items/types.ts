// src/features/items/types.ts

// Starea fizică a obiectului (pentru UX + filtrare + trust)
export type ItemCondition =
  | "new"          // nou, nefolosit
  | "like_new"     // ca nou, folosit foarte puțin
  | "very_good"    // foarte bun
  | "good"         // bun, urme normale de uzură
  | "acceptable";  // acceptabil, clar folosit

// Starea de viață a anunțului în aplicație
export type ItemStatus =
  | "draft"        // încă nu e public
  | "active"       // apare în feed / swipe
  | "archived";    // scos din circulație

// Sursele posibile pentru titlu / categorie generate de AI
export type AiSource =
  | "image_classification"
  | "text_classification"
  | "hybrid";

// Ce știm despre clasificarea AI pentru un obiect
export interface ItemAiMetadata {
  // de ex: "vit-gpt2-swaply-v1"
  model?: string;

  // eticheta principală venită din clasificarea imaginii
  primaryLabel?: string;

  // scor de încredere 0–1 pentru eticheta principală
  confidence?: number;

  // alte etichete alternative pe care le-a dat modelul
  alternativeLabels?: string[];

  // titlu sugerat de AI (pe care îl putem propune ca default)
  suggestedTitle?: string;

  // categorie / subcategorie sugerate de AI
  suggestedCategory?: string;
  suggestedSubcategory?: string;

  // tags sugerate automat
  suggestedTags?: string[];

  // sursa principală (imagine / text / hibrid)
  source?: AiSource;
}

// O imagine asociată unui obiect (în Cloudinary)
export interface ItemImage {
  id?: string; // poate lipsi în formular, apare după salvare în DB

  // URL-ul complet (delivery) – folosit direct în <Image />
  url: string;

  // public_id din Cloudinary (pentru transformări / delete)
  publicId?: string;

  // dacă este imaginea principală
  isPrimary?: boolean;

  // metadate opționale
  width?: number;
  height?: number;
  format?: string;
}

// Obiectul așa cum îl vedem în UI (view model complet)
export interface Item {
  id: string;
  ownerId: string; // user_id din Supabase

  title: string;
  description: string;

  // Sistem flexibil de categorii – pentru început string-uri simple
  category: string;
  subcategory?: string;

  // Liste de etichete
  tags: string[];

  condition: ItemCondition;
  status: ItemStatus;

  // Pot fi folosite pentru filtrare / “close to you”
  locationCity?: string;
  locationCountry?: string;

  // Optional: estimare valoare (în viitor pentru scoring de schimb)
  approximateValue?: number;
  currency?: string;

  // Imagini asociate
  images: ItemImage[];

  // Info AI folosită la titlu / categorii / taguri
  aiMetadata?: ItemAiMetadata;

  // Timestamps din DB (ISO string)
  createdAt: string;
  updatedAt: string;
}

// Datele așa cum vin din formularul de “Add / Edit Item”
// (nu toate sunt obligatorii încă)
export interface ItemFormData {
  title: string;
  description: string;

  category: string;
  subcategory?: string;

  tags: string[];

  condition: ItemCondition;

  // localizare opțională
  locationCity?: string;
  locationCountry?: string;

  // valoare aproximativă, opțional
  approximateValue?: number;
  currency?: string;

  // imaginile din formular (încărcate sau deja existente)
  images: ItemImage[];

  // info AI pentru UX (de ex. preview de titlu / tags sugerate)
  aiMetadata?: ItemAiMetadata;
}

// Răspunsul standard pentru un endpoint de clasificare AI
// (ex: route API care folosește Hugging Face)
export interface ItemClassificationRequest {
  // URL Cloudinary al imaginii principale sau file path temporar
  imageUrl?: string;

  // descrierea scrisă de utilizator
  description?: string;

  // limbă în care dorim titlu / tags (ex: "ro", "en")
  locale: string;
}

export interface ItemClassificationResponse {
  ok: boolean;

  // în caz de eroare
  error?: string;

  // datele sugerate de AI
  suggestedTitle?: string;
  suggestedCategory?: string;
  suggestedSubcategory?: string;
  suggestedTags?: string[];

  primaryLabel?: string;
  confidence?: number;

  // pentru debugging / logging
  rawModelOutput?: unknown;
}
