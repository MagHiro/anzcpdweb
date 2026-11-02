import { EmailText as Text } from "./_components/layout";
import { EmailLayout } from "./_components/layout";

type Props = { name?: string; classTitle?: string; classDate?: string; bookingReference?: string; amount?: string; detailUrl?: string };
export default function BookingConfirmation({ name = "Alex", classTitle = "Migration practice workshop", classDate = "30 November 2026, 7:00 pm Australia/Sydney", bookingReference = "B-EXAMPLE", amount = "AUD 120.00", detailUrl = "https://www.anzmigrationacademy.com/account/bookings" }: Props) {
  return <EmailLayout title="Your booking is confirmed" name={name} href={detailUrl} action="View booking details"><Text>Your place is confirmed for the following activity.</Text><Text><strong>{classTitle}</strong><br />{classDate}<br />Booking reference: {bookingReference}<br />Amount paid: {amount}</Text><Text>You can view your booking and activity details using the link below.</Text></EmailLayout>;
}
