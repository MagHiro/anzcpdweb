"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Notice = { id: number; message: string; tone: "success" | "error" | "info" };
const Feedback = createContext<((message: string, tone: Notice["tone"]) => void) | null>(null);

export function useAdminFeedback() { return useContext(Feedback); }

export function AdminFeedback({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const sequence = useRef(0);
  const notify = useCallback((message: string, tone: Notice["tone"]) => {
    setNotices(items => [...items.slice(-3), { id: ++sequence.current, message, tone }]);
  }, []);
  const dismiss = useCallback((id: number) => setNotices(items => items.filter(item => item.id !== id)), []);
  return <Feedback.Provider value={notify}>{children}<div className="admin-notifications" aria-label="Notifications">{notices.map(notice => <Toast key={notice.id} notice={notice} dismiss={dismiss} />)}</div></Feedback.Provider>;
}

function Toast({ notice, dismiss }: { notice: Notice; dismiss: (id: number) => void }) {
  const [leaving, setLeaving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const close = useCallback(() => setLeaving(true), []);
  useEffect(() => {
    if (notice.tone === "error" || hovered || focused || leaving) return;
    const timer = setTimeout(close, 6000);
    return () => clearTimeout(timer);
  }, [notice.tone, hovered, focused, leaving, close]);
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => dismiss(notice.id), 300);
    return () => clearTimeout(timer);
  }, [leaving, dismiss, notice.id]);
  return <div className="admin-toast-slot" data-leaving={leaving}><div className="admin-toast-clip"><div className={`admin-toast admin-toast-${notice.tone}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} role={notice.tone === "error" ? "alert" : "status"}><span className="admin-toast-icon" aria-hidden="true">{notice.tone === "success" ? "✓" : notice.tone === "error" ? "!" : "i"}</span><div><strong>{notice.tone === "success" ? "Changes saved" : notice.tone === "error" ? "Action needs attention" : "Update"}</strong><p>{notice.message}</p></div><button type="button" aria-label="Dismiss notification" onClick={close} className="focus-ring">×</button></div></div></div>;
}

export function FeedbackNotice({ children, tone = "error", className = "" }: { children?: ReactNode; tone?: Notice["tone"]; className?: string }) {
  const notify = useContext(Feedback);
  const text = typeof children === "string" ? children : "";
  useEffect(() => { if (text) notify?.(text, tone); }, [text, tone, notify]);
  if (!children) return null;
  return <div className={`rounded-[.6rem] border px-4 py-3 text-sm leading-6 ${tone === "error" ? "border-[#e8beb8] bg-[var(--color-danger-soft)] text-[var(--color-danger)]" : tone === "success" ? "border-[#b9d7ca] bg-[var(--color-success-soft)] text-[var(--color-success)]" : "border-[var(--line)] bg-white text-[var(--muted)]"} ${className}`} role={notify ? undefined : tone === "error" ? "alert" : "status"}>{children}</div>;
}
