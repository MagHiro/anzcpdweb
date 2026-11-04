/* Email HTML is not a Next.js page and requires its own document head. */
/* eslint-disable @next/next/no-head-element */
import type { CSSProperties, ReactNode } from "react";

const fontFamily = "Tahoma, Arial, sans-serif";

export function EmailText({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ margin: "0 0 16px", fontFamily, fontSize: "14px", lineHeight: "22px", ...style }}>{children}</p>;
}

export function EmailLayout({ title, name, children, href, action, salutation = "Hello" }: { title: string; name: string; children: ReactNode; href?: string; action?: string; salutation?: string }) {
  return <html lang="en"><head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>{title}</title></head><body style={{ backgroundColor: "#f4f7f5", fontFamily, fontSize: "14px", lineHeight: "22px", color: "#20382e", margin: 0, padding: "32px 16px" }}>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0"><tbody><tr><td align="center">
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: "560px", backgroundColor: "#ffffff", borderRadius: "12px" }}><tbody><tr><td style={{ padding: "32px", fontFamily, fontSize: "14px", lineHeight: "22px" }}>
        <EmailText style={{ fontWeight: 700, color: "#14382c", marginBottom: "28px" }}>ANZ Migration Academy</EmailText>
        <h1 style={{ fontFamily, fontSize: "20px", lineHeight: "28px", fontWeight: 700, margin: "0 0 24px", color: "#14382c" }}>{title}</h1>
        <EmailText>{salutation} {name},</EmailText>{children}
        {href && <><table role="presentation" cellPadding="0" cellSpacing="0" style={{ marginTop: "24px" }}><tbody><tr><td style={{ backgroundColor: "#14382c", borderRadius: "6px", textAlign: "center" }}><a href={href} style={{ display: "inline-block", fontFamily, fontSize: "14px", lineHeight: "22px", fontWeight: 700, color: "#ffffff", textDecoration: "none", padding: "12px 20px", border: "1px solid #14382c", borderRadius: "6px" }}>{action}</a></td></tr></tbody></table>
        <EmailText style={{ marginTop: "24px", marginBottom: 0, color: "#52645b", overflowWrap: "anywhere" }}>If the button does not work, copy this link into your browser:<br /><a href={href} style={{ color: "#245b43", textDecoration: "underline" }}>{href}</a></EmailText></>}
      </td></tr></tbody></table>
    </td></tr></tbody></table>
  </body></html>;
}
