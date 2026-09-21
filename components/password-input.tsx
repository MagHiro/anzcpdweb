"use client";
import { useState, type ComponentProps } from "react";
import { TextInput } from "@/components/ui";
export function PasswordInput(props: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  return <div className="relative"><TextInput {...props} type={visible ? "text" : "password"} className="pr-20" /><button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(value => !value)} className="focus-ring absolute right-1 top-1 min-h-9 rounded px-3 text-xs font-semibold text-[var(--forest)]">{visible ? "Hide" : "Show"}</button></div>;
}
