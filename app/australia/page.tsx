import { CountryLanding } from "@/components/country-landing";
import { getPublishedClasses } from "@/server/catalogue/queries";
export const dynamic = "force-dynamic";
export default async function AustraliaPage() {
  let items: Awaited<ReturnType<typeof getPublishedClasses>> = [];
  let unavailable = false;
  try { items = await getPublishedClasses({ country: "AU", time: "upcoming", pageSize: 6 }); } catch { unavailable = true; }
  return <CountryLanding code="AU" label="Australia" headline="Grow with Australian migration practice." summary="Continuing professional development for Australian migration professionals, from everyday questions to complex judgment calls." themes={["Ethics & obligations", "Evidence & compliance", "Migration pathways"]} context="Australian activities display CPD points where supplied. ANZ CPD does not represent them as OMARA-approved or guarantee registration outcomes. Always check current requirements with the relevant authority." items={items} unavailable={unavailable} />;
}
