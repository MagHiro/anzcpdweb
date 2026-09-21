"use client";
import { useState, type ComponentProps } from "react";
import { TextInput } from "@/components/ui";
export function MoneyInput({ name, defaultMinor = 0, maxMinor, ...props }: Omit<ComponentProps<"input">, "defaultValue"> & { defaultMinor?: number; maxMinor?: number }) {
  const [amount, setAmount] = useState((defaultMinor / 100).toFixed(2));
  const minor = amount === "" ? "" : Math.round(Number(amount) * 100);
  return <><TextInput {...props} type="number" inputMode="decimal" min={props.min ?? 0} max={maxMinor === undefined ? undefined : maxMinor / 100} step="0.01" value={amount} onChange={event => setAmount(event.target.value)} /><input type="hidden" name={name} value={minor} /></>;
}
