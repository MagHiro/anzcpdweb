"use client";

import { useEffect, useRef, useState } from "react";
import { appVersion, deploymentField, deploymentHeader, requiresCurrentDeployment } from "@/lib/deployment";

export function DeploymentGuard() {
  const [updated, setUpdated] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const originalFetch = window.fetch;
    let stale = false;
    let disposed = false;
    const markUpdated = () => {
      stale = true;
      if (!disposed) setUpdated(true);
    };
    async function checkVersion() {
      const response = await originalFetch("/api/version", { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Unable to check application version");
      const data = await response.json();
      if (typeof data.version !== "string") throw new Error("Invalid application version");
      if (data.version !== appVersion) markUpdated();
      return !stale;
    }
    const checkInBackground = () => { if (document.visibilityState === "visible") void checkVersion().catch(() => {}); };

    // Covers Server Actions, account/auth requests, uploads, and button-driven mutations.
    window.fetch = async (input, init) => {
      const request = new Request(input instanceof Request ? input : new URL(input, window.location.href), init);
      const url = new URL(request.url);
      if (url.origin !== window.location.origin || !requiresCurrentDeployment(request.method, url.pathname)) return originalFetch(input, init);
      if (stale || !await checkVersion()) throw new Error("Reload the page to use the updated application.");
      request.headers.set(deploymentHeader, appVersion);
      const response = await originalFetch(request);
      if (response.status === 409 && response.headers.get(deploymentHeader) !== null && response.headers.get(deploymentHeader) !== appVersion) markUpdated();
      return response;
    };

    // Native form posts also carry the page's version; the server checks it atomically
    // against the running release before allowing the request into an action/route.
    const onSubmit = (event: SubmitEvent) => {
      if (stale) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || new URL(form.action).origin !== location.origin) return;
      let field = form.querySelector<HTMLInputElement>(`input[name="${deploymentField}"]`);
      if (!field) { field = document.createElement("input"); field.type = "hidden"; field.name = deploymentField; form.append(field); }
      field.value = appVersion;
    };
    const onPageShow = () => checkInBackground();
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("visibilitychange", checkInBackground);
    window.addEventListener("focus", checkInBackground);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", checkInBackground);
    const timer = window.setInterval(checkInBackground, 30000);
    checkInBackground();
    return () => {
      disposed = true;
      window.fetch = originalFetch;
      window.clearInterval(timer);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("visibilitychange", checkInBackground);
      window.removeEventListener("focus", checkInBackground);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", checkInBackground);
    };
  }, []);

  useEffect(() => { if (updated && !dialog.current?.open) dialog.current?.showModal(); }, [updated]);

  return <dialog ref={dialog} aria-labelledby="deployment-update-title" aria-describedby="deployment-update-description" onCancel={event => event.preventDefault()} className="deployment-update">
    <h2 id="deployment-update-title">Update available</h2>
    <p id="deployment-update-description">Reload the page to continue. Unsaved changes may be lost.</p>
    <button type="button" onClick={() => window.location.reload()} className="focus-ring">Reload page</button>
  </dialog>;
}
