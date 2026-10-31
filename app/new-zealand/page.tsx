import { CountryLanding } from "@/components/country-landing";
import { getPublishedClasses } from "@/server/catalogue/queries";
export const dynamic = "force-dynamic";
export default async function NewZealandPage() {
  let items: Awaited<ReturnType<typeof getPublishedClasses>> = [];
  let unavailable = false;
  try { items = await getPublishedClasses({ country: "NZ", time: "upcoming", pageSize: 6 }); } catch { unavailable = true; }
  return <CountryLanding code="NZ" label="New Zealand" headline="Stay current in New Zealand immigration advice." summary="Clear, practice-focused professional development for licensed immigration advisers navigating policy, client advice and evidence." themes={["Immigration instructions", "Residence & temporary entry", "Adviser obligations"]} items={items} unavailable={unavailable} />;
}
