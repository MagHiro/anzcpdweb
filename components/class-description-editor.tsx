"use client";

import { useState } from "react";
import { ClassDescription } from "@/components/class-description";
import { Field, TextArea } from "@/components/ui";

export function ClassDescriptionEditor({ initialText = "", error }: { initialText?: string; error?: string }) {
  const [text, setText] = useState(initialText);
  const [showPreview, setShowPreview] = useState(false);

  return <div className="grid min-w-0 gap-3 sm:col-span-2">
    <Field label="Full description" hint="Markdown supports headings, lists, bold text and links. HTML is not rendered. Avoid copying large third-party passages." required error={error}>
      <TextArea name="fullDescription" value={text} onChange={event => setText(event.target.value)} maxLength={20_000} required className="min-h-40" />
    </Field>
    <details onToggle={event => setShowPreview(event.currentTarget.open)} className="rounded-lg border border-[var(--line)] px-4">
      <summary className="focus-ring cursor-pointer py-3 text-sm font-medium">Preview</summary>
      {showPreview && <div className="border-t border-[var(--line)] py-4">
        {text.trim() ? <ClassDescription text={text} /> : <p className="text-sm text-[var(--muted)]">Enter a description to preview it.</p>}
      </div>}
    </details>
  </div>;
}
