import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { categories, classSourceReferences, classes, countries, presenters, sourceReferences } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";
import { COUNTRY_CONFIG } from "@/lib/domain/countries";
import { parseLocalDateTime } from "@/lib/date";

const presenterSeeds = [
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

async function main() {
  const db = getDb();
  const checkedAt = new Date("2026-09-21T00:00:00.000Z");

await db.insert(countries).values([
  { code: "AU", name: COUNTRY_CONFIG.AU.name, currency: COUNTRY_CONFIG.AU.currency, identifierType: COUNTRY_CONFIG.AU.identifierType, identifierLabel: COUNTRY_CONFIG.AU.identifierLabel, cpdUnitType: COUNTRY_CONFIG.AU.cpdUnitType, defaultTimezone: COUNTRY_CONFIG.AU.defaultTimezone, description: COUNTRY_CONFIG.AU.description },
  { code: "NZ", name: COUNTRY_CONFIG.NZ.name, currency: COUNTRY_CONFIG.NZ.currency, identifierType: COUNTRY_CONFIG.NZ.identifierType, identifierLabel: COUNTRY_CONFIG.NZ.identifierLabel, cpdUnitType: COUNTRY_CONFIG.NZ.cpdUnitType, defaultTimezone: COUNTRY_CONFIG.NZ.defaultTimezone, description: COUNTRY_CONFIG.NZ.description },
]).onConflictDoNothing({ target: countries.code });

const categorySeeds = [
  ["AU", "Ethics & Code of Conduct", "ethics-code-of-conduct", "Ethical standards, professional obligations and the Code of Conduct for registered migration agents."],
  ["AU", "Skilled Migration", "skilled-migration", "Points-tested and skilled regional pathways, evidence and decision-making."],
  ["AU", "Employer-Sponsored Migration", "employer-sponsored-migration", "Employer-sponsored pathways, nomination, sponsorship and evidence."],
  ["AU", "Family Migration", "family-migration", "Partner and family migration applications, sponsorship and evidence."],
  ["AU", "Student & Temporary Visas", "student-temporary-visas", "Student, temporary work and visitor practice with current policy considerations."],
  ["AU", "Compliance, Evidence & Professional Practice", "compliance-evidence-professional-practice", "File quality, evidence strategy, compliance and professional practice."],
  ["NZ", "Adviser Professional Practice", "adviser-professional-practice", "Licensed immigration adviser practice, ethics and professional obligations."],
  ["NZ", "Residence Instructions", "residence-instructions", "Reading and applying residence instructions and evidence requirements."],
  ["NZ", "Skilled Migrant Category", "skilled-migrant-category", "Skilled Migrant Category residence instructions and skilled employment evidence."],
  ["NZ", "Accredited Employer Work Visa", "accredited-employer-work-visa", "Employer accreditation, Job Checks and applicant requirements."],
  ["NZ", "Temporary Entry", "temporary-entry", "Work, student and visitor temporary entry matters."],
  ["NZ", "Partnership & Family", "partnership-family", "Partnership-based applications and family migration evidence."],
  ["NZ", "Compliance, Evidence & Immigration Instructions", "compliance-evidence-immigration-instructions", "Evidence, instructions, adviser obligations and compliance."],
] as const;

const categoryIds = new Map<string, string>();
for (const [country, name, slug, shortDescription] of categorySeeds) {
  await db.insert(categories).values({ country, name, slug, shortDescription }).onConflictDoNothing({ target: [categories.country, categories.slug] });
  const [row] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.country, country), eq(categories.slug, slug))).limit(1);
  if (row) categoryIds.set(`${country}:${slug}`, row.id);
}

const presenterIds = new Map<string, string>();
for (const presenter of presenterSeeds) {
  await db.insert(presenters).values({ slug: presenter.slug, name: presenter.name, role: presenter.role, location: presenter.location, initials: presenter.initials, bio: presenter.bio, expertise: presenter.expertise }).onConflictDoNothing({ target: presenters.slug });
  const [row] = await db.select({ id: presenters.id }).from(presenters).where(eq(presenters.slug, presenter.slug)).limit(1);
  if (row) presenterIds.set(presenter.slug, row.id);
}

