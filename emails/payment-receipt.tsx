import { EmailText as Text } from "./_components/layout";
import { EmailLayout } from "./_components/layout";

type Props = { name?: string; classTitle?: string; receiptNumber?: string; amount?: string; url?: string };
export default function PaymentReceipt({ name = "Alex", classTitle = "Migration practice workshop", receiptNumber = "R-EXAMPLE", amount = "AUD 120.00", url = "https://www.anzmigrationacademy.com/account/bookings" }: Props) {
  return <EmailLayout title="Payment received" name={name} href={url} action="View or print receipt"><Text>We have received your payment.</Text><Text><strong>{classTitle}</strong><br />Amount paid: {amount}<br />Receipt number: {receiptNumber}</Text><Text>Your private receipt link is valid for 30 days. This receipt records payment, not attendance confirmation.</Text></EmailLayout>;
}
