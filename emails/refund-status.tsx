import { EmailText as Text } from "./_components/layout";
import { EmailLayout } from "./_components/layout";

type Props = { name?: string; bookingReference?: string; amount?: string; status?: string; detailUrl?: string };
export default function RefundStatus({ name = "Alex", bookingReference = "B-EXAMPLE", amount = "AUD 120.00", status = "succeeded", detailUrl = "https://www.anzmigrationacademy.com/account/bookings" }: Props) {
  return <EmailLayout title="Refund update" name={name} href={detailUrl} action="View booking details"><Text>Your refund is currently <strong>{status}</strong>.</Text><Text>Amount: {amount}<br />Reference: {bookingReference}</Text></EmailLayout>;
}