const sourceSeeds = [
  { authority: "OMARA", title: "CPD rules", url: "https://www.mara.gov.au/continuing-professional-development/before-you-re-register/cpd-rules", jurisdiction: "AU" as const, notes: "Check the current CPD rules and instruments before publishing an activity as approved." },
  { authority: "Australian Department of Home Affairs", title: "Skilled occupation list and related visa pathways", url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list", jurisdiction: "AU" as const, notes: "Reference point for subclasses and occupation terminology; verify current visa criteria separately." },
  { authority: "Immigration New Zealand", title: "SR3.10 Summary of requirements — Skilled Migrant Category", url: "https://www.immigration.govt.nz/opsmanual/90250.htm", jurisdiction: "NZ" as const, notes: "Operational Manual reference checked for seed taxonomy only." },
  { authority: "Immigration New Zealand", title: "WA1 Objective and overview of Accredited Employer instructions", url: "https://www.immigration.govt.nz/opsmanual/82317.htm", jurisdiction: "NZ" as const, notes: "Operational Manual reference checked for seed taxonomy only." },
  { authority: "Immigration Advisers Authority", title: "Continuing professional development toolkit", url: "https://www.iaa.govt.nz/for-advisers/adviser-tools/continuing-professional-development-toolkit/", jurisdiction: "NZ" as const, notes: "Use current IAA guidance when maintaining provider-specific CPD information." },
];

const sourceIds = new Map<string, string>();
for (const source of sourceSeeds) {
  const [existing] = await db.select({ id: sourceReferences.id }).from(sourceReferences).where(eq(sourceReferences.url, source.url)).limit(1);
  const [row] = existing ? [existing] : await db.insert(sourceReferences).values({ ...source, checkedAt }).returning({ id: sourceReferences.id });
  if (row) sourceIds.set(source.url, row.id);
}

const date = (value: string, timezone: string) => parseLocalDateTime(value, timezone);
const classSeeds = [
  { country: "AU" as const, category: "ethics-code-of-conduct", title: "Ethical Standards for Registered Migration Agents — 2026 Update", slug: "ethical-standards-registered-migration-agents-2026", shortDescription: "A development session on ethical standards, professional judgment and the boundaries of competent migration-agent practice.", fullDescription: "This draft activity examines the role of ethical standards in registered migration-agent practice, including conflicts, client communication, file decisions and the professional responsibilities that sit alongside technical visa knowledge. It is development material, not a statement of OMARA approval or a substitute for the current Code of Conduct.", start: "2026-10-06T09:30", end: "2026-10-06T11:00", open: "2026-09-21T09:00", close: "2026-10-06T09:00", timezone: "Australia/Sydney", price: 19500, capacity: 30, cpd: "1", categorySource: "https://www.mara.gov.au/continuing-professional-development/before-you-re-register/cpd-rules" },
  { country: "AU" as const, category: "ethics-code-of-conduct", title: "Code of Conduct for Registered Migration Agents — Professional Obligations", slug: "code-of-conduct-professional-obligations", shortDescription: "Work through the professional obligations that shape advice, evidence, communication and file stewardship.", fullDescription: "A practical draft discussion of professional obligations under the registered migration-agent Code of Conduct. The class uses scenarios around scope, evidence, records and client expectations, with prompts for participants to compare practice systems against the current authoritative requirements.", start: "2026-10-20T13:00", end: "2026-10-20T15:00", open: "2026-09-21T09:00", close: "2026-10-20T12:30", timezone: "Australia/Melbourne", price: 21500, capacity: 30, cpd: "1", categorySource: "https://www.mara.gov.au/continuing-professional-development/before-you-re-register/cpd-rules" },
  { country: "AU" as const, category: "skilled-migration", title: "Skilled Independent, Skilled Nominated and Skilled Work Regional Pathways", slug: "skilled-independent-nominated-regional-pathways", shortDescription: "A structured review of subclasses 189, 190 and 491, with emphasis on evidence and pathway distinctions.", fullDescription: "This draft activity compares the Skilled Independent visa (subclass 189), Skilled Nominated visa (subclass 190) and Skilled Work Regional (Provisional) visa (subclass 491). It focuses on reading current program material, identifying evidence gaps and explaining pathway distinctions without treating a generic checklist as legal advice.", start: "2026-11-03T09:30", end: "2026-11-03T12:00", open: "2026-09-21T09:00", close: "2026-11-03T09:00", timezone: "Australia/Brisbane", price: 26500, capacity: 40, cpd: "2", categorySource: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list" },
  { country: "AU" as const, category: "employer-sponsored-migration", title: "Skills in Demand, Employer Nomination and Regional Employer-Sponsored Pathways", slug: "skills-in-demand-employer-nomination-regional-pathways", shortDescription: "A source-led session on subclass 482, subclass 186 and regional employer-sponsored practice.", fullDescription: "This draft activity uses current Department of Home Affairs terminology to compare Skills in Demand (subclass 482), Employer Nomination Scheme (subclass 186) and regional employer-sponsored pathways. It is designed to help practitioners identify which source questions need to be checked before advising or preparing evidence.", start: "2026-11-17T13:00", end: "2026-11-17T15:30", open: "2026-09-21T09:00", close: "2026-11-17T12:30", timezone: "Australia/Perth", price: 28500, capacity: 40, cpd: "2", categorySource: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list" },
  { country: "NZ" as const, category: "residence-instructions", title: "Immigration New Zealand Operational Manual — Reading and Applying Instructions", slug: "reading-applying-immigration-new-zealand-instructions", shortDescription: "Build a disciplined method for locating, reading and applying current Immigration New Zealand instructions.", fullDescription: "This draft activity introduces a source-first reading method for the Immigration New Zealand Operational Manual. It focuses on instruction structure, effective dates, evidence questions and the difference between a public summary and the instruction that must be checked before professional work is completed.", start: "2026-10-08T10:00", end: "2026-10-08T12:00", open: "2026-09-21T09:00", close: "2026-10-08T09:30", timezone: "Pacific/Auckland", price: 22500, capacity: 30, cpd: "2.0", categorySource: "https://www.immigration.govt.nz/opsmanual/90250.htm" },
  { country: "NZ" as const, category: "skilled-migrant-category", title: "Skilled Migrant Category — Reading Current Residence Instructions", slug: "skilled-migrant-category-current-residence-instructions", shortDescription: "Trace skilled employment and evidence questions through current residence instructions.", fullDescription: "A draft professional-development session on the Skilled Migrant Category, using the current Operational Manual as an editorial reference. Participants work through how to identify the governing instruction, test evidence against the instruction and record changes for later review.", start: "2026-10-22T13:00", end: "2026-10-22T15:00", open: "2026-09-21T09:00", close: "2026-10-22T12:30", timezone: "Pacific/Auckland", price: 24000, capacity: 30, cpd: "2.0", categorySource: "https://www.immigration.govt.nz/opsmanual/90250.htm" },
  { country: "NZ" as const, category: "accredited-employer-work-visa", title: "Accredited Employer Work Visa — Accreditation, Job Checks and Applicant Requirements", slug: "accredited-employer-work-visa-accreditation-job-checks", shortDescription: "Connect employer accreditation, Job Checks and applicant requirements without collapsing the stages into one checklist.", fullDescription: "This draft activity follows the three-stage structure described in Immigration New Zealand material: employer accreditation, Job Check and work visa. It considers the evidence and instruction questions that arise at each stage and is intended for professional development, not a guarantee of an application outcome.", start: "2026-11-05T10:00", end: "2026-11-05T12:30", open: "2026-09-21T09:00", close: "2026-11-05T09:30", timezone: "Pacific/Auckland", price: 25500, capacity: 35, cpd: "2.5", categorySource: "https://www.immigration.govt.nz/opsmanual/82317.htm" },
  { country: "NZ" as const, category: "temporary-entry", title: "New Zealand Temporary Entry Instructions — Work, Student and Visitor Matters", slug: "new-zealand-temporary-entry-work-student-visitor", shortDescription: "A practice-focused session on identifying the right temporary-entry instruction and supporting evidence.", fullDescription: "This draft session considers how professional advisers distinguish work, student and visitor temporary-entry questions, how evidence is framed, and how to document source checks when instructions or policy settings move. Current Immigration New Zealand sources should be reviewed before publication.", start: "2026-11-19T13:00", end: "2026-11-19T15:00", open: "2026-09-21T09:00", close: "2026-11-19T12:30", timezone: "Pacific/Auckland", price: 22500, capacity: 35, cpd: "2.0", categorySource: "https://www.immigration.govt.nz/opsmanual/82317.htm" },
];

for (const item of classSeeds) {
  const categoryId = categoryIds.get(`${item.country}:${item.category}`);
  if (!categoryId) throw new Error(`Missing category for ${item.slug}`);
  const country = COUNTRY_CONFIG[item.country];
  const presenterSlug = item.country === "NZ" ? "ania-te-rangi" : item.category === "ethics-code-of-conduct" ? "maya-singh" : "james-wilson";
  const [classRecord] = await db.insert(classes).values({ title: item.title, slug: item.slug, country: item.country, categoryId, presenterId: presenterIds.get(presenterSlug), shortDescription: item.shortDescription, fullDescription: item.fullDescription, startAt: date(item.start, item.timezone), endAt: date(item.end, item.timezone), timezone: item.timezone, bookingOpensAt: date(item.open, item.timezone), bookingClosesAt: date(item.close, item.timezone), deliveryFormat: "ONLINE", onlineAttendanceInfo: "Online attendance details will be provided after confirmed payment.", priceMinorUnits: item.price, currency: country.currency, seatCapacity: item.capacity, unlimitedCapacity: false, cpdUnitType: country.cpdUnitType, cpdUnitAmount: item.cpd, cpdActivityCategory: item.country === "AU" ? "Workshop" : "Private study with assessment", professionalIdentifierRequired: true, status: "DRAFT", seoTitle: item.title, seoDescription: item.shortDescription }).onConflictDoNothing({ target: classes.slug }).returning({ id: classes.id, presenterId: classes.presenterId });
  const [existingClass] = classRecord ? [classRecord] : await db.select({ id: classes.id, presenterId: classes.presenterId }).from(classes).where(eq(classes.slug, item.slug)).limit(1);
  if (existingClass && !classRecord && !existingClass.presenterId) await db.update(classes).set({ presenterId: presenterIds.get(presenterSlug), updatedAt: new Date() }).where(eq(classes.id, existingClass.id));
  const sourceId = sourceIds.get(item.categorySource);
  if (existingClass && sourceId) await db.insert(classSourceReferences).values({ classId: existingClass.id, sourceReferenceId: sourceId }).onConflictDoNothing();
}

  console.log(`Seeded ${categorySeeds.length} categories and ${classSeeds.length} draft classes for AU/NZ.`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => closeDb());
