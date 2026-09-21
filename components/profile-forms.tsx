"use client";
import { useState } from "react";
import { Button, Field, FormNotice, TextInput } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
function useAccountUpdate(endpoint: string, method: string, success: string) {
  const [state, setState] = useState<{ loading?: boolean; error?: string; success?: string }>({});
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries()); setState({ loading: true });
    try { const response = await fetch(endpoint, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); setState(response.ok ? { success } : { error: result.error ?? "Your changes could not be saved." }); if (response.ok && endpoint.includes("password")) form.reset(); }
    catch { setState({ error: "We couldn’t reach the service. Check your connection and try again." }); }
  }
  return { state, submit };
}
export function ProfileForm({ name, email }: { name: string; email: string }) {
  const { state, submit } = useAccountUpdate("/api/account/profile", "PATCH", "Your profile has been updated.");
  return <form onSubmit={submit} className="space-y-5"><FormNotice>{state.error}</FormNotice><FormNotice tone="success">{state.success}</FormNotice><Field label="Full name" required><TextInput name="name" autoComplete="name" defaultValue={name} required /></Field><Field label="Email address" hint="Your verified booking identity. Contact the academy if you need help with your email."><TextInput type="email" autoComplete="email" value={email} readOnly className="bg-[var(--mist)]" /></Field><Button disabled={state.loading} type="submit">{state.loading ? "Saving…" : "Save changes"}</Button></form>;
}
export function ChangePasswordForm() {
  const { state, submit } = useAccountUpdate("/api/account/change-password", "POST", "Your password has been updated. Other sessions have been signed out.");
  return <form onSubmit={submit} className="space-y-5"><FormNotice>{state.error}</FormNotice><FormNotice tone="success">{state.success}</FormNotice><Field label="Current password" required><PasswordInput name="currentPassword" autoComplete="current-password" required /></Field><Field label="New password" hint="Use at least 12 characters. Other sessions will be signed out." required><PasswordInput name="newPassword" autoComplete="new-password" minLength={12} required /></Field><Button disabled={state.loading} type="submit">{state.loading ? "Updating…" : "Update password"}</Button></form>;
}
