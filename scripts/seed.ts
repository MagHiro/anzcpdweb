import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { categories, classSourceReferences, classes, countries, presenters, sourceReferences } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";
import { COUNTRY_CONFIG } from "@/lib/domain/countries";
import { parseLocalDateTime } from "@/lib/date";

const presenterSeeds = [
  {
    slug: "james-alan-hall",
    name: "James Alan Hall",
    role: "Registered migration agent and CPD presenter",
    location: "Sydney · Australia",
    initials: "JAH",
    bio: "James brings a practical, source-led approach to professional obligations, client communication and the decisions that keep a migration file defensible.",
    expertise: ["Professional obligations", "Ethics and conduct", "Evidence strategy"],
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
const seededAt = new Date();
const classSeeds = [
  { country: "AU" as const, category: "ethics-code-of-conduct", presenter: "james-alan-hall", title: "Professional Practice and the Code of Conduct", slug: "professional-practice-code-of-conduct", shortDescription: "A completed professional-development session on ethical standards, professional judgment and defensible migration-agent practice.", fullDescription: "This historical activity examined ethical standards in registered migration-agent practice, including conflicts, client communication, file decisions and the professional responsibilities that sit alongside technical visa knowledge. It is retained as catalogue history and is not a statement of OMARA approval or a substitute for the current Code of Conduct.", start: "2025-06-12T10:00", end: "2025-06-12T12:00", open: "2025-05-01T09:00", close: "2025-06-12T09:00", timezone: "Australia/Sydney", price: 19500, capacity: 30, cpd: "2", categorySource: "https://www.mara.gov.au/continuing-professional-development/before-you-re-register/cpd-rules" },
];

for (const item of classSeeds) {
  const categoryId = categoryIds.get(`${item.country}:${item.category}`);
  if (!categoryId) throw new Error(`Missing category for ${item.slug}`);
  const country = COUNTRY_CONFIG[item.country];
  const startAt = date(item.start, item.timezone);
  const endAt = date(item.end, item.timezone);
  if (endAt >= seededAt) throw new Error(`Seed class ${item.slug} must be in the past`);
  const presenterId = presenterIds.get(item.presenter);
  if (!presenterId) throw new Error(`Missing presenter for ${item.slug}`);
  const [classRecord] = await db.insert(classes).values({ title: item.title, slug: item.slug, country: item.country, categoryId, presenterId, shortDescription: item.shortDescription, fullDescription: item.fullDescription, startAt, endAt, timezone: item.timezone, bookingOpensAt: date(item.open, item.timezone), bookingClosesAt: date(item.close, item.timezone), deliveryFormat: "ONLINE", onlineAttendanceInfo: "This historical activity is no longer open for booking.", priceMinorUnits: item.price, currency: country.currency, seatCapacity: item.capacity, unlimitedCapacity: false, cpdUnitType: country.cpdUnitType, cpdUnitAmount: item.cpd, cpdActivityCategory: "Workshop", professionalIdentifierRequired: true, status: "COMPLETED", seoTitle: item.title, seoDescription: item.shortDescription }).onConflictDoNothing({ target: classes.slug }).returning({ id: classes.id, presenterId: classes.presenterId });
  const [existingClass] = classRecord ? [classRecord] : await db.select({ id: classes.id, presenterId: classes.presenterId }).from(classes).where(eq(classes.slug, item.slug)).limit(1);
  if (existingClass && !classRecord && !existingClass.presenterId) await db.update(classes).set({ presenterId, updatedAt: new Date() }).where(eq(classes.id, existingClass.id));
  const sourceId = sourceIds.get(item.categorySource);
  if (existingClass && sourceId) await db.insert(classSourceReferences).values({ classId: existingClass.id, sourceReferenceId: sourceId }).onConflictDoNothing();
}

  console.log(`Seeded ${categorySeeds.length} categories, ${classSeeds.length} completed historical class, and ${presenterSeeds.length} presenter.`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => closeDb());
