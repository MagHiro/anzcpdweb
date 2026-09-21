import { NextResponse } from "next/server";
import { getStoredImage } from "@/server/media/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) { const { key } = await params; try { const image = await getStoredImage(key.join("/")); if (image.redirectUrl) return NextResponse.redirect(image.redirectUrl); return new NextResponse(image.bytes ? Buffer.from(image.bytes) : null, { headers: { "content-type": image.contentType ?? "application/octet-stream", "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } }); } catch { return new NextResponse("Not found", { status: 404 }); } }
