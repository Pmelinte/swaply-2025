/**
 * Sync translations: merge missing keys from en.json into all language files.
 * For major languages, provides translated values for new feature keys.
 * For other languages, falls back to English values.
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const MESSAGES_DIR = join(import.meta.dirname, "..", "src", "messages");

// Read en.json as the reference
const en = JSON.parse(readFileSync(join(MESSAGES_DIR, "en.json"), "utf-8"));

/**
 * Deep merge: add missing keys from source into target
 * Returns the merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (!(key in result)) {
      result[key] = source[key];
    } else if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof result[key] === "object" &&
      result[key] !== null
    ) {
      result[key] = deepMerge(result[key], source[key]);
    }
  }
  return result;
}

/**
 * Count missing keys (deep)
 */
function countMissing(target, source) {
  let count = 0;
  for (const key of Object.keys(source)) {
    if (!(key in target)) {
      if (typeof source[key] === "object" && !Array.isArray(source[key])) {
        count += Object.keys(flattenObject(source[key])).length;
      } else {
        count++;
      }
    } else if (
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      typeof target[key] === "object"
    ) {
      count += countMissing(target[key], source[key]);
    }
  }
  return count;
}

function flattenObject(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

// Translations for new feature keys per major language
const TRANSLATIONS = {
  // French
  fr: {
    profile: {
      achievements: "Réalisations",
      achievementsDesc: "Débloquez des trophées en complétant des échanges, listant des objets et étant actif",
      tokenShop: "Boutique de Jetons",
      tokenShopDesc: "Dépensez vos jetons gagnés en boosts et fonctionnalités premium",
      balance: "Solde",
      buy: "Acheter",
      accountPause: "Pause du Compte",
      accountPauseDesc: "Masquez temporairement votre profil et vos objets. Vous pouvez reprendre à tout moment.",
      pauseAccountButton: "Mettre en pause mon compte",
      accountPaused: "Compte en pause",
      resumeAccountButton: "Reprendre le compte",
      dataExport: "Exporter Mes Données (RGPD)",
      dataExportDesc: "Téléchargez toutes vos données incluant profil, objets, messages, échanges et jetons en fichier JSON.",
      downloadMyData: "Télécharger mes données",
    },
    change: {
      houseSwapMode: "Type d'échange",
      houseMode_simultaneous: "Simultané",
      houseModeDesc_simultaneous: "Les deux parties voyagent en même temps (ex: montagne ↔ mer)",
      houseMode_non_simultaneous: "Non-simultané",
      houseModeDesc_non_simultaneous: "Dates différentes — planification flexible",
      houseMode_one_way_hosting: "Hébergement unidirectionnel",
      houseModeDesc_one_way_hosting: "Hébergez avec compensation en jetons",
      houseMode_permanent: "Permanent",
      houseModeDesc_permanent: "Échange de logement à long terme ou permanent",
      housePropertyType: "Type de propriété",
      propType_apartment: "Appartement",
      propType_house: "Maison",
      propType_villa: "Villa",
      propType_cabin: "Chalet",
      propType_studio: "Studio",
      propType_room: "Chambre",
      houseBedrooms: "Chambres",
      houseBathrooms: "Salles de bain",
      houseMaxGuests: "Invités max",
      houseAmenities: "Équipements",
      amenity_wifi: "WiFi",
      amenity_parking: "Parking",
      amenity_ac: "Climatisation",
      amenity_heating: "Chauffage",
      amenity_washer: "Lave-linge",
      amenity_kitchen: "Cuisine",
      amenity_pool: "Piscine",
      amenity_garden: "Jardin",
      amenity_pet_friendly: "Animaux acceptés",
      amenity_tv: "TV",
      amenity_workspace: "Espace de travail",
      houseRulesTitle: "Règles de la maison",
      rule_no_smoking: "Non-fumeurs",
      rule_no_pets: "Pas d'animaux",
      rule_no_parties: "Pas de fêtes",
      rule_no_shoes: "Pas de chaussures",
      rule_quiet_hours: "Heures calmes",
      rule_max_guests: "Limite d'invités",
      houseDateFrom: "Disponible à partir de",
      houseDateTo: "Disponible jusqu'au",
      houseDesc: "Description de la propriété",
      houseDescPlaceholder: "Décrivez votre propriété, ses environs et ce qui la rend spéciale...",
      houseNeighborhood: "Quartier et environs",
      houseNeighborhoodPlaceholder: "Attractions à proximité, transports, supermarché, hôpital...",
      houseInspection: "Checklist d'inspection",
      houseInspectionDesc: "Documentez l'état de la propriété avec photos et notes avant et après chaque séjour.",
      houseInspectionPlaceholder: "Notez tout dommage existant, objets spéciaux ou détails importants...",
      houseEmergencyContact: "Contact d'urgence",
      houseEmergencyPlaceholder: "Téléphone du voisin, numéros d'urgence locaux...",
      houseInsurance: "Confirmation d'assurance",
      houseInsuranceDesc: "Je confirme avoir vérifié que mon assurance voyage/habitation couvre cet échange.",
      serviceCategory: "Catégorie de service",
      svcCat_creative: "Créatif",
      svcCat_technical: "Technique",
      svcCat_education: "Éducation",
      svcCat_physical: "Physique",
      svcCat_professional: "Professionnel",
      svcCatDesc_creative: "Dessin, photographie, musique, écriture, montage vidéo",
      svcCatDesc_technical: "Programmation, analyse de données, support IT, impression 3D",
      svcCatDesc_education: "Tutorat, cours de langues, cours de cuisine",
      svcCatDesc_physical: "Aide au déménagement, jardinage, garde d'animaux, ménage",
      svcCatDesc_professional: "Conseil juridique, comptabilité, marketing, consulting",
      serviceSkillName: "Compétence offerte",
      serviceSkillPlaceholder: "ex: Portrait dessiné, Programmation Python...",
      serviceLevel: "Niveau de compétence",
      svcLevelBeginner: "Débutant",
      svcLevelIntermediate: "Intermédiaire",
      svcLevelExpert: "Expert",
      serviceDeliveryMethod: "Méthode de livraison",
      svcDeliveryRemote: "À distance",
      svcDeliveryInPerson: "En personne",
      svcDeliveryHybrid: "Hybride",
      serviceHoursPerWeek: "Heures disponibles par semaine",
      servicePortfolioLink: "Portfolio / exemples",
      servicePortfolioPlaceholder: "Lien vers portfolio, GitHub, Instagram, etc.",
      serviceTimeBank: "Banque de Temps",
      serviceTimeBankDesc: "1 heure de n'importe quel service = 1 heure. Échange équitable basé sur le temps.",
      svcTimeEarned: "Heures gagnées",
      svcTimeSpent: "Heures dépensées",
      svcTimeBalance: "Solde",
      serviceTimeBankNote: "Les crédits de temps peuvent être gagnés en fournissant des services et dépensés avec n'importe quel utilisateur.",
      serviceMilestones: "Jalons et livrables",
      serviceMilestonePlaceholder: "Ajouter un jalon (ex: 'Maquette de design prête')...",
      serviceMilestoneAdd: "Ajouter",
      serviceRatingDimensions: "Dimensions d'évaluation",
      svcRateQuality: "Qualité",
      svcRatePunctuality: "Ponctualité",
      svcRateCommunication: "Communication",
      cancelReasonTitle: "Pourquoi annulez-vous ?",
      cancelReasonDesc: "Aidez-nous à comprendre — vos retours améliorent la plateforme.",
      cancelReason_changed_mind: "J'ai changé d'avis",
      cancelReason_found_better: "J'ai trouvé un meilleur échange",
      cancelReason_no_response: "Le partenaire ne répond pas",
      cancelReason_condition_mismatch: "L'état de l'objet ne correspond pas",
      cancelReason_logistics_issue: "Problème logistique",
      cancelReason_safety_concern: "Préoccupation de sécurité",
      cancelReason_other: "Autre raison",
      cancelNotePlaceholder: "Dites-nous en plus (optionnel)...",
      keepSwap: "Garder l'échange",
      confirmCancel: "Annuler l'échange",
      logistics: "Logistique",
      logisticsDescription: "Choisissez comment organiser l'échange",
      methodPublicSpot: "Lieu public",
      methodPublicSpotDesc: "Rendez-vous dans un lieu public sûr",
      methodCourier: "Coursier",
      methodCourierDesc: "Envoi par service de livraison",
      methodPickup: "Collecte",
      methodPickupDesc: "Le partenaire vient récupérer",
      meetupPoint: "Point de rencontre",
      meetupPointPlaceholder: "ex: Centre commercial...",
      safeMeetingPoints: "Points de rencontre sûrs",
      safePointPolice: "Commissariat de police",
      safePointMall: "Centre commercial",
      safePointCafe: "Café public",
      safePointBank: "Banque / distributeur",
      safePointMetro: "Station de métro",
      safeMeetingTip: "Choisissez des lieux publics, bien éclairés et surveillés.",
      saveLogistics: "Enregistrer",
      logisticsSaved: "Enregistré !",
      logisticsHelp: "Les détails logistiques sont partagés avec votre partenaire d'échange.",
      courierTracking: "Numéro de suivi",
      courierTrackingPlaceholder: "Entrez le numéro AWB/suivi...",
      swapType: "Type d'échange",
      swapTypeDesc: "Sélectionnez comment vous souhaitez faire l'échange",
      typeLocal: "Local",
      typeLocalDesc: "Rencontre en personne à proximité",
      typeCourierNational: "Coursier national",
      typeCourierNationalDesc: "Envoi national par coursier",
      typeCourierInternational: "Coursier international",
      typeCourierInternationalDesc: "Envoi international par coursier",
      typeVacation: "Vacances",
      typeVacationDesc: "Échange lors de voyages",
      typeHouseSwap: "Échange de maison",
      typeHouseSwapDesc: "Échangez votre logement",
      typeServiceSwap: "Échange de services",
      typeServiceSwapDesc: "Échangez des compétences et services",
      meetupDateTime: "Date et heure de rencontre",
      meetupDateTimePlaceholder: "ex: Samedi 15h...",
      awbOutgoing: "AWB sortant",
      awbIncoming: "AWB entrant",
      internationalLeg1: "Suivi segment 1",
      internationalLeg2: "Suivi segment 2",
      travelDates: "Dates de voyage",
      travelDatesPlaceholder: "ex: 10-15 mai...",
      houseDuration: "Durée du séjour",
      houseDurationPlaceholder: "ex: 1 semaine, 3 nuits...",
      serviceDescription: "Description du service",
      serviceDescPlaceholder: "Décrivez le service que vous proposez ou demandez...",
      checklist: "Checklist pré-échange",
      checkVerifyPhotos: "Vérifier les photos correspondent à l'objet",
      checkAgreeLogistics: "Accord sur la logistique",
      checkConfirmCondition: "Confirmer l'état de l'objet",
      checkSetMeetup: "Fixer le point de rencontre",
      checkBothConfirm: "Les deux parties confirment",
      dualConfirmRequired: "Les deux parties doivent confirmer pour finaliser l'échange.",
      qrConfirmation: "Confirmation QR",
      qrConfirmationDesc: "Utilisez ce code pour vérifier l'échange en personne",
      qrSwapCode: "Code d'échange",
      qrInstructions: "Montrez ce code à votre partenaire lors de la rencontre.",
      qrStep1: "Rencontrez votre partenaire au point convenu",
      qrStep2: "Vérifiez les objets en personne",
      qrStep3: "Confirmez l'échange dans l'app",
      qrCopyCode: "Copier le code",
      availability: "Votre disponibilité",
      availabilityDesc: "Indiquez à votre partenaire quand vous êtes libre",
      availMorning: "Matin",
      availAfternoon: "Après-midi",
      availEvening: "Soir",
    },
  },
  // German
  de: {
    profile: {
      achievements: "Erfolge",
      achievementsDesc: "Schalte Trophäen frei durch Tauschgeschäfte, Angebote und Aktivität",
      tokenShop: "Token-Shop",
      tokenShopDesc: "Gib deine verdienten Token für Boosts und Premium-Funktionen aus",
      balance: "Guthaben",
      buy: "Kaufen",
      accountPause: "Konto pausieren",
      accountPauseDesc: "Verberge dein Profil und deine Objekte vorübergehend. Du kannst jederzeit fortfahren.",
      pauseAccountButton: "Konto pausieren",
      accountPaused: "Konto pausiert",
      resumeAccountButton: "Konto fortsetzen",
      dataExport: "Meine Daten exportieren (DSGVO)",
      dataExportDesc: "Lade alle deine Daten als JSON-Datei herunter.",
      downloadMyData: "Meine Daten herunterladen",
    },
    change: {
      houseSwapMode: "Tauschtyp",
      houseMode_simultaneous: "Gleichzeitig",
      houseModeDesc_simultaneous: "Beide Parteien reisen gleichzeitig (z.B. Berge ↔ Meer)",
      houseMode_non_simultaneous: "Nicht gleichzeitig",
      houseModeDesc_non_simultaneous: "Verschiedene Termine — flexible Planung",
      houseMode_one_way_hosting: "Einseitige Unterbringung",
      houseModeDesc_one_way_hosting: "Gastgeber mit Token-Vergütung",
      houseMode_permanent: "Dauerhaft",
      houseModeDesc_permanent: "Langzeit- oder dauerhafter Wohnungstausch",
      housePropertyType: "Immobilientyp",
      propType_apartment: "Wohnung",
      propType_house: "Haus",
      propType_villa: "Villa",
      propType_cabin: "Hütte",
      propType_studio: "Studio",
      propType_room: "Zimmer",
      houseBedrooms: "Schlafzimmer",
      houseBathrooms: "Badezimmer",
      houseMaxGuests: "Max. Gäste",
      houseAmenities: "Ausstattung",
      amenity_wifi: "WLAN",
      amenity_parking: "Parkplatz",
      amenity_ac: "Klimaanlage",
      amenity_heating: "Heizung",
      amenity_washer: "Waschmaschine",
      amenity_kitchen: "Küche",
      amenity_pool: "Pool",
      amenity_garden: "Garten",
      amenity_pet_friendly: "Haustierfreundlich",
      amenity_tv: "TV",
      amenity_workspace: "Arbeitsplatz",
      houseRulesTitle: "Hausregeln",
      rule_no_smoking: "Nicht rauchen",
      rule_no_pets: "Keine Haustiere",
      rule_no_parties: "Keine Partys",
      rule_no_shoes: "Keine Schuhe",
      rule_quiet_hours: "Ruhezeiten",
      rule_max_guests: "Gästelimit",
      houseDateFrom: "Verfügbar ab",
      houseDateTo: "Verfügbar bis",
      houseDesc: "Immobilienbeschreibung",
      houseDescPlaceholder: "Beschreiben Sie Ihre Immobilie und ihre Besonderheiten...",
      houseNeighborhood: "Umgebung",
      houseNeighborhoodPlaceholder: "Sehenswürdigkeiten, Verkehr, Supermarkt, Krankenhaus...",
      houseInspection: "Inspektions-Checkliste",
      houseInspectionDesc: "Dokumentieren Sie den Zustand der Immobilie mit Fotos und Notizen.",
      houseInspectionPlaceholder: "Notieren Sie bestehende Schäden oder wichtige Details...",
      houseEmergencyContact: "Notfallkontakt",
      houseEmergencyPlaceholder: "Nachbar-Telefon, lokale Notfallnummern...",
      houseInsurance: "Versicherungsbestätigung",
      houseInsuranceDesc: "Ich bestätige, dass meine Reise-/Hausratversicherung diesen Tausch abdeckt.",
      serviceCategory: "Dienstleistungskategorie",
      svcCat_creative: "Kreativ",
      svcCat_technical: "Technisch",
      svcCat_education: "Bildung",
      svcCat_physical: "Physisch",
      svcCat_professional: "Professionell",
      svcCatDesc_creative: "Zeichnen, Fotografie, Musik, Schreiben, Videobearbeitung",
      svcCatDesc_technical: "Programmierung, Datenanalyse, IT-Support, 3D-Druck",
      svcCatDesc_education: "Nachhilfe, Sprachkurse, Kochkurse",
      svcCatDesc_physical: "Umzugshilfe, Gartenarbeit, Tierbetreuung, Reinigung",
      svcCatDesc_professional: "Rechtsberatung, Buchhaltung, Marketing, Beratung",
      serviceSkillName: "Angebotene Fähigkeit",
      serviceSkillPlaceholder: "z.B. Porträtzeichnung, Python-Programmierung...",
      serviceLevel: "Fähigkeitsstufe",
      svcLevelBeginner: "Anfänger",
      svcLevelIntermediate: "Fortgeschritten",
      svcLevelExpert: "Experte",
      serviceDeliveryMethod: "Liefermethode",
      svcDeliveryRemote: "Remote",
      svcDeliveryInPerson: "Persönlich",
      svcDeliveryHybrid: "Hybrid",
      serviceHoursPerWeek: "Verfügbare Stunden pro Woche",
      servicePortfolioLink: "Portfolio / Beispiele",
      servicePortfolioPlaceholder: "Link zu Portfolio, GitHub, Instagram, etc.",
      serviceTimeBank: "Zeitbank",
      serviceTimeBankDesc: "1 Stunde jeder Dienstleistung = 1 Stunde. Fairer Tausch basierend auf Zeit.",
      svcTimeEarned: "Verdiente Stunden",
      svcTimeSpent: "Ausgegebene Stunden",
      svcTimeBalance: "Saldo",
      serviceTimeBankNote: "Zeitguthaben können durch Dienstleistungen verdient und bei jedem Nutzer ausgegeben werden.",
      serviceMilestones: "Meilensteine & Lieferungen",
      serviceMilestonePlaceholder: "Meilenstein hinzufügen (z.B. 'Design-Entwurf fertig')...",
      serviceMilestoneAdd: "Hinzufügen",
      serviceRatingDimensions: "Bewertungsdimensionen",
      svcRateQuality: "Qualität",
      svcRatePunctuality: "Pünktlichkeit",
      svcRateCommunication: "Kommunikation",
      cancelReasonTitle: "Warum stornieren Sie?",
      cancelReasonDesc: "Helfen Sie uns zu verstehen — Ihr Feedback verbessert die Plattform.",
      cancelReason_changed_mind: "Meinung geändert",
      cancelReason_found_better: "Besseren Tausch gefunden",
      cancelReason_no_response: "Partner antwortet nicht",
      cancelReason_condition_mismatch: "Objektzustand stimmt nicht",
      cancelReason_logistics_issue: "Logistikproblem",
      cancelReason_safety_concern: "Sicherheitsbedenken",
      cancelReason_other: "Anderer Grund",
      cancelNotePlaceholder: "Erzählen Sie uns mehr (optional)...",
      keepSwap: "Tausch behalten",
      confirmCancel: "Tausch stornieren",
    },
  },
  // Spanish
  es: {
    profile: {
      achievements: "Logros",
      achievementsDesc: "Desbloquea trofeos completando intercambios, listando objetos y siendo activo",
      tokenShop: "Tienda de Tokens",
      tokenShopDesc: "Gasta tus tokens ganados en impulsos y funciones premium",
      balance: "Saldo",
      buy: "Comprar",
      accountPause: "Pausar Cuenta",
      accountPauseDesc: "Oculta temporalmente tu perfil y objetos. Puedes reanudar en cualquier momento.",
      pauseAccountButton: "Pausar mi cuenta",
      accountPaused: "Cuenta pausada",
      resumeAccountButton: "Reanudar cuenta",
      dataExport: "Exportar Mis Datos (RGPD)",
      dataExportDesc: "Descarga todos tus datos como archivo JSON.",
      downloadMyData: "Descargar mis datos",
    },
    change: {
      houseSwapMode: "Tipo de intercambio",
      houseMode_simultaneous: "Simultáneo",
      houseModeDesc_simultaneous: "Ambas partes viajan al mismo tiempo (ej: montaña ↔ playa)",
      houseMode_non_simultaneous: "No simultáneo",
      houseModeDesc_non_simultaneous: "Fechas diferentes — programación flexible",
      houseMode_one_way_hosting: "Alojamiento unidireccional",
      houseModeDesc_one_way_hosting: "Aloja con compensación en tokens",
      houseMode_permanent: "Permanente",
      houseModeDesc_permanent: "Intercambio de vivienda a largo plazo o permanente",
      housePropertyType: "Tipo de propiedad",
      propType_apartment: "Apartamento",
      propType_house: "Casa",
      propType_villa: "Villa",
      propType_cabin: "Cabaña",
      propType_studio: "Estudio",
      propType_room: "Habitación",
      houseBedrooms: "Dormitorios",
      houseBathrooms: "Baños",
      houseMaxGuests: "Huéspedes máx.",
      houseAmenities: "Comodidades",
      amenity_wifi: "WiFi",
      amenity_parking: "Aparcamiento",
      amenity_ac: "Aire acondicionado",
      amenity_heating: "Calefacción",
      amenity_washer: "Lavadora",
      amenity_kitchen: "Cocina",
      amenity_pool: "Piscina",
      amenity_garden: "Jardín",
      amenity_pet_friendly: "Mascotas bienvenidas",
      amenity_tv: "TV",
      amenity_workspace: "Espacio de trabajo",
      houseRulesTitle: "Reglas de la casa",
      rule_no_smoking: "No fumar",
      rule_no_pets: "Sin mascotas",
      rule_no_parties: "Sin fiestas",
      rule_no_shoes: "Sin zapatos",
      rule_quiet_hours: "Horas de silencio",
      rule_max_guests: "Límite de huéspedes",
      serviceCategory: "Categoría de servicio",
      svcCat_creative: "Creativo",
      svcCat_technical: "Técnico",
      svcCat_education: "Educación",
      svcCat_physical: "Físico",
      svcCat_professional: "Profesional",
      serviceSkillName: "Habilidad ofrecida",
      serviceLevel: "Nivel de habilidad",
      svcLevelBeginner: "Principiante",
      svcLevelIntermediate: "Intermedio",
      svcLevelExpert: "Experto",
      serviceTimeBank: "Banco de Tiempo",
      serviceTimeBankDesc: "1 hora de cualquier servicio = 1 hora. Intercambio justo basado en tiempo.",
      cancelReasonTitle: "¿Por qué cancelas?",
      cancelReason_changed_mind: "Cambié de opinión",
      cancelReason_found_better: "Encontré un mejor intercambio",
      cancelReason_no_response: "El socio no responde",
      cancelReason_condition_mismatch: "El estado del objeto no coincide",
      cancelReason_logistics_issue: "Problema logístico",
      cancelReason_safety_concern: "Preocupación de seguridad",
      cancelReason_other: "Otro motivo",
      keepSwap: "Mantener intercambio",
      confirmCancel: "Cancelar intercambio",
    },
  },
  // Italian
  it: {
    profile: {
      achievements: "Risultati",
      achievementsDesc: "Sblocca trofei completando scambi, elencando oggetti ed essendo attivo",
      tokenShop: "Negozio Token",
      tokenShopDesc: "Spendi i token guadagnati per boost e funzionalità premium",
      balance: "Saldo",
      buy: "Acquista",
      accountPause: "Pausa Account",
      accountPauseDesc: "Nascondi temporaneamente il tuo profilo e i tuoi oggetti.",
      pauseAccountButton: "Metti in pausa",
      accountPaused: "Account in pausa",
      resumeAccountButton: "Riprendi account",
      dataExport: "Esporta Dati (GDPR)",
      dataExportDesc: "Scarica tutti i tuoi dati come file JSON.",
      downloadMyData: "Scarica i miei dati",
    },
    change: {
      houseSwapMode: "Tipo di scambio",
      houseMode_simultaneous: "Simultaneo",
      houseModeDesc_simultaneous: "Entrambe le parti viaggiano contemporaneamente",
      houseMode_non_simultaneous: "Non simultaneo",
      houseModeDesc_non_simultaneous: "Date diverse — programmazione flessibile",
      houseMode_permanent: "Permanente",
      houseModeDesc_permanent: "Scambio di alloggio a lungo termine o permanente",
      housePropertyType: "Tipo di proprietà",
      propType_apartment: "Appartamento",
      propType_house: "Casa",
      propType_villa: "Villa",
      propType_cabin: "Baita",
      propType_studio: "Monolocale",
      propType_room: "Stanza",
      houseBedrooms: "Camere",
      houseBathrooms: "Bagni",
      houseAmenities: "Servizi",
      houseRulesTitle: "Regole della casa",
      rule_no_smoking: "Vietato fumare",
      rule_no_pets: "Niente animali",
      rule_no_parties: "Niente feste",
      serviceCategory: "Categoria servizio",
      svcCat_creative: "Creativo",
      svcCat_technical: "Tecnico",
      svcCat_education: "Istruzione",
      svcCat_physical: "Fisico",
      svcCat_professional: "Professionale",
      serviceTimeBank: "Banca del Tempo",
      cancelReasonTitle: "Perché annulli?",
      cancelReason_changed_mind: "Ho cambiato idea",
      keepSwap: "Mantieni scambio",
      confirmCancel: "Annulla scambio",
    },
  },
  // Portuguese
  pt: {
    profile: {
      achievements: "Conquistas",
      achievementsDesc: "Desbloqueie troféus completando trocas, listando objetos e sendo ativo",
      tokenShop: "Loja de Tokens",
      tokenShopDesc: "Gaste seus tokens ganhos em impulsos e recursos premium",
      balance: "Saldo",
      buy: "Comprar",
      accountPause: "Pausar Conta",
      accountPauseDesc: "Oculte temporariamente seu perfil e objetos.",
      pauseAccountButton: "Pausar minha conta",
      accountPaused: "Conta pausada",
      resumeAccountButton: "Retomar conta",
      dataExport: "Exportar Dados (LGPD)",
      dataExportDesc: "Baixe todos os seus dados como arquivo JSON.",
      downloadMyData: "Baixar meus dados",
    },
    change: {
      houseSwapMode: "Tipo de troca",
      houseMode_simultaneous: "Simultâneo",
      houseModeDesc_simultaneous: "Ambas as partes viajam ao mesmo tempo",
      houseMode_permanent: "Permanente",
      housePropertyType: "Tipo de propriedade",
      propType_apartment: "Apartamento",
      propType_house: "Casa",
      propType_villa: "Villa",
      serviceCategory: "Categoria de serviço",
      svcCat_creative: "Criativo",
      svcCat_technical: "Técnico",
      svcCat_education: "Educação",
      serviceTimeBank: "Banco de Tempo",
      cancelReasonTitle: "Por que está cancelando?",
      cancelReason_changed_mind: "Mudei de ideia",
      keepSwap: "Manter troca",
      confirmCancel: "Cancelar troca",
    },
  },
  // Dutch
  nl: {
    profile: {
      achievements: "Prestaties",
      tokenShop: "Token Winkel",
      balance: "Saldo",
      buy: "Kopen",
      accountPause: "Account Pauzeren",
      pauseAccountButton: "Pauzeer mijn account",
      accountPaused: "Account gepauzeerd",
      resumeAccountButton: "Account hervatten",
      dataExport: "Gegevens Exporteren (AVG)",
      downloadMyData: "Mijn gegevens downloaden",
    },
    change: {
      houseSwapMode: "Ruiltype",
      housePropertyType: "Type woning",
      propType_apartment: "Appartement",
      propType_house: "Huis",
      houseBedrooms: "Slaapkamers",
      houseBathrooms: "Badkamers",
      houseAmenities: "Voorzieningen",
      houseRulesTitle: "Huisregels",
      serviceCategory: "Dienstcategorie",
      serviceTimeBank: "Tijdbank",
      cancelReasonTitle: "Waarom annuleert u?",
      keepSwap: "Ruil behouden",
      confirmCancel: "Ruil annuleren",
    },
  },
  // Polish
  pl: {
    profile: {
      achievements: "Osiągnięcia",
      tokenShop: "Sklep Tokenów",
      balance: "Saldo",
      buy: "Kup",
      accountPause: "Wstrzymaj Konto",
      pauseAccountButton: "Wstrzymaj moje konto",
      dataExport: "Eksport Danych (RODO)",
      downloadMyData: "Pobierz moje dane",
    },
    change: {
      houseSwapMode: "Typ wymiany",
      housePropertyType: "Typ nieruchomości",
      propType_apartment: "Mieszkanie",
      propType_house: "Dom",
      serviceCategory: "Kategoria usługi",
      serviceTimeBank: "Bank Czasu",
      cancelReasonTitle: "Dlaczego anulujesz?",
      keepSwap: "Zachowaj wymianę",
      confirmCancel: "Anuluj wymianę",
    },
  },
  // Russian
  ru: {
    profile: {
      achievements: "Достижения",
      tokenShop: "Магазин токенов",
      balance: "Баланс",
      buy: "Купить",
      accountPause: "Приостановить аккаунт",
      pauseAccountButton: "Приостановить",
      dataExport: "Экспорт данных",
      downloadMyData: "Скачать мои данные",
    },
    change: {
      houseSwapMode: "Тип обмена",
      housePropertyType: "Тип недвижимости",
      propType_apartment: "Квартира",
      propType_house: "Дом",
      serviceCategory: "Категория услуги",
      serviceTimeBank: "Банк времени",
      cancelReasonTitle: "Почему отменяете?",
      keepSwap: "Сохранить обмен",
      confirmCancel: "Отменить обмен",
    },
  },
  // Turkish
  tr: {
    profile: {
      achievements: "Başarılar",
      tokenShop: "Token Mağazası",
      balance: "Bakiye",
      buy: "Satın Al",
      accountPause: "Hesabı Duraklat",
      dataExport: "Verileri Dışa Aktar",
      downloadMyData: "Verilerimi İndir",
    },
    change: {
      houseSwapMode: "Takas türü",
      housePropertyType: "Mülk türü",
      propType_apartment: "Daire",
      propType_house: "Ev",
      serviceCategory: "Hizmet kategorisi",
      serviceTimeBank: "Zaman Bankası",
      cancelReasonTitle: "Neden iptal ediyorsunuz?",
      keepSwap: "Takası koru",
      confirmCancel: "Takası iptal et",
    },
  },
};

// Process each language file
const files = readdirSync(MESSAGES_DIR).filter(
  (f) => f.endsWith(".json") && f !== "en.json"
);

let totalAdded = 0;
for (const file of files) {
  const lang = file.replace(".json", "");
  const filePath = join(MESSAGES_DIR, file);
  const langData = JSON.parse(readFileSync(filePath, "utf-8"));

  const missing = countMissing(langData, en);
  if (missing === 0) {
    console.log(`  ${lang}: ✓ up to date`);
    continue;
  }

  // First, deep merge with English fallback
  let merged = deepMerge(langData, en);

  // Then overlay with proper translations for this language
  if (TRANSLATIONS[lang]) {
    for (const [section, keys] of Object.entries(TRANSLATIONS[lang])) {
      if (!merged[section]) merged[section] = {};
      for (const [key, value] of Object.entries(keys)) {
        merged[section][key] = value;
      }
    }
  }

  // Write back
  writeFileSync(filePath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  console.log(`  ${lang}: +${missing} keys added`);
  totalAdded += missing;
}

console.log(`\nTotal: ${totalAdded} keys added across ${files.length} language files`);
