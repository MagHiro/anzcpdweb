import { EmailText as Text } from "./_components/layout";
import { EmailLayout } from "./_components/layout";

type Props = { name?: string; classTitle?: string; receiptNumber?: string; amount?: string; url?: string; noPaymentRequired?: boolean };
export default function PaymentReceipt({ name = "Alex", classTitle = "Migration practice workshop", receiptNumber = "R-EXAMPLE", amount = "AUD 120.00", url = "https://www.anzmigrationacademy.com/account/bookings", noPaymentRequired = false }: Props) {
  return <EmailLayout title={noPaymentRequired ? "Booking receipt" : "Payment receipt"} name={name} href={url} action="View receipt"><Text>{noPaymentRequired ? "Your booking is confirmed. No payment was required." : "Your payment has been received."} The PDF receipt is attached.</Text><Text><strong>{classTitle}</strong><br />{noPaymentRequired ? "Booking total" : "Amount paid"}: {amount}<br />Receipt number: {receiptNumber}</Text><Text>The receipt link below expires in 30 days. This receipt is not a tax invoice and does not confirm attendance.</Text></EmailLayout>;
}
