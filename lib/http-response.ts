/** Proxies can return HTML errors; never expose their markup or JSON parser errors. */
export async function resourceResponse(response: Response): Promise<{ id?: string; error?: string }> {
  const result = await response.json().catch(() => null);
  if (!result || typeof result !== "object") {
    if (response.status === 413) throw new Error("The server rejected the upload size. Reload the page and upload again.");
    throw new Error(`The server could not complete the request (${response.status}). Reload and try again.`);
  }
  return result;
}
