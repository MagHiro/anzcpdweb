"use client";

import { useState } from "react";
import { Button, Field, FormNotice, TextInput } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";

export function MfaSettings({ enabled: initialEnabled }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [setup, setSetup] = useState<{ totpURI: string; backupCodes: string[] }>();
  const [codes, setCodes] = useState<string[]>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setLoading(true); setError(undefined);
    try {
      const response = await fetch(`/api/account/mfa/${setup ? "verify" : enabled ? "disable" : "enable"}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) { setError(typeof result.error === "string" ? result.error : result.message ?? "MFA could not be updated."); return; }
      form.reset();
      if (setup) { setCodes(setup.backupCodes); setSetup(undefined); setEnabled(true); }
      else if (enabled) { setEnabled(false); setCodes(undefined); }
      else setSetup(result);
    } catch { setError("We could not reach the service. Please try again."); }
    finally { setLoading(false); }
  }

  return <section className="mt-10 rounded-3xl bg-white p-6 sm:p-8" aria-labelledby="mfa-heading">
    <h2 id="mfa-heading" className="display text-2xl font-normal text-[var(--forest)]">Multi-factor authentication</h2>
    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{enabled ? "MFA is enabled. Your authenticator code is required when you sign in." : "Add an authenticator app to protect your account."}</p>
    <form onSubmit={submit} className="mt-6 space-y-5">
      <FormNotice>{error}</FormNotice>
      {setup ? <>
        <p className="text-sm leading-6">In your authenticator app, add an account using this setup key.</p>
        <code className="block break-all rounded-xl bg-[var(--mist)] p-4 text-sm select-all">{new URL(setup.totpURI).searchParams.get("secret")}</code>
        <p className="text-sm text-[var(--muted)]">Account: ANZ Migration Academy. Time-based code, 6 digits, 30 seconds.</p>
        <Field label="Verification code" required><TextInput name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></Field>
        <Button type="submit" disabled={loading}>{loading ? "Verifying…" : "Verify and enable MFA"}</Button>
      </> : <>
        <Field label="Current password" required><PasswordInput name="password" autoComplete="current-password" maxLength={128} required /></Field>
        <Button type="submit" disabled={loading} variant={enabled ? "secondary" : "primary"}>{loading ? "Updating…" : enabled ? "Disable MFA" : "Set up MFA"}</Button>
      </>}
    </form>
    {codes && <div className="mt-6" role="status"><h3 className="text-base font-medium">Save your recovery codes</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Keep these somewhere safe. Each code works once if you lose access to your authenticator. These codes are shown only now.</p><pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[var(--mist)] p-4 text-sm select-all">{codes.join("\n")}</pre><button type="button" onClick={() => setCodes(undefined)} className="mt-4 text-sm underline underline-offset-4">I’ve saved my codes</button></div>}
  </section>;
}
