"use client";

import { useEffect, useRef, useState } from "react";
import { TextInput } from "@/components/ui";
import { slugify } from "@/lib/utils";

export function SlugInput({ defaultValue = "", sourceName }: { defaultValue?: string; sourceName: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [unlocked, setUnlocked] = useState(false);
  const manuallyEdited = useRef(false);

  useEffect(() => {
    const form = wrapper.current?.closest("form");
    if (!form || defaultValue) return;
    const update = (event: Event) => {
      if (event.target instanceof HTMLInputElement && event.target.name === sourceName && !manuallyEdited.current) setValue(slugify(event.target.value));
    };
    form.addEventListener("input", update);
    return () => form.removeEventListener("input", update);
  }, [defaultValue, sourceName]);

  return <div ref={wrapper} className="slug-control">
    <TextInput name="slug" value={value} readOnly={!unlocked} required onChange={event => { manuallyEdited.current = true; setValue(event.target.value); }} />
    <button type="button" className="slug-lock focus-ring" aria-label={unlocked ? "Lock slug" : "Unlock slug"} aria-pressed={unlocked} onClick={() => setUnlocked(current => !current)}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="3" /><path d={unlocked ? "M8 10V6a4 4 0 0 1 8 0" : "M8 10V6a4 4 0 0 1 8 0v4"} /><path d="M12 14v3" /></svg>
    </button>
  </div>;
}
