import { getServerSession } from "@/server/auth/session";
import { getBookingJoinAccess } from "@/server/bookings/join";
import { uuidSchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return new Response("Sign in to access your booking.", { status: 401 });
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return new Response("Booking not found.", { status: 404 });
  const access = await getBookingJoinAccess(session.user.id, id);
  if (!access.meetingLink) return new Response("Joining is not available for this booking.", { status: 403, headers: { "Cache-Control": "no-store" } });
  return new Response(null, { status: 302, headers: { Location: access.meetingLink, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
