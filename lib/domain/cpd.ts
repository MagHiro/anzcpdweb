export type CpdCategory = "Category A" | "Category B";

export const CPD_ACTIVITY_TYPES = [
  "Workshop",
  "Accredited unit",
  "Conference, seminar or lecture",
  "Private study with assessment",
] as const;

export type CpdActivityType = (typeof CPD_ACTIVITY_TYPES)[number];

export type CpdCourse = {
  slug: string;
  title: string;
  category: CpdCategory;
  type: "Workshop" | "Accredited unit" | "Conference, seminar or lecture" | "Private study with assessment";
  country: "Australia" | "New Zealand" | "Australia & New Zealand";
  date: string;
  dateIso: string;
  hours: string;
  points: string;
  description: string;
  presenterSlug: string;
  presenterName: string;
  price: string;
  format: string;
  status: "Open" | "Coming soon";
};

export type Presenter = {
  slug: string;
  name: string;
  role: string;
  location: string;
  initials: string;
  bio: string;
  expertise: string[];
};

export const cpdActivityGuide = [
  {
    number: "01",
    category: "Category A" as const,
    type: "Workshop",
    title: "Live, facilitated learning",
    rule: "1 point per hour",
    detail: "Maximum 30 participants, with a facilitator in real time and interactive discussion or participation tools.",
    tone: "coral" as const,
  },
  {
    number: "02",
    category: "Category A" as const,
    type: "Accredited unit",
    title: "A completed learning programme",
    rule: "5 points per accredited unit",
    detail: "A unit within a programme of learning that has been successfully completed.",
    tone: "blue" as const,
  },
  {
    number: "03",
    category: "Category B" as const,
    type: "Conference, seminar or lecture",
    title: "Structured professional listening",
    rule: "1 point per 1.5 hours",
    detail: "A conference, seminar or lecture conducted in real time by a facilitator, face-to-face or online.",
    tone: "gold" as const,
  },
  {
    number: "04",
    category: "Category B" as const,
    type: "Private study with assessment",
    title: "Independent study with proof",
    rule: "1 point per 1.5 hours",
    detail: "Private study must include an assessment, completed within 12 months of enrolment in the activity.",
    tone: "green" as const,
  },
];

export const presenters: Presenter[] = [
  {
    slug: "maya-singh",
    name: "Maya Singh",
    role: "Registered migration agent and practice educator",
    location: "Sydney · Australia",
    initials: "MS",
    bio: "Maya brings a practical, evidence-led approach to professional obligations, client communication and the small decisions that keep a file defensible.",
    expertise: ["Professional obligations", "Ethics and conduct", "Evidence strategy"],
  },
  {
    slug: "james-wilson",
    name: "James Wilson",
    role: "Immigration adviser and policy analyst",
    location: "Melbourne · Australia",
    initials: "JW",
    bio: "James helps advisers turn changing policy into a disciplined reading practice, with sessions built around source checking and sound professional judgment.",
    expertise: ["Skilled migration", "Policy reading", "File quality"],
  },
  {
    slug: "ania-te-rangi",
    name: "Ania Te Rangi",
    role: "Licensed immigration adviser and facilitator",
    location: "Auckland · New Zealand",
    initials: "AT",
    bio: "Ania focuses on clear, teachable methods for working with New Zealand immigration instructions, evidence and the realities of adviser practice.",
    expertise: ["NZ instructions", "Residence pathways", "Adviser practice"],
  },
];

export const featuredCourses: CpdCourse[] = [
  {
    slug: "ethical-standards-registered-migration-agents-2026",
    title: "Ethical standards for registered migration agents",
    category: "Category A",
    type: "Workshop",
    country: "Australia",
    date: "06 October 2026",
    dateIso: "2026-10-06",
    hours: "1.5 hours",
    points: "1 CPD point",
    description: "A live, scenario-led workshop on professional judgment, client communication and the boundaries of competent practice.",
    presenterSlug: "maya-singh",
    presenterName: "Maya Singh",
    price: "AUD 195",
    format: "Live online",
    status: "Open",
  },
  {
    slug: "reading-applying-immigration-new-zealand-instructions",
    title: "Reading and applying New Zealand instructions",
    category: "Category B",
    type: "Private study with assessment",
    country: "New Zealand",
    date: "08 October 2026",
    dateIso: "2026-10-08",
    hours: "1.5 hours",
    points: "1 CPD point",
    description: "Build a source-first reading method for locating the governing instruction, testing evidence and recording what changed.",
    presenterSlug: "ania-te-rangi",
    presenterName: "Ania Te Rangi",
    price: "NZD 165",
    format: "Self-paced online",
    status: "Open",
  },
  {
    slug: "skilled-independent-nominated-regional-pathways",
    title: "Skilled pathways: evidence that holds",
    category: "Category B",
    type: "Conference, seminar or lecture",
    country: "Australia",
    date: "03 November 2026",
    dateIso: "2026-11-03",
    hours: "3 hours",
    points: "2 CPD points",
    description: "A source-led seminar comparing skilled pathways, evidence gaps and the questions to check before advice is given.",
    presenterSlug: "james-wilson",
    presenterName: "James Wilson",
    price: "AUD 265",
    format: "Live online",
    status: "Open",
  },
  {
    slug: "professional-practice-intensive",
    title: "Professional practice intensive",
    category: "Category A",
    type: "Accredited unit",
    country: "Australia & New Zealand",
    date: "12 November 2026",
    dateIso: "2026-11-12",
    hours: "Programme unit",
    points: "5 CPD points",
    description: "A completed programme unit bringing ethics, evidence and client-centred decision-making into one practical framework.",
    presenterSlug: "maya-singh",
    presenterName: "Maya Singh",
    price: "AUD 395",
    format: "Online programme",
    status: "Coming soon",
  },
  {
    slug: "new-zealand-residence-instructions",
    title: "Residence instructions: a disciplined reading practice",
    category: "Category B",
    type: "Conference, seminar or lecture",
    country: "New Zealand",
    date: "22 October 2026",
    dateIso: "2026-10-22",
    hours: "3 hours",
    points: "2 CPD points",
    description: "Trace skilled employment and evidence questions through current residence instructions without losing the source.",
    presenterSlug: "ania-te-rangi",
    presenterName: "Ania Te Rangi",
    price: "NZD 240",
    format: "Live online",
    status: "Open",
  },
  {
    slug: "evidence-and-professional-judgment",
    title: "Evidence and professional judgment",
    category: "Category A",
    type: "Workshop",
    country: "Australia & New Zealand",
    date: "05 December 2026",
    dateIso: "2026-12-05",
    hours: "2 hours",
    points: "2 CPD points",
    description: "A small-group workshop for turning incomplete instructions into better questions, better records and better advice.",
    presenterSlug: "james-wilson",
    presenterName: "James Wilson",
    price: "AUD 220",
    format: "Live online",
    status: "Coming soon",
  },
];

export function getPresenter(slug: string) {
  return presenters.find((presenter) => presenter.slug === slug) ?? null;
}

export function getCourse(slug: string) {
  return featuredCourses.find((course) => course.slug === slug) ?? null;
}
