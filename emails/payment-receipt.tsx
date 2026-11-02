import { EmailText as Text } from "./_components/layout";
import { EmailLayout } from "./_components/layout";

type Props = { name?: string; classTitle?: string; receiptNumber?: string; amount?: string; url?: string; noPaymentRequired?: boolean };
export default function PaymentReceipt({ name = "Alex", classTitle = "Migration practice workshop", receiptNumber = "R-EXAMPLE", amount = "AUD 120.00", url = "https://www.anzmigrationacademy.com/account/bookings", noPaymentRequired = false }: Props) {
  return <EmailLayout title={noPaymentRequired ? "Your booking receipt" : "Payment received"} name={name} href={url} action="View or print receipt"><Text>{noPaymentRequired ? "Your free booking is confirmed. No payment was required. Your receipt is attached." : "We have received your payment."}</Text><Text><strong>{classTitle}</strong><br />{noPaymentRequired ? "Booking total" : "Amount paid"}: {amount}<br />Receipt number: {receiptNumber}</Text><Text>Your private receipt link is valid for 30 days. This receipt {noPaymentRequired ? "records your booking" : "records payment"}, not attendance confirmation.</Text></EmailLayout>;
}
