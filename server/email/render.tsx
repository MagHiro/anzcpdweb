import { render, toPlainText } from "@react-email/render";
import type { EmailMessage } from "./service";
import EmailVerification from "../../emails/email-verification";
import PasswordReset from "../../emails/password-reset";
import AccountSetup from "../../emails/account-setup";
import AccountClaim from "../../emails/account-claim";
import BookingConfirmation from "../../emails/booking-confirmation";
import BookingCancelled from "../../emails/booking-cancelled";
import PaymentReceipt from "../../emails/payment-receipt";
import RefundStatus from "../../emails/refund-status";

export async function renderMessage(message: EmailMessage) {
  const content = (() => {
    switch (message.type) {
      case "EMAIL_VERIFICATION": return { subject: "Verify your email address | ANZ Migration Academy", element: <EmailVerification {...message} /> };
      case "PASSWORD_RESET": return { subject: "Reset your password | ANZ Migration Academy", element: <PasswordReset {...message} /> };
      case "ACCOUNT_SETUP": return { subject: "Set up your account | ANZ Migration Academy", element: <AccountSetup {...message} /> };
      case "ACCOUNT_CLAIM": return { subject: "Connect your booking records | ANZ Migration Academy", element: <AccountClaim {...message} /> };
      case "BOOKING_CONFIRMATION": return { subject: `Booking confirmed: ${message.classTitle}`, element: <BookingConfirmation {...message} /> };
      case "BOOKING_CANCELLED": return { subject: `Booking cancelled: ${message.classTitle}`, element: <BookingCancelled {...message} /> };
      case "PAYMENT_RECEIPT": return { subject: `Payment receipt: ${message.amount}`, element: <PaymentReceipt {...message} /> };
      case "REFUND_STATUS": return { subject: `Refund update: ${message.bookingReference}`, element: <RefundStatus {...message} /> };
    }
  })();
  const html = await render(content.element);
  return { subject: content.subject.replace(/[\r\n]/g, " "), html, text: toPlainText(html) };
}
