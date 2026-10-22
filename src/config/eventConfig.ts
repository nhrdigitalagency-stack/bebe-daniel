export interface ScheduleStepConfig {
  id: string;
  time?: string;
  titleKey: string;
  descriptionKey: string;
}

export interface EventConfig {
  babyName: string;
  parentsNames: string[];
  eventStart: string | null;
  eventEnd: string | null;
  timeZone: string | null;
  venueName: string;
  address: string;
  mapsUrl: string;
  dressCode: string;
  accessNotes?: string;
  portraitUrl: string;
  heroBackdropUrl: string;
  whatsappNumber: string;
  whatsappDisplayNumber: string;
  defaultLocale: 'fr' | 'en';
  supportedLocales: readonly ['fr', 'en'];
  schedule: ScheduleStepConfig[];
  siteUrl: string;
  rsvpLimits: {
    maxAdditionalAdults: number;
    maxChildren: number;
  };
  uploadLimits: {
    maxFilesPerSubmission: number;
    maxFileSizeMb: number;
    allowedMimeTypes: readonly string[];
  };
}

/**
 * Configuration centrale publique de l'événement « Le Voir bébé de Daniel ».
 * Parents : Marie et Joseph
 * Date : Dimanche 1er novembre 2026
 * Lieu : Domicile des parents à Yaoundé, Quartier Simbock
 */
export const eventConfig: EventConfig = {
  babyName: "Daniel",
  parentsNames: ["Marie", "Joseph"],
  eventStart: "2026-11-01T14:00:00+01:00",
  eventEnd: "2026-11-01T19:00:00+01:00",
  timeZone: "Africa/Douala",
  venueName: "Domicile de Marie et Joseph",
  address: "Yaoundé, Simbock",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Simbock+Yaounde+Cameroun",
  dressCode: "Élégance douce (touches de blanc et rose bienvenues)",
  accessNotes: "Domicile familial de Marie et Joseph à Yaoundé, quartier Simbock. Contactez-nous sur WhatsApp en cas de besoin pour le guidage.",
  portraitUrl: "/assets/aistudio/Tendresse_maternelle_en_rose_pastel_9322ab3b.png",
  heroBackdropUrl: "/assets/aistudio/Tendresse_maternelle_en_rose_pastel_9322ab3b.png",
  whatsappNumber: "33753049353",
  whatsappDisplayNumber: "+33 7 53 04 93 53",
  defaultLocale: "fr",
  supportedLocales: ["fr", "en"],
  schedule: [
    {
      id: "welcome",
      time: "14h00",
      titleKey: "schedule.steps.welcome.title",
      descriptionKey: "schedule.steps.welcome.description",
    },
    {
      id: "presentation",
      time: "15h00",
      titleKey: "schedule.steps.presentation.title",
      descriptionKey: "schedule.steps.presentation.description",
    },
    {
      id: "gathering",
      time: "16h00",
      titleKey: "schedule.steps.gathering.title",
      descriptionKey: "schedule.steps.gathering.description",
    },
    {
      id: "memories",
      time: "17h30",
      titleKey: "schedule.steps.memories.title",
      descriptionKey: "schedule.steps.memories.description",
    },
  ],
  siteUrl: "",
  rsvpLimits: {
    maxAdditionalAdults: 6,
    maxChildren: 6,
  },
  uploadLimits: {
    maxFilesPerSubmission: 10,
    maxFileSizeMb: 10,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
};

export const AVAILABLE_STUDIO_PORTRAITS = [
  {
    id: "tendresse",
    labelFr: "Tendresse maternelle en rose pastel",
    labelEn: "Maternal tenderness in pastel rose",
    url: "/assets/aistudio/Tendresse_maternelle_en_rose_pastel_9322ab3b.png",
  },
  {
    id: "cocon",
    labelFr: "Cocon doux entouré de peluches",
    labelEn: "Soft cocoon surrounded by plushes",
    url: "/assets/aistudio/Portrait_de_b_b__dans_un_cocon_rose_28a4c365.png",
  },
  {
    id: "portrait_rose_1",
    labelFr: "Douceur en rose pastel",
    labelEn: "Sweetness in pastel pink",
    url: "/assets/aistudio/56c735b127f9b726afd50a77fa3d44f4_150b67cd.jpg",
  },
  {
    id: "portrait_rose_2",
    labelFr: "Regard éveillé",
    labelEn: "Bright gaze",
    url: "/assets/aistudio/611856299390557753_e665baed.jpg",
  },
] as const;
