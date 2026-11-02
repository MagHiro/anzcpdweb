import { EmailText as Text } from "./_components/layout";
import { EmailLayout } from "./_components/layout";

type Props = { name?: string; classTitle?: string; bookingReference?: string; reason?: string; detailUrl?: string };
export default function BookingCancelled({ name = "Alex", classTitle = "Migration practice workshop", bookingReference = "B-EXAMPLE", reason = "The class has been cancelled. Any refund is handled separately.", detailUrl = "https://www.anzmigrationacademy.com/account/bookings" }: Props) {
  return <EmailLayout title="Your booking has been cancelled" name={name} href={detailUrl} action="View class information"><Text><strong>{classTitle}</strong><br />Reference: {bookingReference}</Text><Text>{reason}</Text></EmailLayout>;
}
