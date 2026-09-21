import { Container, Section } from "@/components/ui";

export default function Loading() { return <Section><Container><div className="animate-pulse space-y-5"><div className="h-4 w-24 rounded bg-[#dce3df]" /><div className="h-16 max-w-2xl rounded bg-[#dce3df]" /><div className="h-5 max-w-xl rounded bg-[#dce3df]" /><div className="grid gap-5 pt-8 md:grid-cols-3"><div className="h-72 rounded-[1.5rem] bg-[#e8efeb]" /><div className="h-72 rounded-[1.5rem] bg-[#e8efeb]" /><div className="h-72 rounded-[1.5rem] bg-[#e8efeb]" /></div></div></Container></Section>; }
