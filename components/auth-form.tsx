"use client";

import { PasswordInput } from "@/components/password-input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, FormNotice, TextInput } from "@/components/ui";
import { Turnstile } from "@/components/turnstile";

export function AuthForm({ mode, siteKey, resetToken, redirectTo }: { mode: "login" | "register" | "forgot" | "reset"; siteKey?: string; resetToken?: string; redirectTo?: string }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [state, setState] = useState<{ loading: boolean; error?: string; success?: string }>({ loading: false });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true });
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const endpoint = mode === "login" ? "/api/auth/login" : mode === "register" ? "/api/auth/register" : mode === "forgot" ? "/api/auth/forgot-password" : "/api/auth/reset-password";
    if (mode !== "reset") data.turnstileToken = token;
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const payload = await response.json().catch(() => ({})) as { error?: string; message?: string };
      if (!response.ok) { setState({ loading: false, error: payload.error ?? "The request could not be completed." }); return; }
      if (mode === "login") router.push(redirectTo ?? "/account");
      else if (mode === "register") setState({ loading: false, success: "Your account was created. Check your email to verify it before signing in." });
      else if (mode === "forgot") setState({ loading: false, success: "If an account exists for that email, we’ve sent reset instructions." });
      else { setState({ loading: false, success: "Password reset. You can now sign in." }); window.setTimeout(() => router.push("/sign-in"), 800); }
    } catch { setState({ loading: false, error: "We could not reach the service. Check your connection and try again." }); }
  }
  return <form onSubmit={submit} className="space-y-5">{resetToken ? <input type="hidden" name="token" value={resetToken} /> : null}<FormNotice tone="error">{state.error}</FormNotice><FormNotice tone="success">{state.success}</FormNotice>{mode === "register" ? <Field label="Full name" required><TextInput name="name" autoComplete="name" required /></Field> : null}{mode !== "reset" ? <Field label="Email address" required><TextInput name="email" type="email" autoComplete="email" required /></Field> : null}{mode !== "forgot" ? <Field label="Password" hint={mode === "register" || mode === "reset" ? "Use at least 12 characters." : undefined} required><PasswordInput name={mode === "reset" ? "password" : "password"} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 12} required /></Field> : null}{mode === "register" || mode === "reset" ? <Field label="Confirm password" required><PasswordInput name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required /></Field> : null}{mode !== "reset" ? <Turnstile siteKey={siteKey} onToken={setToken} /> : null}<button disabled={state.loading} className="focus-ring min-h-12 w-full rounded-lg bg-[var(--forest)] px-5 text-sm font-bold text-white transition hover:bg-[var(--fern)] disabled:opacity-60">{state.loading ? "Working…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset instructions" : "Reset password"}</button><div className="flex flex-wrap justify-between gap-3 text-sm text-[var(--muted)]">{mode === "login" ? <><Link href="/forgot-password" className="font-bold text-[var(--forest)] underline underline-offset-4">Forgot password?</Link><Link href="/register" className="font-bold text-[var(--forest)] underline underline-offset-4">Create an account</Link></> : mode === "register" ? <Link href="/sign-in" className="font-bold text-[var(--forest)] underline underline-offset-4">Already have an account?</Link> : mode === "forgot" ? <Link href="/sign-in" className="font-bold text-[var(--forest)] underline underline-offset-4">Back to sign in</Link> : null}</div></form>;
}

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setPending(true); setError("");
    try { const response = await fetch("/api/auth/sign-out", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); if (!response.ok) throw new Error("Sign out failed"); router.push("/"); router.refresh(); }
    catch { setError("Couldn’t sign out. Try again."); setPending(false); }
  }
  return <><button type="button" disabled={pending} onClick={signOut} className="focus-ring text-sm font-semibold text-[var(--forest)] underline underline-offset-4">{pending ? "Signing out…" : "Sign out"}</button>{error && <p role="alert" className="mt-2 text-xs text-[var(--error)]">{error}</p>}</>;
}
