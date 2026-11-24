"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, FormNotice, TextInput, Button } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import { Turnstile } from "@/components/turnstile";
import { ArrowRight } from "@/components/icon";
import { REMEMBERED_SESSION_DAYS } from "@/lib/session-duration";

export function LoginForm({ siteKey, redirectTo }: { siteKey?: string; redirectTo?: string }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [challenge, setChallenge] = useState(false);
  const [backup, setBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const sharedDeviceHint = useId();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setLoading(true); setError(undefined);
    try {
      const body = challenge ? { code: fields.get("code") } : { email: fields.get("email"), password: fields.get("password"), rememberMe: fields.get("rememberMe") === "on", turnstileToken: token };
      const response = await fetch(challenge ? `/api/account/mfa/${backup ? "backup" : "verify"}` : "/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(typeof result.error === "string" ? result.error : result.message ?? "Sign-in failed. Check your details and try again."); return; }
      form.reset();
      if (result.twoFactorRedirect) { setChallenge(true); return; }
      router.push(redirectTo ?? "/account"); router.refresh();
    } catch { setError("We could not reach the service. Check your connection and try again."); }
    finally { setLoading(false); }
  }

  return <form onSubmit={submit} className="space-y-5">
    <FormNotice>{error}</FormNotice>
    {challenge ? <>
      <p className="text-sm text-[var(--muted)]">{backup ? "Enter one of your saved recovery codes." : "Enter the six-digit code from your authenticator app."}</p>
      <Field label={backup ? "Recovery code" : "Verification code"} required><TextInput key={backup ? "backup" : "totp"} name="code" autoComplete="one-time-code" inputMode={backup ? "text" : "numeric"} pattern={backup ? undefined : "[0-9]{6}"} maxLength={backup ? 100 : 6} required autoFocus /></Field>
      <Button type="submit" disabled={loading} className="w-full">{loading ? "Verifying…" : "Verify and sign in"}</Button>
      <Button type="button" variant="secondary" onClick={() => { setBackup(!backup); setError(undefined); }}>{backup ? "Use authenticator app" : "Use a recovery code"}</Button>
    </> : <>
      <Field label="Email address" required><TextInput name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Password" required><PasswordInput name="password" autoComplete="current-password" maxLength={128} required /></Field>
      <div className="signin-options">
        <label><input type="checkbox" name="rememberMe" aria-describedby={sharedDeviceHint} />Stay signed in for {REMEMBERED_SESSION_DAYS} days</label>
        <Link href="/forgot-password" className="focus-ring">Forgot password?</Link>
        <p id={sharedDeviceHint}>On a shared device? Leave this unchecked.</p>
      </div>
      <Turnstile siteKey={siteKey} onToken={setToken} />
      <Button type="submit" disabled={loading} className="w-full justify-between">{loading ? "Signing in…" : "Sign in"}{!loading && <ArrowRight />}</Button>
      <div className="signin-register"><Link href="/register" className="focus-ring">Create an account</Link></div>
    </>}
  </form>;
}
