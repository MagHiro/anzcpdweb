import { getAdminSourceReferences } from "@/server/catalogue/queries";
import { SourceManager } from "@/components/source-manager";
export default async function Page() { return <SourceManager rows={await getAdminSourceReferences()} />; }
