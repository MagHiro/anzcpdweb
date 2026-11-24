import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "@/components/icon";

export function AdminPageHeading({ title, description, back, actions, children }: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return <header className={`admin-record-heading${back ? " admin-record-heading-detail" : ""}`}>
    {back && <Link href={back.href} className="admin-record-back focus-ring"><ArrowRight size={16} />{back.label}</Link>}
    <div className="admin-record-heading-row">
      <div className="admin-record-heading-text">
        <h1 className="display">{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </div>
      {actions && <div className="admin-record-heading-actions">{actions}</div>}
    </div>
  </header>;
}
